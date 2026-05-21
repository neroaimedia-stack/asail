import { AdminCharts, type UserGrowthPoint, type VideoSubmissionsPoint } from "./admin-charts";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const peso = new Intl.NumberFormat("en-PH", {
  currency: "PHP",
  maximumFractionDigits: 0,
  style: "currency",
});
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dayKey(date: Date) {
  return date.toISOString().slice(5, 10);
}

function last30Days() {
  const days: Date[] = [];
  const today = startOfDay(new Date());
  for (let index = 29; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    days.push(day);
  }
  return days;
}

async function getDashboardData() {
  const admin = createAdminClient();
  const sinceWeek = new Date();
  sinceWeek.setDate(sinceWeek.getDate() - 7);
  const since30 = last30Days()[0].toISOString();

  const [
    profiles,
    campaigns,
    videos,
    verifications,
    disputes,
    payouts,
    history,
    notifications,
  ] = await Promise.all([
    admin.from("profiles").select("id, role, created_at").in("role", ["business", "creator", "admin"]),
    admin.from("campaigns").select("id, status, created_at"),
    admin.from("videos").select("id, status, view_count, submitted_at"),
    admin.from("pending_verifications").select("id", { count: "exact", head: true }),
    admin.from("disputes").select("id", { count: "exact", head: true }).in("status", ["open", "under_review"]),
    admin.from("payouts").select("amount, status").eq("status", "completed"),
    admin.from("video_history").select("status, note, created_at").order("created_at", { ascending: false }).limit(20),
    admin.from("notifications").select("type, title, body, created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  const profileRows = profiles.data ?? [];
  const campaignRows = campaigns.data ?? [];
  const videoRows = videos.data ?? [];
  const days = last30Days();
  const userGrowth: UserGrowthPoint[] = days.map((date) => ({
    business: 0,
    creator: 0,
    date: dayKey(date),
  }));
  const videosByDay: VideoSubmissionsPoint[] = days.map((date) => ({
    date: dayKey(date),
    submissions: 0,
  }));

  for (const profile of profileRows) {
    if (profile.created_at < since30) continue;
    const key = dayKey(new Date(profile.created_at));
    const point = userGrowth.find((item) => item.date === key);
    if (point && profile.role === "business") point.business += 1;
    if (point && profile.role === "creator") point.creator += 1;
  }

  for (const video of videoRows) {
    if (video.submitted_at < since30) continue;
    const key = dayKey(new Date(video.submitted_at));
    const point = videosByDay.find((item) => item.date === key);
    if (point) point.submissions += 1;
  }

  const activities = [
    ...(history.data ?? []).map((item) => ({
      createdAt: item.created_at as string,
      text: `${item.status}: ${item.note ?? "Video status updated"}`,
    })),
    ...(notifications.data ?? []).map((item) => ({
      createdAt: item.created_at as string,
      text: `${item.title}: ${item.body}`,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  return {
    activities,
    stats: {
      campaignsActive: campaignRows.filter((campaign) => campaign.status === "active").length,
      campaignsCompleted: campaignRows.filter((campaign) => campaign.status === "completed").length,
      campaignsPaused: campaignRows.filter((campaign) => campaign.status === "paused").length,
      newUsersThisWeek: profileRows.filter((profile) => profile.created_at >= sinceWeek.toISOString()).length,
      openDisputes: disputes.count ?? 0,
      pendingVerifications: verifications.count ?? 0,
      totalCampaigns: campaignRows.length,
      totalPayouts: (payouts.data ?? []).reduce((sum, payout) => sum + Number(payout.amount ?? 0), 0),
      totalUsers: profileRows.length,
      totalVideos: videoRows.length,
      totalViews: videoRows.reduce((sum, video) => sum + Number(video.view_count ?? 0), 0),
    },
    userGrowth,
    videosByDay,
  };
}

export default async function AdminDashboardPage() {
  const { activities, stats, userGrowth, videosByDay } = await getDashboardData();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Platform-wide health and activity.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total users" value={number.format(stats.totalUsers)} />
        <Stat label="New users this week" value={number.format(stats.newUsersThisWeek)} />
        <Stat label="Campaigns" value={`${stats.totalCampaigns} (${stats.campaignsActive}/${stats.campaignsPaused}/${stats.campaignsCompleted})`} />
        <Stat label="Videos submitted" value={number.format(stats.totalVideos)} />
        <Stat label="Total views" value={number.format(stats.totalViews)} />
        <Stat label="Pending verifications" value={number.format(stats.pendingVerifications)} />
        <Stat label="Open disputes" value={number.format(stats.openDisputes)} />
        <Stat label="Payouts sent" value={peso.format(stats.totalPayouts)} />
      </div>
      <div className="mt-6">
        <AdminCharts userGrowth={userGrowth} videoSubmissions={videosByDay} />
      </div>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold">Recent activity</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {activities.map((activity) => (
            <div className="py-3 text-sm" key={`${activity.createdAt}-${activity.text}`}>
              <div className="font-medium text-slate-800">{activity.text}</div>
              <div className="mt-1 text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

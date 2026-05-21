import Link from "next/link";
import { redirect } from "next/navigation";
import { setCampaignStatus } from "./actions";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { formatUnreadCount, getUnreadMessageCount } from "@/lib/messages";
import { getNotificationSnapshot } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

type Campaign = {
  expires_at: string | null;
  id: string;
  title: string;
  status: "active" | "paused" | "completed";
  total_budget: number | string;
  spent_budget: number | string | null;
};

type Video = {
  campaign_id: string;
  status: "pending" | "accepted" | "rejected";
  view_count: number | null;
  payout_amount: number | string | null;
  payout_status: "unpaid" | "paid";
};

type CampaignRow = Campaign & {
  acceptedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalViews: number;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const statusStyles = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  completed: "border-stone-200 bg-stone-100 text-stone-700",
  paused: "border-amber-200 bg-amber-100 text-amber-900",
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatExpiryDate(value: string | null) {
  if (!value) {
    return "No end date";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function expiryState(value: string | null) {
  if (!value) {
    return "none";
  }

  const now = new Date();
  const expiresAt = new Date(value);

  if (expiresAt < now) {
    return "ended";
  }

  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  return expiresAt <= threeDaysFromNow ? "soon" : "normal";
}

async function getDashboardData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/business/dashboard");
  }

  const { data: termsAcceptance } = await supabase
    .from("terms_accepted")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!termsAcceptance) {
    redirect(
      "/auth/signup/business?error=Please%20accept%20the%20Terms%20of%20Service%20and%20Privacy%20Policy.",
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/business/onboarding");
  }

  const { data: campaignsData, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, title, status, total_budget, spent_budget, expires_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (campaignsError) {
    throw new Error(campaignsError.message);
  }

  const campaigns = (campaignsData ?? []) as Campaign[];
  const campaignIds = campaigns.map((campaign) => campaign.id);

  const { data: videosData, error: videosError } = campaignIds.length
    ? await supabase
        .from("videos")
        .select("campaign_id, status, view_count, payout_amount, payout_status")
        .in("campaign_id", campaignIds)
    : { data: [], error: null };

  if (videosError) {
    throw new Error(videosError.message);
  }

  const videos = (videosData ?? []) as Video[];
  const rows: CampaignRow[] = campaigns.map((campaign) => {
    const campaignVideos = videos.filter(
      (video) => video.campaign_id === campaign.id,
    );
    const acceptedVideos = campaignVideos.filter(
      (video) => video.status === "accepted",
    );

    return {
      ...campaign,
      acceptedCount: acceptedVideos.length,
      pendingCount: campaignVideos.filter((video) => video.status === "pending")
        .length,
      rejectedCount: campaignVideos.filter(
        (video) => video.status === "rejected",
      ).length,
      totalViews: acceptedVideos.reduce(
        (sum, video) => sum + toNumber(video.view_count),
        0,
      ),
    };
  });

  const totalSpend = videos
    .filter((video) => video.payout_status === "paid")
    .reduce((sum, video) => sum + toNumber(video.payout_amount), 0);

  return {
    businessName: business.business_name as string,
    messageUnreadCount: await getUnreadMessageCount(user.id),
    notifications: await getNotificationSnapshot(user.id),
    rows,
    stats: {
      totalCampaigns: campaigns.length,
      totalSpend,
      totalVideos: videos.length,
      totalViews: rows.reduce((sum, campaign) => sum + campaign.totalViews, 0),
    },
    userId: user.id,
  };
}

export default async function BusinessDashboardPage() {
  const { businessName, messageUnreadCount, notifications, rows, stats, userId } =
    await getDashboardData();

  return (
    <main className="min-h-screen bg-[#fff8ed] text-amber-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <aside className="border-b border-amber-200 bg-[#fffaf0] px-5 py-5 md:w-64 md:border-b-0 md:border-r">
          <Link className="block text-lg font-semibold" href="/business/dashboard">
            Asail
          </Link>
          <p className="mt-1 text-sm text-amber-900/65">{businessName}</p>
          <nav className="mt-6 flex gap-2 overflow-x-auto text-sm md:flex-col md:overflow-visible">
            <Link
              className="rounded-md bg-amber-100 px-3 py-2 font-semibold text-amber-950"
              href="/business/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/business/campaigns"
            >
              Campaigns
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/business/review"
            >
              Review Videos
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/leaderboard"
            >
              Leaderboard
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/search"
            >
              Search
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/messages"
            >
              <span className="flex items-center justify-between gap-2">
                Messages
                {messageUnreadCount > 0 ? (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                    {formatUnreadCount(messageUnreadCount)}
                  </span>
                ) : null}
              </span>
            </Link>
            <div className="my-1 hidden border-t border-amber-200 md:block" />
            <span className="hidden px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-amber-800/70 md:block">
              Analytics
            </span>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/business/analytics/spend"
            >
              Spend
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/business/settings"
            >
              Settings
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/help"
            >
              Help
            </Link>
          </nav>
        </aside>

        <section className="flex-1 px-5 py-6 md:px-8">
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-amber-900/70">
                Campaign performance and review queue.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell
                initialNotifications={notifications.notifications}
                initialUnreadCount={notifications.unreadCount}
                userId={userId}
              />
              <Link
                className="inline-flex rounded-md bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
                href="/business/campaigns/new"
              >
                Create new campaign
              </Link>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total campaigns"
              value={numberFormatter.format(stats.totalCampaigns)}
            />
            <StatCard
              label="Total videos submitted"
              value={numberFormatter.format(stats.totalVideos)}
            />
            <StatCard
              label="Total views earned"
              value={numberFormatter.format(stats.totalViews)}
            />
            <StatCard
              label="Total spend so far"
              value={moneyFormatter.format(stats.totalSpend)}
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-amber-200 bg-white">
            <div className="flex items-center justify-between border-b border-amber-200 px-4 py-3">
              <h2 className="text-base font-semibold">Campaigns</h2>
              <span className="text-sm text-amber-900/65">
                {rows.length} total
              </span>
            </div>

            {rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                  <thead className="bg-amber-50 text-amber-900">
                    <tr>
                      <Th>Campaign name</Th>
                      <Th>Status</Th>
                      <Th>Budget remaining</Th>
                      <Th>Ends</Th>
                      <Th>Videos pending review</Th>
                      <Th>Total views</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {rows.map((campaign) => {
                      const budgetRemaining =
                        toNumber(campaign.total_budget) -
                        toNumber(campaign.spent_budget);
                      const nextStatus =
                        campaign.status === "active" ? "paused" : "active";
                      const canToggle = campaign.status !== "completed";
                      const expiry = expiryState(campaign.expires_at);

                      return (
                        <tr className="align-middle" key={campaign.id}>
                          <Td>
                            <div>
                              <div className="font-semibold text-amber-950">
                                {campaign.title}
                              </div>
                              <div className="mt-1 text-xs text-amber-900/60">
                                {campaign.acceptedCount} accepted ·{" "}
                                {campaign.rejectedCount} rejected
                              </div>
                            </div>
                          </Td>
                          <Td>
                            <span
                              className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[campaign.status]}`}
                            >
                              {campaign.status}
                            </span>
                          </Td>
                          <Td>{moneyFormatter.format(budgetRemaining)}</Td>
                          <Td>
                            <span
                              className={
                                expiry === "ended"
                                  ? "font-semibold text-red-700"
                                  : expiry === "soon"
                                    ? "font-semibold text-amber-700"
                                    : "text-amber-950"
                              }
                            >
                              {expiry === "ended"
                                ? "Ended"
                                : formatExpiryDate(campaign.expires_at)}
                            </span>
                          </Td>
                          <Td>{numberFormatter.format(campaign.pendingCount)}</Td>
                          <Td>{numberFormatter.format(campaign.totalViews)}</Td>
                          <Td>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                className="rounded-md border border-amber-200 px-3 py-2 font-semibold text-amber-900 hover:border-amber-300 hover:bg-amber-50"
                                href={`/business/review?campaign=${campaign.id}`}
                              >
                                Review videos
                              </Link>
                              <Link
                                className="rounded-md border border-amber-200 px-3 py-2 font-semibold text-amber-900 hover:border-amber-300 hover:bg-amber-50"
                                href={`/business/analytics/${campaign.id}`}
                              >
                                View analytics →
                              </Link>
                              <Link
                                className="rounded-md border border-amber-200 px-3 py-2 font-semibold text-amber-900 hover:border-amber-300 hover:bg-amber-50"
                                href={`/business/campaigns/${campaign.id}`}
                              >
                                Invitations
                              </Link>
                              <form action={setCampaignStatus}>
                                <input
                                  name="campaignId"
                                  type="hidden"
                                  value={campaign.id}
                                />
                                <input
                                  name="nextStatus"
                                  type="hidden"
                                  value={nextStatus}
                                />
                                <button
                                  className="rounded-md border border-amber-200 px-3 py-2 font-semibold text-amber-900 hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={!canToggle}
                                  type="submit"
                                >
                                  {campaign.status === "active"
                                    ? "Pause"
                                    : "Resume"}
                                </button>
                              </form>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-amber-900/70">
                  No campaigns yet. Create your first campaign to start
                  receiving creator submissions.
                </p>
                <Link
                  className="mt-4 inline-flex rounded-md bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
                  href="/business/campaigns/new"
                >
                  Create new campaign
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-white p-4">
      <div className="text-sm text-amber-900/65">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-amber-950">
        {value}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-amber-950">{children}</td>;
}

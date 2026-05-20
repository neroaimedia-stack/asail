import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PlatformBreakdownChart,
  SpendTrajectoryChart,
  ViewsOverTimeChart,
  type PlatformPoint,
  type SpendPoint,
  type ViewsPoint,
} from "./analytics-charts";
import { createClient } from "@/lib/supabase/server";

type Campaign = {
  created_at: string;
  expires_at: string | null;
  id: string;
  status: "active" | "paused" | "completed";
  title: string;
};

type RawVideo = {
  id: string;
  platform: "youtube" | "tiktok" | "instagram";
  payout_amount: number | string | null;
  reviewed_at: string | null;
  submitted_at: string;
  view_count: number | null;
  creators: {
    handle: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
  video_history: Array<{
    created_at: string;
    note: string | null;
  }> | null;
};

type TopVideo = {
  creatorHandle: string;
  creatorName: string;
  earnings: number;
  id: string;
  platform: "youtube" | "tiktok" | "instagram";
  submittedAt: string;
  views: number;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
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

const platformStyles = {
  instagram: "border-pink-200 bg-pink-50 text-pink-700",
  tiktok: "border-slate-200 bg-slate-50 text-slate-700",
  youtube: "border-red-200 bg-red-50 text-red-700",
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string | null) {
  if (!value) {
    return "No end date";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPlatform(value: string) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
  };

  return labels[value] ?? value;
}

function parseViewsUpdatedNote(note: string | null) {
  if (!note?.includes("Views updated")) {
    return null;
  }

  const match = note.match(/Views updated to\s+([\d,]+)/i);
  const parsed = Number(match?.[1]?.replaceAll(",", "") ?? NaN);

  return Number.isFinite(parsed) ? parsed : null;
}

function chartDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function weekSinceCampaignStart(campaignCreatedAt: string, value: string) {
  const start = new Date(campaignCreatedAt).getTime();
  const current = new Date(value).getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  return Math.max(Math.floor((current - start) / oneWeek) + 1, 1);
}

function buildViewsOverTime(videos: RawVideo[]) {
  const events = videos
    .flatMap((video) =>
      (video.video_history ?? [])
        .map((entry) => ({
          createdAt: entry.created_at,
          views: parseViewsUpdatedNote(entry.note),
        }))
        .filter((entry): entry is { createdAt: string; views: number } =>
          Number.isFinite(entry.views),
        ),
    )
    .sort(
      (first, second) =>
        new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
    );

  let cumulativeViews = 0;
  const byDate = new Map<string, number>();

  for (const event of events) {
    cumulativeViews += event.views;
    byDate.set(chartDate(event.createdAt), cumulativeViews);
  }

  return Array.from(byDate.entries()).map(
    ([date, views]): ViewsPoint => ({ date, views }),
  );
}

function buildSpendTrajectory(campaignCreatedAt: string, videos: RawVideo[]) {
  const spendByWeek = new Map<number, number>();

  for (const video of videos) {
    if (!video.reviewed_at) {
      continue;
    }

    const week = weekSinceCampaignStart(campaignCreatedAt, video.reviewed_at);
    spendByWeek.set(
      week,
      (spendByWeek.get(week) ?? 0) + toNumber(video.payout_amount),
    );
  }

  return Array.from(spendByWeek.entries())
    .sort(([first], [second]) => first - second)
    .map(([week, amount]): SpendPoint => ({
      amount,
      week: `Week ${week}`,
    }));
}

function buildPlatformBreakdown(videos: RawVideo[]) {
  const viewsByPlatform = new Map<string, number>();

  for (const video of videos) {
    viewsByPlatform.set(
      video.platform,
      (viewsByPlatform.get(video.platform) ?? 0) + toNumber(video.view_count),
    );
  }

  return ["youtube", "tiktok", "instagram"].map(
    (platform): PlatformPoint => ({
      name: formatPlatform(platform),
      value: viewsByPlatform.get(platform) ?? 0,
    }),
  );
}

async function getCampaignAnalytics(campaignId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectedFrom=/business/analytics/${campaignId}`);
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/business/onboarding");
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, title, status, expires_at, created_at")
    .eq("id", campaignId)
    .eq("business_id", business.id)
    .single();

  if (campaignError || !campaign) {
    redirect("/business/dashboard");
  }

  const { data, error } = await supabase
    .from("videos")
    .select(
      "id, platform, view_count, payout_amount, submitted_at, reviewed_at, creators!inner(handle, profiles!inner(full_name)), video_history(note, created_at)",
    )
    .eq("campaign_id", campaign.id)
    .eq("status", "accepted")
    .order("view_count", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const videos = (data ?? []) as unknown as RawVideo[];
  const topVideos: TopVideo[] = videos
    .map((video) => ({
      creatorHandle: video.creators?.handle ?? "@creator",
      creatorName: video.creators?.profiles?.full_name ?? "Creator",
      earnings: toNumber(video.payout_amount),
      id: video.id,
      platform: video.platform,
      submittedAt: video.submitted_at,
      views: toNumber(video.view_count),
    }))
    .sort((first, second) => second.views - first.views);

  const totalViews = videos.reduce(
    (sum, video) => sum + toNumber(video.view_count),
    0,
  );
  const totalSpend = videos.reduce(
    (sum, video) => sum + toNumber(video.payout_amount),
    0,
  );

  return {
    businessName: business.business_name as string,
    campaign: campaign as Campaign,
    charts: {
      platformBreakdown: buildPlatformBreakdown(videos),
      spendTrajectory: buildSpendTrajectory(campaign.created_at, videos),
      viewsOverTime: buildViewsOverTime(videos),
    },
    stats: {
      averageViews:
        videos.length > 0 ? Math.round(totalViews / videos.length) : 0,
      totalSpend,
      totalViews,
      videosAccepted: videos.length,
    },
    topVideos,
  };
}

export default async function CampaignAnalyticsPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const { businessName, campaign, charts, stats, topVideos } =
    await getCampaignAnalytics(params.campaignId);

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
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
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
            <div className="my-1 hidden border-t border-amber-200 md:block" />
            <span className="hidden px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-amber-800/70 md:block">
              Analytics
            </span>
            <Link
              className="rounded-md bg-amber-100 px-3 py-2 font-semibold text-amber-950"
              href={`/business/analytics/${campaign.id}`}
            >
              Campaign
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/business/analytics/spend"
            >
              Spend
            </Link>
          </nav>
        </aside>

        <section className="flex-1 px-5 py-6 md:px-8">
          <div className="mb-6">
            <Link
              className="text-sm font-semibold text-amber-800 hover:text-amber-950"
              href="/business/dashboard"
            >
              Back to dashboard
            </Link>
          </div>

          <header className="mb-6 rounded-lg border border-amber-200 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {campaign.title}
                  </h1>
                  <span
                    className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[campaign.status]}`}
                  >
                    {campaign.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-amber-900/70">
                  Expires {formatDate(campaign.expires_at)}
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total views"
              value={numberFormatter.format(stats.totalViews)}
            />
            <StatCard
              label="Total spend"
              value={moneyFormatter.format(stats.totalSpend)}
            />
            <StatCard
              label="Videos accepted"
              value={numberFormatter.format(stats.videosAccepted)}
            />
            <StatCard
              label="Avg. views per video"
              value={numberFormatter.format(stats.averageViews)}
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <AnalyticsCard title="Views over time">
              <ViewsOverTimeChart data={charts.viewsOverTime} />
            </AnalyticsCard>

            <AnalyticsCard title="Spend trajectory">
              <SpendTrajectoryChart data={charts.spendTrajectory} />
            </AnalyticsCard>

            <AnalyticsCard title="Platform breakdown">
              <PlatformBreakdownChart data={charts.platformBreakdown} />
            </AnalyticsCard>

            <AnalyticsCard title="Top performing videos">
              {topVideos.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead className="bg-amber-50 text-amber-900">
                      <tr>
                        <Th>Creator</Th>
                        <Th>Platform</Th>
                        <Th>Views</Th>
                        <Th>Earnings</Th>
                        <Th>Date submitted</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {topVideos.map((video) => (
                        <tr className="align-middle" key={video.id}>
                          <Td>
                            <div className="font-semibold text-amber-950">
                              {video.creatorName}
                            </div>
                            <div className="mt-1 text-xs text-amber-900/60">
                              {video.creatorHandle}
                            </div>
                          </Td>
                          <Td>
                            <span
                              className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${platformStyles[video.platform]}`}
                            >
                              {formatPlatform(video.platform)}
                            </span>
                          </Td>
                          <Td>{numberFormatter.format(video.views)}</Td>
                          <Td>{moneyFormatter.format(video.earnings)}</Td>
                          <Td>{formatDate(video.submittedAt)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-amber-200 bg-amber-50 px-6 py-12 text-center text-sm font-medium text-amber-900/70">
                  Accepted videos will appear here.
                </div>
              )}
            </AnalyticsCard>
          </div>
        </section>
      </div>
    </main>
  );
}

function AnalyticsCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-amber-200 bg-white p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
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

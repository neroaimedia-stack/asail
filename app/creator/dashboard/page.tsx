import Link from "next/link";
import { redirect } from "next/navigation";
import { VideosTable, type CreatorVideoRow } from "./videos-table";
import { createClient } from "@/lib/supabase/server";

type RawVideo = {
  id: string;
  payout_amount: number | string | null;
  payout_status: "paid" | "unpaid";
  rejection_reason: string | null;
  status: "pending" | "accepted" | "rejected";
  submitted_at: string;
  view_count: number | null;
  campaigns: {
    title: string;
    businesses: {
      business_name: string;
    } | null;
  } | null;
  video_history: Array<{
    created_at: string;
    id: string;
    note: string | null;
    status: string;
  }> | null;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  style: "currency",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getCreatorDashboardData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/creator/dashboard");
  }

  const { data: termsAcceptance } = await supabase
    .from("terms_accepted")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!termsAcceptance) {
    redirect(
      "/auth/signup/creator?error=Please%20accept%20the%20Terms%20of%20Service%20and%20Privacy%20Policy.",
    );
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id, handle")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) {
    redirect("/creator/onboarding");
  }

  const { data, error } = await supabase
    .from("videos")
    .select(
      "id, status, view_count, payout_amount, payout_status, submitted_at, rejection_reason, campaigns!inner(title, businesses!inner(business_name)), video_history(id, status, note, created_at)",
    )
    .eq("creator_id", creator.id)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const videos: CreatorVideoRow[] = ((data ?? []) as unknown as RawVideo[]).map(
    (video) => ({
      businessName: video.campaigns?.businesses?.business_name ?? "Business",
      campaignTitle: video.campaigns?.title ?? "Campaign",
      earnings: toNumber(video.payout_amount),
      id: video.id,
      history: (video.video_history ?? [])
        .map((entry) => ({
          createdAt: entry.created_at,
          id: entry.id,
          note: entry.note,
          status: entry.status,
        }))
        .sort(
          (first, second) =>
            new Date(first.createdAt).getTime() -
            new Date(second.createdAt).getTime(),
        ),
      payoutStatus: video.payout_status,
      rejectionReason: video.rejection_reason,
      status: video.status,
      submittedAt: video.submitted_at,
      viewCount: toNumber(video.view_count),
    }),
  );

  const acceptedVideos = videos.filter((video) => video.status === "accepted");
  const totalEarned = videos.reduce((sum, video) => sum + video.earnings, 0);
  const pendingPayout = videos
    .filter((video) => video.payoutStatus !== "paid")
    .reduce((sum, video) => sum + video.earnings, 0);

  return {
    creatorHandle: creator.handle as string,
    stats: {
      pendingPayout,
      totalEarned,
      totalVideos: videos.length,
      totalViews: acceptedVideos.reduce(
        (sum, video) => sum + video.viewCount,
        0,
      ),
    },
    videos,
  };
}

export default async function CreatorDashboardPage({
  searchParams,
}: {
  searchParams?: { message?: string };
}) {
  const { creatorHandle, stats, videos } = await getCreatorDashboardData();

  return (
    <main className="min-h-screen bg-indigo-50 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <aside className="border-b border-indigo-200 bg-white px-5 py-5 md:w-64 md:border-b-0 md:border-r">
          <Link className="block text-lg font-semibold" href="/creator/dashboard">
            Asail
          </Link>
          <p className="mt-1 text-sm text-slate-500">{creatorHandle}</p>
          <nav className="mt-6 flex gap-2 overflow-x-auto text-sm md:flex-col md:overflow-visible">
            <Link
              className="rounded-md bg-indigo-100 px-3 py-2 font-semibold text-indigo-900"
              href="/creator/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
              href="/creator/browse"
            >
              Browse Campaigns
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
              href="/creator/dashboard"
            >
              My Videos
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
              href="/creator/earnings"
            >
              Earnings
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
              href="/leaderboard"
            >
              Leaderboard
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
              href="/creator/settings"
            >
              Settings
            </Link>
          </nav>
        </aside>

        <section className="flex-1 px-5 py-6 md:px-8">
          {searchParams?.message ? (
            <p className="mb-5 rounded-md border border-indigo-200 bg-white px-4 py-3 text-sm font-semibold text-indigo-700">
              {searchParams.message}
            </p>
          ) : null}

          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Track submissions, views, and payouts.
              </p>
            </div>
            <Link
              className="inline-flex rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              href="/creator/browse"
            >
              Browse campaigns
            </Link>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total videos submitted"
              value={numberFormatter.format(stats.totalVideos)}
            />
            <StatCard
              label="Total views accepted"
              value={numberFormatter.format(stats.totalViews)}
            />
            <StatCard
              label="Total earned"
              value={moneyFormatter.format(stats.totalEarned)}
            />
            <StatCard
              label="Pending payout"
              value={moneyFormatter.format(stats.pendingPayout)}
            />
          </div>

          <div className="mt-6">
            <VideosTable videos={videos} />
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-indigo-200 bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ReviewQueue, type ReviewVideo } from "./review-queue";
import { createClient } from "@/lib/supabase/server";

type RawVideo = {
  id: string;
  platform: string;
  submitted_at: string;
  video_url: string;
  campaigns: {
    title: string;
  } | null;
  creators: {
    handle: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
};

type RawHistory = {
  created_at: string;
  note: string | null;
  video_id: string;
};

async function getPendingVideos() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/business/review");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/business/onboarding");
  }

  const { data, error } = await supabase
    .from("videos")
    .select(
      "id, video_url, platform, submitted_at, campaigns!inner(title, business_id), creators!inner(handle, profiles!inner(full_name))",
    )
    .eq("status", "pending")
    .eq("campaigns.business_id", business.id)
    .order("submitted_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rawVideos = (data ?? []) as unknown as RawVideo[];
  const videoIds = rawVideos.map((video) => video.id);
  const { data: historyData, error: historyError } = videoIds.length
    ? await supabase
        .from("video_history")
        .select("video_id, note, created_at")
        .in("video_id", videoIds)
        .eq("note", "Submitted by creator")
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (historyError) {
    throw new Error(historyError.message);
  }

  const submittedAtByVideoId = new Map(
    ((historyData ?? []) as RawHistory[]).map((entry) => [
      entry.video_id,
      entry.created_at,
    ]),
  );

  const videos = rawVideos.map(
    (video): ReviewVideo => ({
      campaignTitle: video.campaigns?.title ?? "Untitled campaign",
      creatorHandle: video.creators?.handle ?? "@creator",
      creatorName: video.creators?.profiles?.full_name ?? "Creator",
      id: video.id,
      platform: video.platform,
      submittedAt: submittedAtByVideoId.get(video.id) ?? video.submitted_at,
      videoUrl: video.video_url,
    }),
  );

  return {
    businessName: business.business_name as string,
    videos,
  };
}

export default async function BusinessReviewPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const { businessName, videos } = await getPendingVideos();

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
              className="rounded-md bg-amber-100 px-3 py-2 font-semibold text-amber-950"
              href="/business/review"
            >
              Review Videos
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/business/settings"
            >
              Settings
            </Link>
          </nav>
        </aside>

        <section className="flex-1 px-5 py-6 md:px-8">
          <header className="mb-6 flex flex-col gap-2 border-b border-amber-200 pb-5">
            <h1 className="text-2xl font-semibold tracking-tight">
              Review Videos
            </h1>
            <p className="text-sm text-amber-900/70">
              {videos.length} videos awaiting review
            </p>
          </header>

          {searchParams?.error ? (
            <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {searchParams.error}
            </p>
          ) : null}

          <ReviewQueue initialVideos={videos} />
        </section>
      </div>
    </main>
  );
}

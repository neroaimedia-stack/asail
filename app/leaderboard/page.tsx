import { redirect } from "next/navigation";
import {
  LeaderboardClient,
  type LeaderboardRow,
} from "./leaderboard-client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RawLeaderboardRow = {
  avg_views_per_video: number | string | null;
  categories: string[] | null;
  creator_id: string;
  full_name: string | null;
  handle: string;
  platform: "youtube" | "tiktok" | "instagram";
  total_earned: number | string | null;
  total_videos_accepted: number | null;
  total_views: number | string | null;
  user_id: string;
  verified: boolean | null;
};

async function getLeaderboardData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/leaderboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: leaderboardData, error: leaderboardError } = await supabase
    .from("creator_leaderboard")
    .select(
      "creator_id, user_id, full_name, handle, platform, categories, verified, total_views, total_earned, total_videos_accepted, avg_views_per_video",
    )
    .order("total_views", { ascending: false });

  if (leaderboardError) {
    throw new Error(leaderboardError.message);
  }

  const rows: LeaderboardRow[] = (
    (leaderboardData ?? []) as RawLeaderboardRow[]
  ).map((row) => ({
    avgViewsPerVideo: row.avg_views_per_video ?? 0,
    categories: row.categories ?? [],
    creatorId: row.creator_id,
    fullName: row.full_name ?? "Creator",
    handle: row.handle,
    platform: row.platform,
    totalEarned: row.total_earned ?? 0,
    totalVideosAccepted: row.total_videos_accepted ?? 0,
    totalViews: row.total_views ?? 0,
    userId: row.user_id,
    verified: Boolean(row.verified),
  }));

  return {
    isBusiness: profile?.role === "business",
    rows,
  };
}

export default async function LeaderboardPage() {
  const { isBusiness, rows } = await getLeaderboardData();

  return (
    <LeaderboardClient
      isBusiness={isBusiness}
      rows={rows}
    />
  );
}

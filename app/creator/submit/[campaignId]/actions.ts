"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateVideoSubmissionLimits } from "@/lib/submission-limits";
import { recordVideoHistory } from "@/lib/video-history";

type Platform = "youtube" | "tiktok" | "instagram";

function detectPlatform(url: string): Platform | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be" || host.endsWith("youtube.com")) {
      return "youtube";
    }

    if (host.endsWith("tiktok.com")) {
      return "tiktok";
    }

    if (host.endsWith("instagram.com") && parsed.pathname.includes("/reel")) {
      return "instagram";
    }
  } catch {
    return null;
  }

  return null;
}

function redirectWithError(campaignId: string, message: string): never {
  redirect(
    `/creator/submit/${campaignId}?error=${encodeURIComponent(message)}`,
  );
}

export async function submitVideo(campaignId: string, formData: FormData) {
  const videoUrl = formData.get("videoUrl");

  if (typeof videoUrl !== "string") {
    redirectWithError(campaignId, "Video URL is required.");
  }

  const normalizedUrl = videoUrl.trim();
  const platform = detectPlatform(normalizedUrl);

  if (!platform) {
    redirectWithError(
      campaignId,
      "Enter a valid YouTube, TikTok, or Instagram Reels URL.",
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectedFrom=/creator/submit/${campaignId}`);
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) {
    redirect("/creator/onboarding");
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();

  if (!campaign) {
    redirect("/creator/browse");
  }

  const limitResult = await validateVideoSubmissionLimits({
    campaignId: campaign.id,
    creatorId: creator.id,
  });

  if (!limitResult.ok && limitResult.message) {
    redirectWithError(campaignId, limitResult.message);
  }

  const { data: video, error } = await supabase
    .from("videos")
    .insert({
      campaign_id: campaign.id,
      creator_id: creator.id,
      platform,
      status: "pending",
      video_url: normalizedUrl,
    })
    .select("id")
    .single();

  if (error) {
    redirectWithError(campaignId, error.message);
  }

  await recordVideoHistory({
    changedBy: user.id,
    note: "Submitted by creator",
    status: "pending",
    videoId: video.id,
  });

  revalidatePath("/creator/dashboard");
  redirect("/creator/dashboard?message=Video%20submitted%20for%20review.");
}

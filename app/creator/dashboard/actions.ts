"use server";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type SubmitDisputeResult = {
  error?: string;
  success?: string;
};

type DisputeVideo = {
  creator_id: string;
  reviewed_at: string | null;
  status: string;
  campaigns: {
    business_id: string;
  } | null;
};

export async function submitDispute(
  formData: FormData,
): Promise<SubmitDisputeResult> {
  const videoId = formData.get("videoId");
  const reasonValue = formData.get("reason");
  const evidenceValue = formData.get("evidenceUrl");

  if (typeof videoId !== "string") {
    return { error: "Choose a video to dispute." };
  }

  const reason = typeof reasonValue === "string" ? reasonValue.trim() : "";
  const evidenceUrl =
    typeof evidenceValue === "string" ? evidenceValue.trim() : "";

  if (reason.length < 50) {
    return {
      error: "Explain why you disagree with at least 50 characters.",
    };
  }

  if (evidenceUrl) {
    try {
      new URL(evidenceUrl);
    } catch {
      return { error: "Enter a valid evidence URL or leave it blank." };
    }
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in before submitting a dispute." };
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) {
    return { error: "Finish creator onboarding before submitting disputes." };
  }

  const { data: existingDispute } = await supabase
    .from("disputes")
    .select("id")
    .eq("video_id", videoId)
    .maybeSingle();

  if (existingDispute) {
    return { error: "A dispute has already been submitted for this video." };
  }

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("creator_id, status, reviewed_at, campaigns!inner(business_id)")
    .eq("id", videoId)
    .eq("creator_id", creator.id)
    .maybeSingle();

  if (videoError || !video) {
    return { error: "We could not find this rejected video." };
  }

  const disputeVideo = video as unknown as DisputeVideo;

  if (disputeVideo.status !== "rejected") {
    return { error: "Only rejected videos can be disputed." };
  }

  if (!disputeVideo.reviewed_at) {
    return { error: "This rejection cannot be disputed yet." };
  }

  if (!disputeVideo.campaigns?.business_id) {
    return { error: "We could not identify the business for this dispute." };
  }

  const reviewedAt = new Date(disputeVideo.reviewed_at).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  if (reviewedAt < sevenDaysAgo) {
    return {
      error: "Disputes must be submitted within 7 days of rejection.",
    };
  }

  const { error } = await supabase.from("disputes").insert({
    business_id: disputeVideo.campaigns.business_id,
    creator_id: creator.id,
    evidence_url: evidenceUrl || null,
    reason,
    status: "open",
    video_id: videoId,
  });

  if (error) {
    return { error: error.message };
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("user_id")
    .eq("id", disputeVideo.campaigns.business_id)
    .maybeSingle();

  if (business?.user_id) {
    await createNotification({
      body: "A creator has disputed a rejected video. Review the dispute details from the admin queue.",
      link: "/business/review",
      title: "Dispute opened",
      type: "dispute_opened",
      userId: business.user_id as string,
    });
  }

  revalidatePath("/creator/dashboard");

  return {
    success:
      "Your dispute has been submitted. We will review it within 3 business days.",
  };
}

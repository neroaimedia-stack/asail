import { createClient } from "@/lib/supabase/server";

const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

export type SubmissionLimitResult = {
  blocksForm: boolean;
  message: string | null;
  ok: boolean;
};

export async function validateVideoSubmissionLimits({
  campaignId,
  creatorId,
}: {
  campaignId: string;
  creatorId: string;
}): Promise<SubmissionLimitResult> {
  const supabase = createClient();

  const { count: activeSubmissionCount, error: activeSubmissionError } =
    await supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .eq("campaign_id", campaignId)
      .in("status", ["pending", "accepted"]);

  if (activeSubmissionError) {
    throw activeSubmissionError;
  }

  if ((activeSubmissionCount ?? 0) > 0) {
    return {
      blocksForm: true,
      message: "You already have an active submission for this campaign.",
      ok: false,
    };
  }

  const { count: campaignSubmissionCount, error: campaignSubmissionError } =
    await supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .eq("campaign_id", campaignId);

  if (campaignSubmissionError) {
    throw campaignSubmissionError;
  }

  if ((campaignSubmissionCount ?? 0) >= 3) {
    return {
      blocksForm: true,
      message: "You have reached the maximum of 3 submissions for this campaign.",
      ok: false,
    };
  }

  const since = new Date(Date.now() - oneDayInMilliseconds).toISOString();
  const { count: dailySubmissionCount, error: dailySubmissionError } =
    await supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creatorId)
      .gte("submitted_at", since);

  if (dailySubmissionError) {
    throw dailySubmissionError;
  }

  if ((dailySubmissionCount ?? 0) >= 5) {
    return {
      blocksForm: false,
      message: "You have reached your daily submission limit of 5 videos. Try again tomorrow.",
      ok: false,
    };
  }

  const { data: lastSubmission, error: lastSubmissionError } = await supabase
    .from("videos")
    .select("status, reviewed_at")
    .eq("creator_id", creatorId)
    .eq("campaign_id", campaignId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastSubmissionError) {
    throw lastSubmissionError;
  }

  if (lastSubmission?.status === "rejected") {
    const reviewedAt = lastSubmission.reviewed_at
      ? new Date(lastSubmission.reviewed_at).getTime()
      : null;
    const canResubmitAt = reviewedAt
      ? reviewedAt + oneDayInMilliseconds
      : Date.now() + oneDayInMilliseconds;

    if (canResubmitAt > Date.now()) {
      return {
        blocksForm: false,
        message: "Please wait 24 hours after a rejection before resubmitting to this campaign.",
        ok: false,
      };
    }
  }

  return {
    blocksForm: false,
    message: null,
    ok: true,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPreferredEmail } from "@/lib/email";
import { videoAcceptedEmail, videoRejectedEmail } from "@/lib/email-templates";
import { createNotification } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordVideoHistory } from "@/lib/video-history";

async function getBusinessId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/business/review");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/business/onboarding");
  }

  return { businessId: business.id as string, supabase, userId: user.id };
}

async function canReviewVideo(videoId: string, businessId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("videos")
    .select("id, campaigns!inner(business_id)")
    .eq("id", videoId)
    .eq("status", "pending")
    .eq("campaigns.business_id", businessId)
    .maybeSingle();

  return Boolean(data);
}

async function getReviewNotificationContext(videoId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("videos")
    .select(
      "id, creators!inner(user_id, profiles!inner(full_name)), campaigns!inner(title, businesses!inner(business_name))",
    )
    .eq("id", videoId)
    .maybeSingle();

  return data as unknown as
    | {
        campaigns: {
          businesses: { business_name: string } | null;
          title: string;
        } | null;
        creators: {
          profiles: { full_name: string } | null;
          user_id: string;
        } | null;
      }
    | null;
}

export async function acceptVideo(formData: FormData) {
  const videoId = formData.get("videoId");

  if (typeof videoId !== "string") {
    redirect("/business/review");
  }

  const { businessId, supabase, userId } = await getBusinessId();

  if (!(await canReviewVideo(videoId, businessId))) {
    redirect("/business/review");
  }

  await supabase
    .from("videos")
    .update({
      reviewed_at: new Date().toISOString(),
      status: "accepted",
    })
    .eq("id", videoId);

  await recordVideoHistory({
    changedBy: userId,
    note: "Accepted by business",
    status: "accepted",
    videoId,
  });

  const notificationContext = await getReviewNotificationContext(videoId);
  if (notificationContext?.creators?.user_id) {
    const template = videoAcceptedEmail({
      businessName:
        notificationContext.campaigns?.businesses?.business_name ?? "Business",
      campaignTitle: notificationContext.campaigns?.title ?? "this campaign",
      creatorName:
        notificationContext.creators.profiles?.full_name ?? "Creator",
    });

    await createNotification({
      body: `Your video for ${notificationContext.campaigns?.title ?? "this campaign"} was accepted. Views will be tracked automatically.`,
      link: "/creator/dashboard",
      title: "Your video was accepted!",
      type: "video_accepted",
      userId: notificationContext.creators.user_id,
    });
    await sendPreferredEmail({
      html: template.html,
      preference: "video_updates",
      subject: template.subject,
      userId: notificationContext.creators.user_id,
    });
  }

  revalidatePath("/business/review");
  revalidatePath("/business/dashboard");
}

export async function rejectVideo(formData: FormData) {
  const videoId = formData.get("videoId");
  const rejectionReason = formData.get("rejectionReason");

  if (typeof videoId !== "string") {
    redirect("/business/review");
  }

  const reason =
    typeof rejectionReason === "string" ? rejectionReason.trim() : "";

  if (!reason) {
    redirect("/business/review?error=Add%20a%20rejection%20reason.");
  }

  const { businessId, supabase, userId } = await getBusinessId();

  if (!(await canReviewVideo(videoId, businessId))) {
    redirect("/business/review");
  }

  await supabase
    .from("videos")
    .update({
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
      status: "rejected",
    })
    .eq("id", videoId);

  await recordVideoHistory({
    changedBy: userId,
    note: `Rejected: ${reason}`,
    status: "rejected",
    videoId,
  });

  const notificationContext = await getReviewNotificationContext(videoId);
  if (notificationContext?.creators?.user_id) {
    const template = videoRejectedEmail({
      campaignTitle: notificationContext.campaigns?.title ?? "this campaign",
      creatorName:
        notificationContext.creators.profiles?.full_name ?? "Creator",
      rejectionReason: reason,
    });

    await createNotification({
      body: `Your video for ${notificationContext.campaigns?.title ?? "this campaign"} was not accepted. Reason: ${reason}`,
      link: "/creator/dashboard",
      title: "Video not accepted",
      type: "video_rejected",
      userId: notificationContext.creators.user_id,
    });
    await sendPreferredEmail({
      html: template.html,
      preference: "video_updates",
      subject: template.subject,
      userId: notificationContext.creators.user_id,
    });
  }

  revalidatePath("/business/review");
  revalidatePath("/business/dashboard");
}

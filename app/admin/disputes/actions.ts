"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordVideoHistory } from "@/lib/video-history";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/admin/disputes");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return user.id;
}

export async function resolveDispute(formData: FormData) {
  const adminId = await requireAdmin();
  const disputeId = formData.get("disputeId");
  const resolution = formData.get("resolution");
  const noteValue = formData.get("adminNote");

  if (typeof disputeId !== "string") {
    redirect("/admin/disputes?error=Missing%20dispute.");
  }

  const adminNote = typeof noteValue === "string" ? noteValue.trim() : "";

  if (!adminNote) {
    redirect("/admin/disputes?error=Add%20an%20admin%20note%20before%20resolving.");
  }

  if (resolution !== "creator" && resolution !== "business") {
    redirect("/admin/disputes?error=Choose%20a%20resolution.");
  }

  const admin = createAdminClient();
  const { data: dispute, error: disputeError } = await admin
    .from("disputes")
    .select("id, video_id, status, creators!inner(user_id)")
    .eq("id", disputeId)
    .maybeSingle();

  if (disputeError || !dispute || dispute.status !== "open") {
    redirect("/admin/disputes?error=This%20dispute%20is%20not%20open.");
  }

  const resolvedAt = new Date().toISOString();
  const creatorUserId = (dispute.creators as { user_id?: string } | null)
    ?.user_id;

  if (resolution === "creator") {
    const { error: videoError } = await admin
      .from("videos")
      .update({
        reviewed_at: resolvedAt,
        status: "accepted",
      })
      .eq("id", dispute.video_id);

    if (videoError) {
      redirect("/admin/disputes?error=Could%20not%20accept%20the%20video.");
    }

    const { error: updateError } = await admin
      .from("disputes")
      .update({
        admin_note: adminNote,
        resolved_at: resolvedAt,
        resolved_by: adminId,
        status: "resolved_creator",
      })
      .eq("id", disputeId);

    if (updateError) {
      redirect("/admin/disputes?error=Could%20not%20update%20the%20dispute.");
    }

    await recordVideoHistory({
      changedBy: adminId,
      note: "Dispute resolved - video accepted",
      status: "accepted",
      videoId: dispute.video_id,
    });

    if (creatorUserId) {
      await createNotification({
        body: "Your dispute was resolved in your favor. The video is now accepted.",
        link: "/creator/dashboard",
        title: "Dispute resolved",
        type: "dispute_resolved",
        userId: creatorUserId,
      });
    }
  } else {
    const { error: updateError } = await admin
      .from("disputes")
      .update({
        admin_note: adminNote,
        resolved_at: resolvedAt,
        resolved_by: adminId,
        status: "resolved_business",
      })
      .eq("id", disputeId);

    if (updateError) {
      redirect("/admin/disputes?error=Could%20not%20update%20the%20dispute.");
    }

    await recordVideoHistory({
      changedBy: adminId,
      note: "Dispute resolved - rejection upheld",
      status: "rejected",
      videoId: dispute.video_id,
    });

    if (creatorUserId) {
      await createNotification({
        body: "Your dispute was reviewed and the rejection was upheld.",
        link: "/creator/dashboard",
        title: "Dispute resolved",
        type: "dispute_resolved",
        userId: creatorUserId,
      });
    }
  }

  revalidatePath("/admin/disputes");
  revalidatePath("/creator/dashboard");
  redirect("/admin/disputes?message=Dispute%20resolved.");
}

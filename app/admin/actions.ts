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
    redirect("/auth/login?redirectedFrom=/admin");
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

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function suspendUser(formData: FormData) {
  await requireAdmin();
  const userId = getString(formData, "userId");
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ suspended_at: new Date().toISOString() })
    .eq("id", userId);
  revalidatePath("/admin/users");
}

export async function softDeleteUser(formData: FormData) {
  await requireAdmin();
  const userId = getString(formData, "userId");
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", userId);
  revalidatePath("/admin/users");
}

export async function makeAdmin(formData: FormData) {
  await requireAdmin();
  const userId = getString(formData, "userId");
  const admin = createAdminClient();
  await admin.from("profiles").update({ role: "admin" }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function setCampaignAdminStatus(formData: FormData) {
  await requireAdmin();
  const campaignId = getString(formData, "campaignId");
  const status = getString(formData, "status");

  if (!["active", "paused", "completed"].includes(status)) {
    redirect("/admin/campaigns?error=Invalid%20campaign%20status.");
  }

  const admin = createAdminClient();
  await admin.from("campaigns").update({ status }).eq("id", campaignId);
  revalidatePath("/admin/campaigns");
}

export async function deleteCampaign(formData: FormData) {
  await requireAdmin();
  const campaignId = getString(formData, "campaignId");
  const admin = createAdminClient();
  await admin.from("campaigns").delete().eq("id", campaignId);
  revalidatePath("/admin/campaigns");
}

export async function overrideVideoStatus(formData: FormData) {
  const adminId = await requireAdmin();
  const videoId = getString(formData, "videoId");
  const status = getString(formData, "status");
  const reason = getString(formData, "reason") || "No reason provided";

  if (!["accepted", "rejected"].includes(status)) {
    redirect("/admin/videos?error=Invalid%20video%20status.");
  }

  const admin = createAdminClient();
  await admin
    .from("videos")
    .update({
      rejection_reason: status === "rejected" ? reason : null,
      reviewed_at: new Date().toISOString(),
      status,
    })
    .eq("id", videoId);
  await recordVideoHistory({
    changedBy: adminId,
    note: `Status overridden by admin: ${reason}`,
    status,
    videoId,
  });
  revalidatePath("/admin/videos");
}

export async function approveVerification(formData: FormData) {
  await requireAdmin();
  const verificationId = getString(formData, "verificationId");
  const admin = createAdminClient();
  const { data: verification } = await admin
    .from("pending_verifications")
    .select("id, platform, creator_id, creators!inner(user_id)")
    .eq("id", verificationId)
    .maybeSingle();

  if (!verification) {
    redirect("/admin/verifications");
  }

  await admin
    .from("creators")
    .update({ verified: true })
    .eq("id", verification.creator_id);
  await admin.from("pending_verifications").delete().eq("id", verificationId);

  const creator = verification.creators as { user_id?: string } | null;
  if (creator?.user_id) {
    await createNotification({
      body: `Your ${verification.platform} account has been verified.`,
      link: "/settings?tab=platforms",
      title: "Account verified",
      type: "dispute_resolved",
      userId: creator.user_id,
    });
  }

  revalidatePath("/admin/verifications");
}

export async function rejectVerification(formData: FormData) {
  await requireAdmin();
  const verificationId = getString(formData, "verificationId");
  const admin = createAdminClient();
  const { data: verification } = await admin
    .from("pending_verifications")
    .select("id, creators!inner(user_id)")
    .eq("id", verificationId)
    .maybeSingle();

  await admin.from("pending_verifications").delete().eq("id", verificationId);
  const creator = verification?.creators as { user_id?: string } | null;
  if (creator?.user_id) {
    await createNotification({
      body: "Your account verification was unsuccessful. Please ensure the code is in your bio and resubmit.",
      link: "/settings?tab=platforms",
      title: "Verification unsuccessful",
      type: "dispute_resolved",
      userId: creator.user_id,
    });
  }

  revalidatePath("/admin/verifications");
}

export async function markDisputeUnderReview(formData: FormData) {
  await requireAdmin();
  const disputeId = getString(formData, "disputeId");
  const admin = createAdminClient();
  await admin
    .from("disputes")
    .update({ status: "under_review" })
    .eq("id", disputeId);
  revalidatePath("/admin/disputes");
}

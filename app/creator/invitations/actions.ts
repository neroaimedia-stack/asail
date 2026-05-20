"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getCreatorId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/creator/invitations");
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id, handle")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) {
    redirect("/creator/onboarding");
  }

  return {
    creatorHandle: creator.handle as string,
    creatorId: creator.id as string,
  };
}

export async function acceptInvitation(formData: FormData) {
  const invitationId = formData.get("invitationId");

  if (typeof invitationId !== "string") {
    redirect("/creator/invitations");
  }

  const { creatorHandle, creatorId } = await getCreatorId();
  const admin = createAdminClient();
  const { data: invitation, error: invitationError } = await admin
    .from("invitations")
    .select(
      "id, campaign_id, creator_id, status, expires_at, campaigns!inner(title), businesses!inner(user_id)",
    )
    .eq("id", invitationId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (
    invitationError ||
    !invitation ||
    invitation.status !== "pending" ||
    new Date(invitation.expires_at).getTime() < Date.now()
  ) {
    redirect("/creator/invitations?error=This%20invitation%20is%20no%20longer%20available.");
  }

  const respondedAt = new Date().toISOString();
  const { error } = await admin
    .from("invitations")
    .update({
      responded_at: respondedAt,
      status: "accepted",
    })
    .eq("id", invitationId)
    .eq("creator_id", creatorId);

  if (error) {
    redirect("/creator/invitations?error=Could%20not%20accept%20the%20invitation.");
  }

  const campaign = invitation.campaigns as { title?: string } | null;
  const business = invitation.businesses as { user_id?: string } | null;

  if (business?.user_id) {
    await createNotification({
      body: `${creatorHandle} accepted your invitation to ${campaign?.title ?? "your campaign"}`,
      link: "/business/dashboard",
      title: "Invitation accepted",
      type: "invitation_accepted",
      userId: business.user_id,
    });
  }

  revalidatePath("/creator/invitations");
  redirect(`/creator/browse/${invitation.campaign_id}`);
}

export async function declineInvitation(formData: FormData) {
  const invitationId = formData.get("invitationId");

  if (typeof invitationId !== "string") {
    redirect("/creator/invitations");
  }

  const { creatorId } = await getCreatorId();
  const admin = createAdminClient();
  const { error } = await admin
    .from("invitations")
    .update({
      responded_at: new Date().toISOString(),
      status: "declined",
    })
    .eq("id", invitationId)
    .eq("creator_id", creatorId)
    .eq("status", "pending");

  if (error) {
    redirect("/creator/invitations?error=Could%20not%20decline%20the%20invitation.");
  }

  revalidatePath("/creator/invitations");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InviteCampaignOption = {
  disabledReason: string | null;
  id: string;
  title: string;
};

export type SendInvitationResult = {
  error?: string;
  success?: string;
};

type BusinessContext = {
  businessId: string;
  businessName: string;
  userId: string;
};

async function requireBusiness(): Promise<BusinessContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/leaderboard");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/business/onboarding");
  }

  return {
    businessId: business.id as string,
    businessName: business.business_name as string,
    userId: user.id,
  };
}

export async function getInviteCampaignOptions(
  creatorId: string,
): Promise<InviteCampaignOption[]> {
  const { businessId } = await requireBusiness();
  const admin = createAdminClient();

  const { data: campaigns, error: campaignsError } = await admin
    .from("campaigns")
    .select("id, title")
    .eq("business_id", businessId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (campaignsError) {
    throw campaignsError;
  }

  const campaignIds = (campaigns ?? []).map((campaign) => campaign.id);

  if (!campaignIds.length) {
    return [];
  }

  const [videosResult, invitationsResult] = await Promise.all([
    admin
      .from("videos")
      .select("campaign_id, status")
      .eq("creator_id", creatorId)
      .in("campaign_id", campaignIds)
      .in("status", ["pending", "accepted"]),
    admin
      .from("invitations")
      .select("campaign_id, status")
      .eq("creator_id", creatorId)
      .in("campaign_id", campaignIds)
      .eq("status", "pending"),
  ]);

  if (videosResult.error) {
    throw videosResult.error;
  }

  if (invitationsResult.error) {
    throw invitationsResult.error;
  }

  const activeSubmissionCampaignIds = new Set(
    (videosResult.data ?? []).map((video) => video.campaign_id as string),
  );
  const invitedCampaignIds = new Set(
    (invitationsResult.data ?? []).map(
      (invitation) => invitation.campaign_id as string,
    ),
  );

  return (campaigns ?? []).map((campaign) => ({
    disabledReason: activeSubmissionCampaignIds.has(campaign.id)
      ? "Creator already has an active submission"
      : invitedCampaignIds.has(campaign.id)
        ? "Invitation already pending"
        : null,
    id: campaign.id,
    title: campaign.title,
  }));
}

export async function sendInvitation(
  formData: FormData,
): Promise<SendInvitationResult> {
  const creatorId = formData.get("creatorId");
  const campaignId = formData.get("campaignId");
  const messageValue = formData.get("message");

  if (typeof creatorId !== "string" || typeof campaignId !== "string") {
    return { error: "Choose a campaign and creator." };
  }

  const message =
    typeof messageValue === "string" ? messageValue.trim().slice(0, 200) : "";

  const { businessId, businessName } = await requireBusiness();
  const admin = createAdminClient();

  const options = await getInviteCampaignOptions(creatorId);
  const selectedOption = options.find((option) => option.id === campaignId);

  if (!selectedOption) {
    return { error: "This campaign is not available for invitations." };
  }

  if (selectedOption.disabledReason) {
    return {
      error:
        selectedOption.disabledReason === "Invitation already pending"
          ? "You already invited this creator to this campaign."
          : selectedOption.disabledReason,
    };
  }

  const { data: creator, error: creatorError } = await admin
    .from("creators")
    .select("id, user_id, handle")
    .eq("id", creatorId)
    .maybeSingle();

  if (creatorError || !creator) {
    return { error: "Creator not found." };
  }

  const { data: invitation, error } = await admin
    .from("invitations")
    .insert({
      business_id: businessId,
      campaign_id: campaignId,
      creator_id: creatorId,
      message: message || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "You already invited this creator to this campaign." };
    }

    return { error: error.message };
  }

  await createNotification({
    body: `${businessName} invited you to their campaign: ${selectedOption.title}`,
    link: "/creator/invitations",
    title: "You've been invited to a campaign",
    type: "invitation_received",
    userId: creator.user_id as string,
  });

  revalidatePath("/leaderboard");
  revalidatePath("/search");
  revalidatePath(`/business/campaigns/${campaignId}`);

  return {
    success: `Invitation sent to ${creator.handle}`,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type BusinessContext = {
  businessId: string;
  businessName: string;
  userId: string;
};

async function getUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/messages");
  }

  return user.id;
}

async function requireBusiness(): Promise<BusinessContext> {
  const userId = await getUserId();
  const admin = createAdminClient();
  const { data: business, error } = await admin
    .from("businesses")
    .select("id, business_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!business) {
    redirect("/business/onboarding");
  }

  return {
    businessId: business.id as string,
    businessName: business.business_name as string,
    userId,
  };
}

async function getConversationForParticipant(conversationId: string, userId: string) {
  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  const { data: creator } = await admin
    .from("creators")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: conversation, error } = await admin
    .from("conversations")
    .select(
      "id, business_id, creator_id, campaign_id, businesses(user_id, business_name), creators(user_id, handle, profiles(full_name))",
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const isParticipant =
    Boolean(business?.id && conversation?.business_id === business.id) ||
    Boolean(creator?.id && conversation?.creator_id === creator.id);

  return isParticipant ? conversation : null;
}

async function findOrCreateConversation({
  businessId,
  campaignId,
  creatorId,
}: {
  businessId: string;
  campaignId?: string | null;
  creatorId: string;
}) {
  const admin = createAdminClient();
  let query = admin
    .from("conversations")
    .select("id")
    .eq("business_id", businessId)
    .eq("creator_id", creatorId);

  query = campaignId ? query.eq("campaign_id", campaignId) : query.is("campaign_id", null);

  const { data: existing, error: existingError } = await query.maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.id) {
    return existing.id as string;
  }

  const { data: created, error } = await admin
    .from("conversations")
    .insert({
      business_id: businessId,
      campaign_id: campaignId ?? null,
      creator_id: creatorId,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return created.id as string;
}

export async function startBusinessConversation(formData: FormData) {
  const creatorId = formData.get("creatorId");
  const campaignIdValue = formData.get("campaignId");

  if (typeof creatorId !== "string") {
    redirect("/messages");
  }

  const campaignId =
    typeof campaignIdValue === "string" && campaignIdValue
      ? campaignIdValue
      : null;
  const { businessId } = await requireBusiness();
  const admin = createAdminClient();

  if (campaignId) {
    const { data: campaign } = await admin
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (!campaign) {
      redirect("/messages");
    }
  }

  const conversationId = await findOrCreateConversation({
    businessId,
    campaignId,
    creatorId,
  });

  redirect(`/messages?conversation=${conversationId}`);
}

export async function startCreatorInvitedConversation(formData: FormData) {
  const invitationId = formData.get("invitationId");

  if (typeof invitationId !== "string") {
    redirect("/messages");
  }

  const userId = await getUserId();
  const admin = createAdminClient();
  const { data: creator } = await admin
    .from("creators")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!creator) {
    redirect("/creator/onboarding");
  }

  const { data: invitation } = await admin
    .from("invitations")
    .select("business_id, campaign_id, creator_id, status, expires_at")
    .eq("id", invitationId)
    .eq("creator_id", creator.id)
    .in("status", ["pending", "accepted"])
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!invitation) {
    redirect("/messages");
  }

  const conversationId = await findOrCreateConversation({
    businessId: invitation.business_id as string,
    campaignId: invitation.campaign_id as string,
    creatorId: creator.id as string,
  });

  redirect(`/messages?conversation=${conversationId}`);
}

export async function startConversationFromReview(formData: FormData) {
  const videoId = formData.get("videoId");

  if (typeof videoId !== "string") {
    redirect("/business/review");
  }

  const { businessId } = await requireBusiness();
  const admin = createAdminClient();
  const { data: video } = await admin
    .from("videos")
    .select("creator_id, campaign_id, campaigns!inner(business_id)")
    .eq("id", videoId)
    .eq("campaigns.business_id", businessId)
    .maybeSingle();

  const rawVideo = video as unknown as
    | { campaign_id: string; creator_id: string }
    | null;

  if (!rawVideo) {
    redirect("/business/review");
  }

  const conversationId = await findOrCreateConversation({
    businessId,
    campaignId: rawVideo.campaign_id,
    creatorId: rawVideo.creator_id,
  });

  redirect(`/messages?conversation=${conversationId}`);
}

export async function sendMessage(formData: FormData) {
  const conversationId = formData.get("conversationId");
  const contentValue = formData.get("content");

  if (typeof conversationId !== "string") {
    return { error: "Choose a conversation." };
  }

  const content = typeof contentValue === "string" ? contentValue.trim() : "";

  if (!content) {
    return { error: "Write a message first." };
  }

  const userId = await getUserId();
  const conversation = await getConversationForParticipant(conversationId, userId);

  if (!conversation) {
    return { error: "You do not have access to this conversation." };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: message, error } = await admin
    .from("messages")
    .insert({
      content,
      conversation_id: conversationId,
      sender_id: userId,
    })
    .select("id, conversation_id, sender_id, content, read, created_at")
    .single();

  if (error) {
    return { error: error.message };
  }

  await admin
    .from("conversations")
    .update({ last_message_at: now })
    .eq("id", conversationId);

  const business = conversation.businesses as
    | { business_name?: string; user_id?: string }
    | null;
  const creator = conversation.creators as
    | { handle?: string; profiles?: { full_name?: string } | null; user_id?: string }
    | null;
  const recipientUserId =
    userId === business?.user_id ? creator?.user_id : business?.user_id;
  const senderName =
    userId === business?.user_id
      ? business?.business_name ?? "Business"
      : creator?.profiles?.full_name ?? creator?.handle ?? "Creator";

  if (recipientUserId) {
    await createNotification({
      body: content.length > 60 ? `${content.slice(0, 57)}...` : content,
      link: `/messages?conversation=${conversationId}`,
      title: `New message from ${senderName}`,
      type: "new_message",
      userId: recipientUserId,
    });
  }

  revalidatePath("/messages");
  return {
    message: message
      ? {
          content: message.content as string,
          conversationId: message.conversation_id as string,
          createdAt: message.created_at as string,
          id: message.id as string,
          read: message.read as boolean,
          senderId: message.sender_id as string,
        }
      : null,
    success: true,
  };
}

export async function markConversationRead(conversationId: string) {
  const userId = await getUserId();
  const conversation = await getConversationForParticipant(conversationId, userId);

  if (!conversation) {
    return;
  }

  const admin = createAdminClient();
  await admin
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);

  revalidatePath("/messages");
}

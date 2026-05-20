import { redirect } from "next/navigation";
import { MessagesClient, type ConversationSummary, type MessageItem } from "./messages-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProfileRole = "business" | "creator" | "admin";

type RawConversation = {
  business_id: string;
  campaign_id: string | null;
  campaigns: { title: string } | null;
  created_at: string;
  creator_id: string;
  creators: {
    handle: string;
    profiles: {
      avatar_url: string | null;
      full_name: string;
    } | null;
  } | null;
  businesses: {
    business_name: string;
    logo_url: string | null;
  } | null;
  id: string;
  last_message_at: string;
};

type RawMessage = {
  content: string;
  conversation_id: string;
  created_at: string;
  id: string;
  read: boolean;
  sender_id: string;
};

type CreatorOption = {
  fullName: string;
  handle: string;
  id: string;
};

type CampaignOption = {
  id: string;
  title: string;
};

type InvitedConversationOption = {
  businessName: string;
  campaignTitle: string;
  id: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function getMessagesData(selectedConversationId?: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/messages");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const [businessResult, creatorResult] = await Promise.all([
    admin
      .from("businesses")
      .select("id, business_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin.from("creators").select("id, handle").eq("user_id", user.id).maybeSingle(),
  ]);

  const filters: string[] = [];

  if (businessResult.data?.id) {
    filters.push(`business_id.eq.${businessResult.data.id}`);
  }

  if (creatorResult.data?.id) {
    filters.push(`creator_id.eq.${creatorResult.data.id}`);
  }

  if (!filters.length && profile?.role !== "admin") {
    redirect("/auth/login");
  }

  const { data: conversationData, error: conversationError } = filters.length
    ? await admin
        .from("conversations")
        .select(
          "id, business_id, creator_id, campaign_id, last_message_at, created_at, businesses(business_name, logo_url), creators(handle, profiles(full_name, avatar_url)), campaigns(title)",
        )
        .or(filters.join(","))
        .order("last_message_at", { ascending: false })
    : { data: [], error: null };

  if (conversationError) {
    throw new Error(conversationError.message);
  }

  const conversations = (conversationData ?? []) as unknown as RawConversation[];
  const conversationIds = conversations.map((conversation) => conversation.id);
  const { data: allMessagesData, error: messagesError } = conversationIds.length
    ? await admin
        .from("messages")
        .select("id, conversation_id, sender_id, content, read, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const allMessages = (allMessagesData ?? []) as RawMessage[];
  const messagesByConversation = new Map<string, RawMessage[]>();

  for (const message of allMessages) {
    const existing = messagesByConversation.get(message.conversation_id) ?? [];
    existing.push(message);
    messagesByConversation.set(message.conversation_id, existing);
  }

  const summaries: ConversationSummary[] = conversations.map((conversation) => {
    const messages = messagesByConversation.get(conversation.id) ?? [];
    const lastMessage = messages[messages.length - 1];
    const unreadCount = messages.filter(
      (message) => message.sender_id !== user.id && !message.read,
    ).length;
    const otherName = businessResult.data?.id
      ? conversation.creators?.profiles?.full_name ?? "Creator"
      : conversation.businesses?.business_name ?? "Business";
    const otherHandle = businessResult.data?.id
      ? conversation.creators?.handle ?? null
      : null;
    const avatarUrl = businessResult.data?.id
      ? conversation.creators?.profiles?.avatar_url ?? null
      : conversation.businesses?.logo_url ?? null;

    return {
      avatarInitials: initials(otherName),
      avatarUrl,
      campaignId: conversation.campaign_id,
      campaignTitle: conversation.campaigns?.title ?? null,
      id: conversation.id,
      lastMessageAt: lastMessage?.created_at ?? conversation.last_message_at,
      lastMessagePreview: lastMessage?.content ?? "No messages yet",
      otherHandle,
      otherName,
      unreadCount,
    };
  });

  const selectedId =
    selectedConversationId && summaries.some((item) => item.id === selectedConversationId)
      ? selectedConversationId
      : summaries[0]?.id ?? null;
  const selectedMessages: MessageItem[] = selectedId
    ? (messagesByConversation.get(selectedId) ?? []).map((message) => ({
        content: message.content,
        conversationId: message.conversation_id,
        createdAt: message.created_at,
        id: message.id,
        read: message.read,
        senderId: message.sender_id,
      }))
    : [];

  let creatorOptions: CreatorOption[] = [];
  let campaignOptions: CampaignOption[] = [];
  let invitedOptions: InvitedConversationOption[] = [];

  if (businessResult.data?.id) {
    const [creatorsResponse, campaignsResponse] = await Promise.all([
      admin
        .from("creator_leaderboard")
        .select("creator_id, full_name, handle")
        .order("total_views", { ascending: false })
        .limit(75),
      admin
        .from("campaigns")
        .select("id, title")
        .eq("business_id", businessResult.data.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);

    creatorOptions = (creatorsResponse.data ?? []).map((creator) => ({
      fullName: (creator.full_name as string | null) ?? "Creator",
      handle: creator.handle as string,
      id: creator.creator_id as string,
    }));
    campaignOptions = (campaignsResponse.data ?? []).map((campaign) => ({
      id: campaign.id as string,
      title: campaign.title as string,
    }));
  } else if (creatorResult.data?.id) {
    const { data: invitations } = await admin
      .from("invitations")
      .select("id, businesses(business_name), campaigns(title)")
      .eq("creator_id", creatorResult.data.id)
      .in("status", ["pending", "accepted"])
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    invitedOptions = ((invitations ?? []) as unknown as Array<{
      businesses: { business_name: string } | null;
      campaigns: { title: string } | null;
      id: string;
    }>).map((invitation) => ({
      businessName: invitation.businesses?.business_name ?? "Business",
      campaignTitle: invitation.campaigns?.title ?? "Campaign",
      id: invitation.id,
    }));
  }

  return {
    campaignOptions,
    conversations: summaries,
    creatorOptions,
    currentUserId: user.id,
    invitedOptions,
    isBusiness: Boolean(businessResult.data?.id),
    role: (profile?.role ?? "creator") as ProfileRole,
    selectedConversationId: selectedId,
    selectedMessages,
  };
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams?: { conversation?: string };
}) {
  const data = await getMessagesData(searchParams?.conversation);

  return <MessagesClient {...data} />;
}

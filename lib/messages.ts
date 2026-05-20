import { createAdminClient } from "@/lib/supabase/admin";

export async function getUnreadMessageCount(userId: string) {
  const supabase = createAdminClient();
  const [businessResult, creatorResult] = await Promise.all([
    supabase.from("businesses").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("creators").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  const filters: string[] = [];

  if (businessResult.data?.id) {
    filters.push(`business_id.eq.${businessResult.data.id}`);
  }

  if (creatorResult.data?.id) {
    filters.push(`creator_id.eq.${creatorResult.data.id}`);
  }

  if (!filters.length) {
    return 0;
  }

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id")
    .or(filters.join(","));

  if (conversationsError) {
    throw conversationsError;
  }

  const conversationIds = (conversations ?? []).map(
    (conversation) => conversation.id as string,
  );

  if (!conversationIds.length) {
    return 0;
  }

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId)
    .eq("read", false);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export function formatUnreadCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

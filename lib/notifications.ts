import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationType =
  | "video_submitted"
  | "video_accepted"
  | "video_rejected"
  | "dispute_opened"
  | "dispute_resolved"
  | "campaign_expiring"
  | "campaign_expired"
  | "invitation_received"
  | "invitation_accepted"
  | "new_message"
  | "payout_sent";

export type NotificationPreview = {
  body: string;
  created_at: string;
  id: string;
  link: string | null;
  read: boolean;
  title: string;
  type: NotificationType;
};

export async function createNotification({
  body,
  link,
  title,
  type,
  userId,
}: {
  body: string;
  link?: string | null;
  title: string;
  type: NotificationType;
  userId: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("create_notification", {
    notification_body: body,
    notification_link: link ?? null,
    notification_title: title,
    notification_type: type,
    target_user_id: userId,
  });

  if (error) {
    throw error;
  }
}

export async function createNotificationOnce({
  body,
  link,
  title,
  type,
  userId,
}: {
  body: string;
  link?: string | null;
  title: string;
  type: NotificationType;
  userId: string;
}) {
  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("link", link ?? "")
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return false;
  }

  await createNotification({ body, link, title, type, userId });
  return true;
}

export async function getNotificationSnapshot(userId: string) {
  const supabase = createAdminClient();
  const [notificationsResult, unreadResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, link, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false),
  ]);

  if (notificationsResult.error) {
    throw notificationsResult.error;
  }

  if (unreadResult.error) {
    throw unreadResult.error;
  }

  return {
    notifications: (notificationsResult.data ?? []) as NotificationPreview[],
    unreadCount: unreadResult.count ?? 0,
  };
}

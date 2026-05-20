import { redirect } from "next/navigation";
import {
  NotificationsPageClient,
  type PaginatedNotification,
} from "./notifications-page-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = {
  page?: string;
};

async function getNotificationsData(searchParams?: SearchParams) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/notifications");
  }

  const page = Math.max(Number(searchParams?.page ?? 1), 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const admin = createAdminClient();

  const { data, error, count } = await admin
    .from("notifications")
    .select("id, type, title, body, link, read, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    notifications: (data ?? []) as PaginatedNotification[],
    page,
    totalPages: Math.max(Math.ceil((count ?? 0) / pageSize), 1),
    userId: user.id,
  };
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const { notifications, page, totalPages, userId } =
    await getNotificationsData(searchParams);

  return (
    <NotificationsPageClient
      initialNotifications={notifications}
      page={page}
      totalPages={totalPages}
      userId={userId}
    />
  );
}

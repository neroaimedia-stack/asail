"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NotificationType } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";

export type PaginatedNotification = {
  body: string;
  created_at: string;
  id: string;
  link: string | null;
  read: boolean;
  title: string;
  type: NotificationType;
};

type NotificationsPageClientProps = {
  initialNotifications: PaginatedNotification[];
  page: number;
  totalPages: number;
  userId: string;
};

function groupLabel(value: string) {
  const now = new Date();
  const date = new Date(value);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const startWeek = new Date(startToday);
  startWeek.setDate(startWeek.getDate() - 7);

  if (date >= startToday) {
    return "Today";
  }

  if (date >= startYesterday) {
    return "Yesterday";
  }

  if (date >= startWeek) {
    return "This week";
  }

  return "Earlier";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function typeIcon(type: NotificationType) {
  if (type.includes("video")) {
    return "V";
  }

  if (type.includes("dispute")) {
    return "D";
  }

  if (type.includes("campaign")) {
    return "C";
  }

  if (type.includes("payout")) {
    return "P";
  }

  return "N";
}

function typeStyle(type: NotificationType) {
  if (type.includes("accepted") || type === "payout_sent") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (type.includes("rejected") || type.includes("resolved")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (type.includes("campaign")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-indigo-200 bg-indigo-50 text-indigo-700";
}

export function NotificationsPageClient({
  initialNotifications,
  page,
  totalPages,
  userId,
}: NotificationsPageClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-page:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `user_id=eq.${userId}`,
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          setNotifications((current) => [
            payload.new as PaginatedNotification,
            ...current,
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const groupedNotifications = useMemo(() => {
    return notifications.reduce<Record<string, PaginatedNotification[]>>(
      (groups, notification) => {
        const label = groupLabel(notification.created_at);
        return {
          ...groups,
          [label]: [...(groups[label] ?? []), notification],
        };
      },
      {},
    );
  }, [notifications]);

  async function markAllRead() {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
    router.refresh();
  }

  async function openNotification(notification: PaginatedNotification) {
    if (!notification.read) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notification.id);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );
    }

    router.push(notification.link ?? "/notifications");
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-950 md:px-8">
      <section className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Updates about videos, campaigns, disputes, payouts, and messages.
            </p>
          </div>
          <button
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
            onClick={markAllRead}
            type="button"
          >
            Mark all as read
          </button>
        </header>

        {notifications.length ? (
          <div className="space-y-6">
            {["Today", "Yesterday", "This week", "Earlier"].map((label) =>
              groupedNotifications[label]?.length ? (
                <section key={label}>
                  <h2 className="mb-3 text-sm font-semibold text-stone-600">
                    {label}
                  </h2>
                  <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                    {groupedNotifications[label].map((notification) => (
                      <button
                        className={`flex w-full gap-4 border-b border-stone-100 px-4 py-4 text-left last:border-b-0 hover:bg-stone-50 ${
                          notification.read ? "" : "bg-stone-50"
                        }`}
                        key={notification.id}
                        onClick={() => openNotification(notification)}
                        type="button"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${typeStyle(
                            notification.type,
                          )}`}
                        >
                          {typeIcon(notification.type)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">
                              {notification.title}
                            </span>
                            {!notification.read ? (
                              <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                Unread
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-1 block text-sm leading-6 text-stone-600">
                            {notification.body}
                          </span>
                        </span>
                        <time className="shrink-0 text-xs text-stone-500">
                          {formatTimestamp(notification.created_at)}
                        </time>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null,
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-white px-6 py-12 text-center text-sm text-stone-500">
            No notifications yet.
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link
            className={`rounded-md border border-stone-300 px-3 py-2 font-semibold ${
              page <= 1
                ? "pointer-events-none opacity-40"
                : "bg-white hover:bg-stone-100"
            }`}
            href={`/notifications?page=${Math.max(page - 1, 1)}`}
          >
            Previous
          </Link>
          <span className="text-stone-600">
            Page {page} of {totalPages}
          </span>
          <Link
            className={`rounded-md border border-stone-300 px-3 py-2 font-semibold ${
              page >= totalPages
                ? "pointer-events-none opacity-40"
                : "bg-white hover:bg-stone-100"
            }`}
            href={`/notifications?page=${Math.min(page + 1, totalPages)}`}
          >
            Next
          </Link>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type NotificationPreview,
  type NotificationType,
} from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";

type NotificationBellProps = {
  initialNotifications: NotificationPreview[];
  initialUnreadCount: number;
  userId: string;
};

function relativeTime(value: string) {
  const then = new Date(value).getTime();
  const now = Date.now();
  const diffSeconds = Math.max(Math.floor((now - then) / 1000), 0);

  if (diffSeconds < 60) {
    return "Just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  if (diffHours < 48) {
    return "Yesterday";
  }

  return `${Math.floor(diffHours / 24)}d ago`;
}

function typeAccent(type: NotificationType) {
  if (type.includes("accepted") || type === "payout_sent") {
    return "border-emerald-500";
  }

  if (type.includes("rejected") || type.includes("resolved")) {
    return "border-red-500";
  }

  if (type.includes("campaign")) {
    return "border-amber-500";
  }

  return "border-indigo-500";
}

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
  userId,
}: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `user_id=eq.${userId}`,
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const nextNotification = payload.new as NotificationPreview;
          setNotifications((current) =>
            [nextNotification, ...current].slice(0, 10),
          );
          setUnreadCount((current) => current + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  async function markNotificationRead(notification: NotificationPreview) {
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
      setUnreadCount((current) => Math.max(current - 1, 0));
    }

    setIsOpen(false);
    router.push(notification.link ?? "/notifications");
  }

  async function markAllRead() {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
    setUnreadCount(0);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-50"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-lg border border-stone-200 bg-white text-stone-950 shadow-lg">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <h2 className="text-sm font-semibold">Notifications</h2>
            <button
              className="text-xs font-semibold text-stone-600 hover:text-stone-950"
              onClick={markAllRead}
              type="button"
            >
              Mark all as read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length ? (
              notifications.map((notification) => (
                <button
                  className={`block w-full border-l-4 px-4 py-3 text-left transition hover:bg-stone-50 ${
                    notification.read
                      ? "border-transparent"
                      : typeAccent(notification.type)
                  }`}
                  key={notification.id}
                  onClick={() => markNotificationRead(notification)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold">{notification.title}</div>
                    <time className="shrink-0 text-xs text-stone-500">
                      {relativeTime(notification.created_at)}
                    </time>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-stone-600">
                    {notification.body}
                  </p>
                </button>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-sm text-stone-500">
                No notifications yet.
              </p>
            )}
          </div>
          <button
            className="block w-full border-t border-stone-200 px-4 py-3 text-center text-sm font-semibold text-stone-700 hover:bg-stone-50"
            onClick={() => {
              setIsOpen(false);
              router.push("/notifications");
            }}
            type="button"
          >
            View all notifications
          </button>
        </div>
      ) : null}
    </div>
  );
}

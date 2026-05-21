"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header({
  initials = "A",
  notificationCount = 0,
  title,
}: {
  initials?: string;
  notificationCount?: number;
  title: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between border-b px-4 backdrop-blur" style={{ background: "color-mix(in srgb, var(--asail-app), transparent 8%)", borderColor: "var(--asail-border)" }}>
      <h1 className="page-title">{title}</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <IconButton label="Notifications" badge={notificationCount}>
          <path d="M6 9a6 6 0 0 1 12 0v4l2 3H4l2-3Zm6 11a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3Z" />
        </IconButton>
        <IconButton label="Activity">
          <path d="M4 12h4l2-7 4 14 2-7h4" />
        </IconButton>
        <details className="relative">
          <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-[8px] bg-[var(--asail-blue)] text-xs font-bold text-white">
            {initials.slice(0, 2).toUpperCase()}
          </summary>
          <div className="card absolute right-0 mt-2 w-48 p-2">
            <Link className="nav-item" href="/settings">Profile & Settings</Link>
            <Link className="nav-item" href="/help">Help Center</Link>
            <form action="/auth/signout">
              <button className="nav-item w-full" type="submit">Sign out</button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}

function IconButton({
  badge,
  children,
  label,
}: {
  badge?: number;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button aria-label={label} className="btn-ghost relative min-w-10 px-2" type="button">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
        {children}
      </svg>
      {badge ? (
        <span className="absolute -right-1 -top-1 rounded-full bg-[var(--asail-blue)] px-1.5 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
}

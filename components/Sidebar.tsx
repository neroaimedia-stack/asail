"use client";

import Link from "next/link";
import { useState } from "react";

type NavItem = {
  badge?: number;
  href: string;
  label: string;
};

const groups: Array<{ items: NavItem[]; title: string }> = [
  {
    title: "MENU",
    items: [
      { href: "/business/dashboard", label: "Dashboard" },
      { href: "/business/campaigns", label: "Campaigns" },
      { href: "/business/review", label: "Review Videos" },
      { href: "/business/analytics/spend", label: "Analytics" },
      { href: "/notifications", label: "Notifications" },
    ],
  },
  {
    title: "CREATORS",
    items: [
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/search", label: "Discover" },
      { href: "/messages", label: "Messages" },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { href: "/settings", label: "Settings" },
      { href: "/help", label: "Help Center" },
    ],
  },
];

export function Sidebar({ activePath = "" }: { activePath?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden min-h-screen shrink-0 border-r p-3 transition-all md:block ${
        collapsed ? "w-14" : "w-[220px]"
      }`}
      style={{ background: "var(--asail-sidebar)", borderColor: "var(--asail-border)" }}
    >
      <div className="flex h-10 items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--asail-blue)] text-xs font-bold text-white">
          A
        </div>
        {!collapsed ? <span className="font-semibold">Asail</span> : null}
        <button className="btn-ghost ml-auto hidden min-w-8 px-1 lg:inline-flex" onClick={() => setCollapsed((value) => !value)} type="button">
          «
        </button>
      </div>
      {!collapsed ? (
        <input className="input-base mt-4" placeholder="Search anything..." />
      ) : null}
      <nav className="mt-5 space-y-5">
        {groups.map((group) => (
          <div key={group.title}>
            {!collapsed ? <div className="label-muted px-3">{group.title}</div> : null}
            <div className="mt-2 space-y-1">
              {group.items.map((item) => (
                <Link
                  className={`nav-item ${activePath === item.href ? "nav-active" : ""} ${
                    collapsed ? "justify-center px-2" : ""
                  }`}
                  href={item.href}
                  key={item.href}
                  title={item.label}
                >
                  <span className="h-4 w-4 rounded border border-current opacity-70" />
                  {!collapsed ? <span>{item.label}</span> : null}
                  {!collapsed && item.badge ? (
                    <span className="ml-auto rounded-full bg-[var(--asail-blue)] px-2 text-xs text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      {!collapsed ? (
        <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--asail-border)" }}>
          <div className="flex flex-col gap-1 text-xs" style={{ color: "var(--asail-text-muted)" }}>
            <Link className="btn-ghost justify-start text-xs" href="/terms" target="_blank">Terms of Service</Link>
            <Link className="btn-ghost justify-start text-xs" href="/privacy" target="_blank">Privacy Policy</Link>
          </div>
          <div className="card mt-4 border-[var(--asail-blue-border)] p-3 shadow-[var(--asail-blue-glow)]">
            <h3 className="font-semibold">Go Pro!</h3>
            <p className="mt-2 text-xs leading-5" style={{ color: "var(--asail-text-muted)" }}>
              Unlock unlimited campaigns and creator analytics.
            </p>
            <button className="btn-primary mt-3 w-full" type="button">Upgrade</button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

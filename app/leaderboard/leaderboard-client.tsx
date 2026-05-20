"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  InviteCreatorModal,
  type InviteCreator,
} from "@/components/invitations/invite-creator-modal";
import { startBusinessConversation } from "@/app/messages/actions";

export type LeaderboardRow = {
  avgViewsPerVideo: number | string;
  categories: string[];
  creatorId: string;
  fullName: string;
  handle: string;
  platform: "youtube" | "tiktok" | "instagram";
  totalEarned: number | string;
  totalVideosAccepted: number;
  totalViews: number | string;
  userId: string;
  verified: boolean;
};

type LeaderboardClientProps = {
  isBusiness: boolean;
  rows: LeaderboardRow[];
};

const platformOptions = ["All", "YouTube", "TikTok", "Instagram"];
const defaultCategories = ["All", "Food", "Travel", "Tech", "Lifestyle", "Fashion", "Other"];

const platformStyles = {
  instagram: "border-pink-200 bg-pink-50 text-pink-700",
  tiktok: "border-slate-200 bg-slate-50 text-slate-700",
  youtube: "border-red-200 bg-red-50 text-red-700",
};

const podiumStyles = [
  "border-amber-300 bg-amber-50",
  "border-stone-300 bg-stone-50",
  "border-yellow-300 bg-yellow-50",
];

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCompact(value: number | string) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(toNumber(value));
}

function formatNumber(value: number | string) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatPlatform(value: string) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
  };

  return labels[value] ?? value;
}

function handleWithAt(handle: string) {
  return handle.startsWith("@") ? handle : `@${handle}`;
}

export function LeaderboardClient({
  isBusiness,
  rows,
}: LeaderboardClientProps) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [selectedCreator, setSelectedCreator] = useState<InviteCreator | null>(null);
  const [toast, setToast] = useState("");

  const categoryOptions = useMemo(() => {
    const categories = new Set(defaultCategories);
    for (const row of rows) {
      row.categories.forEach((category) => categories.add(category));
    }

    return Array.from(categories);
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const platformMatches =
        platformFilter === "All" ||
        formatPlatform(row.platform).toLowerCase() === platformFilter.toLowerCase();
      const categoryMatches =
        categoryFilter === "All" || row.categories.includes(categoryFilter);

      return platformMatches && categoryMatches;
    });
  }, [categoryFilter, platformFilter, rows]);

  const topCreators = filteredRows.slice(0, 3);

  function openInviteModal(row: LeaderboardRow) {
    setSelectedCreator({
      creatorId: row.creatorId,
      fullName: row.fullName,
      handle: row.handle,
    });
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-7 text-stone-950 md:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Creator leaderboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Discover creators ranked by accepted campaign performance across
              Asail.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-stone-600">
                Platform
              </span>
              <select
                className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                onChange={(event) => setPlatformFilter(event.target.value)}
                value={platformFilter}
              >
                {platformOptions.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-stone-600">
                Category
              </span>
              <select
                className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                onChange={(event) => setCategoryFilter(event.target.value)}
                value={categoryFilter}
              >
                {categoryOptions.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {topCreators.map((creator, index) => (
            <article
              className={`rounded-lg border p-5 ${podiumStyles[index]}`}
              key={creator.creatorId}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-3xl font-semibold text-amber-700">
                  #{index + 1}
                </span>
                {creator.verified ? (
                  <span className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-semibold text-emerald-700">
                    Verified
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 text-lg font-semibold">{creator.fullName}</h2>
              <p className="mt-1 text-sm text-stone-600">
                {handleWithAt(creator.handle)}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-semibold ${platformStyles[creator.platform]}`}
                >
                  {formatPlatform(creator.platform)}
                </span>
                <span className="text-xl font-semibold">
                  {formatCompact(creator.totalViews)} views
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {creator.categories.length ? (
                  creator.categories.map((category) => (
                    <span
                      className="rounded-md border border-amber-200 bg-white px-2 py-1 text-xs text-stone-700"
                      key={category}
                    >
                      {category}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-stone-500">No categories yet</span>
                )}
              </div>
            </article>
          ))}
        </div>

        <section className="mt-6 overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-5 py-4">
            <h2 className="text-base font-semibold">Full leaderboard</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <Th>Rank</Th>
                  <Th>Creator</Th>
                  <Th>Platform</Th>
                  <Th>Categories</Th>
                  <Th>Total views</Th>
                  <Th>Videos</Th>
                  <Th>Avg views</Th>
                  {isBusiness ? <Th>Action</Th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredRows.map((creator, index) => (
                  <tr className="hover:bg-stone-50" key={creator.creatorId}>
                    <Td>#{index + 1}</Td>
                    <Td>
                      <div className="font-semibold text-stone-950">
                        {creator.fullName}
                        {creator.verified ? (
                          <span className="ml-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Verified
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-stone-500">
                        {handleWithAt(creator.handle)}
                      </div>
                    </Td>
                    <Td>
                      <span
                        className={`rounded-md border px-2 py-1 text-xs font-semibold ${platformStyles[creator.platform]}`}
                      >
                        {formatPlatform(creator.platform)}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex max-w-xs flex-wrap gap-1.5">
                        {creator.categories.length ? (
                          creator.categories.map((category) => (
                            <span
                              className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-700"
                              key={category}
                            >
                              {category}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-stone-500">None</span>
                        )}
                      </div>
                    </Td>
                    <Td>{formatNumber(creator.totalViews)}</Td>
                    <Td>{formatNumber(creator.totalVideosAccepted)}</Td>
                    <Td>{formatNumber(creator.avgViewsPerVideo)}</Td>
                    {isBusiness ? (
                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-100"
                            onClick={() => openInviteModal(creator)}
                            type="button"
                          >
                            Invite
                          </button>
                          <form action={startBusinessConversation}>
                            <input
                              name="creatorId"
                              type="hidden"
                              value={creator.creatorId}
                            />
                            <button
                              className="rounded-md bg-stone-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
                              type="submit"
                            >
                              Message
                            </button>
                          </form>
                        </div>
                      </Td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!filteredRows.length ? (
            <p className="border-t border-stone-200 px-5 py-8 text-center text-sm text-stone-500">
              No creators match these filters yet.
            </p>
          ) : null}
        </section>
      </section>

      <InviteCreatorModal
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
        onSuccess={(message) => {
          setToast(message);
          window.setTimeout(() => setToast(""), 2800);
        }}
      />

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-900 shadow-lg">
          {toast}
        </div>
      ) : null}
    </main>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-5 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="whitespace-nowrap px-5 py-4 align-top">{children}</td>;
}

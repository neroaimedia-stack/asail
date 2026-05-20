"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type SearchTab = "campaigns" | "creators";

export type ActiveCampaign = {
  id: string;
  title: string;
};

type CampaignResult = {
  business_category: string;
  business_logo_url: string | null;
  business_name: string;
  brief: string;
  cpm_rate: number | string;
  id: string;
  spent_budget: number | string | null;
  title: string;
  total_budget: number | string;
};

type CreatorResult = {
  categories: string[] | null;
  creator_id: string;
  full_name: string;
  handle: string;
  platform: "youtube" | "tiktok" | "instagram";
  total_views: number | string;
  user_id: string;
  verified: boolean;
};

type SearchClientProps = {
  activeCampaigns: ActiveCampaign[];
  defaultQuery: string;
  defaultTab: SearchTab;
  isBusiness: boolean;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const platformStyles = {
  instagram: "border-pink-200 bg-pink-50 text-pink-700",
  tiktok: "border-stone-200 bg-stone-50 text-stone-700",
  youtube: "border-red-200 bg-red-50 text-red-700",
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compact(value: number | string) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(toNumber(value));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

export function SearchClient({
  activeCampaigns,
  defaultQuery,
  defaultTab,
  isBusiness,
}: SearchClientProps) {
  const router = useRouter();
  const [campaignResults, setCampaignResults] = useState<CampaignResult[]>([]);
  const [creatorResults, setCreatorResults] = useState<CreatorResult[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(defaultQuery);
  const [selectedCampaignId, setSelectedCampaignId] = useState(
    activeCampaigns[0]?.id ?? "",
  );
  const [selectedCreator, setSelectedCreator] = useState<CreatorResult | null>(
    null,
  );
  const [tab, setTab] = useState<SearchTab>(defaultTab);
  const [toast, setToast] = useState("");

  const trimmedQuery = query.trim();
  const activeResults = tab === "campaigns" ? campaignResults : creatorResults;

  useEffect(() => {
    const controller = new AbortController();
    const nextUrl = trimmedQuery
      ? `/search?q=${encodeURIComponent(trimmedQuery)}&type=${tab}`
      : `/search?type=${tab}`;

    router.replace(nextUrl, { scroll: false });

    if (!trimmedQuery) {
      setCampaignResults([]);
      setCreatorResults([]);
      setError("");
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);
    setError("");

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}&type=${tab}`,
          { signal: controller.signal },
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Search failed.");
        }

        if (tab === "campaigns") {
          setCampaignResults(payload.results ?? []);
        } else {
          setCreatorResults(payload.results ?? []);
        }
      } catch (searchError) {
        if (!controller.signal.aborted) {
          setError(
            searchError instanceof Error
              ? searchError.message
              : "Search failed.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [router, tab, trimmedQuery]);

  const emptyMessage = useMemo(() => {
    if (!trimmedQuery) {
      return "Search for keywords like sushi, hotel, travel, reels, or tech.";
    }

    return `No results for ${trimmedQuery}. Try different keywords.`;
  }, [trimmedQuery]);

  function openInviteModal(creator: CreatorResult) {
    setSelectedCreator(creator);
    setSelectedCampaignId(activeCampaigns[0]?.id ?? "");
  }

  function showInviteToast() {
    setSelectedCreator(null);
    setToast("Invitation feature coming soon");
    window.setTimeout(() => setToast(""), 2800);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-950 md:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="border-b border-stone-200 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
          <div className="mt-5">
            <label className="sr-only" htmlFor="marketplace-search">
              Search campaigns or creators
            </label>
            <input
              autoFocus
              className="h-14 w-full rounded-lg border border-stone-300 bg-white px-5 text-lg outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              id="marketplace-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search campaigns or creators..."
              value={query}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <TabButton active={tab === "campaigns"} onClick={() => setTab("campaigns")}>
              Campaigns
            </TabButton>
            <TabButton active={tab === "creators"} onClick={() => setTab("creators")}>
              Creators
            </TabButton>
          </div>
        </header>

        {error ? (
          <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <section className="mt-6">
          {loading ? (
            <SkeletonGrid />
          ) : activeResults.length ? (
            tab === "campaigns" ? (
              <CampaignResults results={campaignResults} />
            ) : (
              <CreatorResults
                isBusiness={isBusiness}
                onInvite={openInviteModal}
                results={creatorResults}
              />
            )
          ) : (
            <EmptyState>{emptyMessage}</EmptyState>
          )}
        </section>
      </section>

      {selectedCreator ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-5 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Invite creator</h2>
                <p className="mt-1 text-sm text-stone-600">
                  {selectedCreator.full_name} {handleWithAt(selectedCreator.handle)}
                </p>
              </div>
              <button
                className="rounded-md px-2 py-1 text-stone-500 hover:bg-stone-100"
                onClick={() => setSelectedCreator(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-stone-700">
                Active campaign
              </span>
              <select
                className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                disabled={!activeCampaigns.length}
                onChange={(event) => setSelectedCampaignId(event.target.value)}
                value={selectedCampaignId}
              >
                {activeCampaigns.length ? (
                  activeCampaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </option>
                  ))
                ) : (
                  <option>No active campaigns</option>
                )}
              </select>
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
                onClick={() => setSelectedCreator(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                disabled={!activeCampaigns.length}
                onClick={showInviteToast}
                type="button"
              >
                Send invite
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-900 shadow-lg">
          {toast}
        </div>
      ) : null}
    </main>
  );
}

function CampaignResults({ results }: { results: CampaignResult[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {results.map((campaign) => {
        const totalBudget = toNumber(campaign.total_budget);
        const spentBudget = toNumber(campaign.spent_budget);
        const spentPercent =
          totalBudget > 0 ? Math.min((spentBudget / totalBudget) * 100, 100) : 0;

        return (
          <article
            className="flex min-h-full flex-col rounded-lg border border-stone-200 bg-white p-5"
            key={campaign.id}
          >
            <div className="flex items-start gap-3">
              {campaign.business_logo_url ? (
                <Image
                  alt={`${campaign.business_name} logo`}
                  className="h-11 w-11 rounded-md border border-stone-200 object-cover"
                  height={44}
                  src={campaign.business_logo_url}
                  width={44}
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-md border border-stone-200 bg-stone-100 text-sm font-semibold text-stone-700">
                  {initials(campaign.business_name)}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">
                  {campaign.business_name}
                </h2>
                <span className="mt-1 inline-flex rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-700">
                  {campaign.business_category}
                </span>
              </div>
            </div>

            <h3 className="mt-5 text-lg font-semibold leading-6">
              {campaign.title}
            </h3>
            <p className="mt-3 line-clamp-4 text-sm leading-6 text-stone-600">
              {campaign.brief}
            </p>

            <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4">
              <div className="text-2xl font-semibold">
                {moneyFormatter.format(toNumber(campaign.cpm_rate))}
                <span className="text-sm font-medium text-stone-600">
                  {" "}
                  per 1k views
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span>Budget remaining</span>
                  <span>
                    {moneyFormatter.format(Math.max(totalBudget - spentBudget, 0))}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-sm bg-stone-200">
                  <div
                    className="h-full bg-stone-800"
                    style={{ width: `${spentPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <Link
              className="mt-5 inline-flex w-full justify-center rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              href={`/creator/browse/${campaign.id}`}
            >
              View campaign
            </Link>
          </article>
        );
      })}
    </div>
  );
}

function CreatorResults({
  isBusiness,
  onInvite,
  results,
}: {
  isBusiness: boolean;
  onInvite: (creator: CreatorResult) => void;
  results: CreatorResult[];
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {results.map((creator) => (
        <article
          className="rounded-lg border border-stone-200 bg-white p-5"
          key={creator.creator_id}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{creator.full_name}</h2>
              <p className="mt-1 text-sm text-stone-600">
                {handleWithAt(creator.handle)}
              </p>
            </div>
            {creator.verified ? (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                Verified
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span
              className={`rounded-md border px-2 py-1 text-xs font-semibold ${platformStyles[creator.platform]}`}
            >
              {formatPlatform(creator.platform)}
            </span>
            <span className="text-lg font-semibold">
              {compact(creator.total_views)} views
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(creator.categories ?? []).length ? (
              creator.categories?.map((category) => (
                <span
                  className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-700"
                  key={category}
                >
                  {category}
                </span>
              ))
            ) : (
              <span className="text-sm text-stone-500">No categories yet</span>
            )}
          </div>

          {isBusiness ? (
            <button
              className="mt-5 inline-flex w-full justify-center rounded-md border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
              onClick={() => onInvite(creator)}
              type="button"
            >
              Invite to campaign
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-stone-950 text-white"
          : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div
          className="rounded-lg border border-stone-200 bg-white p-5"
          key={item}
        >
          <div className="h-5 w-1/2 rounded bg-stone-200" />
          <div className="mt-3 h-4 w-1/3 rounded bg-stone-100" />
          <div className="mt-6 h-20 rounded bg-stone-100" />
          <div className="mt-5 h-10 rounded bg-stone-200" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-6 py-12 text-center text-sm text-stone-600">
      {children}
    </div>
  );
}

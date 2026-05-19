"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export type BrowseCampaign = {
  brief: string;
  businessCategory: string;
  businessLogoUrl: string | null;
  businessName: string;
  cpmRate: number;
  id: string;
  remainingBudget: number;
  spentBudget: number;
  title: string;
  totalBudget: number;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function briefPreview(brief: string, expanded: boolean) {
  if (expanded || brief.length <= 120) {
    return brief;
  }

  return `${brief.slice(0, 120).trim()}...`;
}

export function CampaignGrid({ campaigns }: { campaigns: BrowseCampaign[] }) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  if (!campaigns.length) {
    return (
      <div className="rounded-lg border border-indigo-200 bg-white px-6 py-12 text-center">
        <h2 className="text-xl font-semibold text-slate-950">
          No active campaigns
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Check back soon for new briefs from businesses.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((campaign) => {
        const expanded = expandedIds.includes(campaign.id);
        const spentPercent =
          campaign.totalBudget > 0
            ? Math.min((campaign.spentBudget / campaign.totalBudget) * 100, 100)
            : 0;

        return (
          <article
            className="flex min-h-full flex-col rounded-lg border border-indigo-200 bg-white p-5"
            key={campaign.id}
          >
            <div className="flex items-start gap-3">
              {campaign.businessLogoUrl ? (
                <Image
                  alt={`${campaign.businessName} logo`}
                  className="h-11 w-11 rounded-md border border-indigo-100 object-cover"
                  height={44}
                  src={campaign.businessLogoUrl}
                  width={44}
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-sm font-semibold text-indigo-700">
                  {initials(campaign.businessName)}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-slate-950">
                  {campaign.businessName}
                </h2>
                <span className="mt-1 inline-flex rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                  {campaign.businessCategory}
                </span>
              </div>
            </div>

            <h3 className="mt-5 text-lg font-semibold leading-6 text-slate-950">
              {campaign.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {briefPreview(campaign.brief, expanded)}
              {campaign.brief.length > 120 ? (
                <button
                  className="ml-1 font-semibold text-indigo-700 hover:text-indigo-900"
                  onClick={() =>
                    setExpandedIds((ids) =>
                      expanded
                        ? ids.filter((id) => id !== campaign.id)
                        : [...ids, campaign.id],
                    )
                  }
                  type="button"
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              ) : null}
            </p>

            <div className="mt-5 rounded-md border border-indigo-100 bg-indigo-50 p-4">
              <div className="text-2xl font-semibold text-indigo-700">
                {moneyFormatter.format(campaign.cpmRate)}
                <span className="text-sm font-medium text-indigo-700/75">
                  {" "}
                  per 1k views
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Budget remaining</span>
                  <span>{moneyFormatter.format(campaign.remainingBudget)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-sm bg-indigo-100">
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${spentPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <Link
              className="mt-5 inline-flex w-full justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
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

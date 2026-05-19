"use client";

import { useMemo, useState } from "react";
import { createCampaign } from "./actions";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const viewsFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function estimatedViews(totalBudget: string, cpmRate: string) {
  const budget = Number(totalBudget);
  const cpm = Number(cpmRate);

  if (!Number.isFinite(budget) || !Number.isFinite(cpm) || budget <= 0 || cpm <= 0) {
    return 0;
  }

  return Math.floor((budget / cpm) * 1000);
}

export function CampaignForm({ error }: { error?: string }) {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [instructions, setInstructions] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [cpmRate, setCpmRate] = useState("");

  const coveredViews = useMemo(
    () => estimatedViews(totalBudget, cpmRate),
    [totalBudget, cpmRate],
  );

  const budgetLabel = Number(totalBudget) > 0 ? moneyFormatter.format(Number(totalBudget)) : "$0";
  const cpmLabel = Number(cpmRate) > 0 ? moneyFormatter.format(Number(cpmRate)) : "$0";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form
        action={createCampaign}
        className="space-y-5 rounded-lg border border-amber-200 bg-white p-6"
      >
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <label className="block">
          <span className="text-sm font-semibold text-amber-950">
            Campaign title
          </span>
          <input
            className="mt-2 w-full rounded-md border border-amber-200 bg-white px-3 py-3 text-amber-950 outline-none transition placeholder:text-amber-900/35 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            name="title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Summer tasting menu launch"
            required
            type="text"
            value={title}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-amber-950">Brief</span>
          <textarea
            className="mt-2 min-h-36 w-full resize-y rounded-md border border-amber-200 bg-white px-3 py-3 text-amber-950 outline-none transition placeholder:text-amber-900/35 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            name="brief"
            onChange={(event) => setBrief(event.target.value)}
            placeholder="What the campaign is about and what creators should highlight."
            required
            value={brief}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-amber-950">
            Content instructions
          </span>
          <textarea
            className="mt-2 min-h-36 w-full resize-y rounded-md border border-amber-200 bg-white px-3 py-3 text-amber-950 outline-none transition placeholder:text-amber-900/35 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            name="instructions"
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="Dos and don'ts, hashtags, required shots, and things to avoid."
            required
            value={instructions}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-amber-950">
              Total budget
            </span>
            <input
              className="mt-2 w-full rounded-md border border-amber-200 bg-white px-3 py-3 text-amber-950 outline-none transition placeholder:text-amber-900/35 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              min="1"
              name="totalBudget"
              onChange={(event) => setTotalBudget(event.target.value)}
              placeholder="5000"
              required
              step="0.01"
              type="number"
              value={totalBudget}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-amber-950">
              CPM rate
            </span>
            <input
              className="mt-2 w-full rounded-md border border-amber-200 bg-white px-3 py-3 text-amber-950 outline-none transition placeholder:text-amber-900/35 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              min="0.01"
              name="cpmRate"
              onChange={(event) => setCpmRate(event.target.value)}
              placeholder="12"
              required
              step="0.01"
              type="number"
              value={cpmRate}
            />
            <span className="mt-2 block text-sm text-amber-900/70">
              At this rate, your budget covers approximately{" "}
              <strong className="font-semibold text-amber-950">
                {viewsFormatter.format(coveredViews)}
              </strong>{" "}
              views
            </span>
          </label>
        </div>

        <button
          className="w-full rounded-md bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
          type="submit"
        >
          Create active campaign
        </button>
      </form>

      <aside className="rounded-lg border border-amber-200 bg-[#fffaf0] p-5 lg:sticky lg:top-6 lg:self-start">
        <div className="border-b border-amber-200 pb-4">
          <h2 className="text-lg font-semibold text-amber-950">
            {title || "Campaign title"}
          </h2>
          <p className="mt-2 text-sm text-amber-900/70">Status: active</p>
        </div>

        <div className="space-y-5 py-5">
          <div>
            <h3 className="text-sm font-semibold text-amber-950">Brief</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-950/75">
              {brief || "Your campaign summary will appear here as you type."}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-amber-950">
              Instructions
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-950/75">
              {instructions ||
                "Creator dos, don'ts, hashtags, and required talking points will appear here."}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t border-amber-200 pt-4 text-sm">
          <div>
            <dt className="text-amber-900/65">Budget</dt>
            <dd className="mt-1 font-semibold text-amber-950">{budgetLabel}</dd>
          </div>
          <div>
            <dt className="text-amber-900/65">CPM</dt>
            <dd className="mt-1 font-semibold text-amber-950">{cpmLabel}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-amber-900/65">Estimated reach</dt>
            <dd className="mt-1 font-semibold text-amber-950">
              {viewsFormatter.format(coveredViews)} views
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

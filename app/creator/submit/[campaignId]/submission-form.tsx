"use client";

import { useMemo, useState } from "react";
import { submitVideo } from "./actions";

type Platform = "youtube" | "tiktok" | "instagram";

const platformLabels: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  style: "currency",
});

const viewsFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function detectPlatform(value: string): Platform | null {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be" || host.endsWith("youtube.com")) {
      return "youtube";
    }

    if (host.endsWith("tiktok.com")) {
      return "tiktok";
    }

    if (host.endsWith("instagram.com") && parsed.pathname.includes("/reel")) {
      return "instagram";
    }
  } catch {
    return null;
  }

  return null;
}

export function SubmissionForm({
  campaignId,
  cpmRate,
  error,
}: {
  campaignId: string;
  cpmRate: number;
  error?: string;
}) {
  const [videoUrl, setVideoUrl] = useState("");
  const [estimatedViews, setEstimatedViews] = useState(1000);
  const [briefConfirmed, setBriefConfirmed] = useState(false);
  const [brandConfirmed, setBrandConfirmed] = useState(false);
  const [uniqueConfirmed, setUniqueConfirmed] = useState(false);
  const platform = useMemo(() => detectPlatform(videoUrl), [videoUrl]);
  const allChecked = briefConfirmed && brandConfirmed && uniqueConfirmed;
  const canSubmit = Boolean(platform) && allChecked;
  const estimatedEarnings = (estimatedViews / 1000) * cpmRate;
  const action = submitVideo.bind(null, campaignId);

  return (
    <form action={action} className="space-y-6 rounded-lg border border-indigo-200 bg-white p-6">
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Video URL</span>
        <input
          className="mt-2 w-full rounded-md border border-indigo-200 px-3 py-3 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          name="videoUrl"
          onChange={(event) => setVideoUrl(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          required
          type="url"
          value={videoUrl}
        />
      </label>

      <div className="min-h-8">
        {platform ? (
          <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            {platformLabels[platform]} detected ✓
          </span>
        ) : videoUrl ? (
          <span className="inline-flex rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            Enter a YouTube, TikTok, or Instagram Reels URL
          </span>
        ) : null}
      </div>

      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">
            Estimated views
          </span>
          <input
            className="mt-4 w-full accent-indigo-600"
            max={1000000}
            min={1000}
            onChange={(event) => setEstimatedViews(Number(event.target.value))}
            step={1000}
            type="range"
            value={estimatedViews}
          />
        </label>
        <p className="mt-3 text-sm text-slate-700">
          At {viewsFormatter.format(estimatedViews)} views you&apos;d earn{" "}
          <strong className="text-indigo-700">
            {moneyFormatter.format(estimatedEarnings)}
          </strong>
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-800">
          Confirm before submitting
        </legend>
        <label className="flex items-start gap-3 rounded-md border border-indigo-200 px-3 py-3 text-sm text-slate-700">
          <input
            className="mt-0.5 h-4 w-4 accent-indigo-600"
            onChange={(event) => setBriefConfirmed(event.target.checked)}
            type="checkbox"
          />
          My video follows the campaign brief
        </label>
        <label className="flex items-start gap-3 rounded-md border border-indigo-200 px-3 py-3 text-sm text-slate-700">
          <input
            className="mt-0.5 h-4 w-4 accent-indigo-600"
            onChange={(event) => setBrandConfirmed(event.target.checked)}
            type="checkbox"
          />
          My video mentions the brand or product
        </label>
        <label className="flex items-start gap-3 rounded-md border border-indigo-200 px-3 py-3 text-sm text-slate-700">
          <input
            className="mt-0.5 h-4 w-4 accent-indigo-600"
            onChange={(event) => setUniqueConfirmed(event.target.checked)}
            type="checkbox"
          />
          I have not submitted this video to another campaign
        </label>
      </fieldset>

      <button
        className="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        disabled={!canSubmit}
        type="submit"
      >
        Submit for review
      </button>
    </form>
  );
}

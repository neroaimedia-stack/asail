"use client";

import { useState } from "react";

type SyncResult = {
  errors?: Array<{
    id?: string;
    message: string;
    videoUrl?: string;
  }>;
  updated?: number;
};

export function SyncButton({ cronSecret }: { cronSecret: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSync() {
    setIsRunning(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/views/sync", {
        method: "POST",
        headers: {
          "x-cron-secret": cronSecret,
        },
      });
      const payload = (await response.json()) as SyncResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Sync failed.");
      }

      setResult(payload);
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Unable to run sync.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <button
        className="inline-flex rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isRunning}
        onClick={runSync}
        type="button"
      >
        {isRunning ? "Syncing..." : "Run sync now"}
      </button>

      {result ? (
        <div className="mt-5 rounded-md border border-indigo-200 bg-indigo-50 p-4 text-sm text-slate-800">
          <div className="font-semibold text-indigo-900">
            Updated {result.updated ?? 0} videos
          </div>
          {result.errors?.length ? (
            <ul className="mt-3 space-y-2">
              {result.errors.map((syncError, index) => (
                <li key={`${syncError.id ?? "error"}-${index}`}>
                  {syncError.id ? `${syncError.id}: ` : ""}
                  {syncError.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate-600">No sync errors.</p>
          )}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

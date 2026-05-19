import { SyncButton } from "./sync-button";

export const dynamic = "force-dynamic";

export default function AdminSyncPage({
  searchParams,
}: {
  searchParams?: { secret?: string };
}) {
  const configuredSecret = process.env.CRON_SECRET;
  const providedSecret = searchParams?.secret ?? "";
  const isConfigured = Boolean(configuredSecret);
  const isAuthorized = isConfigured && providedSecret === configuredSecret;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
          Asail admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          View count sync
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Manually sync accepted YouTube video views and recalculate creator
          payouts during development.
        </p>

        {!isConfigured ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
            CRON_SECRET is not configured.
          </div>
        ) : null}

        {isConfigured && !isAuthorized ? (
          <form className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <label
              className="text-sm font-semibold text-slate-800"
              htmlFor="secret"
            >
              Cron secret
            </label>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              id="secret"
              name="secret"
              placeholder="Enter CRON_SECRET"
              type="password"
            />
            <button
              className="mt-4 inline-flex rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              type="submit"
            >
              Unlock sync
            </button>
          </form>
        ) : null}

        {isAuthorized ? (
          <div className="mt-6">
            <SyncButton cronSecret={providedSecret} />
          </div>
        ) : null}
      </div>
    </main>
  );
}

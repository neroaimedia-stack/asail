import Link from "next/link";

export default function BusinessCampaignsPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
          Business portal
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-ink">Campaigns</h1>
        <p className="mt-4 max-w-2xl text-ink/70">
          Create briefs, manage deliverables, and match campaigns with creators.
        </p>
        <Link
          className="mt-6 inline-flex rounded-md bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          href="/business/campaigns/new"
        >
          New campaign
        </Link>
      </section>
    </main>
  );
}

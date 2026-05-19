import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center gap-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
            Asail
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight text-ink md:text-7xl">
            Creator campaigns, managed in one place.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70">
            A two-sided marketplace foundation for brands to launch campaigns
            and creators to discover, submit, and get paid.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/business/dashboard"
            className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/85"
          >
            Business portal
          </Link>
          <Link
            href="/creator/dashboard"
            className="rounded-md border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
          >
            Creator portal
          </Link>
        </div>
      </section>
    </main>
  );
}

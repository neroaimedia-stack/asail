import Link from "next/link";
import { redirect } from "next/navigation";
import { AsailLogo } from "@/components/AsailLogo";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "business") redirect("/business/dashboard");
    if (profile?.role === "creator") redirect("/creator/dashboard");
    if (profile?.role === "admin") redirect("/admin/dashboard");
  }

  return (
    <main className="min-h-screen text-[var(--asail-text)]">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <AsailLogo />
        <div className="hidden items-center gap-3 md:flex">
          <a className="btn-ghost" href="#businesses">For Businesses</a>
          <a className="btn-ghost" href="#creators">For Creators</a>
          <Link className="btn-ghost" href="/auth/login">Sign in</Link>
          <Link className="btn-primary" href="/auth/signup">Get started</Link>
        </div>
      </nav>

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-5 py-16 text-center">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Real videos. Real views.
          <br />
          Pay only for results.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7" style={{ color: "var(--asail-text-secondary)" }}>
          Connect your business with creators who make content your customers watch.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="btn-primary" href="/auth/signup/business">Start a campaign</Link>
          <Link className="btn-secondary" href="/auth/signup/creator">Start earning</Link>
        </div>
        <div className="card mt-12 w-full max-w-3xl p-4 text-left shadow-[var(--asail-blue-glow)]">
          <div className="grid gap-4 md:grid-cols-3">
            <PreviewStat label="Views this month" value="245K" />
            <PreviewStat label="Active campaigns" value="12" />
            <PreviewStat label="Creator payouts" value="₱84K" />
          </div>
          <div className="mt-4 h-28 rounded-[10px] border border-[var(--asail-border)] bg-[linear-gradient(115deg,#050506_0%,#111114_40%,#1a3a6e_75%,#3B82F6_100%)]" />
        </div>
      </section>

      <section id="businesses" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-2xl font-semibold">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Step number="1" title="Create a campaign" text="Set your brief, budget, CPM, and creator guidelines." />
          <Step number="2" title="Creators make videos" text="Creators submit videos about your business for review." />
          <Step number="3" title="Pay per view" text="Spend only when accepted videos earn verified views." />
        </div>
      </section>

      <section id="creators" className="mx-auto grid max-w-6xl gap-6 px-5 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">For creators</h2>
          <p className="mt-3 leading-7" style={{ color: "var(--asail-text-secondary)" }}>
            Browse campaigns, make a video, and earn per verified view.
          </p>
        </div>
        <div className="card">
          <div className="label-muted">Earnings estimator</div>
          <div className="metric-value mt-3">At 100,000 views you&apos;d earn ₱1,200</div>
          <input className="mt-6 w-full accent-[var(--asail-blue)]" defaultValue={100000} max={1000000} min={1000} type="range" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {["Maria Santos", "Joel Reyes", "Ana Cruz"].map((name) => (
            <div className="card" key={name}>
              <div className="text-[var(--asail-blue-bright)]">★★★★★</div>
              <p className="mt-3 text-sm leading-6">Asail helped us get real local creator videos without paying for empty impressions.</p>
              <div className="mt-4 font-semibold">{name}</div>
              <div className="text-xs" style={{ color: "var(--asail-text-muted)" }}>Restaurant owner</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-xl px-5 py-16 text-center">
        <div className="card">
          <h2 className="text-2xl font-semibold">No monthly fees. No contracts.</h2>
          <p className="mt-3 leading-7" style={{ color: "var(--asail-text-secondary)" }}>
            Set your own CPM. Fund your campaign. Pay only when real views come in.
          </p>
          <Link className="btn-primary mt-6" href="/auth/signup/business">Start a campaign →</Link>
        </div>
      </section>

      <footer className="border-t border-[var(--asail-border)] px-5 py-6 text-center text-xs" style={{ color: "var(--asail-text-muted)" }}>
        © 2025 Asail · <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · Built in the Philippines
      </footer>
    </main>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return <div className="stat-card"><div className="label-muted">{label}</div><div className="metric-value mt-2">{value}</div></div>;
}

function Step({ number, text, title }: { number: string; text: string; title: string }) {
  return (
    <div className="card text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--asail-blue)] font-bold text-white">{number}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--asail-text-muted)" }}>{text}</p>
    </div>
  );
}

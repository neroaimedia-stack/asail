import Link from "next/link";
import { signupCreator } from "@/app/auth/actions";
import { TermsConsent } from "@/app/auth/signup/terms-consent";
import { AsailLogo } from "@/components/AsailLogo";

const categories = ["Food", "Travel", "Tech", "Lifestyle", "Other"];

export default function CreatorSignupPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card w-full max-w-[400px] p-7">
        <AsailLogo centered />
        <div className="mt-6 text-center">
          <h1 className="text-lg font-semibold">Create a creator account</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--asail-text-muted)" }}>
            Find campaigns and earn per verified view.
          </p>
        </div>
        {searchParams?.error ? (
          <p className="pill pill-danger mt-5 w-full justify-center">
            {searchParams.error}
          </p>
        ) : null}
        <form action={signupCreator} className="mt-6 space-y-4">
          <label className="block">
            <span className="label-muted">Full name</span>
            <input
              className="input-base mt-2"
              name="fullName"
              type="text"
              autoComplete="name"
              required
            />
          </label>
          <label className="block">
            <span className="label-muted">Email</span>
            <input
              className="input-base mt-2"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block">
            <span className="label-muted">Password</span>
            <input
              className="input-base mt-2"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
          <label className="block">
            <span className="label-muted">
              Handle
            </span>
            <input
              className="input-base mt-2"
              name="socialHandle"
              type="text"
              placeholder="@asailcreator"
              required
            />
          </label>
          <fieldset className="space-y-3">
            <legend className="label-muted">Platform</legend>
            <div className="grid grid-cols-3 gap-2">
              {["YouTube", "TikTok", "Instagram"].map((platform) => (
                <label className="card-inset flex items-center gap-2 px-3 py-2 text-xs" key={platform}>
                  <input className="accent-[var(--asail-blue)]" name="platform" type="radio" value={platform.toLowerCase()} />
                  {platform}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="label-muted">
              Content categories
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <label
                  className="card-inset flex items-center gap-3 px-3 py-3 text-sm"
                  key={category}
                >
                  <input
                    className="h-4 w-4 accent-[var(--asail-blue)]"
                    name="contentCategories"
                    type="checkbox"
                    value={category}
                  />
                  {category}
                </label>
              ))}
            </div>
          </fieldset>
          <TermsConsent submitLabel="Create account" />
        </form>
        <p className="mt-6 text-center text-sm" style={{ color: "var(--asail-text-muted)" }}>
          Already have an account?{" "}
          <Link className="font-semibold text-[var(--asail-blue-bright)]" href="/auth/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

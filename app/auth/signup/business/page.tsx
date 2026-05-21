import Link from "next/link";
import { signupBusiness } from "@/app/auth/actions";
import { TermsConsent } from "@/app/auth/signup/terms-consent";
import { AsailLogo } from "@/components/AsailLogo";

const categories = ["Restaurant", "Hotel", "SaaS", "Retail", "Other"];

export default function BusinessSignupPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card w-full max-w-[400px] p-7">
        <AsailLogo centered />
        <div className="mt-6 text-center">
          <h1 className="text-lg font-semibold">Create a business account</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--asail-text-muted)" }}>
            Launch campaigns and pay for real views.
          </p>
        </div>
        {searchParams?.error ? (
          <p className="pill pill-danger mt-5 w-full justify-center">
            {searchParams.error}
          </p>
        ) : null}
        <form action={signupBusiness} className="mt-6 space-y-4">
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
              Business name
            </span>
            <input
              className="input-base mt-2"
              name="businessName"
              type="text"
              required
            />
          </label>
          <label className="block">
            <span className="label-muted">
              Business category
            </span>
            <select
              className="input-base mt-2"
              name="businessCategory"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
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

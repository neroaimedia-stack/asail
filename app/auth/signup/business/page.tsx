import Link from "next/link";
import { signupBusiness } from "@/app/auth/actions";

const categories = ["Restaurant", "Hotel", "SaaS", "Retail", "Other"];

export default function BusinessSignupPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-xl rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
            Business signup
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">
            Create a business account
          </h1>
        </div>
        {searchParams?.error ? (
          <p className="mt-5 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-ink">
            {searchParams.error}
          </p>
        ) : null}
        <form action={signupBusiness} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-ink/75">Full name</span>
            <input
              className="mt-2 w-full rounded-md border border-ink/15 px-3 py-3 text-ink outline-none transition focus:border-sea"
              name="fullName"
              type="text"
              autoComplete="name"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink/75">Email</span>
            <input
              className="mt-2 w-full rounded-md border border-ink/15 px-3 py-3 text-ink outline-none transition focus:border-sea"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink/75">Password</span>
            <input
              className="mt-2 w-full rounded-md border border-ink/15 px-3 py-3 text-ink outline-none transition focus:border-sea"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink/75">
              Business name
            </span>
            <input
              className="mt-2 w-full rounded-md border border-ink/15 px-3 py-3 text-ink outline-none transition focus:border-sea"
              name="businessName"
              type="text"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink/75">
              Business category
            </span>
            <select
              className="mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-3 text-ink outline-none transition focus:border-sea"
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
          <button
            className="w-full rounded-md bg-sea px-4 py-3 text-sm font-semibold text-white transition hover:bg-sea/90"
            type="submit"
          >
            Sign up as business
          </button>
        </form>
        <p className="mt-6 text-sm text-ink/65">
          Already have an account?{" "}
          <Link className="font-semibold text-sea" href="/auth/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}

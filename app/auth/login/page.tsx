import Link from "next/link";
import { login } from "@/app/auth/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; message?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-ink">Log in to Asail</h1>
        {searchParams?.message ? (
          <p className="mt-5 rounded-md border border-sea/30 bg-sea/10 px-3 py-2 text-sm text-ink">
            {searchParams.message}
          </p>
        ) : null}
        {searchParams?.error ? (
          <p className="mt-5 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-ink">
            {searchParams.error}
          </p>
        ) : null}
        <form action={login} className="mt-8 space-y-5">
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
              autoComplete="current-password"
              required
            />
          </label>
          <button
            className="w-full rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/85"
            type="submit"
          >
            Log in
          </button>
        </form>
        <div className="mt-6 space-y-2 text-sm text-ink/65">
          <p>New to Asail?</p>
          <div className="flex flex-wrap gap-3">
            <Link className="font-semibold text-sea" href="/auth/signup/business">
              Business signup
            </Link>
            <Link className="font-semibold text-sea" href="/auth/signup/creator">
              Creator signup
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

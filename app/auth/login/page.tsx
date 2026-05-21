import Link from "next/link";
import { login } from "@/app/auth/actions";
import { AsailLogo } from "@/components/AsailLogo";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; message?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card w-full max-w-[400px] p-7">
        <AsailLogo centered />
        <div className="mt-6 text-center">
          <h1 className="text-lg font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--asail-text-muted)" }}>
            Sign in to your Asail account
          </p>
        </div>
        {searchParams?.message ? (
          <p className="pill pill-success mt-5 w-full justify-center">
            {searchParams.message}
          </p>
        ) : null}
        {searchParams?.error ? (
          <p className="pill pill-danger mt-5 w-full justify-center">
            {searchParams.error}
          </p>
        ) : null}
        <form action={login} className="mt-6 space-y-4">
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
            <div className="flex items-center justify-between">
              <span className="label-muted">Password</span>
              <Link className="text-xs" href="/help" style={{ color: "var(--asail-text-muted)" }}>
                Forgot password?
              </Link>
            </div>
            <input
              className="input-base mt-2"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button
            className="btn-primary w-full"
            type="submit"
          >
            Sign in
          </button>
        </form>
        <div className="my-6 flex items-center gap-3 text-xs" style={{ color: "var(--asail-text-muted)" }}>
          <div className="h-px flex-1 bg-[var(--asail-border)]" />
          or
          <div className="h-px flex-1 bg-[var(--asail-border)]" />
        </div>
        <div>
          <p className="text-center text-sm" style={{ color: "var(--asail-text-muted)" }}>
            New to Asail?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link className="btn-secondary" href="/auth/signup/business">
              I&apos;m a Business
            </Link>
            <Link className="btn-secondary" href="/auth/signup/creator">
              I&apos;m a Creator
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs leading-5" style={{ color: "var(--asail-text-muted)" }}>
          By signing in you agree to our{" "}
          <Link className="underline" href="/terms" target="_blank">Terms of Service</Link>{" "}
          and{" "}
          <Link className="underline" href="/privacy" target="_blank">Privacy Policy</Link>
        </p>
      </section>
    </main>
  );
}

import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-xl rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-ink">Create an account</h1>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            className="rounded-md border border-ink/15 px-4 py-5 transition hover:border-sea hover:bg-sea/5"
            href="/auth/signup/business"
          >
            <span className="block text-base font-semibold text-ink">
              Business
            </span>
            <span className="mt-2 block text-sm leading-6 text-ink/65">
              Launch campaigns and review creator submissions.
            </span>
          </Link>
          <Link
            className="rounded-md border border-ink/15 px-4 py-5 transition hover:border-coral hover:bg-coral/5"
            href="/auth/signup/creator"
          >
            <span className="block text-base font-semibold text-ink">
              Creator
            </span>
            <span className="mt-2 block text-sm leading-6 text-ink/65">
              Browse campaigns and submit content.
            </span>
          </Link>
        </div>
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

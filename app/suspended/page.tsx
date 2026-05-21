export default function SuspendedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="max-w-md rounded-lg border border-red-500/40 bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold">Account suspended</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Your Asail account has been suspended. If you believe this is a
          mistake, contact support from the Help and Contact page.
        </p>
      </section>
    </main>
  );
}

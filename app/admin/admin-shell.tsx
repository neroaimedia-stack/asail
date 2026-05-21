import Link from "next/link";

const links = [
  ["Dashboard", "/admin/dashboard"],
  ["Users", "/admin/users"],
  ["Campaigns", "/admin/campaigns"],
  ["Videos", "/admin/videos"],
  ["Disputes", "/admin/disputes"],
  ["Verifications", "/admin/verifications"],
  ["Messages", "/admin/messages"],
  ["Email logs", "/admin/email-logs"],
  ["Settings", "/admin/settings"],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col md:flex-row">
        <aside className="border-b border-slate-800 bg-slate-950 px-5 py-5 md:w-64 md:border-b-0 md:border-r">
          <Link className="block text-lg font-semibold text-white" href="/admin/dashboard">
            Asail admin
          </Link>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-red-400">
            Control center
          </p>
          <nav className="mt-6 flex gap-2 overflow-x-auto text-sm md:flex-col md:overflow-visible">
            {links.map(([label, href]) => (
              <Link
                className="rounded-md px-3 py-2 font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="flex-1 bg-slate-100 px-5 py-6 text-slate-950 md:px-8">
          {children}
        </section>
      </div>
    </main>
  );
}

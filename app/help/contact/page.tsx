import Link from "next/link";
import { redirect } from "next/navigation";
import { ContactForm } from "./contact-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  closed: "border-slate-200 bg-slate-100 text-slate-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700",
  open: "border-stone-200 bg-stone-50 text-stone-700",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: { error?: string; sent?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/help/contact");
  }

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, subject, category, status, admin_reply, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-950 md:px-8">
      <section className="mx-auto max-w-5xl">
        <Link className="text-sm font-semibold text-stone-600 hover:text-stone-950" href="/help">Back to help</Link>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
          <section className="rounded-lg border border-stone-200 bg-white p-6">
            <h1 className="text-2xl font-semibold">Contact support</h1>
            <p className="mt-2 text-sm text-stone-600">We aim to respond within 1-2 business days.</p>
            {searchParams?.sent ? <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Your message has been sent. Check your email for confirmation.</p> : null}
            {searchParams?.error ? <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{searchParams.error}</p> : null}
            <div className="mt-6"><ContactForm /></div>
          </section>
          <section className="rounded-lg border border-stone-200 bg-white p-6">
            <h2 className="text-xl font-semibold">My support tickets</h2>
            <div className="mt-4 divide-y divide-stone-100">
              {(tickets ?? []).map((ticket) => (
                <details className="py-3" key={ticket.id}>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{ticket.subject}</div>
                        <div className="mt-1 text-xs text-stone-500">{ticket.category} - {new Date(ticket.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[ticket.status]}`}>{ticket.status.replaceAll("_", " ")}</span>
                    </div>
                  </summary>
                  {ticket.admin_reply ? (
                    <div className="mt-3 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                      <div className="font-semibold text-stone-950">Reply from Asail support</div>
                      <p className="mt-2">{ticket.admin_reply}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-stone-500">No reply yet.</p>
                  )}
                </details>
              ))}
              {!tickets?.length ? <p className="py-8 text-center text-sm text-stone-500">No tickets yet.</p> : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

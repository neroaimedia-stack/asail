import { replyToTicket } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  closed: "border-slate-200 bg-slate-100 text-slate-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700",
  open: "border-stone-200 bg-stone-50 text-stone-700",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function daysOpen(value: string) {
  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
}

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams?: { error?: string; message?: string; ticket?: string };
}) {
  const admin = createAdminClient();
  const { data: tickets } = await admin
    .from("support_tickets")
    .select("id, user_id, subject, category, message, attach_url, status, admin_reply, created_at, profiles(full_name)")
    .order("created_at", { ascending: true });
  const selected = (tickets ?? []).find((ticket) => ticket.id === searchParams?.ticket) ?? tickets?.[0] ?? null;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Support tickets</h1>
        <p className="mt-1 text-sm text-slate-600">Reply to users and resolve support requests.</p>
      </header>
      {searchParams?.message ? <p className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{searchParams.message}</p> : null}
      {searchParams?.error ? <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{searchParams.error}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr><Th>User</Th><Th>Subject</Th><Th>Category</Th><Th>Status</Th><Th>Date</Th><Th>SLA</Th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(tickets ?? []).map((ticket) => {
                const age = daysOpen(ticket.created_at);
                const overdue = age > 2 && ticket.status === "open";
                return (
                  <tr key={ticket.id}>
                    <Td>{(ticket.profiles as { full_name?: string } | null)?.full_name ?? "User"}</Td>
                    <Td><a className="font-semibold text-red-700" href={`/admin/tickets?ticket=${ticket.id}`}>{ticket.subject}</a></Td>
                    <Td>{ticket.category}</Td>
                    <Td><span className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[ticket.status]}`}>{ticket.status.replaceAll("_", " ")}</span></Td>
                    <Td>{new Date(ticket.created_at).toLocaleDateString()}</Td>
                    <Td><span className={overdue ? "font-semibold text-red-700" : ""}>{age} days</span></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <aside className="rounded-lg border border-slate-200 bg-white p-5">
          {selected ? (
            <>
              <h2 className="text-lg font-semibold">{selected.subject}</h2>
              <p className="mt-1 text-sm text-slate-500">{selected.category} - {new Date(selected.created_at).toLocaleString()}</p>
              <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selected.message}</div>
              {selected.attach_url ? <a className="mt-3 inline-flex text-sm font-semibold text-red-700" href={selected.attach_url}>Attachment URL</a> : null}
              <form action={replyToTicket} className="mt-5 space-y-3">
                <input name="ticketId" type="hidden" value={selected.id} />
                <textarea className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-3 text-sm" name="reply" placeholder="Write a support reply" required />
                <button className="rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700" type="submit">Send reply and mark resolved</button>
              </form>
            </>
          ) : <p className="text-sm text-slate-500">No tickets yet.</p>}
        </aside>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 font-semibold">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-4 py-4 align-top">{children}</td>; }

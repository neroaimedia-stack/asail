import { markDisputeUnderReview } from "../actions";
import { resolveDispute } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  closed: "border-slate-200 bg-slate-100 text-slate-700",
  open: "border-amber-200 bg-amber-50 text-amber-700",
  resolved_business: "border-red-200 bg-red-50 text-red-700",
  resolved_creator: "border-emerald-200 bg-emerald-50 text-emerald-700",
  under_review: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

async function getDisputes(status: string) {
  const admin = createAdminClient();
  let query = admin
    .from("disputes")
    .select("id, reason, evidence_url, status, created_at, videos(rejection_reason, campaigns(title)), creators(handle, profiles(full_name)), businesses(business_name)")
    .order("created_at", { ascending: true });

  if (status === "resolved") {
    query = query.in("status", ["resolved_creator", "resolved_business", "closed"]);
  } else if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

function daysOld(value: string) {
  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
}

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const status = searchParams?.status ?? "open";
  const disputes = await getDisputes(status);

  return (
    <div>
      <Header title="Disputes" subtitle="Prioritize and resolve creator appeals." />
      <form className="mb-5 rounded-lg border border-slate-200 bg-white p-4">
        <select className="h-10 rounded-md border border-slate-300 px-3 text-sm" defaultValue={status} name="status">
          <option value="all">All</option><option value="open">Open</option><option value="under_review">Under review</option><option value="resolved">Resolved</option>
        </select>
        <button className="ml-3 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Filter</button>
      </form>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[1250px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr><Th>SLA</Th><Th>Creator</Th><Th>Business</Th><Th>Campaign</Th><Th>Reason</Th><Th>Evidence</Th><Th>Status</Th><Th>Actions</Th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {disputes.map((dispute: any) => {
              const age = daysOld(dispute.created_at);
              return (
                <tr key={dispute.id}>
                  <Td><span className={age > 3 ? "font-semibold text-red-700" : "text-slate-700"}>{age} days</span></Td>
                  <Td><div className="font-semibold">{dispute.creators?.profiles?.full_name ?? "Creator"}</div><div className="text-xs text-slate-500">{dispute.creators?.handle}</div></Td>
                  <Td>{dispute.businesses?.business_name ?? "Business"}</Td>
                  <Td>{dispute.videos?.campaigns?.title ?? "Campaign"}</Td>
                  <Td>{dispute.reason}</Td>
                  <Td>{dispute.evidence_url ? <a className="text-red-700" href={dispute.evidence_url}>Evidence</a> : "None"}</Td>
                  <Td><span className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[dispute.status]}`}>{dispute.status.replaceAll("_", " ")}</span></Td>
                  <Td>
                    <div className="space-y-3">
                      <form action={markDisputeUnderReview}><input name="disputeId" type="hidden" value={dispute.id} /><button className={smallButton}>Mark under review</button></form>
                      <form action={resolveDispute} className="flex flex-wrap gap-2">
                        <input name="disputeId" type="hidden" value={dispute.id} />
                        <input className="rounded-md border border-slate-300 px-2 py-2 text-xs" name="adminNote" placeholder="Admin note" required />
                        <button className={smallButton} name="resolution" value="creator">For creator</button>
                        <button className={smallButton} name="resolution" value="business">For business</button>
                      </form>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const smallButton = "rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100";
function Header({ subtitle, title }: { subtitle: string; title: string }) { return <header className="mb-6"><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-slate-600">{subtitle}</p></header>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 font-semibold">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-4 py-4 align-top">{children}</td>; }

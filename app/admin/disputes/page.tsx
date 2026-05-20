import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveDispute } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RawDispute = {
  created_at: string;
  evidence_url: string | null;
  id: string;
  reason: string;
  status: string;
  videos: {
    rejection_reason: string | null;
    campaigns: {
      title: string;
    } | null;
  } | null;
  creators: {
    handle: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
  businesses: {
    business_name: string;
  } | null;
};

const statusStyles: Record<string, string> = {
  closed: "border-slate-200 bg-slate-100 text-slate-700",
  open: "border-amber-200 bg-amber-50 text-amber-700",
  resolved_business: "border-red-200 bg-red-50 text-red-700",
  resolved_creator: "border-emerald-200 bg-emerald-50 text-emerald-700",
  under_review: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/admin/disputes");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/");
  }
}

async function getOpenDisputes() {
  await requireAdmin();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("disputes")
    .select(
      "id, reason, evidence_url, status, created_at, videos(rejection_reason, campaigns(title)), creators(handle, profiles(full_name)), businesses(business_name)",
    )
    .eq("status", "open")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as RawDispute[];
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams?: { error?: string; message?: string };
}) {
  const disputes = await getOpenDisputes();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <aside className="border-b border-slate-200 bg-white px-5 py-5 md:w-64 md:border-b-0 md:border-r">
          <Link className="block text-lg font-semibold" href="/admin/disputes">
            Asail admin
          </Link>
          <nav className="mt-6 flex gap-2 overflow-x-auto text-sm md:flex-col md:overflow-visible">
            <Link
              className="rounded-md bg-slate-100 px-3 py-2 font-semibold text-slate-950"
              href="/admin/disputes"
            >
              Disputes
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
              href="/admin/sync"
            >
              View sync
            </Link>
          </nav>
        </aside>

        <section className="flex-1 px-5 py-6 md:px-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Open disputes
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review creator appeals and resolve rejected campaign submissions.
            </p>
          </header>

          {searchParams?.message ? (
            <p className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {searchParams.message}
            </p>
          ) : null}

          {searchParams?.error ? (
            <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {searchParams.error}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <Th>Creator</Th>
                    <Th>Business</Th>
                    <Th>Campaign</Th>
                    <Th>Rejection reason</Th>
                    <Th>Dispute reason</Th>
                    <Th>Evidence</Th>
                    <Th>Date submitted</Th>
                    <Th>Status</Th>
                    <Th>Resolve</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {disputes.map((dispute) => (
                    <tr className="align-top" key={dispute.id}>
                      <Td>
                        <div className="font-semibold">
                          {dispute.creators?.profiles?.full_name ?? "Creator"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {dispute.creators?.handle ?? "@creator"}
                        </div>
                      </Td>
                      <Td>{dispute.businesses?.business_name ?? "Business"}</Td>
                      <Td>{dispute.videos?.campaigns?.title ?? "Campaign"}</Td>
                      <Td>
                        {dispute.videos?.rejection_reason ?? "No reason provided."}
                      </Td>
                      <Td>{dispute.reason}</Td>
                      <Td>
                        {dispute.evidence_url ? (
                          <a
                            className="font-semibold text-indigo-700 hover:text-indigo-900"
                            href={dispute.evidence_url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View evidence
                          </a>
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </Td>
                      <Td>{formatDateTime(dispute.created_at)}</Td>
                      <Td>
                        <span
                          className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${
                            statusStyles[dispute.status] ?? statusStyles.open
                          }`}
                        >
                          {formatStatus(dispute.status)}
                        </span>
                      </Td>
                      <Td>
                        <form action={resolveDispute} className="w-72 space-y-3">
                          <input
                            name="disputeId"
                            type="hidden"
                            value={dispute.id}
                          />
                          <textarea
                            className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            name="adminNote"
                            placeholder="Admin note required"
                            required
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                              name="resolution"
                              type="submit"
                              value="creator"
                            >
                              Resolve for creator
                            </button>
                            <button
                              className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                              name="resolution"
                              type="submit"
                              value="business"
                            >
                              Resolve for business
                            </button>
                          </div>
                        </form>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!disputes.length ? (
              <p className="border-t border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                No open disputes right now.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 text-slate-700">{children}</td>;
}

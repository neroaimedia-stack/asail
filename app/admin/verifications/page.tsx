import { approveVerification, rejectVerification } from "../actions";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("pending_verifications")
    .select("id, platform, verification_code, created_at, creators(handle, profiles(full_name))")
    .order("created_at", { ascending: true });

  return (
    <div>
      <Header title="Verifications" subtitle="Approve creator platform verification requests." />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr><Th>Creator</Th><Th>Platform</Th><Th>Code</Th><Th>Submitted</Th><Th>Actions</Th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(data ?? []).map((item) => (
              <tr key={item.id}>
                <Td><div className="font-semibold">{(item.creators as any)?.profiles?.full_name ?? "Creator"}</div><div className="text-xs text-slate-500">{(item.creators as any)?.handle}</div></Td>
                <Td>{item.platform}</Td>
                <Td><code>{item.verification_code}</code></Td>
                <Td>{new Date(item.created_at).toLocaleDateString()}</Td>
                <Td><div className="flex gap-2"><VerificationAction action={approveVerification} id={item.id} label="Approve" /><VerificationAction action={rejectVerification} id={item.id} label="Reject" /></div></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VerificationAction({ action, id, label }: { action: (formData: FormData) => void; id: string; label: string }) {
  return <form action={action}><input name="verificationId" type="hidden" value={id} /><button className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100">{label}</button></form>;
}
function Header({ subtitle, title }: { subtitle: string; title: string }) { return <header className="mb-6"><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-slate-600">{subtitle}</p></header>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 font-semibold">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-4 py-4 align-top">{children}</td>; }

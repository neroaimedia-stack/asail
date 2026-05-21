import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("messages")
    .select("id, content, created_at, sender_id, conversations(campaign_id, businesses(business_name), creators(handle, profiles(full_name)))")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <Header title="Messages" subtitle="Monitor recent marketplace conversations. Read-only." />
      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {(data ?? []).map((message) => (
          <div className="p-4 text-sm" key={message.id}>
            <div className="font-semibold">{(message.conversations as any)?.businesses?.business_name ?? "Business"} / {(message.conversations as any)?.creators?.profiles?.full_name ?? "Creator"}</div>
            <p className="mt-2 text-slate-700">{message.content}</p>
            <div className="mt-1 text-xs text-slate-500">{new Date(message.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({ subtitle, title }: { subtitle: string; title: string }) { return <header className="mb-6"><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-slate-600">{subtitle}</p></header>; }

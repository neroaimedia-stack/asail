import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminEmailLogsPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("notifications")
    .select("id, type, title, body, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <Header title="Email logs" subtitle="Transactional email-adjacent events currently mirror notification events." />
      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {(data ?? []).map((item) => (
          <div className="p-4 text-sm" key={item.id}>
            <div className="font-semibold">{item.title}</div>
            <div className="mt-1 text-xs text-slate-500">{item.type} - {new Date(item.created_at).toLocaleString()}</div>
            <p className="mt-2 text-slate-700">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({ subtitle, title }: { subtitle: string; title: string }) { return <header className="mb-6"><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-slate-600">{subtitle}</p></header>; }

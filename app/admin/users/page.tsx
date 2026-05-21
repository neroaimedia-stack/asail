import { makeAdmin, softDeleteUser, suspendUser } from "../actions";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Profile = {
  avatar_url: string | null;
  created_at: string;
  deleted_at: string | null;
  full_name: string;
  id: string;
  role: string;
  suspended_at: string | null;
};

async function getUsers(searchParams?: Record<string, string | undefined>) {
  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, role, full_name, avatar_url, created_at, deleted_at, suspended_at")
    .order("created_at", { ascending: false });
  const { data: creators } = await admin.from("creators").select("user_id, verified");
  const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map(authUsers.users.map((user) => [user.id, user.email ?? ""]));
  const verifiedByUserId = new Map((creators ?? []).map((creator) => [creator.user_id, Boolean(creator.verified)]));
  const query = (searchParams?.q ?? "").toLowerCase();
  const role = searchParams?.role ?? "all";
  const verified = searchParams?.verified ?? "all";

  return ((profiles ?? []) as Profile[]).filter((profile) => {
    const email = emailById.get(profile.id) ?? "";
    const matchesSearch = !query || `${profile.full_name} ${email}`.toLowerCase().includes(query);
    const matchesRole = role === "all" || profile.role === role;
    const isVerified = verifiedByUserId.get(profile.id);
    const matchesVerified =
      verified === "all" ||
      (verified === "verified" && isVerified) ||
      (verified === "unverified" && profile.role === "creator" && !isVerified);
    return matchesSearch && matchesRole && matchesVerified;
  }).map((profile) => ({
    ...profile,
    email: emailById.get(profile.id) ?? "No email",
    verified: verifiedByUserId.get(profile.id) ?? null,
  }));
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Record<string, string | undefined>;
}) {
  const users = await getUsers(searchParams);

  return (
    <div>
      <Header title="Users" subtitle="Manage accounts, roles, and status." />
      <form className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input className={inputClass} defaultValue={searchParams?.q} name="q" placeholder="Search name or email" />
        <select className={inputClass} defaultValue={searchParams?.role ?? "all"} name="role">
          <option value="all">All roles</option>
          <option value="business">Business</option>
          <option value="creator">Creator</option>
          <option value="admin">Admin</option>
        </select>
        <select className={inputClass} defaultValue={searchParams?.verified ?? "all"} name="verified">
          <option value="all">Any verification</option>
          <option value="verified">Verified creators</option>
          <option value="unverified">Unverified creators</option>
        </select>
        <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Filter</button>
      </form>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr><Th>Name and email</Th><Th>Role</Th><Th>Joined</Th><Th>Status</Th><Th>Verified</Th><Th>Actions</Th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id}>
                <Td><div className="font-semibold">{user.full_name}</div><div className="text-xs text-slate-500">{user.email}</div></Td>
                <Td><Badge>{user.role}</Badge></Td>
                <Td>{new Date(user.created_at).toLocaleDateString()}</Td>
                <Td>{user.deleted_at ? "deleted" : user.suspended_at ? "suspended" : "active"}</Td>
                <Td>{user.verified === null ? "-" : user.verified ? "Verified" : "Unverified"}</Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <a className={smallButton} href={`?q=${encodeURIComponent(user.email)}`}>View</a>
                    <ActionButton action={suspendUser} label="Suspend" userId={user.id} />
                    <ActionButton action={softDeleteUser} label="Delete" userId={user.id} />
                    <ActionButton action={makeAdmin} label="Make admin" userId={user.id} />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputClass = "h-10 rounded-md border border-slate-300 px-3 text-sm";
const smallButton = "rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100";
function Header({ subtitle, title }: { subtitle: string; title: string }) {
  return <header className="mb-6"><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-slate-600">{subtitle}</p></header>;
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold">{children}</span>;
}
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 font-semibold">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-4 py-4 align-top">{children}</td>; }
function ActionButton({ action, label, userId }: { action: (formData: FormData) => void; label: string; userId: string }) {
  return <form action={action}><input name="userId" type="hidden" value={userId} /><button className={smallButton} type="submit">{label}</button></form>;
}

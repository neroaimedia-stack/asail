export default function AdminSettingsPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Admin settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Operational controls for Asail administrators.
        </p>
      </header>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">First admin SQL</h2>
        <pre className="mt-3 overflow-x-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
{`-- Replace MY_EMAIL_HERE with your Supabase Auth email.
update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'MY_EMAIL_HERE'
  limit 1
);`}
        </pre>
      </section>
    </div>
  );
}

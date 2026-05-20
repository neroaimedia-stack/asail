import Link from "next/link";
import { redirect } from "next/navigation";
import { updateEmailPreferences } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Preferences = {
  campaign_alerts: boolean;
  invitations: boolean;
  messages: boolean;
  video_updates: boolean;
};

const defaultPreferences: Preferences = {
  campaign_alerts: true,
  invitations: true,
  messages: true,
  video_updates: true,
};

async function getSettingsData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/settings");
  }

  const admin = createAdminClient();
  const [{ data: profile }, { data: preferences }] = await Promise.all([
    admin.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle(),
    admin
      .from("email_preferences")
      .select("video_updates, invitations, campaign_alerts, messages")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return {
    email: user.email ?? "",
    preferences: { ...defaultPreferences, ...(preferences as Partial<Preferences> | null) },
    profile: profile as { full_name: string; role: string } | null,
  };
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { error?: string; saved?: string };
}) {
  const { email, preferences, profile } = await getSettingsData();
  const accent =
    profile?.role === "business"
      ? "border-amber-200 bg-[#fff8ed] text-amber-950"
      : "border-indigo-200 bg-indigo-50 text-slate-950";

  return (
    <main className={`min-h-screen px-6 py-10 ${accent}`}>
      <section className="mx-auto max-w-3xl rounded-lg border border-stone-200 bg-white p-6 text-stone-950">
        <div className="mb-6">
          <Link
            className="text-sm font-semibold text-stone-600 hover:text-stone-950"
            href={profile?.role === "business" ? "/business/dashboard" : "/creator/dashboard"}
          >
            Back to dashboard
          </Link>
        </div>

        <header className="border-b border-stone-200 pb-5">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-2 text-sm text-stone-600">
            Manage transactional emails for {email}.
          </p>
        </header>

        {searchParams?.saved ? (
          <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Email preferences saved.
          </p>
        ) : null}

        {searchParams?.error ? (
          <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {searchParams.error}
          </p>
        ) : null}

        <form action={updateEmailPreferences} className="mt-6 space-y-4">
          <PreferenceToggle
            checked={preferences.video_updates}
            description="Emails when videos are accepted or rejected."
            label="Video accepted / rejected notifications"
            name="video_updates"
          />
          <PreferenceToggle
            checked={preferences.invitations}
            description="Emails when a business invites you to a campaign."
            label="Invitation notifications"
            name="invitations"
          />
          <PreferenceToggle
            checked={preferences.campaign_alerts}
            description="Emails when campaigns are close to expiring."
            label="Campaign expiry warnings"
            name="campaign_alerts"
          />
          <PreferenceToggle
            checked={preferences.messages}
            description="Emails for new messages when you have been away."
            label="New message notifications"
            name="messages"
          />

          <button
            className="mt-4 rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
            type="submit"
          >
            Save preferences
          </button>
        </form>
      </section>
    </main>
  );
}

function PreferenceToggle({
  checked,
  description,
  label,
  name,
}: {
  checked: boolean;
  description: string;
  label: string;
  name: string;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-stone-200 p-4">
      <span>
        <span className="block text-sm font-semibold text-stone-950">
          {label}
        </span>
        <span className="mt-1 block text-sm text-stone-600">{description}</span>
      </span>
      <input
        className="mt-1 h-5 w-5 accent-stone-950"
        defaultChecked={checked}
        name={name}
        type="checkbox"
      />
    </label>
  );
}

import { redirect } from "next/navigation";
import { CampaignForm } from "./campaign-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/business/campaigns/new");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/business/onboarding");
  }

  return (
    <main className="min-h-screen bg-[#fff8ed] px-6 py-10 text-amber-950">
      <section className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 border-b border-amber-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              New campaign
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/70">
              Define the brief, payout rate, and budget before creators start
              submitting content.
            </p>
          </div>
          <a
            className="text-sm font-semibold text-amber-800 transition hover:text-amber-950"
            href="/business/campaigns"
          >
            Back to campaigns
          </a>
        </div>

        <CampaignForm error={searchParams?.error} />
      </section>
    </main>
  );
}

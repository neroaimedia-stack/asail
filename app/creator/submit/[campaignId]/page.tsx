import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmissionForm } from "./submission-form";
import { createClient } from "@/lib/supabase/server";
import {
  type SubmissionLimitResult,
  validateVideoSubmissionLimits,
} from "@/lib/submission-limits";

type Campaign = {
  brief: string;
  cpm_rate: number | string;
  id: string;
  instructions: string;
  title: string;
  businesses: {
    business_name: string;
  } | null;
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getCampaignForSubmission(campaignId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectedFrom=/creator/submit/${campaignId}`);
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) {
    redirect("/creator/onboarding");
  }

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, title, brief, instructions, cpm_rate, businesses!inner(business_name)")
    .eq("id", campaignId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .single();

  if (error || !data) {
    redirect("/creator/browse");
  }

  const campaign = data as unknown as Campaign;
  const limitResult = await validateVideoSubmissionLimits({
    campaignId: campaign.id,
    creatorId: creator.id,
  });

  return {
    campaign,
    limitResult,
  };
}

export default async function CreatorSubmitCampaignPage({
  params,
  searchParams,
}: {
  params: { campaignId: string };
  searchParams?: { error?: string };
}) {
  const { campaign, limitResult } = await getCampaignForSubmission(
    params.campaignId,
  );
  const displayedError = searchParams?.error ?? limitResult.message ?? undefined;

  return (
    <main className="min-h-screen bg-indigo-50 px-6 py-8 text-slate-950">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            href={`/creator/browse/${campaign.id}`}
          >
            Back to campaign
          </Link>
        </div>

        <div className="rounded-lg border border-indigo-200 bg-white p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {campaign.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {campaign.businesses?.business_name ?? "Business"}
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="text-base font-semibold">Brief</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                {campaign.brief}
              </p>
            </section>
            <section>
              <h2 className="text-base font-semibold">Content instructions</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                {campaign.instructions}
              </p>
            </section>
          </div>
        </div>

        <div className="mt-6">
          {limitResult.blocksForm && limitResult.message ? (
            <div className="rounded-lg border border-red-200 bg-white p-6">
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                {limitResult.message}
              </p>
              <Link
                className="mt-5 inline-flex rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                href="/creator/browse"
              >
                Browse other campaigns →
              </Link>
            </div>
          ) : (
            <SubmissionForm
              campaignId={campaign.id}
              cpmRate={toNumber(campaign.cpm_rate)}
              error={displayedError}
            />
          )}
        </div>
      </section>
    </main>
  );
}

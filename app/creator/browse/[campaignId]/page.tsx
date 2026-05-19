import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CampaignDetail = {
  brief: string;
  cpm_rate: number | string;
  id: string;
  instructions: string;
  spent_budget: number | string | null;
  title: string;
  total_budget: number | string;
  businesses: {
    business_name: string;
    category: string;
    logo_url: string | null;
  } | null;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function requireCreatorOnboardingComplete() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/creator/browse");
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) {
    redirect("/creator/onboarding");
  }

  return supabase;
}

export default async function CampaignDetailPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const supabase = await requireCreatorOnboardingComplete();
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id, title, brief, instructions, total_budget, spent_budget, cpm_rate, businesses!inner(business_name, category, logo_url)",
    )
    .eq("id", params.campaignId)
    .eq("status", "active")
    .single();

  if (error || !data) {
    redirect("/creator/browse");
  }

  const campaign = data as unknown as CampaignDetail;
  const businessName = campaign.businesses?.business_name ?? "Business";
  const businessCategory = campaign.businesses?.category ?? "Other";
  const totalBudget = toNumber(campaign.total_budget);
  const spentBudget = toNumber(campaign.spent_budget);
  const remainingBudget = Math.max(totalBudget - spentBudget, 0);
  const spentPercent =
    totalBudget > 0 ? Math.min((spentBudget / totalBudget) * 100, 100) : 0;

  return (
    <main className="min-h-screen bg-indigo-50 px-6 py-8 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            href="/creator/browse"
          >
            Back to browse
          </Link>
        </div>

        <div className="rounded-lg border border-indigo-200 bg-white">
          <div className="border-b border-indigo-200 p-6">
            <div className="flex items-start gap-4">
              {campaign.businesses?.logo_url ? (
                <Image
                  alt={`${businessName} logo`}
                  className="h-14 w-14 rounded-md border border-indigo-100 object-cover"
                  height={56}
                  src={campaign.businesses.logo_url}
                  width={56}
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-base font-semibold text-indigo-700">
                  {initials(businessName)}
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {campaign.title}
                  </h1>
                  <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                    {businessCategory}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{businessName}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
              <section>
                <h2 className="text-base font-semibold">Brief</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                  {campaign.brief}
                </p>
              </section>
              <section>
                <h2 className="text-base font-semibold">
                  Content instructions
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                  {campaign.instructions}
                </p>
              </section>
            </div>

            <aside className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <div>
                <div className="text-sm text-slate-600">CPM rate</div>
                <div className="mt-1 text-2xl font-semibold text-indigo-700">
                  {moneyFormatter.format(toNumber(campaign.cpm_rate))}
                  <span className="text-sm font-medium text-indigo-700/75">
                    {" "}
                    per 1k views
                  </span>
                </div>
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Budget remaining</span>
                  <span>{moneyFormatter.format(remainingBudget)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-sm bg-indigo-100">
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${spentPercent}%` }}
                  />
                </div>
              </div>
              <Link
                className="mt-5 inline-flex w-full justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                href={`/creator/submit/${campaign.id}`}
              >
                Submit a video
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

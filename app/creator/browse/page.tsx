import { redirect } from "next/navigation";
import { CampaignGrid, type BrowseCampaign } from "./campaign-grid";
import { createClient } from "@/lib/supabase/server";

type SearchParams = {
  category?: string;
  sort?: string;
};

type CampaignRow = {
  brief: string;
  cpm_rate: number | string;
  id: string;
  spent_budget: number | string | null;
  title: string;
  total_budget: number | string;
  businesses: {
    business_name: string;
    category: string;
    logo_url: string | null;
  } | null;
};

const categories = ["All", "Restaurant", "Hotel", "SaaS", "Retail"];

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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

export default async function CreatorBrowsePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const supabase = await requireCreatorOnboardingComplete();
  const selectedCategory = searchParams?.category ?? "All";
  const selectedSort = searchParams?.sort ?? "newest";

  let query = supabase
    .from("campaigns")
    .select(
      "id, title, brief, total_budget, spent_budget, cpm_rate, created_at, businesses!inner(business_name, category, logo_url)",
    )
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (selectedCategory !== "All" && categories.includes(selectedCategory)) {
    query = query.eq("businesses.category", selectedCategory);
  }

  query =
    selectedSort === "highest-cpm"
      ? query.order("cpm_rate", { ascending: false })
      : query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const campaigns: BrowseCampaign[] = ((data ?? []) as unknown as CampaignRow[]).map(
    (campaign) => {
      const totalBudget = toNumber(campaign.total_budget);
      const spentBudget = toNumber(campaign.spent_budget);

      return {
        brief: campaign.brief,
        businessCategory: campaign.businesses?.category ?? "Other",
        businessLogoUrl: campaign.businesses?.logo_url ?? null,
        businessName: campaign.businesses?.business_name ?? "Business",
        cpmRate: toNumber(campaign.cpm_rate),
        id: campaign.id,
        remainingBudget: Math.max(totalBudget - spentBudget, 0),
        spentBudget,
        title: campaign.title,
        totalBudget,
      };
    },
  );

  return (
    <main className="min-h-screen bg-indigo-50 px-6 py-8 text-slate-950">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 border-b border-indigo-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Browse campaigns
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Find active briefs that match your channels and content style.
            </p>
            <form action="/search" className="mt-4 flex max-w-xl gap-2">
              <input name="type" type="hidden" value="campaigns" />
              <label className="sr-only" htmlFor="campaign-search">
                Search campaigns
              </label>
              <input
                className="h-11 flex-1 rounded-md border border-indigo-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                id="campaign-search"
                name="q"
                placeholder="Search campaigns..."
              />
              <button
                className="rounded-md border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                type="submit"
              >
                Search
              </button>
            </form>
          </div>

          <form className="flex flex-col gap-3 sm:flex-row" method="get">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Category
              </span>
              <select
                className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-44"
                defaultValue={selectedCategory}
                name="category"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Sort</span>
              <select
                className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-40"
                defaultValue={selectedSort}
                name="sort"
              >
                <option value="newest">Newest</option>
                <option value="highest-cpm">Highest CPM</option>
              </select>
            </label>
            <button
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:self-end"
              type="submit"
            >
              Apply
            </button>
          </form>
        </div>

        <CampaignGrid campaigns={campaigns} />
      </section>
    </main>
  );
}

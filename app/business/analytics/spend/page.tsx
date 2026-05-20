import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SpendRow = {
  campaign_id: string;
  campaign_title: string;
  cpm_rate: number | string | null;
  spent_budget: number | string | null;
  total_budget: number | string | null;
  total_paid_out: number | string | null;
  total_videos: number | null;
  total_views: number | null;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getBusinessSpendData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/business/analytics/spend");
  }

  const { data: termsAcceptance } = await supabase
    .from("terms_accepted")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!termsAcceptance) {
    redirect(
      "/auth/signup/business?error=Please%20accept%20the%20Terms%20of%20Service%20and%20Privacy%20Policy.",
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/business/onboarding");
  }

  const { data, error } = await supabase
    .from("business_spend_summary")
    .select(
      "campaign_id, campaign_title, total_budget, spent_budget, cpm_rate, total_paid_out, total_views, total_videos",
    )
    .eq("business_id", business.id)
    .order("campaign_title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SpendRow[];
  const totalBudget = rows.reduce(
    (sum, row) => sum + toNumber(row.total_budget),
    0,
  );
  const totalSpent = rows.reduce(
    (sum, row) => sum + toNumber(row.total_paid_out),
    0,
  );

  return {
    businessName: business.business_name as string,
    rows,
    stats: {
      budgetRemaining: Math.max(totalBudget - totalSpent, 0),
      totalBudget,
      totalCampaigns: rows.length,
      totalSpent,
    },
  };
}

export default async function BusinessSpendPage() {
  const { businessName, rows, stats } = await getBusinessSpendData();

  return (
    <main className="min-h-screen bg-[#fff8ed] text-amber-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <aside className="border-b border-amber-200 bg-[#fffaf0] px-5 py-5 md:w-64 md:border-b-0 md:border-r">
          <Link className="block text-lg font-semibold" href="/business/dashboard">
            Asail
          </Link>
          <p className="mt-1 text-sm text-amber-900/65">{businessName}</p>
          <nav className="mt-6 flex gap-2 overflow-x-auto text-sm md:flex-col md:overflow-visible">
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/business/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/business/campaigns"
            >
              Campaigns
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/business/review"
            >
              Review Videos
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/leaderboard"
            >
              Leaderboard
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/search"
            >
              Search
            </Link>
            <div className="my-1 hidden border-t border-amber-200 md:block" />
            <span className="hidden px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-amber-800/70 md:block">
              Analytics
            </span>
            <Link
              className="rounded-md bg-amber-100 px-3 py-2 font-semibold text-amber-950"
              href="/business/analytics/spend"
            >
              Spend
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/business/settings"
            >
              Settings
            </Link>
          </nav>
        </aside>

        <section className="flex-1 px-5 py-6 md:px-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Spend analytics
            </h1>
            <p className="mt-1 text-sm text-amber-900/70">
              Track budgets, payouts, views, and accepted video volume.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total campaigns"
              value={numberFormatter.format(stats.totalCampaigns)}
            />
            <StatCard
              label="Total budget"
              value={moneyFormatter.format(stats.totalBudget)}
            />
            <StatCard
              label="Total spent so far"
              value={moneyFormatter.format(stats.totalSpent)}
            />
            <StatCard
              label="Budget remaining"
              value={moneyFormatter.format(stats.budgetRemaining)}
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-amber-200 bg-white">
            <div className="border-b border-amber-200 px-4 py-3">
              <h2 className="text-base font-semibold">Campaign spend</h2>
            </div>
            {rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                  <thead className="bg-amber-50 text-amber-900">
                    <tr>
                      <Th>Campaign name</Th>
                      <Th>Total budget</Th>
                      <Th>Spent</Th>
                      <Th>Remaining</Th>
                      <Th>Total views</Th>
                      <Th>CPM rate</Th>
                      <Th>Videos accepted</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {rows.map((row) => {
                      const totalBudget = toNumber(row.total_budget);
                      const spent = toNumber(row.total_paid_out);
                      const remaining = Math.max(totalBudget - spent, 0);
                      const spentPercent =
                        totalBudget > 0
                          ? Math.min((spent / totalBudget) * 100, 100)
                          : 0;

                      return (
                        <tr className="align-middle" key={row.campaign_id}>
                          <Td>{row.campaign_title}</Td>
                          <Td>{moneyFormatter.format(totalBudget)}</Td>
                          <Td>{moneyFormatter.format(spent)}</Td>
                          <Td>
                            <div className="min-w-40">
                              <div className="flex items-center justify-between gap-3">
                                <span>{moneyFormatter.format(remaining)}</span>
                                <span className="text-xs text-amber-900/60">
                                  {numberFormatter.format(100 - spentPercent)}%
                                </span>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-sm bg-amber-100">
                                <div
                                  className="h-full bg-amber-600"
                                  style={{ width: `${spentPercent}%` }}
                                />
                              </div>
                            </div>
                          </Td>
                          <Td>{numberFormatter.format(toNumber(row.total_views))}</Td>
                          <Td>{moneyFormatter.format(toNumber(row.cpm_rate))}</Td>
                          <Td>{numberFormatter.format(toNumber(row.total_videos))}</Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <h2 className="text-xl font-semibold text-amber-950">
                  No campaign spend yet
                </h2>
                <p className="mt-2 text-sm text-amber-900/70">
                  Spend analytics appear once you create campaigns.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-white p-4">
      <div className="text-sm text-amber-900/65">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-amber-950">
        {value}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-amber-950">{children}</td>;
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type EarningsRow = {
  business_name: string;
  campaign_title: string;
  cpm_rate: number | string | null;
  payout_amount: number | string | null;
  payout_status: "paid" | "unpaid";
  platform: string;
  submitted_at: string;
  video_id: string;
  view_count: number | null;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  style: "currency",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const statusStyles = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  unpaid: "border-amber-200 bg-amber-50 text-amber-700",
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPlatform(value: string) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
  };

  return labels[value] ?? value;
}

async function getCreatorEarningsData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/creator/earnings");
  }

  const { data: termsAcceptance } = await supabase
    .from("terms_accepted")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!termsAcceptance) {
    redirect(
      "/auth/signup/creator?error=Please%20accept%20the%20Terms%20of%20Service%20and%20Privacy%20Policy.",
    );
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id, handle")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) {
    redirect("/creator/onboarding");
  }

  const { data, error } = await supabase
    .from("earnings_summary")
    .select(
      "video_id, campaign_title, business_name, platform, view_count, cpm_rate, payout_amount, payout_status, submitted_at",
    )
    .eq("creator_id", creator.id)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as EarningsRow[];
  const totalEarned = rows.reduce(
    (sum, row) => sum + toNumber(row.payout_amount),
    0,
  );
  const paidOut = rows
    .filter((row) => row.payout_status === "paid")
    .reduce((sum, row) => sum + toNumber(row.payout_amount), 0);
  const pendingPayout = rows
    .filter((row) => row.payout_status === "unpaid")
    .reduce((sum, row) => sum + toNumber(row.payout_amount), 0);

  return {
    creatorHandle: creator.handle as string,
    rows,
    stats: {
      paidOut,
      pendingPayout,
      totalEarned,
      totalViews: rows.reduce((sum, row) => sum + toNumber(row.view_count), 0),
    },
  };
}

export default async function CreatorEarningsPage() {
  const { creatorHandle, rows, stats } = await getCreatorEarningsData();

  return (
    <main className="min-h-screen bg-indigo-50 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
        <aside className="border-b border-indigo-200 bg-white px-5 py-5 md:w-64 md:border-b-0 md:border-r">
          <Link className="block text-lg font-semibold" href="/creator/dashboard">
            Asail
          </Link>
          <p className="mt-1 text-sm text-slate-500">{creatorHandle}</p>
          <nav className="mt-6 flex gap-2 overflow-x-auto text-sm md:flex-col md:overflow-visible">
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
              href="/creator/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
              href="/creator/browse"
            >
              Browse Campaigns
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
              href="/creator/dashboard"
            >
              My Videos
            </Link>
            <Link
              className="rounded-md bg-indigo-100 px-3 py-2 font-semibold text-indigo-900"
              href="/creator/earnings"
            >
              Earnings
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
              href="/creator/settings"
            >
              Settings
            </Link>
          </nav>
        </aside>

        <section className="flex-1 px-5 py-6 md:px-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Earnings
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track accepted videos, verified views, and payout status.
            </p>
          </header>

          <div className="mb-6 rounded-lg border border-indigo-200 bg-white p-4">
            <div className="text-sm font-semibold text-indigo-900">
              Your earnings = (Views ÷ 1,000) × CPM rate
            </div>
            <p className="mt-1 text-sm text-slate-600">
              View counts and CPM rates are calculated per accepted campaign
              video.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total views"
              value={numberFormatter.format(stats.totalViews)}
            />
            <StatCard
              label="Total earned"
              value={moneyFormatter.format(stats.totalEarned)}
            />
            <StatCard
              label="Paid out"
              value={moneyFormatter.format(stats.paidOut)}
            />
            <StatCard
              label="Pending payout"
              value={moneyFormatter.format(stats.pendingPayout)}
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-indigo-200 bg-white">
            <div className="border-b border-indigo-200 px-4 py-3">
              <h2 className="text-base font-semibold">Earnings breakdown</h2>
            </div>
            {rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                  <thead className="bg-indigo-50 text-slate-700">
                    <tr>
                      <Th>Campaign</Th>
                      <Th>Business</Th>
                      <Th>Platform</Th>
                      <Th>Views</Th>
                      <Th>CPM rate</Th>
                      <Th>Earnings</Th>
                      <Th>Payout</Th>
                      <Th>Date submitted</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-100">
                    {rows.map((row) => {
                      const isPendingPlatformViews =
                        ["tiktok", "instagram"].includes(row.platform) &&
                        toNumber(row.view_count) === 0;

                      return (
                        <tr className="align-middle" key={row.video_id}>
                          <Td>{row.campaign_title}</Td>
                          <Td>{row.business_name}</Td>
                          <Td>{formatPlatform(row.platform)}</Td>
                          <Td>
                            <div>{numberFormatter.format(toNumber(row.view_count))}</div>
                            {isPendingPlatformViews ? (
                              <span className="mt-1 inline-flex rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                                Views pending — platform API coming soon
                              </span>
                            ) : null}
                          </Td>
                          <Td>{moneyFormatter.format(toNumber(row.cpm_rate))}</Td>
                          <Td>{moneyFormatter.format(toNumber(row.payout_amount))}</Td>
                          <Td>
                            <span
                              className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[row.payout_status]}`}
                            >
                              {row.payout_status === "paid"
                                ? "Paid"
                                : "Unpaid"}
                            </span>
                          </Td>
                          <Td>{formatDate(row.submitted_at)}</Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <h2 className="text-xl font-semibold text-slate-950">
                  No accepted videos yet
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Earnings appear here once a business accepts your submitted
                  video.
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
    <div className="rounded-lg border border-indigo-200 bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-slate-700">{children}</td>;
}

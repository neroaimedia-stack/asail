import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminCampaignDetailPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("campaigns")
    .select("title, brief, instructions, status, total_budget, spent_budget, businesses(business_name), videos(id, video_url, status, view_count, payout_amount, creators(handle, profiles(full_name)))")
    .eq("id", params.campaignId)
    .maybeSingle();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{campaign?.title ?? "Campaign"}</h1>
        <p className="mt-1 text-sm text-slate-600">{(campaign?.businesses as { business_name?: string } | null)?.business_name}</p>
      </header>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Info label="Status" value={campaign?.status ?? "-"} />
          <Info label="Budget" value={`${campaign?.total_budget ?? 0}`} />
          <Info label="Spent" value={`${campaign?.spent_budget ?? 0}`} />
        </div>
        <h2 className="mt-6 font-semibold">Submitted videos</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {((campaign?.videos ?? []) as Array<any>).map((video) => (
            <div className="py-3 text-sm" key={video.id}>
              <a className="font-semibold text-red-700" href={video.video_url}>{video.video_url}</a>
              <div className="mt-1 text-slate-600">
                {video.creators?.profiles?.full_name ?? "Creator"} - {video.status} - {Number(video.view_count ?? 0).toLocaleString()} views
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}

import { deleteCampaign, setCampaignAdminStatus } from "../actions";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function getCampaigns() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("campaigns")
    .select("id, title, status, total_budget, spent_budget, expires_at, businesses(business_name), videos(id, status, view_count)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function AdminCampaignsPage() {
  const campaigns = await getCampaigns();
  return (
    <div>
      <Header title="Campaigns" subtitle="Inspect and moderate campaigns." />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr><Th>Campaign</Th><Th>Business</Th><Th>Status</Th><Th>Budget / spent</Th><Th>Videos</Th><Th>Views</Th><Th>Expiry</Th><Th>Actions</Th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {campaigns.map((campaign) => {
              const videos = (campaign.videos ?? []) as Array<{ view_count: number | null }>;
              return (
                <tr key={campaign.id}>
                  <Td>{campaign.title}</Td>
                  <Td>{(campaign.businesses as { business_name?: string } | null)?.business_name ?? "Business"}</Td>
                  <Td><Badge>{campaign.status}</Badge></Td>
                  <Td>{campaign.total_budget} / {campaign.spent_budget}</Td>
                  <Td>{videos.length}</Td>
                  <Td>{videos.reduce((sum, video) => sum + Number(video.view_count ?? 0), 0).toLocaleString()}</Td>
                  <Td>{campaign.expires_at ? new Date(campaign.expires_at).toLocaleDateString() : "No end"}</Td>
                  <Td><div className="flex flex-wrap gap-2">
                    <a className={smallButton} href={`/admin/campaigns/${campaign.id}`}>View</a>
                    <CampaignAction id={campaign.id} label="Pause" status="paused" />
                    <CampaignAction id={campaign.id} label="End early" status="completed" />
                    <form action={deleteCampaign}><input name="campaignId" type="hidden" value={campaign.id} /><button className={smallButton}>Delete</button></form>
                  </div></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const smallButton = "rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100";
function CampaignAction({ id, label, status }: { id: string; label: string; status: string }) {
  return <form action={setCampaignAdminStatus}><input name="campaignId" type="hidden" value={id} /><input name="status" type="hidden" value={status} /><button className={smallButton}>{label}</button></form>;
}
function Header({ subtitle, title }: { subtitle: string; title: string }) { return <header className="mb-6"><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-slate-600">{subtitle}</p></header>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold">{children}</span>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 font-semibold">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-4 py-4 align-top">{children}</td>; }

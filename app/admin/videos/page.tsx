import { overrideVideoStatus } from "../actions";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  const admin = createAdminClient();
  const { data: videos } = await admin
    .from("videos")
    .select("id, video_url, platform, status, view_count, payout_amount, submitted_at, creators(handle, profiles(full_name)), campaigns(title)")
    .order("submitted_at", { ascending: false });

  return (
    <div>
      <Header title="Videos" subtitle="Review all platform submissions." />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr><Th>URL</Th><Th>Creator</Th><Th>Campaign</Th><Th>Platform</Th><Th>Status</Th><Th>Views</Th><Th>Payout</Th><Th>Submitted</Th><Th>Actions</Th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(videos ?? []).map((video) => (
              <tr key={video.id}>
                <Td><a className="font-semibold text-red-700" href={video.video_url} rel="noreferrer" target="_blank">Open video</a></Td>
                <Td>{(video.creators as any)?.profiles?.full_name ?? "Creator"}</Td>
                <Td>{(video.campaigns as any)?.title ?? "Campaign"}</Td>
                <Td><Badge>{video.platform}</Badge></Td>
                <Td><Badge>{video.status}</Badge></Td>
                <Td>{Number(video.view_count ?? 0).toLocaleString()}</Td>
                <Td>{video.payout_amount}</Td>
                <Td>{new Date(video.submitted_at).toLocaleDateString()}</Td>
                <Td><OverrideForm videoId={video.id} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverrideForm({ videoId }: { videoId: string }) {
  return (
    <form action={overrideVideoStatus} className="flex min-w-72 gap-2">
      <input name="videoId" type="hidden" value={videoId} />
      <input className="w-32 rounded-md border border-slate-300 px-2 py-2 text-xs" name="reason" placeholder="Reason" />
      <button className={smallButton} name="status" value="accepted">Accept</button>
      <button className={smallButton} name="status" value="rejected">Reject</button>
    </form>
  );
}

const smallButton = "rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100";
function Header({ subtitle, title }: { subtitle: string; title: string }) { return <header className="mb-6"><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-slate-600">{subtitle}</p></header>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold">{children}</span>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 font-semibold">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-4 py-4 align-top">{children}</td>; }

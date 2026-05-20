import Link from "next/link";
import { redirect } from "next/navigation";
import {
  InviteAnotherCreator,
  type CampaignInviteCreatorOption,
} from "./invite-another-creator";
import { startBusinessConversation } from "@/app/messages/actions";
import { formatUnreadCount, getUnreadMessageCount } from "@/lib/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RawInvitation = {
  created_at: string;
  id: string;
  responded_at: string | null;
  status: "pending" | "accepted" | "declined" | "expired";
  creators: {
    handle: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
};

type LeaderboardCreator = {
  creator_id: string;
  full_name: string | null;
  handle: string;
};

type AcceptedVideoCreator = {
  creatorId: string;
  handle: string;
  name: string;
  videoCount: number;
};

const statusStyles = {
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  declined: "border-red-200 bg-red-50 text-red-700",
  expired: "border-slate-200 bg-slate-100 text-slate-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function getCampaignInvitations(campaignId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectedFrom=/business/campaigns/${campaignId}`);
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/business/onboarding");
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, title, status")
    .eq("id", campaignId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!campaign) {
    redirect("/business/dashboard");
  }

  const { data, error } = await supabase
    .from("invitations")
    .select("id, status, created_at, responded_at, creators(handle, profiles(full_name))")
    .eq("campaign_id", campaign.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const admin = createAdminClient();
  const [
    { data: creatorsData },
    { data: activeVideos },
    { data: pendingInvites },
    { data: acceptedVideos },
  ] =
    await Promise.all([
      admin
        .from("creator_leaderboard")
        .select("creator_id, full_name, handle")
        .order("total_views", { ascending: false })
        .limit(50),
      admin
        .from("videos")
        .select("creator_id")
        .eq("campaign_id", campaign.id)
        .in("status", ["pending", "accepted"]),
      admin
        .from("invitations")
        .select("creator_id")
        .eq("campaign_id", campaign.id)
        .eq("status", "pending"),
      admin
        .from("videos")
        .select("creator_id, creators!inner(handle, profiles!inner(full_name))")
        .eq("campaign_id", campaign.id)
        .eq("status", "accepted"),
    ]);

  const activeVideoCreatorIds = new Set(
    (activeVideos ?? []).map((video) => video.creator_id as string),
  );
  const pendingInviteCreatorIds = new Set(
    (pendingInvites ?? []).map((invitation) => invitation.creator_id as string),
  );
  const creatorOptions: CampaignInviteCreatorOption[] = (
    (creatorsData ?? []) as LeaderboardCreator[]
  ).map((creator) => ({
    disabledReason: activeVideoCreatorIds.has(creator.creator_id)
      ? "Creator already has an active submission"
      : pendingInviteCreatorIds.has(creator.creator_id)
        ? "Invitation already pending"
        : null,
    fullName: creator.full_name ?? "Creator",
    handle: creator.handle,
    id: creator.creator_id,
  }));
  const acceptedCreatorMap = new Map<string, AcceptedVideoCreator>();

  for (const video of (acceptedVideos ?? []) as unknown as Array<{
    creator_id: string;
    creators: { handle: string; profiles: { full_name: string } | null } | null;
  }>) {
    const current = acceptedCreatorMap.get(video.creator_id);

    acceptedCreatorMap.set(video.creator_id, {
      creatorId: video.creator_id,
      handle: video.creators?.handle ?? "@creator",
      name: video.creators?.profiles?.full_name ?? "Creator",
      videoCount: (current?.videoCount ?? 0) + 1,
    });
  }

  return {
    acceptedCreators: Array.from(acceptedCreatorMap.values()),
    businessName: business.business_name as string,
    campaign: campaign as { id: string; status: string; title: string },
    creatorOptions,
    invitations: (data ?? []) as unknown as RawInvitation[],
    messageUnreadCount: await getUnreadMessageCount(user.id),
  };
}

export default async function BusinessCampaignDetailPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const {
    acceptedCreators,
    businessName,
    campaign,
    creatorOptions,
    invitations,
    messageUnreadCount,
  } = await getCampaignInvitations(params.campaignId);

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
              className="rounded-md bg-amber-100 px-3 py-2 font-semibold text-amber-950"
              href="/business/campaigns"
            >
              Campaigns
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/leaderboard"
            >
              Leaderboard
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-amber-900 hover:bg-amber-100"
              href="/messages"
            >
              <span className="flex items-center justify-between gap-2">
                Messages
                {messageUnreadCount > 0 ? (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                    {formatUnreadCount(messageUnreadCount)}
                  </span>
                ) : null}
              </span>
            </Link>
          </nav>
        </aside>

        <section className="flex-1 px-5 py-6 md:px-8">
          <div className="mb-6">
            <Link
              className="text-sm font-semibold text-amber-800 hover:text-amber-950"
              href="/business/dashboard"
            >
              Back to dashboard
            </Link>
          </div>

          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {campaign.title}
              </h1>
              <p className="mt-1 text-sm text-amber-900/70">
                Invitations for this campaign.
              </p>
            </div>
            <InviteAnotherCreator
              campaignId={campaign.id}
              creators={creatorOptions}
            />
          </header>

          <div className="overflow-hidden rounded-lg border border-amber-200 bg-white">
            <div className="border-b border-amber-200 px-4 py-3">
              <h2 className="text-base font-semibold">Invitations</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-amber-50 text-amber-900">
                  <tr>
                    <Th>Creator</Th>
                    <Th>Status</Th>
                    <Th>Date invited</Th>
                    <Th>Date responded</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {invitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <Td>
                        <div className="font-semibold text-amber-950">
                          {invitation.creators?.profiles?.full_name ?? "Creator"}
                        </div>
                        <div className="mt-1 text-xs text-amber-900/65">
                          {invitation.creators?.handle ?? "@creator"}
                        </div>
                      </Td>
                      <Td>
                        <span
                          className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[invitation.status]}`}
                        >
                          {invitation.status}
                        </span>
                      </Td>
                      <Td>{formatDate(invitation.created_at)}</Td>
                      <Td>{formatDate(invitation.responded_at)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!invitations.length ? (
              <p className="px-5 py-10 text-center text-sm text-amber-900/70">
                No invitations sent for this campaign yet.
              </p>
            ) : null}
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-amber-200 bg-white">
            <div className="border-b border-amber-200 px-4 py-3">
              <h2 className="text-base font-semibold">Accepted creators</h2>
            </div>
            {acceptedCreators.length ? (
              <div className="divide-y divide-amber-100">
                {acceptedCreators.map((creator) => (
                  <div
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    key={creator.creatorId}
                  >
                    <div>
                      <div className="font-semibold text-amber-950">
                        {creator.name}
                      </div>
                      <div className="mt-1 text-sm text-amber-900/65">
                        {creator.handle} - {creator.videoCount} accepted videos
                      </div>
                    </div>
                    <form action={startBusinessConversation}>
                      <input
                        name="campaignId"
                        type="hidden"
                        value={campaign.id}
                      />
                      <input
                        name="creatorId"
                        type="hidden"
                        value={creator.creatorId}
                      />
                      <button
                        className="rounded-md bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
                        type="submit"
                      >
                        Message
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-amber-900/70">
                Accepted creators will appear here after videos are approved.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 text-amber-950">{children}</td>;
}

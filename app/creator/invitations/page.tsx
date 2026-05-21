import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptInvitation, declineInvitation } from "./actions";
import { formatUnreadCount, getUnreadMessageCount } from "@/lib/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RawInvitation = {
  campaign_id: string;
  created_at: string;
  expires_at: string;
  id: string;
  message: string | null;
  responded_at: string | null;
  status: "pending" | "accepted" | "declined" | "expired";
  businesses: {
    business_name: string;
    logo_url: string | null;
  } | null;
  campaigns: {
    brief: string;
    cpm_rate: number | string;
    title: string;
  } | null;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const statusStyles = {
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  declined: "border-red-200 bg-red-50 text-red-700",
  expired: "border-slate-200 bg-slate-100 text-slate-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
};

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

async function getInvitationData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/creator/invitations");
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id, handle")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) {
    redirect("/creator/onboarding");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invitations")
    .select(
      "id, campaign_id, message, status, created_at, responded_at, expires_at, businesses(business_name, logo_url), campaigns(title, brief, cpm_rate)",
    )
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    creatorHandle: creator.handle as string,
    invitations: (data ?? []) as unknown as RawInvitation[],
    messageUnreadCount: await getUnreadMessageCount(user.id),
  };
}

export default async function CreatorInvitationsPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const { creatorHandle, invitations, messageUnreadCount } =
    await getInvitationData();

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
              className="rounded-md bg-indigo-100 px-3 py-2 font-semibold text-indigo-900"
              href="/creator/invitations"
            >
              Invitations
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
              href="/creator/earnings"
            >
              Earnings
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
              href="/search"
            >
              Search
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
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
            <Link
              className="rounded-md px-3 py-2 text-slate-700 hover:bg-indigo-50"
              href="/help"
            >
              Help
            </Link>
          </nav>
        </aside>

        <section className="flex-1 px-5 py-6 md:px-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Invitations
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Campaign invitations from businesses that want to work with you.
            </p>
          </header>

          {searchParams?.error ? (
            <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {searchParams.error}
            </p>
          ) : null}

          <div className="grid gap-4">
            {invitations.map((invitation) => {
              const businessName =
                invitation.businesses?.business_name ?? "Business";
              const isExpired =
                invitation.status === "pending" &&
                new Date(invitation.expires_at).getTime() < Date.now();
              const displayStatus = isExpired ? "expired" : invitation.status;

              return (
                <article
                  className="rounded-lg border border-indigo-200 bg-white p-5"
                  key={invitation.id}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      {invitation.businesses?.logo_url ? (
                        <Image
                          alt={`${businessName} logo`}
                          className="h-12 w-12 rounded-md border border-indigo-100 object-cover"
                          height={48}
                          src={invitation.businesses.logo_url}
                          width={48}
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-sm font-semibold text-indigo-700">
                          {initials(businessName)}
                        </div>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold">
                            {invitation.campaigns?.title ?? "Campaign"}
                          </h2>
                          <span
                            className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[displayStatus]}`}
                          >
                            {displayStatus}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {businessName}
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-semibold text-indigo-700">
                      {moneyFormatter.format(
                        toNumber(invitation.campaigns?.cpm_rate),
                      )}
                      <span className="text-sm font-medium text-indigo-700/75">
                        {" "}
                        per 1k views
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                    {invitation.campaigns?.brief ?? "No brief available."}
                  </p>

                  {invitation.message ? (
                    <div className="mt-4 rounded-md border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm leading-6 text-slate-700">
                      {invitation.message}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>Expires {formatDate(invitation.expires_at)}</span>
                    {displayStatus === "pending" ? (
                      <div className="flex flex-wrap gap-2">
                        <form action={acceptInvitation}>
                          <input
                            name="invitationId"
                            type="hidden"
                            value={invitation.id}
                          />
                          <button
                            className="rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                            type="submit"
                          >
                            View campaign & accept
                          </button>
                        </form>
                        <form action={declineInvitation}>
                          <input
                            name="invitationId"
                            type="hidden"
                            value={invitation.id}
                          />
                          <button
                            className="rounded-md border border-indigo-200 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                            type="submit"
                          >
                            Decline
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}

            {!invitations.length ? (
              <div className="rounded-lg border border-indigo-200 bg-white px-6 py-12 text-center text-sm text-slate-600">
                No invitations yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

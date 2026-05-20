import { NextRequest, NextResponse } from "next/server";
import { createNotificationOnce } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getCronSecret(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  return request.headers.get("x-cron-secret") ?? bearerToken;
}

function isAuthorized(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;

  if (!configuredSecret) {
    return false;
  }

  return getCronSecret(request) === configuredSecret;
}

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let supabase;

  try {
    supabase = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Supabase admin client is not configured.",
      },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const { data: expiringCampaigns, error: expiringError } = await supabase
    .from("campaigns")
    .select("id, title, expires_at, businesses!inner(user_id)")
    .gte("expires_at", now)
    .lte("expires_at", threeDaysFromNow.toISOString())
    .eq("status", "active")
    .eq("auto_expired", false);

  if (expiringError) {
    return NextResponse.json({ error: expiringError.message }, { status: 500 });
  }

  for (const campaign of expiringCampaigns ?? []) {
    const businessUserId = (campaign.businesses as { user_id?: string } | null)
      ?.user_id;

    if (!businessUserId) {
      continue;
    }

    await createNotificationOnce({
      body: `${campaign.title} expires in 3 days. Review any pending videos before it ends.`,
      link: "/business/dashboard",
      title: "Campaign expiring soon",
      type: "campaign_expiring",
      userId: businessUserId,
    });
  }

  const { data: expiredCampaigns, error: expiredSelectError } = await supabase
    .from("campaigns")
    .select("id, title, businesses!inner(user_id)")
    .lt("expires_at", now)
    .eq("status", "active")
    .eq("auto_expired", false);

  if (expiredSelectError) {
    return NextResponse.json(
      { error: expiredSelectError.message },
      { status: 500 },
    );
  }

  const expiredIds = (expiredCampaigns ?? []).map((campaign) => campaign.id);

  const { error } = expiredIds.length
    ? await supabase
        .from("campaigns")
        .update({
          auto_expired: true,
          status: "completed",
        })
        .in("id", expiredIds)
    : { error: null };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const campaign of expiredCampaigns ?? []) {
    const businessUserId = (campaign.businesses as { user_id?: string } | null)
      ?.user_id;

    if (!businessUserId) {
      continue;
    }

    await createNotificationOnce({
      body: `${campaign.title} has ended. View your final campaign results.`,
      link: `/business/analytics/${campaign.id}`,
      title: "Campaign ended",
      type: "campaign_expired",
      userId: businessUserId,
    });
  }

  return NextResponse.json({ expired: expiredIds.length });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

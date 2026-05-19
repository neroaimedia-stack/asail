import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordVideoHistory } from "@/lib/video-history";

export async function GET() {
  return NextResponse.json({ payouts: [] });
}

function getCronSecret(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  return request.headers.get("x-cron-secret") ?? bearerToken;
}

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  if (getCronSecret(request) !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    amount?: number;
    videoId?: string;
  } | null;
  const videoId = body?.videoId;
  const amount = Number(body?.amount ?? 0);

  if (!videoId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "videoId and positive amount are required." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("videos")
    .update({
      payout_amount: amount,
      payout_status: "paid",
    })
    .eq("id", videoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordVideoHistory({
    note: `Payout of ₱${amount.toFixed(2)} sent`,
    status: "paid",
    videoId,
  });

  return NextResponse.json({ paid: true });
}

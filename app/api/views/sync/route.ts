import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SyncError = {
  id?: string;
  message: string;
  videoUrl?: string;
};

type AcceptedYoutubeVideo = {
  campaigns: {
    cpm_rate: number | string | null;
  } | null;
  id: string;
  video_url: string;
};

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

function extractYoutubeVideoId(videoUrl: string) {
  try {
    const parsedUrl = new URL(videoUrl);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "music.youtube.com"
    ) {
      const watchId = parsedUrl.searchParams.get("v");

      if (watchId) {
        return watchId;
      }

      const [firstSegment, secondSegment] = parsedUrl.pathname
        .split("/")
        .filter(Boolean);

      if (["embed", "shorts", "live"].includes(firstSegment)) {
        return secondSegment ?? null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchYoutubeViewCount(videoId: string, apiKey: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`YouTube API returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    items?: Array<{
      statistics?: {
        viewCount?: string;
      };
    }>;
  };
  const viewCount = Number(payload.items?.[0]?.statistics?.viewCount);

  if (!Number.isFinite(viewCount)) {
    throw new Error("YouTube API did not return a view count.");
  }

  return viewCount;
}

function calculatePayout(viewCount: number, cpmRate: number | string | null) {
  const parsedCpm = Number(cpmRate ?? 0);
  const safeCpm = Number.isFinite(parsedCpm) ? parsedCpm : 0;

  return Number(((viewCount / 1000) * safeCpm).toFixed(2));
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

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY is not configured." },
      { status: 500 },
    );
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

  const { data, error } = await supabase
    .from("videos")
    .select("id, video_url, campaigns(cpm_rate)")
    .eq("status", "accepted")
    .eq("platform", "youtube");

  if (error) {
    return NextResponse.json(
      { errors: [{ message: error.message }], updated: 0 },
      { status: 500 },
    );
  }

  const errors: SyncError[] = [];
  let updated = 0;

  for (const video of (data ?? []) as unknown as AcceptedYoutubeVideo[]) {
    try {
      const youtubeVideoId = extractYoutubeVideoId(video.video_url);

      if (!youtubeVideoId) {
        errors.push({
          id: video.id,
          message: "Could not extract a YouTube video ID.",
          videoUrl: video.video_url,
        });
        continue;
      }

      const viewCount = await fetchYoutubeViewCount(
        youtubeVideoId,
        process.env.YOUTUBE_API_KEY,
      );
      const payoutAmount = calculatePayout(
        viewCount,
        video.campaigns?.cpm_rate ?? null,
      );

      const { error: updateError } = await supabase
        .from("videos")
        .update({
          payout_amount: payoutAmount,
          view_count: viewCount,
        })
        .eq("id", video.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      updated += 1;
    } catch (error) {
      errors.push({
        id: video.id,
        message:
          error instanceof Error ? error.message : "Unexpected sync error.",
        videoUrl: video.video_url,
      });
    }
  }

  return NextResponse.json({ errors, updated });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

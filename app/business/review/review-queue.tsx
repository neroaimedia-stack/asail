"use client";

import { useMemo, useState } from "react";
import { acceptVideo, rejectVideo } from "./actions";

export type ReviewVideo = {
  campaignTitle: string;
  creatorHandle: string;
  creatorName: string;
  id: string;
  platform: string;
  submittedAt: string;
  videoUrl: string;
};

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }

    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }

  return null;
}

function getEmbedUrl(url: string) {
  const youtubeId = getYouTubeId(url);

  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  if (url.includes("tiktok.com")) {
    const tiktokId = url.split("/video/")[1]?.split("?")[0];
    return tiktokId ? `https://www.tiktok.com/embed/v2/${tiktokId}` : null;
  }

  return null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ReviewQueue({
  initialVideos,
}: {
  initialVideos: ReviewVideo[];
}) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const videos = useMemo(
    () => initialVideos.filter((video) => !dismissedIds.includes(video.id)),
    [dismissedIds, initialVideos],
  );
  const current = videos[0];

  if (!current) {
    return (
      <div className="rounded-lg border border-amber-200 bg-white px-6 py-12 text-center">
        <h2 className="text-xl font-semibold text-amber-950">
          No pending videos
        </h2>
        <p className="mt-2 text-sm text-amber-900/70">
          New creator submissions will appear here when they are ready for
          review.
        </p>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(current.videoUrl);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
      <div className="overflow-hidden rounded-lg border border-amber-200 bg-black">
        {embedUrl ? (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="aspect-video w-full"
            src={embedUrl}
            title={`${current.creatorName} video submission`}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-amber-950 px-6 text-center text-sm text-amber-50">
            Preview unavailable for this URL. Open the original link in the
            details panel.
          </div>
        )}
      </div>

      <aside className="rounded-lg border border-amber-200 bg-white p-5">
        <div className="border-b border-amber-200 pb-4">
          <h2 className="text-xl font-semibold text-amber-950">
            {current.creatorName}
          </h2>
          <p className="mt-1 text-sm text-amber-900/70">
            {current.creatorHandle} · {current.platform}
          </p>
        </div>

        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-amber-950">Campaign</dt>
            <dd className="mt-1 text-amber-900/75">{current.campaignTitle}</dd>
          </div>
          <div>
            <dt className="font-semibold text-amber-950">Submitted</dt>
            <dd className="mt-1 text-amber-900/75">
              {formatDate(current.submittedAt)}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-amber-950">Original URL</dt>
            <dd className="mt-1 break-all text-amber-900/75">
              <a className="underline" href={current.videoUrl}>
                {current.videoUrl}
              </a>
            </dd>
          </div>
        </dl>

        <div className="mt-6 space-y-3">
          <form
            action={async (formData) => {
              setDismissedIds((ids) => [...ids, current.id]);
              await acceptVideo(formData);
            }}
          >
            <input name="videoId" type="hidden" value={current.id} />
            <button
              className="w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              type="submit"
            >
              Accept
            </button>
          </form>

          {isRejecting ? (
            <form
              action={async (formData) => {
                setDismissedIds((ids) => [...ids, current.id]);
                setIsRejecting(false);
                setReason("");
                await rejectVideo(formData);
              }}
              className="space-y-3"
            >
              <input name="videoId" type="hidden" value={current.id} />
              <label className="block">
                <span className="text-sm font-semibold text-amber-950">
                  Rejection reason
                </span>
                <input
                  className="mt-2 w-full rounded-md border border-amber-200 px-3 py-3 text-amber-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  name="rejectionReason"
                  onChange={(event) => setReason(event.target.value)}
                  required
                  type="text"
                  value={reason}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="rounded-md border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-50"
                  onClick={() => {
                    setIsRejecting(false);
                    setReason("");
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  type="submit"
                >
                  Confirm reject
                </button>
              </div>
            </form>
          ) : (
            <button
              className="w-full rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              onClick={() => setIsRejecting(true)}
              type="button"
            >
              Reject
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

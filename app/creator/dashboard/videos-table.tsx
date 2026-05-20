"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { submitDispute } from "./actions";

export type CreatorVideoRow = {
  businessName: string;
  campaignTitle: string;
  earnings: number;
  history: VideoHistoryEntry[];
  id: string;
  payoutStatus: "paid" | "unpaid";
  rejectionReason: string | null;
  reviewedAt: string | null;
  dispute: VideoDispute | null;
  status: "pending" | "accepted" | "rejected";
  submittedAt: string;
  viewCount: number;
};

export type VideoDispute = {
  id: string;
  status: "open" | "under_review" | "resolved_creator" | "resolved_business" | "closed";
};

export type VideoHistoryEntry = {
  createdAt: string;
  id: string;
  note: string | null;
  status: string;
};

const statusStyles = {
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  paid: "border-indigo-200 bg-indigo-50 text-indigo-700",
  pending: "border-slate-200 bg-slate-100 text-slate-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

const statusLabels = {
  accepted: "Accepted",
  paid: "Paid",
  pending: "Pending",
  rejected: "Rejected",
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  style: "currency",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function canDispute(video: CreatorVideoRow) {
  if (video.status !== "rejected" || video.dispute || !video.reviewedAt) {
    return false;
  }

  const reviewedAt = new Date(video.reviewedAt).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return reviewedAt >= sevenDaysAgo;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function disputeBadge(video: CreatorVideoRow) {
  if (!video.dispute) {
    return null;
  }

  if (video.dispute.status === "resolved_creator") {
    return {
      label: "Dispute won - video accepted",
      style: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (video.dispute.status === "resolved_business") {
    return {
      label: "Dispute closed - rejection upheld",
      style: "border-red-200 bg-red-50 text-red-700",
    };
  }

  return {
    label: "Dispute pending",
    style: "border-amber-200 bg-amber-50 text-amber-700",
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function historyStatusLabel(status: string) {
  return statusLabels[status as keyof typeof statusLabels] ?? status;
}

function historyStatusStyle(status: string) {
  return (
    statusStyles[status as keyof typeof statusStyles] ??
    "border-slate-200 bg-slate-100 text-slate-700"
  );
}

export function VideosTable({ videos }: { videos: CreatorVideoRow[] }) {
  const router = useRouter();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [disputeDraft, setDisputeDraft] = useState<CreatorVideoRow | null>(null);
  const [disputeError, setDisputeError] = useState("");
  const [disputeSuccess, setDisputeSuccess] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  if (!videos.length) {
    return (
      <div className="rounded-lg border border-indigo-200 bg-white px-6 py-12 text-center">
        <h2 className="text-xl font-semibold text-slate-950">
          No videos submitted
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Submit your first campaign video and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-indigo-200 bg-white">
      <div className="border-b border-indigo-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">My videos</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-left text-sm">
          <thead className="bg-indigo-50 text-slate-700">
            <tr>
              <Th>Campaign</Th>
              <Th>Status</Th>
              <Th>Current views</Th>
              <Th>Earnings so far</Th>
              <Th>Date submitted</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-100">
            {videos.map((video) => {
              const isExpanded = expandedRows.includes(video.id);
              const canExpand = video.history.length > 0 || video.status === "rejected";
              const currentDisputeBadge = disputeBadge(video);

              return (
                <Fragment key={video.id}>
                  <tr className="align-middle">
                    <Td>
                      <div>
                        <div className="font-semibold text-slate-950">
                          {video.campaignTitle}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {video.businessName}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[video.status]}`}
                        >
                          {statusLabels[video.status]}
                        </span>
                        {canExpand ? (
                          <button
                            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                            onClick={() =>
                              setExpandedRows((rows) =>
                                isExpanded
                                  ? rows.filter((row) => row !== video.id)
                                  : [...rows, video.id],
                              )
                            }
                            type="button"
                          >
                            {isExpanded ? "Hide history" : "History"}
                          </button>
                        ) : null}
                        {currentDisputeBadge ? (
                          <span
                            className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${currentDisputeBadge.style}`}
                          >
                            {currentDisputeBadge.label}
                          </span>
                        ) : null}
                      </div>
                    </Td>
                    <Td>{numberFormatter.format(video.viewCount)}</Td>
                    <Td>
                      <div>{moneyFormatter.format(video.earnings)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {video.payoutStatus === "paid" ? "Paid" : "Unpaid"}
                      </div>
                    </Td>
                    <Td>{formatDate(video.submittedAt)}</Td>
                  </tr>
                  {canExpand && isExpanded ? (
                    <tr>
                      <td
                        className="bg-indigo-50 px-4 py-4 text-sm text-slate-800"
                        colSpan={5}
                      >
                        {video.status === "rejected" ? (
                          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-red-800">
                            <strong className="font-semibold">
                              Rejection reason:
                            </strong>{" "}
                            {video.rejectionReason || "No reason provided."}
                            <div className="mt-3">
                              {currentDisputeBadge ? (
                                <span
                                  className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${currentDisputeBadge.style}`}
                                >
                                  {currentDisputeBadge.label}
                                </span>
                              ) : canDispute(video) ? (
                                <button
                                  className="rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-800"
                                  onClick={() => {
                                    setDisputeDraft(video);
                                    setDisputeError("");
                                    setDisputeSuccess("");
                                  }}
                                  type="button"
                                >
                                  Dispute rejection
                                </button>
                              ) : (
                                <span className="text-xs font-semibold text-red-700">
                                  Dispute window closed
                                </span>
                              )}
                            </div>
                          </div>
                        ) : null}
                        <VideoHistoryTimeline history={video.history} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {disputeSuccess ? (
        <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {disputeSuccess}
        </div>
      ) : null}
      {disputeDraft ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
          role="dialog"
        >
          <form
            action={async (formData) => {
              setIsSubmittingDispute(true);
              setDisputeError("");
              const result = await submitDispute(formData);
              setIsSubmittingDispute(false);

              if (result.error) {
                setDisputeError(result.error);
                return;
              }

              setDisputeDraft(null);
              setDisputeSuccess(result.success ?? "");
              router.refresh();
            }}
            className="w-full max-w-lg rounded-lg border border-indigo-200 bg-white p-5 shadow-lg"
          >
            <input name="videoId" type="hidden" value={disputeDraft.id} />
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  Dispute rejection
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {disputeDraft.campaignTitle}
                </p>
              </div>
              <button
                className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
                onClick={() => setDisputeDraft(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">
              <div className="font-semibold">Rejection reason</div>
              <p className="mt-1">{disputeDraft.rejectionReason}</p>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-800">
                Explain why you disagree with this rejection
              </span>
              <textarea
                className="mt-2 min-h-32 w-full rounded-md border border-indigo-200 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                minLength={50}
                name="reason"
                required
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-800">
                Link to evidence (optional)
              </span>
              <input
                className="mt-2 w-full rounded-md border border-indigo-200 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                name="evidenceUrl"
                placeholder="https://..."
                type="url"
              />
            </label>

            {disputeError ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm font-semibold text-red-700">
                {disputeError}
              </p>
            ) : null}

            <button
              className="mt-5 w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              disabled={isSubmittingDispute}
              type="submit"
            >
              {isSubmittingDispute ? "Submitting..." : "Submit dispute"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function VideoHistoryTimeline({ history }: { history: VideoHistoryEntry[] }) {
  if (!history.length) {
    return (
      <p className="text-sm text-slate-600">
        No history entries have been recorded yet.
      </p>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">Video timeline</h3>
      <ol className="mt-3 space-y-4 border-l border-indigo-200 pl-4">
        {history.map((entry) => (
          <li className="relative" key={entry.id}>
            <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-500" />
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${historyStatusStyle(entry.status)}`}
              >
                {historyStatusLabel(entry.status)}
              </span>
              <time className="text-xs text-slate-500">
                {formatDateTime(entry.createdAt)}
              </time>
            </div>
            <p className="mt-1 text-sm text-slate-700">
              {entry.note || "No note provided."}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-slate-700">{children}</td>;
}

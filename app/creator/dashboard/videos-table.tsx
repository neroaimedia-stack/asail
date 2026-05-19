"use client";

import { Fragment, useState } from "react";

export type CreatorVideoRow = {
  businessName: string;
  campaignTitle: string;
  earnings: number;
  id: string;
  payoutStatus: "paid" | "unpaid";
  rejectionReason: string | null;
  status: "pending" | "accepted" | "rejected";
  submittedAt: string;
  viewCount: number;
};

const statusStyles = {
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-slate-200 bg-slate-100 text-slate-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

const statusLabels = {
  accepted: "Accepted",
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function VideosTable({ videos }: { videos: CreatorVideoRow[] }) {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

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
              const canExpand = video.status === "rejected";

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
                            {isExpanded ? "Hide reason" : "Reason"}
                          </button>
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
                        className="bg-red-50 px-4 py-3 text-sm text-red-800"
                        colSpan={5}
                      >
                        <strong className="font-semibold">
                          Rejection reason:
                        </strong>{" "}
                        {video.rejectionReason || "No reason provided."}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-slate-700">{children}</td>;
}

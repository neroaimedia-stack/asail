"use client";

import { useState } from "react";
import { sendInvitation } from "@/app/invitations/actions";

export type CampaignInviteCreatorOption = {
  disabledReason: string | null;
  fullName: string;
  handle: string;
  id: string;
};

type InviteAnotherCreatorProps = {
  campaignId: string;
  creators: CampaignInviteCreatorOption[];
};

function handleWithAt(handle: string) {
  return handle.startsWith("@") ? handle : `@${handle}`;
}

export function InviteAnotherCreator({
  campaignId,
  creators,
}: InviteAnotherCreatorProps) {
  const firstAvailableCreator = creators.find(
    (creator) => !creator.disabledReason,
  );
  const [creatorId, setCreatorId] = useState(firstAvailableCreator?.id ?? "");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  const selectedCreator = creators.find((creator) => creator.id === creatorId);
  const canSubmit =
    Boolean(creatorId) && !selectedCreator?.disabledReason && !isSubmitting;

  return (
    <>
      <button
        className="rounded-md bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Invite another creator
      </button>

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-950 shadow-lg">
          {toast}
        </div>
      ) : null}

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/40 px-4"
          role="dialog"
        >
          <form
            action={async (formData) => {
              setIsSubmitting(true);
              setError("");
              const result = await sendInvitation(formData);
              setIsSubmitting(false);

              if (result.error) {
                setError(result.error);
                return;
              }

              setIsOpen(false);
              setToast(result.success ?? "Invitation sent");
              window.setTimeout(() => setToast(""), 2800);
            }}
            className="w-full max-w-md rounded-lg border border-amber-200 bg-white p-5 shadow-lg"
          >
            <input name="campaignId" type="hidden" value={campaignId} />
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-amber-950">
                  Invite creator
                </h2>
                <p className="mt-1 text-sm text-amber-900/70">
                  Choose a creator for this campaign.
                </p>
              </div>
              <button
                className="rounded-md px-2 py-1 text-amber-900/60 hover:bg-amber-50"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-amber-950">
                Creator
              </span>
              <select
                className="h-11 w-full rounded-md border border-amber-200 bg-white px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                disabled={!creators.length}
                name="creatorId"
                onChange={(event) => setCreatorId(event.target.value)}
                value={creatorId}
              >
                {creators.length ? (
                  creators.map((creator) => (
                    <option
                      disabled={Boolean(creator.disabledReason)}
                      key={creator.id}
                      value={creator.id}
                    >
                      {creator.fullName} {handleWithAt(creator.handle)}
                      {creator.disabledReason ? ` - ${creator.disabledReason}` : ""}
                    </option>
                  ))
                ) : (
                  <option>No creators available</option>
                )}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-amber-950">
                Personal message
              </span>
              <textarea
                className="min-h-24 w-full rounded-md border border-amber-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-amber-900/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                maxLength={200}
                name="message"
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell them why you think they'd be great for this campaign..."
                value={message}
              />
              <span className="mt-1 block text-xs text-amber-900/60">
                {message.length}/200
              </span>
            </label>

            {error ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            ) : null}

            <button
              className="mt-5 w-full rounded-md bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
              disabled={!canSubmit}
              type="submit"
            >
              {isSubmitting ? "Sending..." : "Send invitation"}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}

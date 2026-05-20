"use client";

import { useEffect, useState } from "react";
import {
  getInviteCampaignOptions,
  sendInvitation,
  type InviteCampaignOption,
} from "@/app/invitations/actions";

export type InviteCreator = {
  creatorId: string;
  fullName: string;
  handle: string;
};

type InviteCreatorModalProps = {
  creator: InviteCreator | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

function handleWithAt(handle: string) {
  return handle.startsWith("@") ? handle : `@${handle}`;
}

export function InviteCreatorModal({
  creator,
  onClose,
  onSuccess,
}: InviteCreatorModalProps) {
  const [campaignId, setCampaignId] = useState("");
  const [error, setError] = useState("");
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState<InviteCampaignOption[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      if (!creator) {
        return;
      }

      setError("");
      setIsLoadingOptions(true);
      setMessage("");

      try {
        const nextOptions = await getInviteCampaignOptions(creator.creatorId);

        if (!isMounted) {
          return;
        }

        setOptions(nextOptions);
        setCampaignId(
          nextOptions.find((option) => !option.disabledReason)?.id ?? "",
        );
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load campaigns.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingOptions(false);
        }
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [creator]);

  if (!creator) {
    return null;
  }

  const selectedOption = options.find((option) => option.id === campaignId);
  const canSubmit =
    Boolean(campaignId) && !selectedOption?.disabledReason && !isSubmitting;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4"
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

          onClose();
          onSuccess(result.success ?? `Invitation sent to ${creator.handle}`);
        }}
        className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-5 shadow-lg"
      >
        <input name="creatorId" type="hidden" value={creator.creatorId} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Invite creator</h2>
            <p className="mt-1 text-sm text-stone-600">
              {creator.fullName} {handleWithAt(creator.handle)}
            </p>
          </div>
          <button
            className="rounded-md px-2 py-1 text-stone-500 hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">
            Active campaign
          </span>
          <select
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            disabled={isLoadingOptions || !options.length}
            name="campaignId"
            onChange={(event) => setCampaignId(event.target.value)}
            value={campaignId}
          >
            {isLoadingOptions ? (
              <option>Loading campaigns...</option>
            ) : options.length ? (
              options.map((option) => (
                <option
                  disabled={Boolean(option.disabledReason)}
                  key={option.id}
                  value={option.id}
                >
                  {option.title}
                  {option.disabledReason ? ` - ${option.disabledReason}` : ""}
                </option>
              ))
            ) : (
              <option>No active campaigns</option>
            )}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">
            Personal message
          </span>
          <textarea
            className="min-h-24 w-full rounded-md border border-stone-300 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            maxLength={200}
            name="message"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Tell them why you think they'd be great for this campaign..."
            value={message}
          />
          <span className="mt-1 block text-xs text-stone-500">
            {message.length}/200
          </span>
        </label>

        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-3">
          <button
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={!canSubmit}
            type="submit"
          >
            {isSubmitting ? "Sending..." : "Send invitation"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

export function TermsConsent({ submitLabel }: { submitLabel: string }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="space-y-4">
      <label className="flex gap-3 rounded-md border border-ink/15 bg-mist/60 px-3 py-3 text-sm leading-6 text-ink/75">
        <input
          checked={accepted}
          className="mt-1 h-4 w-4 shrink-0 accent-sea"
          name="termsAccepted"
          onChange={(event) => setAccepted(event.target.checked)}
          required
          type="checkbox"
          value="yes"
        />
        <span>
          I agree to the{" "}
          <Link className="font-semibold text-sea" href="/terms">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link className="font-semibold text-sea" href="/privacy">
            Privacy Policy
          </Link>
        </span>
      </label>

      <button
        className="w-full rounded-md bg-sea px-4 py-3 text-sm font-semibold text-white transition hover:bg-sea/90 disabled:cursor-not-allowed disabled:bg-ink/25"
        disabled={!accepted}
        type="submit"
      >
        {submitLabel}
      </button>
    </div>
  );
}

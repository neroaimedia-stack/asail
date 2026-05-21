"use client";

import Link from "next/link";
import { useState } from "react";

export function TermsConsent({ submitLabel }: { submitLabel: string }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="space-y-4">
      <label className="card-inset flex gap-3 text-sm leading-6">
        <input
          checked={accepted}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--asail-blue)]"
          name="termsAccepted"
          onChange={(event) => setAccepted(event.target.checked)}
          required
          type="checkbox"
          value="yes"
        />
        <span>
          I agree to the{" "}
          <Link className="font-semibold text-[var(--asail-blue-bright)]" href="/terms" target="_blank">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link className="font-semibold text-[var(--asail-blue-bright)]" href="/privacy" target="_blank">
            Privacy Policy
          </Link>
        </span>
      </label>

      <button
        className="btn-primary w-full"
        disabled={!accepted}
        type="submit"
      >
        {submitLabel}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { submitSupportTicket } from "./actions";

const categories = [
  ["account", "Account"],
  ["campaign", "Campaign"],
  ["payment", "Payment"],
  ["verification", "Verification"],
  ["dispute", "Dispute"],
  ["bug", "Bug"],
  ["other", "Other"],
];

export function ContactForm() {
  const [message, setMessage] = useState("");

  return (
    <form action={submitSupportTicket} className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-stone-700">Subject</span>
        <input className={inputClass} name="subject" required />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-stone-700">Category</span>
        <select className={inputClass} name="category" required>
          {categories.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-stone-700">Message</span>
        <textarea
          className="mt-2 min-h-40 w-full rounded-md border border-stone-300 px-3 py-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          maxLength={2000}
          minLength={20}
          name="message"
          onChange={(event) => setMessage(event.target.value)}
          required
          value={message}
        />
        <span className="mt-1 block text-xs text-stone-500">{message.length}/2000</span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-stone-700">Attach URL</span>
        <input className={inputClass} name="attachUrl" type="url" />
      </label>
      <button className="rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800" type="submit">
        Send message
      </button>
    </form>
  );
}

const inputClass = "mt-2 h-11 w-full rounded-md border border-stone-300 px-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200";

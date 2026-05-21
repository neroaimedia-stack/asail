"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type FaqItem = {
  answer: string;
  group: "Businesses" | "Creators" | "General";
  question: string;
};

export function HelpClient({
  faqs,
  loggedIn,
}: {
  faqs: FaqItem[];
  loggedIn: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return faqs;
    return faqs.filter((faq) =>
      `${faq.group} ${faq.question} ${faq.answer}`.toLowerCase().includes(needle),
    );
  }, [faqs, query]);
  const groups = ["Businesses", "Creators", "General"] as const;

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-950 md:px-8">
      <section className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <Link className="text-lg font-semibold" href="/">Asail</Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Help center</h1>
          <label className="mt-6 block">
            <span className="sr-only">Search help</span>
            <input
              className="h-14 w-full rounded-lg border border-stone-300 bg-white px-5 text-lg outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="How can we help you?"
              value={query}
            />
          </label>
        </header>

        <div className="space-y-6">
          {groups.map((group) => {
            const items = filtered.filter((faq) => faq.group === group);
            if (!items.length) return null;
            return (
              <section className="rounded-lg border border-stone-200 bg-white p-4" key={group}>
                <h2 className="px-2 pb-3 text-lg font-semibold">{group}</h2>
                <div className="divide-y divide-stone-100">
                  {items.map((faq) => (
                    <details className="group px-2 py-3" key={faq.question}>
                      <summary className="cursor-pointer list-none font-semibold">
                        {faq.question}
                      </summary>
                      <p className="mt-3 text-sm leading-6 text-stone-600">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-8 rounded-lg border border-stone-200 bg-white p-6 text-center">
          <h2 className="text-xl font-semibold">Didn&apos;t find your answer?</h2>
          <p className="mt-2 text-sm text-stone-600">Contact us and we&apos;ll help you out.</p>
          <Link
            className="mt-5 inline-flex rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800"
            href={loggedIn ? "/help/contact" : "/auth/login?redirectedFrom=/help/contact"}
          >
            Submit a support ticket
          </Link>
        </section>
      </section>
    </main>
  );
}

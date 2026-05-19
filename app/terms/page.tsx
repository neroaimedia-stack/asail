import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Asail",
  description: "Asail Terms of Service.",
};

type TermsSection =
  | {
      body: string[];
      items?: never;
      title: string;
    }
  | {
      body?: never;
      items: string[];
      title: string;
    };

const sections: TermsSection[] = [
  {
    title: "1. Introduction",
    body: [
      "Asail is a creator marketplace platform operating in the Philippines that connects businesses with content creators for video campaign promotions.",
    ],
  },
  {
    title: "2. Acceptance of Terms",
    body: [
      "By creating an account, users agree to these Terms of Service. Continued use of the platform constitutes acceptance of these terms and any future updates.",
    ],
  },
  {
    title: "3. User Roles",
    body: [
      "Asail has two types of users: Businesses, including restaurants, hotels, and other establishments, and Creators, who produce videos for campaign promotions. Different rules and obligations apply to each role.",
    ],
  },
  {
    title: "4. Business Obligations",
    items: [
      "Must provide accurate business information.",
      "Must fund campaigns before going live.",
      "Must review submitted videos within 7 days.",
      "Must provide clear rejection reasons.",
      "Cannot withhold payment for videos that meet the brief.",
    ],
  },
  {
    title: "5. Creator Obligations",
    items: [
      "Must own the social media accounts they connect.",
      "Must only submit original content they own.",
      "Must disclose paid partnerships per platform rules.",
      "Must follow campaign briefs and content guidelines.",
      "Cannot submit the same video to multiple campaigns.",
    ],
  },
  {
    title: "6. Payments and Payouts",
    items: [
      "Businesses pre-fund campaigns.",
      "Creators are paid per 1,000 verified views (CPM).",
      "Payouts are processed via GCash through PayMongo.",
      "Asail takes a platform fee from each transaction.",
      "View counts are pulled directly from connected social media platforms via official APIs.",
    ],
  },
  {
    title: "7. Content and Intellectual Property",
    items: [
      "Creators retain ownership of their videos.",
      "By submitting content, creators grant Asail and the business a non-exclusive license to use the video for promotional purposes.",
      "Businesses cannot claim ownership of creator content.",
    ],
  },
  {
    title: "8. Prohibited Conduct",
    items: [
      "No fake accounts or misrepresentation.",
      "No fake views or engagement manipulation.",
      "No harassment between users.",
      "No content that violates Philippine law or platform community guidelines.",
    ],
  },
  {
    title: "9. Dispute Resolution",
    items: [
      "Disputes between businesses and creators are handled through Asail's internal dispute system.",
      "Asail's decision on disputes is final.",
      "These terms are governed by the laws of the Republic of the Philippines.",
    ],
  },
  {
    title: "10. Termination",
    body: [
      "Asail reserves the right to suspend or terminate accounts that violate these terms without prior notice.",
    ],
  },
  {
    title: "11. Limitation of Liability",
    body: [
      "Asail is operated by an individual and is not liable for losses beyond the amount paid through the platform.",
    ],
  },
  {
    title: "12. Changes to Terms",
    body: [
      "Asail may update these terms at any time. Users will be notified via email. Continued use of the platform constitutes acceptance of the updated terms.",
    ],
  },
  {
    title: "13. Contact",
    body: [
      "For questions about these terms, contact us at the Help and Contact page.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-mist px-5 py-10 text-ink sm:py-14">
      <article className="mx-auto max-w-[760px]">
        <header className="border-b border-ink/10 pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
            Asail
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-ink/60">
            Last updated: May 20, 2026
          </p>
        </header>

        <div className="space-y-9 py-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold tracking-tight">
                {section.title}
              </h2>

              {section.body ? (
                <div className="mt-3 space-y-4 text-base leading-8 text-ink/75">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}

              {section.items ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-ink/75">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Asail",
  description: "Asail Privacy Policy.",
};

type PrivacySection =
  | {
      body: string[];
      groups?: never;
      items?: never;
      title: string;
    }
  | {
      body?: string[];
      groups?: never;
      items: string[];
      title: string;
    }
  | {
      body?: never;
      groups: Array<{
        items: string[];
        label: string;
      }>;
      items?: never;
      title: string;
    };

const sections: PrivacySection[] = [
  {
    title: "1. Introduction",
    body: [
      "Asail is committed to protecting the privacy of users in accordance with the Philippine Data Privacy Act of 2012 (Republic Act 10173).",
    ],
  },
  {
    title: "2. Information We Collect",
    groups: [
      {
        label: "From all users",
        items: [
          "Full name, email address, and encrypted password.",
          "Profile photo.",
          "Country and contact number.",
        ],
      },
      {
        label: "From businesses additionally",
        items: [
          "Business name, category, address, and website.",
          "Payment information, processed securely via PayMongo.",
        ],
      },
      {
        label: "From creators additionally",
        items: [
          "Social media handles and connected account data.",
          "Video URLs and performance metrics, including views and engagement.",
          "Bank or GCash account details for payouts.",
        ],
      },
    ],
  },
  {
    title: "3. How We Use Your Information",
    items: [
      "To operate and improve the platform.",
      "To verify account ownership via social media OAuth.",
      "To calculate and process earnings and payouts.",
      "To send notifications about campaign activity.",
      "To comply with legal obligations under Philippine law.",
    ],
  },
  {
    title: "4. Social Media Data",
    body: [
      "When creators connect their YouTube, TikTok, or Instagram accounts via OAuth, we collect account ID, handle, video view counts, and performance data.",
      "We do not post on your behalf or access private messages. You can disconnect your account at any time from Settings.",
    ],
  },
  {
    title: "5. Data Sharing",
    body: ["We do not sell your personal data. We share data only with:"],
    items: [
      "PayMongo for payment processing.",
      "Supabase for secure database hosting.",
      "Google, TikTok, and Meta for OAuth verification only.",
    ],
  },
  {
    title: "6. Data Retention",
    body: [
      "We retain your data for as long as your account is active. You may request deletion of your account and data at any time by contacting us.",
    ],
  },
  {
    title: "7. Cookies",
    body: [
      "We use essential cookies only for session management. No advertising or tracking cookies are used.",
    ],
  },
  {
    title: "8. Your Rights under RA 10173",
    items: [
      "Access your personal data.",
      "Correct inaccurate data.",
      "Request deletion of your data.",
      "Object to processing of your data.",
      "File a complaint with the National Privacy Commission.",
    ],
  },
  {
    title: "9. Data Security",
    body: [
      "All data is encrypted in transit and at rest. Passwords are never stored in plain text. Payment data is handled entirely by PayMongo and never stored on our servers.",
    ],
  },
  {
    title: "10. Children's Privacy",
    body: [
      "Asail is not intended for users under 18 years of age. We do not knowingly collect data from minors.",
    ],
  },
  {
    title: "11. Changes to This Policy",
    body: [
      "We may update this policy at any time. Users will be notified via email. The latest version is always available at asail.vercel.app/privacy.",
    ],
  },
  {
    title: "12. Contact",
    body: [
      "For privacy concerns or data requests, contact us through the Help and Contact page or email us directly.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-mist px-5 py-10 text-ink sm:py-14">
      <article className="mx-auto max-w-[760px]">
        <header className="border-b border-ink/10 pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
            Asail
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Privacy Policy
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

              {section.groups ? (
                <div className="mt-4 space-y-5">
                  {section.groups.map((group) => (
                    <div key={group.label}>
                      <h3 className="text-sm font-semibold text-ink/80">
                        {group.label}
                      </h3>
                      <ul className="mt-2 list-disc space-y-2 pl-5 text-base leading-7 text-ink/75">
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

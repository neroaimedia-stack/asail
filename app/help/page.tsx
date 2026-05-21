import { HelpClient, type FaqItem } from "./help-client";
import { createClient } from "@/lib/supabase/server";

const faqs: FaqItem[] = [
  { group: "Businesses", question: "How do I create a campaign?", answer: "Go to your business dashboard and choose Create new campaign. Add the brief, budget, CPM rate, end date, and content guidelines." },
  { group: "Businesses", question: "How does CPM pricing work?", answer: "CPM means cost per 1,000 verified views. Creator earnings are calculated from verified views divided by 1,000 multiplied by your CPM rate." },
  { group: "Businesses", question: "How do I review submitted videos?", answer: "Open Review Videos from the business sidebar. You can accept videos that meet the brief or reject with a clear reason." },
  { group: "Businesses", question: "When am I charged for views?", answer: "Campaign budgets are pre-funded. Spend is tracked as accepted videos accumulate verified views." },
  { group: "Businesses", question: "Can I pause or end a campaign early?", answer: "Yes. Use the campaign actions on your dashboard or admin-supported campaign controls when needed." },
  { group: "Businesses", question: "What happens if I reject a video?", answer: "The creator sees your rejection reason and may revise their submission or dispute the decision if eligible." },
  { group: "Businesses", question: "How do I invite a specific creator?", answer: "Use the leaderboard or search pages to find a creator, then choose Invite or Message." },
  { group: "Creators", question: "How do I get verified?", answer: "Go to Settings, open Connected platforms, and follow the platform connection or verification instructions." },
  { group: "Creators", question: "How do I find campaigns to apply for?", answer: "Open Browse Campaigns from the creator sidebar or use Search to find active campaigns." },
  { group: "Creators", question: "How do I submit a video?", answer: "Open a campaign, review the full brief and guidelines, then use Submit a video with a valid video URL." },
  { group: "Creators", question: "When will I get paid?", answer: "Payouts are based on accepted videos and verified views. Pending and paid totals appear in your earnings page." },
  { group: "Creators", question: "What happens if my video is rejected?", answer: "You will see the rejection reason on your dashboard. You can revise if eligible or dispute within the allowed window." },
  { group: "Creators", question: "Can I dispute a rejection?", answer: "Yes. Rejected videos less than 7 days old can be disputed from your creator dashboard." },
  { group: "Creators", question: "How are my views counted?", answer: "View counts are synced from official platform APIs where available, then used to calculate earnings." },
  { group: "General", question: "What is Asail?", answer: "Asail is a two-sided creator marketplace connecting businesses with creators for video campaign promotions." },
  { group: "General", question: "Is Asail free to use?", answer: "Creating an account is free. Businesses fund campaigns, and Asail may take a platform fee from transactions." },
  { group: "General", question: "How do I delete my account?", answer: "Go to Settings, open Danger zone, and follow the account deletion confirmation flow." },
  { group: "General", question: "How do I contact support?", answer: "Use the support ticket form on this help page when logged in." },
];

export default async function HelpPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <HelpClient faqs={faqs} loggedIn={Boolean(user)} />;
}

import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export type EmailPreferenceType =
  | "campaign_alerts"
  | "invitations"
  | "messages"
  | "video_updates";

export async function sendEmail({
  html,
  subject,
  to,
}: {
  html: string;
  subject: string;
  to: string;
}) {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    return;
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    html,
    subject,
    to,
  });
}

export async function sendPreferredEmail({
  html,
  preference,
  subject,
  userId,
}: {
  html: string;
  preference: EmailPreferenceType;
  subject: string;
  userId: string;
}) {
  const supabase = createAdminClient();
  const [{ data: preferences }, { data: userResult }] = await Promise.all([
    supabase
      .from("email_preferences")
      .select("video_updates, invitations, campaign_alerts, messages")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.auth.admin.getUserById(userId),
  ]);

  const typedPreferences = preferences as
    | Record<EmailPreferenceType, boolean>
    | null;

  if (typedPreferences && typedPreferences[preference] === false) {
    return;
  }

  const email = userResult.user?.email;

  if (!email) {
    return;
  }

  await sendEmail({ html, subject, to: email });
}

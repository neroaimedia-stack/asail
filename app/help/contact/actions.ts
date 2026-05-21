"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";
import { supportTicketConfirmationEmail } from "@/lib/email-templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const categories = ["account", "campaign", "payment", "verification", "dispute", "bug", "other"];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitSupportTicket(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/help/contact");
  }

  const subject = getString(formData, "subject");
  const category = getString(formData, "category");
  const message = getString(formData, "message");
  const attachUrl = getString(formData, "attachUrl");

  if (!subject || !categories.includes(category) || message.length < 20 || message.length > 2000) {
    redirect("/help/contact?error=Please%20complete%20the%20support%20form.");
  }

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      attach_url: attachUrl || null,
      category,
      message,
      subject,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/help/contact?error=${encodeURIComponent(error.message)}`);
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (user.email) {
    const template = supportTicketConfirmationEmail({
      name: (profile?.full_name as string | null) ?? "there",
      subject,
      ticketId: String(ticket.id).slice(0, 8),
    });
    await sendEmail({ html: template.html, subject: template.subject, to: user.email });
  }

  revalidatePath("/help/contact");
  redirect("/help/contact?sent=1");
}

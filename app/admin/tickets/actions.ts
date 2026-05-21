"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";
import { supportTicketReplyEmail } from "@/lib/email-templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/admin/tickets");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return user;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function replyToTicket(formData: FormData) {
  const adminUser = await requireAdmin();
  const ticketId = getString(formData, "ticketId");
  const reply = getString(formData, "reply");

  if (!ticketId || !reply) {
    redirect("/admin/tickets?error=Reply%20is%20required.");
  }

  const admin = createAdminClient();
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("id, user_id, subject, message")
    .eq("id", ticketId)
    .maybeSingle();

  if (!ticket) {
    redirect("/admin/tickets?error=Ticket%20not%20found.");
  }

  await admin
    .from("support_tickets")
    .update({
      admin_reply: reply,
      replied_at: new Date().toISOString(),
      replied_by: adminUser.id,
      status: "resolved",
    })
    .eq("id", ticketId);

  if (ticket.user_id) {
    const { data: userResult } = await admin.auth.admin.getUserById(ticket.user_id);
    if (userResult.user?.email) {
      const template = supportTicketReplyEmail({
        adminReply: reply,
        message: ticket.message,
        subject: ticket.subject,
      });
      await sendEmail({
        html: template.html,
        subject: template.subject,
        to: userResult.user.email,
      });
    }
  }

  revalidatePath("/admin/tickets");
  redirect("/admin/tickets?message=Reply%20sent.");
}

type TemplateResult = {
  html: string;
  subject: string;
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://asail.vercel.app";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function button(label: string, path: string) {
  return `<a href="${appUrl}${path}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:600;">${escapeHtml(label)}</a>`;
}

function layout(content: string) {
  return `
    <div style="margin:0;padding:0;background:#ffffff;color:#111827;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
        <div style="font-size:22px;font-weight:700;margin-bottom:28px;">Asail</div>
        <div style="font-size:15px;line-height:1.7;">${content}</div>
        <p style="margin-top:32px;color:#6b7280;font-size:12px;line-height:1.6;">
          You are receiving this email because you have an Asail account. You can manage transactional email preferences in Settings.
        </p>
      </div>
    </div>
  `;
}

export function videoAcceptedEmail({
  businessName,
  campaignTitle,
  creatorName,
}: {
  businessName: string;
  campaignTitle: string;
  creatorName: string;
}): TemplateResult {
  return {
    html: layout(`
      <p>Great news, ${escapeHtml(creatorName)}!</p>
      <p>Your video for <strong>${escapeHtml(campaignTitle)}</strong> by ${escapeHtml(businessName)} has been accepted.</p>
      <p>Views will be tracked automatically and your earnings will update as views come in.</p>
      <p style="margin-top:24px;">${button("View your dashboard", "/creator/dashboard")}</p>
    `),
    subject: "Your video was accepted! 🎉",
  };
}

export function videoRejectedEmail({
  campaignTitle,
  creatorName,
  rejectionReason,
}: {
  campaignTitle: string;
  creatorName: string;
  rejectionReason: string;
}): TemplateResult {
  return {
    html: layout(`
      <p>Hi ${escapeHtml(creatorName)},</p>
      <p>Your video for <strong>${escapeHtml(campaignTitle)}</strong> was not accepted.</p>
      <p><strong>Reason:</strong> ${escapeHtml(rejectionReason)}</p>
      <p>You can submit a revised video or dispute this decision from your dashboard.</p>
      <p style="margin-top:24px;">${button("View dashboard", "/creator/dashboard")}</p>
    `),
    subject: "Update on your video submission",
  };
}

export function invitationReceivedEmail({
  businessName,
  campaignTitle,
  cpmRate,
  creatorName,
  personalMessage,
}: {
  businessName: string;
  campaignTitle: string;
  cpmRate: number | string;
  creatorName: string;
  personalMessage?: string | null;
}): TemplateResult {
  return {
    html: layout(`
      <p>Hi ${escapeHtml(creatorName)},</p>
      <p>${escapeHtml(businessName)} has invited you to their campaign: <strong>${escapeHtml(campaignTitle)}</strong>.</p>
      <p><strong>CPM rate:</strong> ₱${escapeHtml(String(cpmRate))} per 1,000 views</p>
      ${personalMessage ? `<p>${escapeHtml(personalMessage)}</p>` : ""}
      <p style="margin-top:24px;">${button("View invitation", "/creator/invitations")}</p>
    `),
    subject: `${businessName} invited you to a campaign`,
  };
}

export function campaignExpiringEmail({
  businessName,
  campaignTitle,
  pendingCount,
}: {
  businessName: string;
  campaignTitle: string;
  pendingCount: number;
}): TemplateResult {
  return {
    html: layout(`
      <p>Hi ${escapeHtml(businessName)},</p>
      <p>Your campaign <strong>${escapeHtml(campaignTitle)}</strong> expires in 3 days.</p>
      <p>You have ${pendingCount} videos pending review.</p>
      <p style="margin-top:24px;">${button("Review videos", "/business/review")}</p>
    `),
    subject: "Your campaign expires in 3 days",
  };
}

export function newMessageEmail({
  messagePreview,
  recipientName,
  senderName,
}: {
  messagePreview: string;
  recipientName: string;
  senderName: string;
}): TemplateResult {
  return {
    html: layout(`
      <p>Hi ${escapeHtml(recipientName)},</p>
      <p>${escapeHtml(senderName)} sent you a message:</p>
      <p style="border-left:3px solid #111827;padding-left:14px;color:#374151;">${escapeHtml(messagePreview)}</p>
      <p style="margin-top:24px;">${button("Reply", "/messages")}</p>
    `),
    subject: `New message from ${senderName}`,
  };
}

export function supportTicketConfirmationEmail({
  name,
  subject,
  ticketId,
}: {
  name: string;
  subject: string;
  ticketId: string;
}): TemplateResult {
  return {
    html: layout(`
      <p>Hi ${escapeHtml(name)},</p>
      <p>We received your message about <strong>${escapeHtml(subject)}</strong>.</p>
      <p>We aim to respond within 1-2 business days.</p>
      <p>Your ticket ID is <strong>#${escapeHtml(ticketId)}</strong>.</p>
    `),
    subject: "We received your support request - Asail",
  };
}

export function supportTicketReplyEmail({
  adminReply,
  message,
  subject,
}: {
  adminReply: string;
  message: string;
  subject: string;
}): TemplateResult {
  return {
    html: layout(`
      <p>We replied to your support request: <strong>${escapeHtml(subject)}</strong>.</p>
      <p style="margin-top:18px;font-weight:700;">Your original message</p>
      <p style="border-left:3px solid #d1d5db;padding-left:14px;color:#374151;">${escapeHtml(message)}</p>
      <p style="margin-top:18px;font-weight:700;">Reply from Asail support</p>
      <p style="border-left:3px solid #111827;padding-left:14px;color:#374151;">${escapeHtml(adminReply)}</p>
    `),
    subject: `Re: ${subject} - Asail Support`,
  };
}

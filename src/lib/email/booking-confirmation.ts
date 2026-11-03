import { SITE } from "@/lib/site";
import { formatDate, formatTime } from "@/lib/time/format";

type BookingConfirmationInput = {
  guestName: string;
  code: string;
  startsAt: string;
  partySize: number;
};

// Guest text must never become HTML. This makes it safe.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildBookingConfirmationEmail(input: BookingConfirmationInput) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const statusUrl = siteUrl ? `${siteUrl}/book/status` : "";

  const when = `${formatDate(input.startsAt)} at ${formatTime(input.startsAt)}`;
  const guests = `${input.partySize} ${input.partySize === 1 ? "guest" : "guests"}`;

  const subject = `We got your booking request (${input.code})`;

  const name = escapeHtml(input.guestName);
  const code = escapeHtml(input.code);
  const whenHtml = escapeHtml(when);
  const restaurant = escapeHtml(SITE.name);
  const phone = escapeHtml(SITE.phone);
  const address = escapeHtml(SITE.address);

  const buttonHtml = statusUrl
    ? `<p style="margin:24px 0;">
        <a href="${escapeHtml(statusUrl)}"
           style="background:#1f2937;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
          Check or cancel your booking
        </a>
      </p>`
    : "";

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;">
      <h1 style="font-size:22px;margin:0 0 12px;">We got your booking request</h1>
      <p style="margin:0 0 16px;">Hello ${name}, thank you for choosing ${restaurant}. We will confirm your table soon.</p>

      <p style="margin:0;font-size:13px;color:#6b7280;">Your booking code</p>
      <p style="margin:0 0 16px;font-size:26px;font-weight:bold;letter-spacing:2px;">${code}</p>

      <p style="margin:0;"><strong>When:</strong> ${whenHtml}</p>
      <p style="margin:0;"><strong>Guests:</strong> ${escapeHtml(guests)}</p>
      <p style="margin:0 0 8px;"><strong>Status:</strong> Waiting for confirmation</p>

      ${buttonHtml}

      <p style="font-size:14px;color:#4b5563;">
        You need your booking code and your phone number to check or cancel.
        You can cancel online until 2 hours before your time. After that, please call us.
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="font-size:13px;color:#6b7280;margin:0;">
        ${restaurant}<br>${address}<br>${phone}
      </p>
    </div>
  </body>
</html>`;

  const text = [
    "We got your booking request",
    "",
    `Hello ${input.guestName}, thank you for choosing ${SITE.name}. We will confirm your table soon.`,
    "",
    `Booking code: ${input.code}`,
    `When: ${when}`,
    `Guests: ${guests}`,
    "Status: Waiting for confirmation",
    "",
    statusUrl
      ? `Check or cancel your booking: ${statusUrl}`
      : "You can check or cancel your booking on our website.",
    "You need your booking code and your phone number.",
    "You can cancel online until 2 hours before your time. After that, please call us.",
    "",
    SITE.name,
    SITE.address,
    SITE.phone,
  ].join("\n");

  return { subject, html, text };
}
import "server-only";
import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = { ok: true } | { ok: false };

// Sends one email. It never throws, so a bad email can never break a booking.
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.error("[email] RESEND_API_KEY or EMAIL_FROM is missing");
    return { ok: false };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      console.error("[email] Resend refused the email:", error.message);
      return { ok: false };
    }

    return { ok: true };
  } catch (error) {
    console.error(
      "[email] sendEmail failed:",
      error instanceof Error ? error.message : error
    );
    return { ok: false };
  }
}
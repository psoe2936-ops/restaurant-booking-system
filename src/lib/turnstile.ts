import "server-only";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type VerifyResult = { ok: true } | { ok: false; reason: "missing_token" | "failed" | "not_configured" };

export async function verifyTurnstile(token: string | null | undefined): Promise<VerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error("verifyTurnstile: TURNSTILE_SECRET_KEY is missing");
    return { ok: false, reason: "not_configured" };
  }

  if (!token) {
    return { ok: false, reason: "missing_token" };
  }

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("verifyTurnstile: Cloudflare answered with status", response.status);
      return { ok: false, reason: "failed" };
    }

    const data = (await response.json()) as { success: boolean; "error-codes"?: string[] };

    if (!data.success) {
      console.error("verifyTurnstile: check failed", data["error-codes"]);
      return { ok: false, reason: "failed" };
    }

    return { ok: true };
  } catch (error) {
    console.error("verifyTurnstile: request error", error);
    return { ok: false, reason: "failed" };
  }
}
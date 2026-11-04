import { afterEach, describe, expect, it, vi } from "vitest";
import { buildBookingConfirmationEmail } from "@/lib/email/booking-confirmation";
import { SITE } from "@/lib/site";

const input = {
  guestName: "Aye Aye",
  code: "RB-K279Y",
  startsAt: "2026-11-02T05:30:00+00:00", // 12:00 in Yangon
  partySize: 4,
};

afterEach(() => {
  // put the environment variables back after each test
  vi.unstubAllEnvs();
});

describe("buildBookingConfirmationEmail", () => {
  it("puts the booking code in the subject", () => {
    const { subject } = buildBookingConfirmationEmail(input);
    expect(subject).toBe("We got your booking request (RB-K279Y)");
  });

  it("shows the guest name, code, Yangon time and restaurant name", () => {
    const { html, text } = buildBookingConfirmationEmail(input);
    for (const part of [html, text]) {
      expect(part).toContain("Aye Aye");
      expect(part).toContain("RB-K279Y");
      expect(part).toContain("12:00");
      expect(part).toContain("2 Nov 2026");
      expect(part).toContain(SITE.name);
    }
  });

  it("says 'guest' for 1 person and 'guests' for more", () => {
    const one = buildBookingConfirmationEmail({ ...input, partySize: 1 });
    expect(one.html).toContain("Guests:</strong> 1 guest</p>");
    expect(one.text.split("\n")).toContain("Guests: 1 guest");

    const many = buildBookingConfirmationEmail({ ...input, partySize: 4 });
    expect(many.html).toContain("Guests:</strong> 4 guests</p>");
    expect(many.text.split("\n")).toContain("Guests: 4 guests");
  });

  it("makes guest text safe in the HTML", () => {
    const { html } = buildBookingConfirmationEmail({
      ...input,
      guestName: `<script>alert("hi")</script>`,
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt;");
  });

  it("makes quotes and & safe in the HTML", () => {
    const { html } = buildBookingConfirmationEmail({
      ...input,
      guestName: `Tom & "Jerry" O'Neil`,
    });
    expect(html).toContain("Tom &amp; &quot;Jerry&quot; O&#39;Neil");
  });

  it("keeps the guest name as normal text in the plain text version", () => {
    // plain text is not HTML, so no escaping is needed there
    const { text } = buildBookingConfirmationEmail({ ...input, guestName: "Tom & Jerry" });
    expect(text).toContain("Hello Tom & Jerry,");
  });

  it("adds the status link when NEXT_PUBLIC_SITE_URL is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const { html, text } = buildBookingConfirmationEmail(input);
    expect(html).toContain('href="https://example.com/book/status"');
    expect(text).toContain("https://example.com/book/status");
  });

  it("removes a / at the end of NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/");
    const { html } = buildBookingConfirmationEmail(input);
    expect(html).toContain('href="https://example.com/book/status"');
    expect(html).not.toContain("//book/status");
  });

  it("has no link and no button when NEXT_PUBLIC_SITE_URL is empty", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const { html, text } = buildBookingConfirmationEmail(input);
    expect(html).not.toContain("<a ");
    expect(text).not.toContain("/book/status");
    expect(text).toContain("You can check or cancel your booking on our website.");
  });
});
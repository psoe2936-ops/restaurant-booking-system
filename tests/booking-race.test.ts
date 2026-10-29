import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Missing Supabase environment variables for tests");
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

// 5 days from now at 12:00 Myanmar time
function startsAt(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 5);
  const day = d.toISOString().slice(0, 10);
  return `${day}T12:00:00+06:30`;
}

async function cleanUp() {
  await admin.from("bookings").delete().like("phone", "09TEST%");
}

describe("create_booking with many guests at the same moment", () => {
  beforeAll(cleanUp);
  afterAll(cleanUp);

  it("gives the only 8-seat table to exactly one guest", async () => {
    const when = startsAt();

    const results = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        admin.rpc("create_booking", {
          p_guest_name: `Race ${i}`,
          p_phone: `09TEST${i}`,
          p_email: null,
          p_party_size: 8,
          p_starts_at: when,
          p_notes: null,
        })
      )
    );

    const winners = results.filter((r) => !r.error);
    const refused = results.filter((r) => r.error);

    expect(winners).toHaveLength(1);
    expect(refused).toHaveLength(5);
    for (const r of refused) {
      expect(r.error?.message).toContain("no_table_available");
    }
  });
});
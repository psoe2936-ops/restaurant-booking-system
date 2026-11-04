import { defineConfig } from "vitest/config";

// Database race test only. It needs SUPABASE_SERVICE_ROLE_KEY.
export default defineConfig({
  test: {
    include: ["tests/booking-race.test.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
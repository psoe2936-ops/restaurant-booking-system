import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Normal tests: no database, no secret keys.
export default defineConfig({
  resolve: {
    alias: {
      // lets tests use "@/lib/..." like the app code does
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
  },
});
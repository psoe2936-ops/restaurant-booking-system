import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile",
      // a phone size, because guests book on phones
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    // The build is done before by scripts/e2e.mjs. Here we only start.
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 120_000,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      // Cloudflare test keys: they always pass. Only for automatic tests.
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
    },
  },
});
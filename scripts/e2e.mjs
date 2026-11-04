import { spawnSync } from "node:child_process";

// Cloudflare test keys: they always pass. Only for automatic tests.
// NEXT_PUBLIC_ values are put into the page at build time,
// so the build must also get them.
const env = {
  ...process.env,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
};

function run(command) {
  const result = spawnSync(command, { stdio: "inherit", shell: true, env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npm run build");
run(["npx playwright test", ...process.argv.slice(2)].join(" "));
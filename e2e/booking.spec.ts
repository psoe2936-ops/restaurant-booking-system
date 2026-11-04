import { expect, test } from "@playwright/test";

// The date in Yangon, some days from now, like "2026-11-06"
function yangonDate(daysFromNow: number): string {
  const day = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(day);
}

// A new phone number on every run, so the "max 3 active bookings per phone" rule never blocks us
function randomPhone(): string {
  const digits = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, "0");
  return `09${digits}`;
}

test("a guest can book a table", async ({ page }) => {
  await page.goto("/book");
  // wait until the page is ready, so the clicks and typing are not lost
  await expect(page.getByText("Step 1 of 4")).toBeVisible();
  await page.waitForLoadState("networkidle");

  // Step 1: find a day that has free times
  await page.getByLabel("Number of guests").selectOption("2");

  const timeButtons = page.getByRole("button", { name: /^\d{2}:\d{2}$/ });
  let foundTimes = false;

  for (let day = 1; day <= 7 && !foundTimes; day++) {
    await page.getByLabel("Date").fill(yangonDate(day));
    await page.getByRole("button", { name: "See free times" }).click();
    await expect(page.getByRole("heading", { name: "Choose a time" })).toBeVisible();

    if ((await timeButtons.count()) > 0) {
      foundTimes = true;
    } else {
      await page.getByRole("button", { name: "Back" }).click();
    }
  }
  expect(foundTimes, "no free times in the next 7 days").toBe(true);

  // Step 2: choose the first time
  await timeButtons.first().click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 3: guest details (no email, so no email is sent)
  await expect(page.getByRole("heading", { name: "Your details" })).toBeVisible();
  await page.getByLabel("Name", { exact: true }).fill("E2E Test Guest");
  await page.getByLabel("Phone", { exact: true }).fill(randomPhone());
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 4: check, pass Turnstile (test keys pass by themselves), and book
  await expect(page.getByRole("heading", { name: "Check and confirm" })).toBeVisible();
  const bookButton = page.getByRole("button", { name: "Book my table" });
  await expect(bookButton).toBeEnabled({ timeout: 20_000 });
  await bookButton.click();

  // The confirmation screen
  await expect(page.getByRole("heading", { name: "We got your request!" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText(/^RB-[A-Z0-9]{3,}$/)).toBeVisible();
   // The page has 2 links with this name. The confirmation screen link is the last one.
  const statusLink = page.getByRole("link", { name: "Check or cancel your booking" }).last();
  await expect(statusLink).toBeVisible();
  await expect(statusLink).toHaveAttribute("href", "/book/status");
});
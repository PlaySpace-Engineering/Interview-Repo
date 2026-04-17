import { test, expect } from "@playwright/test";

// Jamie is the seeded client (3 historical PHQ-9 rows) — we add two more and
// then confirm the chart shows the enlarged series plus an SI-flag callout.
const JAMIE_ID = "22222222-2222-2222-2222-222222222221";

test("administer PHQ-9 twice and see trend + SI flag", async ({ page }) => {
  await page.goto(`/clients/${JAMIE_ID}`);

  // First administration — HIGH score with item 9 > 0 (SI flag positive).
  await page.getByRole("link", { name: "Administer PHQ-9" }).click();
  await expect(page.getByRole("heading", { name: "PHQ-9" })).toBeVisible();
  for (let i = 0; i < 9; i++) {
    await page.locator('[role="radiogroup"]').nth(i).locator('button[role="radio"][value="3"]').click();
  }
  await page.getByRole("button", { name: "Score & save" }).click();

  // History page — SI flag callout must be visible and chart must render.
  await expect(page.getByRole("heading", { name: "PHQ-9 history" })).toBeVisible();
  await expect(page.getByTestId("si-flag-callout")).toBeVisible();
  await expect(page.getByTestId("phq9-chart")).toBeVisible();

  // Latest row in the admin table shows score 27 + Severe.
  const latestRow = page.locator("table tbody tr").first();
  await expect(latestRow).toContainText("27");
  await expect(latestRow).toContainText("Severe");

  // Second administration — all zeros (no SI, None band).
  await page.getByRole("link", { name: "Administer again" }).click();
  for (let i = 0; i < 9; i++) {
    await page.locator('[role="radiogroup"]').nth(i).locator('button[role="radio"][value="0"]').click();
  }
  await page.getByRole("button", { name: "Score & save" }).click();

  // Chart still visible + latest admin row has score 0 / None.
  await expect(page.getByTestId("phq9-chart")).toBeVisible();
  const latestAfter = page.locator("table tbody tr").first();
  await expect(latestAfter).toContainText("None");

  // Callout should not be visible for this most-recent non-SI administration.
  await expect(page.getByTestId("si-flag-callout")).toHaveCount(0);
});

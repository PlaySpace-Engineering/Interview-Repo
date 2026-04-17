import { test, expect } from "@playwright/test";

/**
 * Happy path: add client → intake → schedule → attend → SOAP note → sign → verify read-only.
 */
test("new client → intake → signed SOAP note", async ({ page }) => {
  const uniqueName = `Test Client ${Date.now()}`;

  // Dashboard → new client
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "+ New client" }).first().click();
  await expect(page.getByRole("heading", { name: "New client" })).toBeVisible();

  // Demographics
  await page.getByLabel("Legal name *").fill(uniqueName);
  await page.getByLabel("Preferred name").fill("Testy");
  await page.getByLabel("Pronouns").fill("they/them");
  await page.getByLabel("Name *", { exact: true }).fill("Kin Tester");
  await page.getByLabel("Phone *", { exact: true }).fill("555-1111");
  await page.getByRole("button", { name: /Save & continue to intake/ }).click();

  // Intake
  await expect(page.getByRole("heading", { name: "Intake" })).toBeVisible();
  await page.getByLabel("Presenting problem *").fill("E2E test: low mood and sleep disruption.");
  await page.getByLabel("Symptom duration").fill("3 weeks");
  await page.getByLabel(/Informed consent/).check();
  await page.getByLabel(/HIPAA/).check();
  await page.getByRole("button", { name: "Save intake" }).click();

  // Client chart
  await expect(page.getByRole("heading", { name: "Testy" })).toBeVisible();
  await page.getByRole("link", { name: "Schedule" }).click();

  // Appointment scheduling — client preselected via ?clientId=
  await expect(page.getByRole("heading", { name: "New appointment" })).toBeVisible();
  await page.getByRole("button", { name: "Schedule" }).click();

  // Appointment detail — mark attended → create note
  await expect(page.getByRole("heading", { name: "Testy" })).toBeVisible();
  await page.getByRole("button", { name: "Mark attended" }).click();
  await expect(page.getByText("attended").first()).toBeVisible();
  await page.getByRole("link", { name: "Create progress note" }).click();

  // New progress note (SOAP default)
  await expect(page.getByRole("heading", { name: "New progress note" })).toBeVisible();
  await page.getByLabel("Subjective").fill("Reports mild improvement in mood.");
  await page.getByLabel("Objective").fill("Alert, engaged, affect congruent.");
  await page.getByLabel("Assessment").fill("MDD, mild — continued response to weekly CBT.");
  await page.getByLabel("Plan").fill("Continue weekly CBT, PHQ-9 next session.");

  // Sign via AlertDialog
  await page.getByRole("button", { name: "Sign & lock note" }).click();
  await page.getByRole("button", { name: "Yes, sign & lock" }).click();

  // Note detail — signed state
  await expect(page.getByRole("heading", { name: "Progress note" })).toBeVisible();
  await expect(page.getByText(/signed · locked/)).toBeVisible();

  // Sign button should not exist on the page once locked.
  await expect(page.getByRole("button", { name: /^Sign & lock$/ })).toHaveCount(0);

  // Addendum form should be available when locked.
  await expect(page.getByPlaceholder("Add an addendum…")).toBeVisible();
});

import { test, expect } from "@playwright/test";

test("new game advances a day and exposes the 30/60/90-day finance outlook", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /BEGIN YOUR JOURNEY/i })).toBeVisible();
  await page.getByRole("button", { name: /BEGIN YOUR JOURNEY/i }).click();
  await expect(page.getByRole("button", { name: /Advance day/i })).toBeVisible();
  await page.getByRole("button", { name: /Advance day/i }).click();
  await expect(page.getByText(/Day 2/).first()).toBeVisible();
  await page.getByRole("button", { name: "Finances", exact: true }).click({ force: true });
  await expect(page.getByText(/30-day outlook/)).toBeVisible();
  await expect(page.getByText(/60-day outlook/)).toBeVisible();
  await expect(page.getByText(/90-day outlook/)).toBeVisible();
});

test("manual save slots can save and reload the current simulation day", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /BEGIN YOUR JOURNEY/i }).click();
  await page.getByRole("button", { name: /Advance day/i }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).first().click({ force: true });
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await expect(page.getByText(/Slot 1 · Day 2/)).toBeVisible();
  await page.getByRole("button", { name: "Load", exact: true }).first().click();
  await expect(page.getByText(/Day 2/).first()).toBeVisible();
});

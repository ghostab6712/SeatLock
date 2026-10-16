import { test, expect } from "@playwright/test";

test("homepage loads successfully", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/localhost:3001/);
  await expect(
    page.getByRole("heading", { name: /Your seat\.\s*Your choice\.\s*Locked in\./i })
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: /Explore SeatLock/i })
  ).toBeVisible();
});

import { test, expect } from "@playwright/test";

test("logged-in user can open My Bookings", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email address").fill("testuser1@example.com");
  await page.getByLabel("Password").fill("SeatLockTest123!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("http://localhost:3001/");

  await page.getByRole("link", { name: "My Bookings" }).click();

  await expect(page).toHaveURL(/\/bookings$/);
  await expect(
    page.getByRole("heading", { name: /my bookings/i })
  ).toBeVisible();
});

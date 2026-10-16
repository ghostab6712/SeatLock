import { test, expect } from "@playwright/test";

test("user can navigate to the login page", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/login$/);

  await expect(
    page.getByRole("heading", { name: "Sign in to SeatLock" })
  ).toBeVisible();

  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in" })
  ).toBeVisible();
});

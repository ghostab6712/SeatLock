import { test, expect } from "@playwright/test";

test("user can log out successfully", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email address").fill("testuser1@example.com");
  await page.getByLabel("Password").fill("SeatLockTest123!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("http://localhost:3001/");

  await page.getByRole("button", { name: "Logout" }).click();

  await expect(page).toHaveURL(/\/login$/);

  const session = await page.evaluate(() => ({
    token: sessionStorage.getItem("seatlock_token"),
    user: sessionStorage.getItem("seatlock_user"),
  }));

  expect(session.token).toBeNull();
  expect(session.user).toBeNull();
});

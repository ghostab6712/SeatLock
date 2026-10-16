import { test, expect } from "@playwright/test";

test("user can log in successfully", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email address").fill("testuser1@example.com");
  await page.getByLabel("Password").fill("SeatLockTest123!");

  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("http://localhost:3001/");

  await expect(
    page.getByText("testuser1@example.com")
  ).toBeVisible();

  const token = await page.evaluate(() =>
    sessionStorage.getItem("seatlock_token")
  );

  expect(token).toBeTruthy();
});

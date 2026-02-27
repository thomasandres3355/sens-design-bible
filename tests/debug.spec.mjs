import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

test("screenshot login screen", async ({ page }) => {
  // Collect console errors
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto(BASE);
  await page.evaluate(() => localStorage.removeItem("sens-auth-session"));
  await page.reload();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "tests/screenshots/01-login.png", fullPage: true });

  // Check what's on the page
  const bodyText = await page.locator("body").innerText();
  console.log("=== LOGIN SCREEN TEXT ===");
  console.log(bodyText.slice(0, 500));
  console.log("=== CONSOLE ERRORS ===");
  errors.forEach(e => console.log("  ERROR:", e));
});

test("screenshot after SSO click", async ({ page }) => {
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto(BASE);
  await page.evaluate(() => localStorage.removeItem("sens-auth-session"));
  await page.reload();
  await page.waitForTimeout(1000);

  // Click Microsoft SSO
  await page.getByRole("button", { name: /Microsoft/ }).click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "tests/screenshots/02-sso-picker.png", fullPage: true });

  const bodyText = await page.locator("body").innerText();
  console.log("=== SSO PICKER TEXT ===");
  console.log(bodyText.slice(0, 500));

  // Click first user (Thomas)
  const firstUserBtn = page.locator("button").filter({ hasText: "thomas@systemicenvs.com" });
  console.log("Found user buttons:", await firstUserBtn.count());
  await firstUserBtn.first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "tests/screenshots/03-after-login.png", fullPage: true });

  const afterText = await page.locator("body").innerText();
  console.log("=== AFTER LOGIN TEXT ===");
  console.log(afterText.slice(0, 800));
  console.log("=== CONSOLE ERRORS ===");
  errors.forEach(e => console.log("  ERROR:", e));
});

test("screenshot email flow", async ({ page }) => {
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto(BASE);
  await page.evaluate(() => localStorage.removeItem("sens-auth-session"));
  await page.reload();
  await page.waitForTimeout(1000);

  // Click email button specifically
  await page.getByRole("button", { name: /Sign in with Email/ }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "tests/screenshots/04-email-form.png", fullPage: true });

  const bodyText = await page.locator("body").innerText();
  console.log("=== EMAIL FORM TEXT ===");
  console.log(bodyText.slice(0, 500));
  console.log("=== CONSOLE ERRORS ===");
  errors.forEach(e => console.log("  ERROR:", e));
});

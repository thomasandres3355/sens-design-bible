import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

// Helper: clear localStorage session before each test
test.beforeEach(async ({ page }) => {
  await page.goto(BASE);
  await page.evaluate(() => localStorage.removeItem("sens-auth-session"));
  await page.reload();
  await page.waitForTimeout(500);
});

// ═══════════════════════════════════════════════
//  Test 1: Login screen renders on first visit
// ═══════════════════════════════════════════════
test("shows login screen when not authenticated", async ({ page }) => {
  await expect(page.locator("text=Executive Intelligence Platform")).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("button", { name: /Sign in with Microsoft/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Sign in with Google/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Sign in with Email/ })).toBeVisible();
  await expect(page.locator("text=Demo Mode")).toBeVisible();
});

// ═══════════════════════════════════════════════
//  Test 2: Microsoft SSO flow
// ═══════════════════════════════════════════════
test("Microsoft SSO login flow", async ({ page }) => {
  await page.getByRole("button", { name: /Sign in with Microsoft/ }).click();
  await expect(page.locator("text=Redirecting to Microsoft")).toBeVisible({ timeout: 3000 });
  await expect(page.locator("text=Pick an account")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=via Microsoft")).toBeVisible();

  // All demo users shown
  await expect(page.locator("text=thomas@systemicenvs.com")).toBeVisible();
  await expect(page.locator("text=sarah@systemicenvs.com")).toBeVisible();

  // Select Thomas (CEO)
  await page.locator("button").filter({ hasText: "thomas@systemicenvs.com" }).click();

  // Should land on dashboard
  await expect(page.locator("nav").locator("text=Dashboard")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Sign Out")).toBeVisible();
  await expect(page.locator("text=Microsoft")).toBeVisible();
});

// ═══════════════════════════════════════════════
//  Test 3: Google SSO flow
// ═══════════════════════════════════════════════
test("Google SSO login flow", async ({ page }) => {
  await page.getByRole("button", { name: /Sign in with Google/ }).click();
  await expect(page.locator("text=Redirecting to Google")).toBeVisible({ timeout: 3000 });
  await expect(page.locator("text=Pick an account")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=via Google")).toBeVisible();

  // Select Sarah (COO)
  await page.locator("button").filter({ hasText: "sarah@systemicenvs.com" }).click();

  await expect(page.locator("nav").locator("text=Dashboard")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Sign Out")).toBeVisible();
  await expect(page.locator("text=Google")).toBeVisible();
});

// ═══════════════════════════════════════════════
//  Test 4: Email + Password → 2FA flow
// ═══════════════════════════════════════════════
test("Email + Password with 2FA verification", async ({ page }) => {
  await page.getByRole("button", { name: /Sign in with Email/ }).click();
  await expect(page.locator("text=Enter your SENS email and password")).toBeVisible({ timeout: 3000 });

  await page.fill('input[type="email"]', "thomas@systemicenvs.com");
  await page.fill('input[type="password"]', "anypassword123");
  await page.click('button[type="submit"]');

  // 2FA screen
  await expect(page.locator("text=Two-Factor Authentication")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=thomas@systemicenvs.com").last()).toBeVisible();

  // Enter 6-digit code
  const codeInputs = page.locator('input[inputmode="numeric"]');
  await expect(codeInputs).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    await codeInputs.nth(i).fill(String(i + 1));
  }

  // Should auto-submit and land on dashboard
  await expect(page.locator("nav").locator("text=Dashboard")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Sign Out")).toBeVisible();
  await expect(page.locator("text=Email")).toBeVisible();
});

// ═══════════════════════════════════════════════
//  Test 5: Wrong email shows error
// ═══════════════════════════════════════════════
test("Email login with unregistered email shows error", async ({ page }) => {
  await page.getByRole("button", { name: /Sign in with Email/ }).click();
  await expect(page.locator("text=Enter your SENS email and password")).toBeVisible({ timeout: 3000 });

  await page.fill('input[type="email"]', "nobody@fake.com");
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');

  await expect(page.locator("text=No account found with that email address")).toBeVisible({ timeout: 5000 });
});

// ═══════════════════════════════════════════════
//  Test 6: Session persistence across refresh
// ═══════════════════════════════════════════════
test("session persists after browser refresh", async ({ page }) => {
  // Log in via Microsoft SSO
  await page.getByRole("button", { name: /Sign in with Microsoft/ }).click();
  await expect(page.locator("text=Pick an account")).toBeVisible({ timeout: 5000 });
  await page.locator("button").filter({ hasText: "thomas@systemicenvs.com" }).click();
  await expect(page.locator("nav").locator("text=Dashboard")).toBeVisible({ timeout: 5000 });

  // Refresh the page
  await page.reload();

  // Should still be on dashboard
  await expect(page.locator("nav").locator("text=Dashboard")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Sign Out")).toBeVisible();

  // Should NOT show login screen
  await expect(page.locator("text=Executive Intelligence Platform")).toBeHidden();
});

// ═══════════════════════════════════════════════
//  Test 7: Sign out returns to login
// ═══════════════════════════════════════════════
test("sign out returns to login screen and clears session", async ({ page }) => {
  // Log in
  await page.getByRole("button", { name: /Sign in with Microsoft/ }).click();
  await expect(page.locator("text=Pick an account")).toBeVisible({ timeout: 5000 });
  await page.locator("button").filter({ hasText: "thomas@systemicenvs.com" }).click();
  await expect(page.locator("text=Sign Out")).toBeVisible({ timeout: 5000 });

  // Sign out
  await page.click("text=Sign Out");

  // Should return to login screen
  await expect(page.locator("text=Executive Intelligence Platform")).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("button", { name: /Sign in with Microsoft/ })).toBeVisible();

  // Refresh — should still be on login (session cleared)
  await page.reload();
  await expect(page.getByRole("button", { name: /Sign in with Microsoft/ })).toBeVisible({ timeout: 5000 });
});

// ═══════════════════════════════════════════════
//  Test 8: CEO sees all sidebar modules
// ═══════════════════════════════════════════════
test("CEO sees full sidebar with all modules", async ({ page }) => {
  await page.getByRole("button", { name: /Sign in with Microsoft/ }).click();
  await expect(page.locator("text=Pick an account")).toBeVisible({ timeout: 5000 });
  await page.locator("button").filter({ hasText: "thomas@systemicenvs.com" }).click();
  await expect(page.locator("nav").locator("text=Dashboard")).toBeVisible({ timeout: 5000 });

  const nav = page.locator("nav");
  await expect(nav.locator("text=Dashboard")).toBeVisible();
  await expect(nav.locator("text=Executive Focus")).toBeVisible();
  await expect(nav.locator("text=Site Map")).toBeVisible();
  await expect(nav.locator("text=Development")).toBeVisible();
  await expect(nav.locator("text=Finance & Strategy")).toBeVisible();
  await expect(nav.locator("text=Platform & Admin")).toBeVisible();
  await expect(nav.locator("text=Workforce")).toBeVisible();
  await expect(nav.locator("text=Risk & Compliance")).toBeVisible();
  await expect(nav.locator("text=Org Chart")).toBeVisible();
  await expect(nav.locator("text=Settings")).toBeVisible();
});

// ═══════════════════════════════════════════════
//  Test 9: Operator sees restricted sidebar
// ═══════════════════════════════════════════════
test("Operator sees restricted sidebar", async ({ page }) => {
  await page.getByRole("button", { name: /Sign in with Microsoft/ }).click();
  await expect(page.locator("text=Pick an account")).toBeVisible({ timeout: 5000 });
  await page.locator("button").filter({ hasText: "demo.op@systemicenvs.com" }).click();
  await expect(page.locator("nav").locator("text=Dashboard")).toBeVisible({ timeout: 5000 });

  const nav = page.locator("nav");
  // Operator should see basic modules
  await expect(nav.locator("text=Dashboard")).toBeVisible();
  await expect(nav.locator("text=Site Map")).toBeVisible();
  await expect(nav.locator("text=Plant Operations")).toBeVisible();

  // Operator should NOT see restricted modules
  await expect(nav.locator("text=Finance & Strategy")).toBeHidden();
  await expect(nav.locator("text=Platform & Admin")).toBeHidden();
  await expect(nav.locator("text=Executive Focus")).toBeHidden();
});

// ═══════════════════════════════════════════════
//  Test 10: Back button works in login flows
// ═══════════════════════════════════════════════
test("back button returns to login method selection", async ({ page }) => {
  // Email form → back
  await page.getByRole("button", { name: /Sign in with Email/ }).click();
  await expect(page.locator("text=Enter your SENS email and password")).toBeVisible({ timeout: 3000 });
  await page.click("text=Back to sign in options");
  await expect(page.getByRole("button", { name: /Sign in with Microsoft/ })).toBeVisible({ timeout: 3000 });

  // SSO account picker → back
  await page.getByRole("button", { name: /Sign in with Google/ }).click();
  await expect(page.locator("text=Pick an account")).toBeVisible({ timeout: 5000 });
  await page.click("text=Back to sign in options");
  await expect(page.getByRole("button", { name: /Sign in with Microsoft/ })).toBeVisible({ timeout: 3000 });
});

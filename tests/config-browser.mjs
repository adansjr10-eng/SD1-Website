// Run against a build using deliberately invalid public configuration.
import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  const errors = [],
    backendRequests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/\/auth\/v1\/|\/rest\/v1\/|\/storage\/v1\//.test(r.url()))
      backendRequests.push(r.url());
  });
  await page.goto(
    (process.env.CONFIG_BASE_URL || "http://127.0.0.1:3000") + "/admin",
  );
  await page
    .getByRole("heading", { name: "Content workspace", exact: true })
    .waitFor();
  await page
    .getByText("BACKEND CONFIGURATION REQUIRED", { exact: true })
    .waitFor();
  assert.ok(await page.locator(".alert.error[role=alert]").isVisible());
  assert.equal(await page.getByLabel("Password", { exact: true }).count(), 0);
  assert.equal(await page.locator(".tester-card").count(), 0);
  await page
    .getByRole("button", { name: "Check connection", exact: true })
    .click();
  await page.getByText("Action required", { exact: true }).waitFor();
  assert.equal(
    backendRequests.length,
    0,
    "Invalid configuration must not send credentials to the wrong host.",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: invalid URL is clearly reported, no demo records or login controls are shown, and no backend credentials are sent to the wrong host.",
  );
} finally {
  await browser.close();
}

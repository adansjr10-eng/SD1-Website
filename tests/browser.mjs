// Run against an unconfigured demo server: npm run start
import { chromium } from "playwright";
import assert from "node:assert/strict";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.BASE_URL || "http://127.0.0.1:3000");
  await page
    .getByRole("heading", {
      name: "Design and Development of a Passenger Rail Bearing Tester",
    })
    .waitFor();
  await page.screenshot({ path: "/tmp/rail-desktop.png", fullPage: true });
  await page.getByRole("link", { name: "Open database", exact: true }).click();
  await page
    .getByRole("heading", { name: "Passenger bearing testers", exact: true })
    .waitFor();
  await page
    .getByRole("textbox", { name: "Search testers", exact: true })
    .fill("axlebox");
  assert.equal(await page.locator(".tester-card").count(), 1);
  await page
    .getByRole("textbox", { name: "Search testers", exact: true })
    .fill("");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page
    .getByText("Minimum load (kN)", { exact: true })
    .locator("input")
    .fill("1");
  assert.equal(await page.locator(".tester-card").count(), 0);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByRole("checkbox", { name: "Compare", exact: true })
    .nth(0)
    .check();
  await page
    .getByRole("checkbox", { name: "Compare", exact: true })
    .nth(1)
    .check();
  await page
    .getByRole("button", { name: "Compare testers", exact: true })
    .click();
  await page.getByRole("dialog", { name: "Tester comparison" }).waitFor();
  assert.ok(
    (await page
      .getByRole("cell", { name: "Not documented", exact: true })
      .count()) > 0,
  );
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  assert.equal(
    (await dl).suggestedFilename(),
    "rail-lab-tester-comparison.csv",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.goto(
    (process.env.BASE_URL || "http://127.0.0.1:3000") + "/comparison",
  );
  await page.locator(".comparison-picker input").nth(0).check();
  await page.locator(".comparison-picker input").nth(1).check();
  await page
    .getByRole("heading", {
      name: "Scope, evidence & specifications",
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("cell", { name: "Component testing", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.goto(
    (process.env.BASE_URL || "http://127.0.0.1:3000") + "/testers",
  );

  await page
    .getByRole("link", { name: "Single-bearing test rig", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Single-bearing test rig", exact: true })
    .waitFor();
  await page
    .getByRole("heading", { name: "Technical specifications" })
    .waitFor();
  for (const [url, heading] of [
    ["/bearings", "Passenger Bearing Research"],
    ["/suspension", "Primary Suspension Research"],
    ["/project", "Project Overview"],
    ["/engineering", "Engineering Design"],
    ["/progress", "Project Progress"],
    ["/team", "Our Team"],
    ["/calculations", "Engineering Calculations"],
    ["/resources", "Documents & image gallery"],
    ["/admin", "Content workspace"],
  ]) {
    await page.goto((process.env.BASE_URL || "http://127.0.0.1:3000") + url);
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
  }
  assert.ok(
    await page
      .getByText("Connect your team’s research backend", { exact: true })
      .isVisible(),
  );
  await page.goto(
    (process.env.BASE_URL || "http://127.0.0.1:3000") + "/calculations",
  );
  await page.getByLabel("Vehicle speed (mph)", { exact: true }).fill("60");
  await page
    .getByLabel("Effective wheel diameter (in)", { exact: true })
    .fill("36");
  await page.getByText(/560.23 RPM/).waitFor();
  await page.goto(
    (process.env.BASE_URL || "http://127.0.0.1:3000") + "/resources",
  );
  await page.getByRole("button", { name: "Upload resources" }).click();
  await page.getByRole("status").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(process.env.BASE_URL || "http://127.0.0.1:3000");
  await page
    .getByRole("heading", {
      name: "Design and Development of a Passenger Rail Bearing Tester",
    })
    .waitFor();
  await page.screenshot({ path: "/tmp/rail-mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Existing Railway Testers" })
    .click();
  await page
    .getByRole("heading", { name: "Passenger bearing testers", exact: true })
    .waitFor();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: dashboard, search, advanced filters, comparison, CSV download, detail page, nine project sections and calculation inputs, backend empty state, mobile navigation, and no browser errors.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

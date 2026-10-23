// Synthetic UI acceptance steps; imported by the existing mocked admin harness.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const host = "http://localhost:3001";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=",
  "base64",
);
const dialogGone = (page) =>
  page.getByRole("dialog").waitFor({ state: "detached" });
async function saveDraft(page) {
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await dialogGone(page);
}
async function publish(page) {
  await page.getByLabel("Publication status").selectOption("published");
  await page.getByLabel("Visibility").selectOption("public");
  await page
    .getByRole("button", { name: "Save & publish", exact: true })
    .click();
  await dialogGone(page);
}
export async function runPresentationChecks(page, getEntries, getResources) {
  const progressCount = getEntries().filter(
    (e) => e.section === "progress",
  ).length;
  await page.getByText("Open import preparation", { exact: true }).click();
  await page
    .getByLabel("Owner brief or reviewed bundle", { exact: true })
    .fill(readFileSync("tests/fixtures/presentation-brief.md", "utf8"));
  await page
    .getByRole("button", { name: "Preview draft plan", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Import 11 team-only drafts", exact: true })
    .click();
  await page
    .getByText(
      "11 team-only drafts inserted; 0 existing import keys skipped. Nothing was published.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByRole("button", { name: "Import 11 team-only drafts", exact: true })
    .click();
  await page
    .getByText(
      "0 team-only drafts inserted; 11 existing import keys skipped. Nothing was published.",
      { exact: true },
    )
    .waitFor();
  assert.equal(
    getEntries().filter((e) => e.section === "progress").length,
    progressCount,
  );
  const profiles = getEntries().filter((e) => e.details?.profile);
  assert.equal(profiles.length, 9);
  assert.ok(
    profiles.every((e) => e.status === "draft" && e.visibility === "team"),
  );
  await page.goto(host);
  await page
    .getByRole("heading", { name: "Synthetic Portfolio Project", exact: true })
    .waitFor();
  await page
    .getByText(
      "A synthetic team is documenting a proposed test platform. This is not an operational system.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByRole("link", { name: "Explore Our Project", exact: true })
    .click();
  await page
    .getByText("A synthetic introduction for the full project presentation.", {
      exact: true,
    })
    .waitFor();
  assert.equal(await page.locator(".portfolio-why-grid article").count(), 3);
  assert.equal(
    await page.locator(".portfolio-objective-grid article").count(),
    6,
  );
  assert.equal(await page.locator(".portfolio-profile").count(), 6);
  assert.equal(await page.locator(".portfolio-advisors article").count(), 3);
  assert.equal(await page.locator(".portfolio-profile img").count(), 0);
  assert.equal(
    await page.locator(".portfolio-progress .portfolio-update").count(),
    1,
  );
  await page
    .getByRole("button", { name: "Edit page content", exact: true })
    .click();
  await page
    .getByLabel("Summary")
    .fill("Editor-reviewed synthetic overview introduction.");
  await page
    .getByLabel("Context card description 1", { exact: true })
    .fill("Edited laboratory context for a synthetic fixture.");
  await page
    .getByRole("group", { name: "Featured project updates", exact: true })
    .getByLabel("Synthetic initial review")
    .check();
  await saveDraft(page);
  await page.reload();
  await page
    .getByText("Editor-reviewed synthetic overview introduction.", {
      exact: true,
    })
    .waitFor();
  await page
    .getByText("Edited laboratory context for a synthetic fixture.", {
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("button", { name: "Edit profile Avery Fixture", exact: true })
    .click();
  await page
    .getByLabel("Team role or advisor role", { exact: true })
    .fill("Synthetic fixture responsibility");
  await page
    .getByLabel("Short biography", { exact: true })
    .fill("An editable synthetic biography.");
  await page
    .getByLabel("LinkedIn URL (optional)", { exact: true })
    .fill("https://www.linkedin.com/in/synthetic-fixture");
  await saveDraft(page);
  for (const [width, height, label] of [
    [1440, 1080, "desktop"],
    [820, 1180, "tablet"],
    [390, 844, "mobile"],
  ]) {
    await page.setViewportSize({ width, height });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overview overflow at ${width}px`,
    );
    await page.screenshot({
      path: `/tmp/pbt-overview-${label}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  await page.screenshot({
    path: "/tmp/pbt-overview-mobile-top.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto(host + "/team");
  await page
    .getByText("An editable synthetic biography.", { exact: true })
    .waitFor();
  const member = getEntries().find((e) => e.title === "Avery Fixture");
  await page
    .getByRole("button", {
      name: "Upload photo for Avery Fixture",
      exact: true,
    })
    .click();
  assert.equal(
    await page.getByLabel("Related research entry").inputValue(),
    member.id,
  );
  await page
    .getByLabel("Choose files", { exact: true })
    .setInputFiles([
      { name: "team-fixture.png", mimeType: "image/png", buffer: png },
    ]);
  await page
    .getByLabel("Caption / description")
    .fill("Synthetic member photograph");
  await page.getByLabel("Reuse rights").selectOption("team-owned");
  await page
    .getByRole("button", { name: "Upload to storage", exact: true })
    .click();
  await dialogGone(page);
  const photo = getResources().find((r) => r.name === "team-fixture.png");
  assert.equal(photo.entry_id, member.id);
  await page
    .getByRole("button", { name: "Edit profile Avery Fixture", exact: true })
    .click();
  await page
    .getByLabel("Team member photo", { exact: true })
    .selectOption(photo.id);
  await saveDraft(page);
  await page.reload();
  await page.locator('img[alt="Avery Fixture"]').waitFor();
  await page
    .getByRole("button", { name: "Enlarge Avery Fixture", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "team-fixture.png", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit profile Avery Fixture", exact: true })
    .click();
  await publish(page);
  assert.equal(getResources().find((r) => r.id === photo.id).status, "draft");
  await page.goto(host + "/project");
  await page
    .getByRole("button", { name: "Edit page content", exact: true })
    .click();
  await publish(page);
  const overview = getEntries().find(
    (e) => e.details?.presentation?.kind === "overview",
  );
  await page
    .getByRole("button", { name: "Upload reference for review", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Related research entry").inputValue(),
    overview.id,
  );
  await page
    .getByLabel("Choose files", { exact: true })
    .setInputFiles([
      { name: "bogie-fixture.png", mimeType: "image/png", buffer: png },
    ]);
  await page
    .getByLabel("Caption / description")
    .fill("Unreviewed synthetic reference");
  await page
    .getByRole("button", { name: "Upload to storage", exact: true })
    .click();
  await dialogGone(page);
  const reference = getResources().find((r) => r.name === "bogie-fixture.png");
  await page
    .getByRole("button", { name: "Edit page content", exact: true })
    .click();
  assert.equal(
    await page
      .getByLabel("Passenger bogie reference image", { exact: true })
      .locator(`option[value="${reference.id}"]`)
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.goto(host + "/resources");
  await page
    .getByRole("button", { name: "Edit bogie-fixture.png", exact: true })
    .click();
  await page
    .getByLabel("Caption / description")
    .fill("Approved synthetic reference caption");
  await page
    .getByLabel("Figure / document citation")
    .fill("Synthetic drawing fixture; permission granted.");
  await page.getByLabel("Reuse rights").selectOption("permission-granted");
  await page.getByLabel("Publication status").selectOption("published");
  await page.getByLabel("Visibility").selectOption("public");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await dialogGone(page);
  await page.goto(host + "/project");
  await page
    .getByRole("button", { name: "Edit page content", exact: true })
    .click();
  await page
    .getByLabel("Passenger bogie reference image", { exact: true })
    .selectOption(reference.id);
  await page
    .getByLabel("Main project image", { exact: true })
    .selectOption(reference.id);
  await page
    .getByRole("group", { name: "Featured gallery images", exact: true })
    .getByLabel("Approved synthetic reference caption")
    .check();
  await page
    .getByRole("button", { name: "Save & publish", exact: true })
    .click();
  await dialogGone(page);
  await page.reload();
  await page.locator(".portfolio-gallery img").waitFor();
  await page
    .locator(".portfolio-gallery")
    .getByRole("button", {
      name: "Enlarge Approved synthetic reference caption",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog", { name: "bogie-fixture.png", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.goto(host + "/admin");
}
export async function assertPublicPresentation(page) {
  await page.goto(host + "/project");
  await page
    .getByRole("heading", { name: "Synthetic Portfolio Project", exact: true })
    .waitFor();
  await page
    .getByText("Editor-reviewed synthetic overview introduction.", {
      exact: true,
    })
    .waitFor();
  assert.equal(await page.locator(".portfolio-profile").count(), 1);
  assert.equal(
    await page.locator(".portfolio-profile img").count(),
    0,
    "A draft photo must not become public with its profile",
  );
  assert.equal(
    await page
      .getByRole("heading", { name: "Jordan Fixture", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Edit page content", exact: true })
      .count(),
    0,
  );
  await page.locator(".portfolio-gallery img").waitFor();
  assert.equal(
    await page.locator(".portfolio-progress .portfolio-update").count(),
    1,
  );
  await page.goto(host);
  await page
    .getByRole("heading", {
      name: "Design and Development of a Passenger Rail Bearing Tester",
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page
      .getByText(
        "A synthetic team is documenting a proposed test platform. This is not an operational system.",
        { exact: true },
      )
      .count(),
    0,
    "Draft Home copy must remain private",
  );
  await page.goto(host + "/admin");
}

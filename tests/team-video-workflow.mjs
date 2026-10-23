// Contract-mocked editorial acceptance; no real YouTube playback or Supabase writes.
import assert from "node:assert/strict";
const host = "http://localhost:3001";
const videoId = "AbCdEfGhI_1";
const replacementId = "QwErTyUiO_2";
const gone = (page) => page.getByRole("dialog").waitFor({ state: "detached" });
async function save(page, published = false, visibility = "public") {
  await page
    .getByLabel("Publication status")
    .selectOption(published ? "published" : "draft");
  await page
    .getByRole("dialog")
    .getByLabel("Visibility")
    .selectOption(visibility);
  await page
    .getByRole("button", {
      name: published ? "Save & publish" : "Save draft",
      exact: true,
    })
    .click();
  await gone(page);
}
async function open(page) {
  await page.goto(host + "/admin");
  await page
    .getByRole("button", { name: "Manage introduction video", exact: true })
    .click();
}
export async function runTeamVideoChecks(page, getEntries, getResources) {
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body>Mock YouTube player</body></html>",
    }),
  );
  await page.goto(host + "/project");
  const section = page.locator("#project-introduction-video");
  await section
    .getByRole("heading", {
      name: "Team Introduction Video — Coming Soon",
      exact: true,
    })
    .waitFor();
  assert.equal(await section.locator("iframe").count(), 0);
  assert.ok(
    await page.evaluate(() => {
      const video = document.querySelector("#project-introduction-video");
      return (
        Boolean(
          document
            .querySelector(".portfolio-progress")
            .compareDocumentPosition(video) & Node.DOCUMENT_POSITION_FOLLOWING,
        ) &&
        Boolean(
          video.compareDocumentPosition(
            document.querySelector("#meet-sixth-gear"),
          ) & Node.DOCUMENT_POSITION_FOLLOWING,
        )
      );
    }),
  );
  for (const [label, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 820, 1100],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await section.scrollIntoViewIfNeeded();
    const box = await section.locator(".team-video-frame").boundingBox();
    assert.ok(Math.abs(box.width / box.height - 16 / 9) < 0.02);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await section.screenshot({
      path: `/tmp/pbt-video-placeholder-${label}.png`,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page);
  await page.getByLabel("Title", { exact: true }).fill("Synthetic team video");
  await page
    .getByLabel("Summary", { exact: true })
    .fill("Private introduction draft.");
  await page
    .getByLabel("YouTube video URL", { exact: true })
    .fill("https://evil.test/embed/video");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByText(/Use a valid HTTPS YouTube/).waitFor();
  assert.equal(getEntries().filter((e) => e.details?.team_video).length, 0);
  await page
    .getByLabel("YouTube video URL", { exact: true })
    .fill(`https://youtu.be/${videoId}?t=10`);
  await page
    .getByRole("button", { name: "Preview video section", exact: true })
    .click();
  const preview = page.getByRole("dialog").locator("iframe");
  await preview.waitFor();
  assert.equal(
    await preview.getAttribute("src"),
    `https://www.youtube-nocookie.com/embed/${videoId}?controls=1&rel=0`,
  );
  assert.equal(await preview.getAttribute("loading"), "lazy");
  assert.equal(
    await preview.getAttribute("title"),
    "Synthetic team video — Project Introduction Video",
  );
  await save(page, false, "team");
  await page.goto(host + "/project");
  await section.locator("iframe").waitFor();
  // Draft settings stay draft after an actual browser reload.
  await page.reload();
  await section
    .getByText("Private introduction draft.", { exact: true })
    .waitFor();
  const first = getEntries().find((e) => e.details?.team_video);
  assert.equal(first.status, "draft");
  assert.equal(first.visibility, "team");
  await page
    .getByRole("button", { name: "Edit video section", exact: true })
    .click();
  await page
    .getByLabel("Summary", { exact: true })
    .fill("Published introduction.");
  await page
    .getByLabel("YouTube video URL", { exact: true })
    .fill(`https://www.youtube.com/watch?v=${videoId}&autoplay=1`);
  // A draft profile photo is eligible only for editorial preview, not public display.
  const draftPhoto = getResources().find((r) => r.name === "team-fixture.png");
  await page
    .getByLabel("Video thumbnail (optional)", { exact: true })
    .selectOption(draftPhoto.id);
  await save(page, true);
  assert.equal(
    getResources().find((r) => r.id === draftPhoto.id).status,
    "draft",
  );
  // Preview an approved public thumbnail and click through to the privacy-enhanced player.
  // Cancel must leave the saved records untouched.
  const beforePreview = structuredClone(getEntries());
  await page
    .getByRole("button", { name: "Edit video section", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Publication status").inputValue(),
    "draft",
  );
  const approved = getResources().find((r) => r.name === "bogie-fixture.png");
  await page
    .getByLabel("Video thumbnail (optional)", { exact: true })
    .selectOption(approved.id);
  await page
    .getByRole("button", { name: "Preview video section", exact: true })
    .click();
  await page.getByRole("dialog").locator(".team-video-poster img").waitFor();
  await page
    .getByRole("dialog")
    .getByRole("button", {
      name: "Play Synthetic team video — Project Introduction Video",
      exact: true,
    })
    .click();
  await page.getByRole("dialog").locator("iframe").waitFor();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await gone(page);
  assert.deepEqual(getEntries(), beforePreview);
  // A published team-only revision does not expose its text or URL anonymously.
  await page
    .getByRole("button", { name: "Edit video section", exact: true })
    .click();
  await page.getByLabel("Title", { exact: true }).fill("Team-only video title");
  await page
    .getByLabel("Summary", { exact: true })
    .fill("Team-only video description.");
  await page
    .getByLabel("YouTube video URL", { exact: true })
    .fill(`https://youtu.be/${replacementId}`);
  await page
    .getByLabel("Video thumbnail (optional)", { exact: true })
    .selectOption("");
  await save(page, true, "team");
  const published = getEntries().filter(
    (e) => e.details?.team_video && e.status === "published",
  );
  assert.equal(
    published.length,
    2,
    "Published history is preserved when a new version is published",
  );
  // Save new private text and a Shorts replacement without touching either published version.
  const snapshot = structuredClone(published);
  await page
    .getByRole("button", { name: "Edit video section", exact: true })
    .click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Unpublished replacement title");
  await page
    .getByLabel("Summary", { exact: true })
    .fill("Unpublished replacement description.");
  await page
    .getByLabel("YouTube video URL", { exact: true })
    .fill(`https://www.youtube.com/shorts/${replacementId}`);
  await save(page, false);
  assert.deepEqual(
    getEntries().filter(
      (e) => e.details?.team_video && e.status === "published",
    ),
    snapshot,
  );
  await page.reload();
  await section.locator("iframe").waitFor();
  assert.match(
    await section.locator("iframe").getAttribute("src"),
    new RegExp(replacementId),
  );
  // Removing the URL saves a clean placeholder, not a broken frame.
  await page
    .getByRole("button", { name: "Edit video section", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove video URL", exact: true })
    .click();
  await save(page, false);
  await section
    .getByRole("heading", {
      name: "Team Introduction Video — Coming Soon",
      exact: true,
    })
    .waitFor();
  assert.equal(await section.locator("iframe").count(), 0);
  // Disable is also a draft change; the public selector continues using the published version.
  await page
    .getByRole("button", { name: "Edit video section", exact: true })
    .click();
  await page.getByLabel("Enable video section", { exact: true }).uncheck();
  await page
    .getByRole("button", { name: "Preview video section", exact: true })
    .click();
  await page
    .getByText(
      "The video section will be hidden when these settings are published.",
      { exact: true },
    )
    .waitFor();
  await save(page, false);
  assert.equal(await section.count(), 0);
  await page.getByText("Video section disabled", { exact: true }).waitFor();
  await page.goto(host + "/admin");
}

export async function assertPublicTeamVideo(page) {
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body>Mock YouTube player</body></html>",
    }),
  );
  await page.goto(host + "/project");
  const section = page.locator("#project-introduction-video");
  await section
    .getByRole("heading", { name: "Synthetic team video", exact: true })
    .waitFor();
  const iframe = section.locator("iframe");
  await iframe.waitFor();
  assert.equal(
    await iframe.getAttribute("src"),
    `https://www.youtube-nocookie.com/embed/${videoId}?controls=1&rel=0`,
  );
  assert.equal(
    await section.getByText("Published introduction.", { exact: true }).count(),
    1,
  );
  assert.equal(
    await page
      .getByText("Unpublished replacement title", { exact: true })
      .count(),
    0,
  );
  assert.equal(
    await page
      .getByText("Unpublished replacement description.", { exact: true })
      .count(),
    0,
  );
  assert.equal(
    await page.getByText("Team-only video title", { exact: true }).count(),
    0,
  );
  assert.equal(
    await page
      .getByText("Team-only video description.", { exact: true })
      .count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Edit video section", exact: true })
      .count(),
    0,
  );
  assert.equal(await section.locator("img").count(), 0);
  for (const [label, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await section.scrollIntoViewIfNeeded();
    const box = await section.locator(".team-video-frame").boundingBox();
    assert.ok(Math.abs(box.width / box.height - 16 / 9) < 0.02);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await section.screenshot({
      path: `/tmp/pbt-video-player-${label}.png`,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(host);
  await page
    .getByRole("link", { name: "Project introduction video", exact: true })
    .click();
  await page.waitForURL(host + "/project#project-introduction-video");
  await page.goto(host + "/admin");
  assert.equal(
    await page
      .getByRole("button", { name: "Manage introduction video", exact: true })
      .count(),
    0,
  );
}

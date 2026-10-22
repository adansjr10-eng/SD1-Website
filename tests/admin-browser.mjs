// Contract-mocked Supabase UI test; NOT a live storage/authentication test.
// Start a separate dev server with the documented test-only public variables.
import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  if (process.env.DEBUG_TEST) {
    page.on("request", (r) => console.log(r.method(), r.url()));
    page.on("console", (m) => console.log(m.type(), m.text()));
  }
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const storedFiles = new Map();
  const importLedger = new Set();
  let memberRole = "editor";
  let entries = [],
    resources = [];
  const user = {
    id: "11111111-1111-4111-8111-111111111111",
    aud: "authenticated",
    role: "authenticated",
    email: "team@example.test",
  };
  const token = [
    { alg: "HS256", typ: "JWT" },
    {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 3600,
      aud: "authenticated",
    },
    "test",
  ]
    .map((v, i) =>
      i < 2 ? Buffer.from(JSON.stringify(v)).toString("base64url") : v,
    )
    .join(".");
  await page.route("http://127.0.0.1:54321/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      method = req.method();
    let body = 200,
      data = {};
    if (method === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "*",
        },
      });
      return;
    }
    if (url.pathname.includes("/auth/v1/token"))
      data = {
        access_token: token,
        refresh_token: "test-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        user,
      };
    else if (url.pathname.includes("/auth/v1/user")) data = user;
    else if (url.pathname.includes("/members")) data = { role: memberRole };
    else if (url.pathname.includes("/rpc/research_backend_status"))
      data = {
        tables_ready: true,
        policies_present: true,
        bucket_exists: true,
        bucket_private: true,
        upload_limit_ok: true,
        images_allowed: true,
        pdf_allowed: true,
      };
    else if (url.pathname.includes("/rpc/import_project_drafts")) {
      let inserted = 0,
        skipped = 0;
      for (const item of req.postDataJSON().items) {
        if (importLedger.has(item.import_key)) {
          skipped++;
          continue;
        }
        importLedger.add(item.import_key);
        entries.push({
          ...item,
          id: crypto.randomUUID(),
          updated_at: new Date().toISOString(),
          status: "draft",
          visibility: "team",
        });
        inserted++;
      }
      data = { inserted, skipped };
    } else if (url.pathname.includes("/rest/v1/entries")) {
      if (method === "GET") {
        const id = url.searchParams.get("id")?.slice(3);
        let visible =
          req.headers().authorization === `Bearer ${token}`
            ? entries
            : entries.filter(
                (e) => e.visibility === "public" && e.status === "published",
              );
        if (id) visible = visible.filter((e) => e.id === id);
        data = req.headers().accept?.includes("vnd.pgrst.object")
          ? visible[0]
          : visible;
      } else if (method === "POST") {
        const e = { ...req.postDataJSON(), id: crypto.randomUUID() };
        entries.push(e);
        data = { id: e.id };
      } else if (method === "PATCH") {
        const id = url.searchParams.get("id")?.slice(3);
        entries = entries.map((e) =>
          e.id === id ? { ...e, ...req.postDataJSON() } : e,
        );
        data = { id };
      } else if (method === "DELETE") {
        const id = url.searchParams.get("id")?.slice(3);
        entries = entries.filter((e) => e.id !== id);
        data = { id };
      }
    } else if (url.pathname.includes("/rest/v1/resources")) {
      if (method === "GET") {
        const id = url.searchParams.get("id")?.slice(3);
        let visible =
          req.headers().authorization === `Bearer ${token}`
            ? resources
            : resources.filter(
                (r) => r.visibility === "public" && r.status === "published",
              );
        if (id) visible = visible.filter((r) => r.id === id);
        data = req.headers().accept?.includes("vnd.pgrst.object")
          ? visible[0]
          : visible;
      } else if (method === "POST") {
        const resource = {
          ...req.postDataJSON(),
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        };
        resources.push(resource);
        data = url.searchParams.has("select") ? { id: resource.id } : [];
      } else if (method === "DELETE") {
        const id = url.searchParams.get("id")?.slice(3);
        resources = resources.filter((r) => r.id !== id);
        data = { id };
      }
    } else if (
      url.pathname.includes("/storage/v1/object/sign/") &&
      method === "POST"
    )
      data = {
        signedURL: "/object/sign/research-files/fixture.png?token=test",
      };
    else if (
      url.pathname.includes("/storage/v1/object/sign/") &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        headers: { "access-control-allow-origin": "*" },
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=",
          "base64",
        ),
      });
      return;
    } else if (url.pathname.includes("/storage/v1/object/")) {
      const path = decodeURIComponent(
        url.pathname.replace(
          /^\/storage\/v1\/object\/(?:authenticated\/)?research-files\/?/,
          "",
        ),
      );
      if (method === "POST") {
        storedFiles.set(path, {
          body: req.postDataBuffer(),
          mime: req.headers()["content-type"],
        });
        data = { Key: `research-files/${path}` };
      } else if (method === "GET") {
        const file = storedFiles.get(path);
        if (req.headers().authorization === `Bearer ${token}` && file) {
          await route.fulfill({
            status: 200,
            contentType: file.mime,
            body: file.body,
            headers: { "access-control-allow-origin": "*" },
          });
          return;
        }
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            statusCode: "404",
            error: "not_found",
            message: "Object not found",
          }),
          headers: { "access-control-allow-origin": "*" },
        });
        return;
      } else if (method === "DELETE") {
        data = (req.postDataJSON().prefixes || [])
          .filter((prefix) => storedFiles.has(prefix))
          .map((prefix) => {
            storedFiles.delete(prefix);
            return { name: prefix };
          });
      }
    } else data = {};
    await route.fulfill({
      status: body,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
      },
      body: JSON.stringify(data),
    });
  });
  await page.goto(process.env.ADMIN_BASE_URL || "http://localhost:3001/admin");
  await page.getByLabel("Email", { exact: true }).fill("team@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await page.getByRole("button", { name: "New entry", exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Check connection", exact: true })
    .click();
  await page
    .getByText(
      "Private research-files bucket exists with a 25 MB maximum and image/PDF MIME types. A real upload is needed to verify persistence.",
      { exact: true },
    )
    .waitFor();
  await page.getByRole("button", { name: "New entry", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Contract test rig");
  await page.getByLabel("Category", { exact: true }).fill("University rigs");
  await page
    .getByLabel("Research notes", { exact: true })
    .fill("## Working notes\nA controlled UI test.");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByText("Contract test rig", { exact: true }).waitFor();
  assert.equal(entries[0].status, "draft");
  assert.equal(entries[0].visibility, "team");
  await page
    .getByRole("button", { name: "Edit Contract test rig", exact: true })
    .click();
  await page.getByLabel("Rotational speed (RPM)", { exact: true }).fill("500");
  await page
    .getByRole("button", { name: "Add source citation", exact: true })
    .click();
  await page
    .getByLabel("Source document", { exact: true })
    .fill("Synthetic source");
  await page
    .getByLabel("Page / slide / section", { exact: true })
    .fill("Test section");
  await page.getByLabel("Publication status").selectOption("published");
  await page.getByLabel("Visibility").selectOption("public");
  await page
    .getByRole("button", { name: "Save & publish", exact: true })
    .click();
  await page.getByText("Entry saved successfully.", { exact: true }).waitFor();
  assert.equal(entries[0].specs.rpm, 500);
  assert.equal(entries[0].status, "published");
  await page.getByRole("button", { name: "Upload files", exact: true }).click();
  await page.getByLabel("Choose files", { exact: true }).setInputFiles([
    {
      name: "research.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nTest fixture"),
    },
    {
      name: "research.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=",
        "base64",
      ),
    },
  ]);
  await page
    .getByLabel("Caption / description", { exact: true })
    .fill("Contract-test document");
  await page
    .getByRole("button", { name: "Upload to storage", exact: true })
    .click();
  await page
    .getByText("Files uploaded to persistent storage.", { exact: true })
    .waitFor();
  assert.equal(resources.length, 2);
  assert.equal(resources[0].status, "draft");
  await page.goto("http://localhost:3001/resources");
  await page.getByText("research.pdf", { exact: true }).waitFor();
  await page.reload();
  await page.getByText("research.pdf", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Enlarge research.png", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "research.png", exact: true })
    .waitFor();
  await page.getByRole("dialog").locator("img").waitFor();
  await page.getByRole("dialog").locator("img").click();
  assert.ok(
    await page
      .getByRole("dialog")
      .locator("img")
      .evaluate((el) => el.classList.contains("zoomed")),
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Delete research.pdf", exact: true })
    .click();
  await page.getByText("Attachment deleted.", { exact: true }).waitFor();
  assert.equal(resources.length, 1);
  await page
    .getByRole("button", { name: "Delete research.png", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete research.png", exact: true })
    .waitFor({ state: "detached" });
  assert.equal(resources.length, 0);
  await page.goto("http://localhost:3001/admin");
  await page
    .getByRole("button", { name: "Delete Contract test rig", exact: true })
    .click();
  await page.getByText("Entry deleted.", { exact: true }).waitFor();
  assert.equal(entries.length, 0);
  await page
    .getByRole("button", {
      name: "Run storage & persistence test",
      exact: true,
    })
    .click();
  await page
    .getByText(
      "Live verification passed. Temporary records were removed. You can now test your own entry and refresh the page.",
      { exact: true },
    )
    .waitFor();
  assert.equal(entries.length, 0);
  assert.equal(resources.length, 0);
  assert.equal(storedFiles.size, 0);
  await page.getByText("Open import preparation", { exact: true }).click();
  const bundle = {
    format: "pbt-private-drafts-v1",
    title: "Synthetic import",
    source_date: "2026-10",
    warnings: ["Synthetic test content"],
    entries: [
      {
        import_key: "pbt:browser-import",
        kind: "project",
        title: "Browser imported draft",
        organization: "Test team",
        category: "engineering",
        summary: "Synthetic research",
        body: "Synthetic body",
        section: "engineering",
        review_state: "preliminary",
        provenance: [
          {
            document: "Synthetic source",
            date: "2026-10",
            locator: "Section 1",
          },
        ],
        details: {
          functions: ["Rotate bearing", "Apply load"],
          rows: [
            {
              label: "Load envelope",
              value: "Pending source review",
              state: "pending",
            },
          ],
          options: [
            {
              function: "Apply load",
              candidate: "Synthetic hydraulic candidate",
              reason: "Awaiting validation",
              state: "preliminary",
            },
          ],
        },
        specs: {},
        tags: [],
        sources: [],
        status: "draft",
        visibility: "team",
        demo: false,
      },
    ],
  };
  await page
    .getByLabel("Owner brief or reviewed bundle", { exact: true })
    .fill(JSON.stringify(bundle));
  await page
    .getByRole("button", { name: "Preview draft plan", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Import 1 team-only drafts", exact: true })
    .click();
  await page
    .getByText(
      "1 team-only drafts inserted; 0 existing import keys skipped. Nothing was published.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByRole("button", { name: "Import 1 team-only drafts", exact: true })
    .click();
  await page
    .getByText(
      "0 team-only drafts inserted; 1 existing import keys skipped. Nothing was published.",
      { exact: true },
    )
    .waitFor();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].visibility, "team");
  assert.equal(entries[0].status, "draft");
  await page.goto("http://localhost:3001/engineering");
  await page
    .getByRole("heading", { name: "Browser imported draft", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("Value / uncertainty", { exact: true })
    .fill("Editor-reviewed pending range");
  await page
    .getByLabel("Development stage", { exact: true })
    .fill("Synthetic review stage");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByText("Entry saved successfully.", { exact: true }).waitFor();
  assert.equal(
    entries[0].details.rows[0].value,
    "Editor-reviewed pending range",
  );
  await page
    .getByRole("link", { name: "Browser imported draft", exact: true })
    .click();
  await page
    .getByRole("cell", { name: "Editor-reviewed pending range", exact: true })
    .waitFor();
  await page
    .getByRole("heading", {
      name: "Functional decomposition — WHAT",
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("cell", { name: "Synthetic hydraulic candidate", exact: true })
    .waitFor();
  await page.reload();
  await page
    .getByRole("cell", { name: "Editor-reviewed pending range", exact: true })
    .waitFor();
  await page.goto("http://localhost:3001");
  // An engineering record must never become the homepage overview by fallback.
  await page
    .getByRole("heading", {
      name: "Design and Development of a Passenger Rail Bearing Tester",
      exact: true,
    })
    .waitFor();
  await page.goto("http://localhost:3001/admin");
  memberRole = "viewer";
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("heading", { name: "Welcome back, team.", exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: "New entry", exact: true }).count(),
    0,
  );
  await page.getByLabel("Email", { exact: true }).fill("team@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await page
    .getByRole("heading", { name: "Team authorization required", exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: "New entry", exact: true }).count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Upload files", exact: true })
      .count(),
    0,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: contract-mocked login, draft creation, editing, publication, multi-file upload requests, image preview and zoom, resource deletion, entry deletion, resource reload, private draft import and duplicate skips, configuration diagnostics, signed-in persistence verification, sign-out, and viewer access restrictions.",
  );
} finally {
  await browser.close();
}

// Real Supabase browser SDK with contract-mocked HTTP. No recovery email is sent,
// real password changed, or live database touched by this test.
import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = process.env.RECOVERY_BASE_URL || "http://localhost:3001";
const api = "http://127.0.0.1:54321";
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
  "fixture",
]
  .map((v, i) =>
    i < 2 ? Buffer.from(JSON.stringify(v)).toString("base64url") : v,
  )
  .join(".");
const session = {
  access_token: token,
  refresh_token: "fixture-refresh",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user,
};
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const pageErrors = [];
async function fixture({ existing = false, verifier = false } = {}) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => pageErrors.push(e.message));
  if (existing || verifier)
    await context.addInitScript(
      ({ existing, verifier, session }) => {
        if (existing)
          localStorage.setItem("sb-127-auth-token", JSON.stringify(session));
        if (verifier)
          localStorage.setItem(
            "sb-127-auth-token-code-verifier",
            JSON.stringify("fixture-verifier/recovery"),
          );
      },
      { existing, verifier, session },
    );
  const state = {
    updates: [],
    emails: [],
    exchanges: 0,
    verifications: 0,
    databaseWrites: 0,
    expired: false,
    mailLimited: false,
  };
  await page.route(api + "/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      method = req.method();
    let status = 200,
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
    if (url.pathname.endsWith("/auth/v1/recover")) {
      state.emails.push({
        body: req.postDataJSON(),
        redirect: url.searchParams.get("redirect_to"),
      });
      if (state.mailLimited) {
        status = 429;
        data = { code: "over_email_send_rate_limit", msg: "Rate limited" };
      }
    } else if (
      url.pathname.endsWith("/auth/v1/token") &&
      url.searchParams.get("grant_type") === "pkce"
    ) {
      state.exchanges++;
      const body = req.postDataJSON();
      if (
        body.auth_code === "fixture-code" &&
        body.code_verifier === "fixture-verifier"
      )
        data = session;
      else {
        status = 400;
        data = {
          code: "flow_state_not_found",
          msg: "Invalid code or verifier",
        };
      }
    } else if (url.pathname.endsWith("/auth/v1/verify")) {
      state.verifications++;
      assert.deepEqual(req.postDataJSON(), {
        type: "recovery",
        token_hash: "fixture-hash",
        gotrue_meta_security: {},
      });
      data = session;
    } else if (url.pathname.endsWith("/auth/v1/user")) {
      if (req.headers().authorization !== `Bearer ${token}` || state.expired) {
        status = 401;
        data = { code: "bad_jwt", msg: "Invalid or expired session" };
      } else if (method === "PUT") {
        const body = req.postDataJSON();
        if (body.password === "weak-fixture-password") {
          status = 422;
          data = {
            code: "weak_password",
            msg: "Password must meet the configured requirements",
          };
        } else {
          state.updates.push(body);
          data = user;
        }
      } else data = user;
    } else if (url.pathname.endsWith("/auth/v1/token")) data = session;
    else if (url.pathname.includes("/rest/v1/")) {
      if (method !== "GET") state.databaseWrites++;
      data = url.pathname.endsWith("/members") ? { role: "admin" } : [];
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
      },
      body: JSON.stringify(data),
    });
  });
  return { page, context, state };
}
const heading = (page, name) =>
  page.getByRole("heading", { name, exact: true }).waitFor();
async function requestAgain(page, state) {
  await page.getByLabel("Email", { exact: true }).fill("team@example.test");
  await page
    .getByRole("button", { name: "Send recovery email", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "If an eligible account exists" })
    .waitFor();
  assert.equal(state.emails.length, 1);
  assert.equal(
    state.emails[0].redirect,
    new URL("/reset-password", base).toString(),
  );
  assert.deepEqual(state.emails[0].body, {
    email: "team@example.test",
    code_challenge: null,
    code_challenge_method: null,
    gotrue_meta_security: {},
  });
}
try {
  {
    const { page, context, state } = await fixture();
    await page.goto(
      base +
        "/#error=access_denied&error_code=otp_expired&error_description=untrusted-description",
    );
    await heading(page, "Reset your PBT password");
    await page.getByRole("alert").filter({ hasText: "expired" }).waitFor();
    assert.equal(new URL(page.url()).hash, "");
    assert.equal(new URL(page.url()).pathname, "/reset-password");
    assert.equal(
      await page.getByLabel("New password", { exact: true }).count(),
      0,
    );
    assert.equal(
      await page.getByText("untrusted-description", { exact: true }).count(),
      0,
    );
    await requestAgain(page, state);
    await page
      .getByRole("link", { name: "Back to sign in", exact: true })
      .click();
    await heading(page, "Welcome back, team.");
    await page
      .getByRole("link", { name: "Forgot your password?", exact: true })
      .click();
    await heading(page, "Reset your PBT password");
    assert.equal(state.databaseWrites, 0);
    await context.close();
  }
  {
    const { page, context, state } = await fixture();
    await page.goto(
      base +
        `/#access_token=${token}&refresh_token=fixture-refresh&type=recovery&expires_in=3600&token_type=bearer`,
    );
    await heading(page, "Choose a new password");
    assert.equal(new URL(page.url()).hash, "");
    await page.reload();
    await heading(page, "Choose a new password");
    await page
      .getByLabel("New password", { exact: true })
      .fill("strong-fixture-password");
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill("different-fixture-password");
    await page
      .getByRole("button", { name: "Save new password", exact: true })
      .click();
    await page
      .getByText("The passwords do not match.", { exact: true })
      .waitFor();
    assert.equal(state.updates.length, 0);
    await page
      .getByLabel("New password", { exact: true })
      .fill("weak-fixture-password");
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill("weak-fixture-password");
    await page
      .getByRole("button", { name: "Save new password", exact: true })
      .click();
    await page
      .getByText("Password must meet the configured requirements", {
        exact: true,
      })
      .waitFor();
    assert.equal(state.updates.length, 0);
    await page
      .getByLabel("New password", { exact: true })
      .fill("strong-fixture-password");
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill("strong-fixture-password");
    await page
      .getByRole("button", { name: "Save new password", exact: true })
      .click();
    await heading(page, "Password updated");
    assert.equal(state.updates.length, 1);
    assert.deepEqual(Object.keys(state.updates[0]), [
      "password",
      "code_challenge",
      "code_challenge_method",
    ]);
    assert.equal(state.updates[0].code_challenge, null);
    assert.equal(state.updates[0].code_challenge_method, null);
    assert.equal(state.databaseWrites, 0);
    assert.equal(
      await page.evaluate(() =>
        sessionStorage.getItem("pbt-password-recovery-user"),
      ),
      null,
    );
    await page
      .getByRole("link", { name: "Continue to admin workspace", exact: true })
      .click();
    await page
      .getByRole("button", { name: "New entry", exact: true })
      .waitFor();
    await page.reload();
    await page
      .getByRole("button", { name: "New entry", exact: true })
      .waitFor();
    await context.close();
  }
  {
    const { page, context, state } = await fixture({ verifier: true });
    await page.goto(base + "/reset-password?code=fixture-code");
    await heading(page, "Choose a new password");
    assert.equal(state.exchanges, 1);
    assert.equal(new URL(page.url()).search, "");
    await context.close();
  }
  {
    const { page, context, state } = await fixture();
    await page.goto(
      base + "/reset-password?token_hash=fixture-hash&type=recovery",
    );
    await heading(page, "Choose a new password");
    assert.equal(state.verifications, 1);
    assert.equal(new URL(page.url()).search, "");
    state.expired = true;
    await page
      .getByLabel("New password", { exact: true })
      .fill("strong-fixture-password");
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill("strong-fixture-password");
    await page
      .getByRole("button", { name: "Save new password", exact: true })
      .click();
    await heading(page, "Reset your PBT password");
    await page.getByRole("alert").filter({ hasText: "expired" }).waitFor();
    assert.equal(state.updates.length, 0);
    await context.close();
  }
  for (const path of [
    "/reset-password?code=missing-verifier",
    "/#type=recovery",
    "/#access_token=invalid&refresh_token=invalid&type=recovery",
    "/reset-password",
  ]) {
    const { page, context, state } = await fixture({ existing: true });
    await page.goto(base + path);
    await heading(page, "Reset your PBT password");
    assert.equal(
      await page.getByLabel("New password", { exact: true }).count(),
      0,
    );
    assert.equal(state.updates.length, 0);
    if (path !== "/reset-password")
      await page.getByRole("alert").filter({ hasText: "expired" }).waitFor();
    await context.close();
  }
  {
    const { page, context, state } = await fixture();
    state.mailLimited = true;
    await page.goto(base + "/forgot-password");
    await heading(page, "Reset your PBT password");
    await page.getByLabel("Email", { exact: true }).fill("team@example.test");
    await page
      .getByRole("button", { name: "Send recovery email", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "try again later" })
      .waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: "/tmp/pbt-recovery-mobile.png",
      fullPage: true,
    });
    await context.close();
  }
  assert.deepEqual(pageErrors, []);
  console.log(
    "PASS: real SDK/mocked HTTP recovery tokens, PKCE/OTP exchange once, URL cleanup, refresh, confirmation/policy validation, password update, unchanged admin access, expired/malformed links with existing sessions, recovery email/rate limits, and mobile layout. No live emails, passwords, or database writes.",
  );
} finally {
  await browser.close();
}

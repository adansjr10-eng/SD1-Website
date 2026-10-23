import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseRecoveryCallback,
  recoveryRedirectUrl,
  validateNewPassword,
  recoveryErrorMessage,
  expiredRecoveryMessage,
} from "../lib/password-recovery";

test("recovery redirects distinguish verified-link inputs from ordinary sessions and untrusted errors", () => {
  const base = "https://sixthgearsdt15-pbt.vercel.app";
  assert.deepEqual(
    parseRecoveryCallback(
      base +
        "/#access_token=fixture&refresh_token=fixture-refresh&type=recovery",
    ),
    {
      kind: "session",
      access_token: "fixture",
      refresh_token: "fixture-refresh",
    },
  );
  assert.deepEqual(
    parseRecoveryCallback(
      base + "/reset-password?code=fixture-code&sb_flow_id=fixture-flow",
    ),
    { kind: "code", code: "fixture-code", flowId: "fixture-flow" },
  );
  assert.deepEqual(
    parseRecoveryCallback(
      base + "/reset-password?token_hash=fixture-hash&type=recovery",
    ),
    { kind: "otp", token_hash: "fixture-hash" },
  );
  for (const suffix of [
    "/#error=access_denied&error_code=otp_expired",
    "/?error_code=otp_expired",
    "/#type=recovery",
    "/reset-password#access_token=missing-refresh",
  ])
    assert.deepEqual(parseRecoveryCallback(base + suffix), { kind: "error" });
  assert.equal(parseRecoveryCallback(base + "/admin"), null);
  assert.equal(parseRecoveryCallback(base + "/reset-password"), null);
  assert.equal(
    parseRecoveryCallback(
      base + "/#access_token=fixture&refresh_token=fixture&type=invite",
    ),
    null,
  );
  assert.equal(
    parseRecoveryCallback(base + "/auth/callback?code=ordinary-oauth"),
    null,
  );
});
test("recovery redirects stay on the current origin and password validation preserves input", () => {
  assert.equal(
    recoveryRedirectUrl(
      "https://sixthgearsdt15-pbt.vercel.app/?next=https://untrusted.example",
    ),
    "https://sixthgearsdt15-pbt.vercel.app/reset-password",
  );
  assert.equal(
    recoveryRedirectUrl("http://localhost:3001"),
    "http://localhost:3001/reset-password",
  );
  assert.ok(validateNewPassword("short", "short"));
  assert.ok(validateNewPassword("test-password", "mismatch"));
  assert.equal(validateNewPassword(" test password ", " test password "), "");
  assert.equal(
    recoveryErrorMessage(new Error("<untrusted callback description>")),
    expiredRecoveryMessage,
  );
  assert.match(
    recoveryErrorMessage(new Error("Failed to fetch")),
    /connection/,
  );
});

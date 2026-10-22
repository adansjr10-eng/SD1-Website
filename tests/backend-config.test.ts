import { test } from "node:test";
import assert from "node:assert/strict";
import {
  inspectBackendConfiguration as inspect,
  explainBackendError,
} from "../lib/backend-config";
const key = "sb_publishable_test-only";
const jwt = (role: string) =>
  `${btoa("{}")}.${btoa(JSON.stringify({ role }))}.test-signature`;
test("configuration distinguishes absent, partial, invalid, and valid backends", () => {
  assert.equal(inspect(undefined, undefined).mode, "demo");
  assert.equal(
    inspect("https://example.supabase.co", undefined).mode,
    "invalid",
  );
  assert.equal(inspect("https://chatgpt.com", key).mode, "invalid");
  assert.equal(
    inspect("https://chatgpt.com/share/not-an-api", key).mode,
    "invalid",
  );
  assert.equal(
    inspect("https://supabase.com/dashboard/project/example", key).mode,
    "invalid",
  );
  assert.equal(
    inspect("https://example.supabase.co/rest/v1", key).mode,
    "invalid",
  );
  assert.equal(inspect("http://example.supabase.co", key).mode, "invalid");
  assert.equal(
    inspect("https://user:password@example.supabase.co", key).mode,
    "invalid",
  );
  assert.equal(
    inspect("https://example.supabase.co?token=foo", key).mode,
    "invalid",
  );
  assert.equal(inspect("https://example.supabase.co/", key).mode, "ready");
  assert.equal(inspect("https://research.example.edu", key).mode, "ready");
  assert.equal(
    inspect("http://127.0.0.1:54321", "test-public-placeholder").mode,
    "ready",
  );
});
test("browser configuration refuses privileged credentials", () => {
  assert.equal(
    inspect("https://example.supabase.co", "sb_secret_test").mode,
    "invalid",
  );
  assert.equal(
    inspect("https://example.supabase.co", jwt("service_role")).mode,
    "invalid",
  );
  assert.equal(
    inspect("https://example.supabase.co", jwt("anon")).mode,
    "ready",
  );
  assert.equal(
    inspect("https://example.supabase.co", "not-a-key").mode,
    "invalid",
  );
});
test("backend errors explain schema, permission, and network fixes without bypasses", () => {
  assert.match(explainBackendError({ code: "PGRST205" }), /schema.sql/);
  assert.match(explainBackendError({ code: "42501" }), /do not disable RLS/);
  assert.match(
    explainBackendError({ message: "Failed to fetch" }),
    /allowlist/,
  );
});

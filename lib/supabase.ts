import { createClient } from "@supabase/supabase-js";
import { inspectBackendConfiguration } from "./backend-config";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
export const configuration = inspectBackendConfiguration(url, key);
export const configured = configuration.mode === "ready";
export const hasConfiguration = configuration.mode !== "demo";
export const supabase = configured
  ? createClient(url!, key!, {
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: init?.signal ?? AbortSignal.timeout(15000),
          }),
      },
    })
  : null;

/** Separate unauthenticated client: never reads or changes the user's stored session. */
export function createAnonymousClient() {
  return configured
    ? createClient(url!, key!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: "rail-lab-anonymous-verification",
        },
        global: {
          fetch: (input, init) =>
            fetch(input, {
              ...init,
              signal: init?.signal ?? AbortSignal.timeout(15000),
            }),
        },
      })
    : null;
}

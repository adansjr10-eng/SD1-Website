"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  establishRecoverySession,
  expiredRecoveryMessage,
  hasPendingRecoveryCallback,
  finishRecoveryCallback,
  recoveryErrorMessage,
  recoveryPath,
  recoveryRedirectUrl,
  recoveryStorageKey,
  validateNewPassword,
} from "@/lib/password-recovery";

type Phase = "checking" | "request" | "ready" | "complete";
function rememberUser(id: string | null) {
  try {
    if (id) sessionStorage.setItem(recoveryStorageKey, id);
    else sessionStorage.removeItem(recoveryStorageKey);
  } catch {
    // Recovery still works when storage is unavailable, but cannot resume on refresh.
  }
}
function rememberedUser() {
  try {
    return sessionStorage.getItem(recoveryStorageKey);
  } catch {
    return null;
  }
}

/** Intercept recovery redirects at any site path, including old Site URL links. */
export default function PasswordRecovery({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [callbackActive, setCallbackActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState("");
  const expectedUser = useRef<string | null>(null);
  const handledCallback = useRef(false);
  const active =
    callbackActive ||
    pathname === recoveryPath ||
    pathname === "/forgot-password";

  useEffect(() => {
    let current = true;
    if (!supabase) {
      setPhase("request");
      return;
    }
    const client = supabase;
    function allow(id: string) {
      expectedUser.current = id;
      rememberUser(id);
      setMessage("");
      setPhase("ready");
    }
    function reject(message: string) {
      expectedUser.current = null;
      rememberUser(null);
      setMessage(message);
      setPhase("request");
    }
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      // Do not call async auth APIs inside this callback: the SDK holds an auth lock.
      if (!current) return;
      const remembered = rememberedUser();
      if (
        event === "SIGNED_OUT" ||
        (session && remembered && session.user.id !== remembered)
      )
        rememberUser(null);
      if (event === "PASSWORD_RECOVERY" && session) {
        if (pathname === recoveryPath) allow(session.user.id);
        else setPhase("checking");
        setCallbackActive(true);
        window.history.replaceState(null, "", recoveryPath);
        router.replace(recoveryPath, { scroll: false });
      } else if (
        expectedUser.current &&
        (!session || session.user.id !== expectedUser.current)
      ) {
        reject(expiredRecoveryMessage);
      }
    });
    async function initialize() {
      if (hasPendingRecoveryCallback() && !handledCallback.current) {
        setCallbackActive(true);
        setPhase("checking");
        rememberUser(null);
        // The SDK's automatic callback handling is disabled only for this redirect.
        // Capture/exchange once; remove credentials/errors before making requests.
        window.history.replaceState(null, "", recoveryPath);
        if (pathname !== recoveryPath)
          router.replace(recoveryPath, { scroll: false });
        try {
          const id = await establishRecoverySession(client);
          if (!current || pathname !== recoveryPath) return;
          handledCallback.current = true;
          finishRecoveryCallback();
          allow(id);
        } catch (error) {
          if (!current || pathname !== recoveryPath) return;
          handledCallback.current = true;
          finishRecoveryCallback();
          reject(recoveryErrorMessage(error));
        } finally {
          if (current && pathname === recoveryPath) setCallbackActive(false);
        }
      } else if (pathname === recoveryPath && !handledCallback.current) {
        setPhase("checking");
        const id = rememberedUser();
        if (!id) {
          if (current) reject("");
          return;
        }
        try {
          const { data, error } = await client.auth.getUser();
          if (!current) return;
          if (error || data.user?.id !== id) reject(expiredRecoveryMessage);
          else allow(id);
        } catch (error) {
          if (current) reject(recoveryErrorMessage(error));
        }
      } else if (pathname === "/forgot-password") {
        setCallbackActive(false);
        setPhase("request");
        setMessage("");
      } else if (pathname !== recoveryPath) {
        setCallbackActive(false);
      }
    }
    void initialize();
    return () => {
      current = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (!active) return children;
  return (
    <main className="recovery-page">
      <Link href="/" className="recovery-brand">
        PBT
      </Link>
      <section
        className="panel login-panel recovery-panel"
        aria-label="Password recovery"
      >
        <div className="empty-icon">
          <KeyRound size={28} />
        </div>
        {phase === "checking" ? (
          <>
            <h1>Checking your recovery link</h1>
            <p role="status">Verifying your secure session…</p>
          </>
        ) : phase === "complete" ? (
          <>
            <h1>Password updated</h1>
            <p role="status">
              Your new password has been saved. Your team access is unchanged.
            </p>
            <Link className="button primary" href="/admin">
              Continue to admin workspace
            </Link>
          </>
        ) : phase === "ready" ? (
          <ResetPassword
            expectedUser={expectedUser}
            onExpired={() => {
              rememberUser(null);
              expectedUser.current = null;
              setMessage(expiredRecoveryMessage);
              setPhase("request");
            }}
            onComplete={() => {
              rememberUser(null);
              expectedUser.current = null;
              setPhase("complete");
            }}
          />
        ) : (
          <RequestRecovery message={message} />
        )}
        <Link href="/admin" className="text-link recovery-back">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}

function RequestRecovery({ message }: { message: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setBusy(true);
    setError("");
    setSent(false);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: recoveryRedirectUrl(window.location.origin),
      });
      if (error) throw error;
      setSent(true);
    } catch {
      setError(
        "The recovery email could not be requested. Please try again later. If you recently requested one, wait before trying again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Reset your PBT password</h1>
      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
      <p>
        Enter your team account email to request a new recovery link. Use the
        newest email; older links may be expired or already used.
      </p>
      {!supabase ? (
        <p role="alert">
          Password recovery is unavailable until the website’s Supabase
          connection is configured.
        </p>
      ) : (
        <form onSubmit={submit} className="recovery-form">
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={busy}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {sent && (
            <p className="verification-success" role="status">
              If an eligible account exists for this email, a recovery link will
              be sent. Check your inbox and spam folder.
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? "Requesting…" : "Send recovery email"}
          </button>
        </form>
      )}
    </>
  );
}

function ResetPassword({
  expectedUser,
  onExpired,
  onComplete,
}: {
  expectedUser: { current: string | null };
  onExpired: () => void;
  onComplete: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const password = String(values.get("password")),
      confirmation = String(values.get("confirmation"));
    const validation = validateNewPassword(password, confirmation);
    setError(validation);
    if (validation) return;
    setBusy(true);
    try {
      const { data, error: sessionError } = await supabase.auth.getUser();
      if (
        sessionError ||
        !expectedUser.current ||
        data.user?.id !== expectedUser.current
      ) {
        onExpired();
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        if (
          error.status === 401 ||
          error.status === 403 ||
          /session|jwt|refresh_token/i.test(error.code || "")
        ) {
          onExpired();
          return;
        }
        throw error;
      }
      form.reset();
      onComplete();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Your password could not be updated. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Choose a new password</h1>
      <p>
        Use at least 8 characters. Your account’s password requirements also
        apply.
      </p>
      <form className="recovery-form" onSubmit={submit}>
        <label>
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={busy}
          />
        </label>
        <label>
          Confirm new password
          <input
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={busy}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? "Saving password…" : "Save new password"}
        </button>
      </form>
    </>
  );
}

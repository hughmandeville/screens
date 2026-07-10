"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import styles from "./LoginGate.module.css";

const USERNAME = "screens";
const PASSWORD = "Screens123!";
const STORAGE_KEY = "screens-auth";
const AUTH_EVENT = "screens-auth-change";

function subscribe(onChange: () => void) {
  window.addEventListener(AUTH_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(AUTH_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

// null marks the server/pre-hydration render so nothing leaks into the static
// HTML; the client resolves the real value from localStorage after hydration.
function getServerSnapshot(): boolean | null {
  return null;
}

// Client-side gate for the home page. The site is served statically from GitHub
// Pages, so this only deters casual viewers — the credentials and content still
// ship in the bundle and can be bypassed. Access is remembered in localStorage
// until the browser's storage is cleared.
export function LoginGate({ children }: { children: React.ReactNode }) {
  const authed = useSyncExternalStore<boolean | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (username === USERNAME && password === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "1");
      window.dispatchEvent(new Event(AUTH_EVENT));
      setError(false);
      return;
    }
    setError(true);
  }

  if (authed === null) return null;
  if (authed) return <>{children}</>;

  return (
    <main className={styles.gate}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Screens</h1>
        <label className={styles.field}>
          <span className={styles.label}>Username</span>
          <input
            className={styles.input}
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <div className={styles.passwordWrap}>
            <input
              className={styles.input}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </label>
        {error && (
          <p className={styles.error}>Incorrect username or password.</p>
        )}
        <button className={styles.button} type="submit">
          Sign in
        </button>
      </form>
    </main>
  );
}

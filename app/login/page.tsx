"use client";
import { useState } from "react";
import { Radar, ArrowRight } from "lucide-react";
import { browserClient } from "@/lib/supabase/browser";
export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="login">
      <a className="brand" href="/">
        <Radar /> Maven Signal
      </a>
      <div className="panel">
        <span className="eyebrow">PRIVATE WORKSPACE</span>
        <h1>Welcome back.</h1>
        <p>Sign in to your agency research workspace.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const f = new FormData(e.currentTarget);
              const { error } = await browserClient().auth.signInWithPassword({
                email: String(f.get("email")),
                password: String(f.get("password")),
              });
              if (error) throw error;
              window.location.href = "/";
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not sign in.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Email
            <input required name="email" type="email" autoComplete="email" />
          </label>
          <label>
            Password
            <input
              required
              name="password"
              type="password"
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight size={16} />
          </button>
        </form>
        <small>
          Accounts are created by your workspace owner. Contact them for access
          or a password reset.
        </small>
      </div>
    </main>
  );
}

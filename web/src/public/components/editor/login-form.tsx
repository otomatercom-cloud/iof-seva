"use client";
import { useState } from "react";

const MESSAGES: Record<string, string> = {
  credentials: "Wrong login or password.",
  forbidden: "This user is not allowed to edit the website.",
  rate_limited: "Too many attempts. Please wait a few minutes.",
  config: "Editor is not configured on the server (ODOO_DATABASE).",
  unreachable: "Cannot reach Odoo. Try again shortly.",
};

export function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/editor/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: f.get("login"), password: f.get("password") }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { window.location.assign("/"); return; }
      setError(MESSAGES[data.error as string] ?? "Sign in failed.");
    } catch { setError(MESSAGES.unreachable); }
    setBusy(false);
  }
  const input = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2";
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-semibold">Login (email)
        <input name="login" autoComplete="username" required maxLength={200} className={input} /></label>
      <label className="block text-sm font-semibold">Password
        <input name="password" type="password" autoComplete="current-password" required maxLength={200} className={input} /></label>
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      <button disabled={busy} className="rounded-full bg-navy-900 px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

"use client";
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

/** Calls a whitelisted otm.iof.api method through the Next.js BFF. */
export async function odoo<T = unknown>(method: string, ...args: unknown[]): Promise<T> {
  const r = await fetch("/api/odoo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method, args }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/login")) location.href = "/login";
    throw new ApiError(j.error || "Request failed", r.status);
  }
  return j.result as T;
}

export async function apiLogin(email: string, password: string) {
  const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(j.error || "Sign-in failed", r.status);
}
export const apiLogout = () => fetch("/api/auth/logout", { method: "POST" }).catch(() => {});

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmtDate = (iso?: string | null) => (iso ? format(parseISO(iso), "dd MMM yyyy") : "—");
export const fmtDateTime = (iso?: string | null) => (iso ? format(parseISO(iso), "dd MMM yyyy, HH:mm") : "—");
export const timeAgo = (iso: string) => formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
export const fmtSAR = (n: number) => `SAR ${n.toLocaleString("en-IN")}`;
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

/** Fixed "now" for the prototype so seeded relative dates are stable. */
export const NOW_ISO = "2026-11-03T15:00:00.000Z";

/** Read a File as a data-URL (used only when the Odoo backend stores the upload). */
export const readDataUrl = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });

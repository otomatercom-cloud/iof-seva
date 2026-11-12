import "server-only";
import { cache, createElement, Fragment, type ReactNode } from "react";
import { COLLECTIONS, TEXTS } from "@/public/content/defaults";
import { GALLERY } from "@/public/lib/gallery";
import { images } from "@/public/lib/utils";
import { cleanLayout, cleanStyle, orderSections, textClass, type Layout, type TextStyle } from "@/public/lib/editor-style";
import { Inlines } from "@/public/lib/markup-react";
import { stripMarkup } from "@/public/lib/markup";

export type Item = { id?: number; title: string; text: string; icon: string; url: string; image: string; file: string };
export type SiteEvent = { title: string; date: string; endDate: string; time: string; location: string; details: string; image: string };
type ApiEvent = { title?: string; date?: string; end_date?: string; time?: string; location?: string; details?: string; image?: string };
type ApiPayload = {
  events?: ApiEvent[];
  texts?: Record<string, string>;
  images?: Record<string, string>;
  collections?: Record<string, Partial<Item>[]>;
  styles?: Record<string, unknown>;
  layouts?: Record<string, unknown>;
};

export type Content = {
  /** True when rendered inside the visual editor (/ed): hidden sections are shown and text is editable. */
  editing: boolean;
  /** Editable text as PLAIN text (markup removed): for attributes, metadata, logic. */
  t: (key: string) => string;
  /** Editable text with the editor's markup (bold/italic/link) and style applied: for JSX children. */
  e: (key: string) => ReactNode;
  /** Raw stored markup (or default) for a key. */
  raw: (key: string) => string;
  /** Editable title/text of a list item (card, list entry) as JSX. */
  ei: (item: Item, field: "title" | "text") => ReactNode;
  /** Saved layout (order / hidden / per-section look) of a page. */
  layout: (page: string) => Layout;
  /** Editable image URL; falls back to the legacy hot-linked image, or null. */
  img: (key: string) => string | null;
  items: (name: string) => Item[];
  /** Events from Odoo: upcoming first (soonest first), then past (latest first). Empty if none / Odoo down. */
  events: (today?: string) => SiteEvent[];
};

const FALLBACK_IMAGES: Record<string, string> = { "site.logo": images.logo, "home.intro.image": images.about };
const blank: Item = { title: "", text: "", icon: "", url: "", image: "", file: "" };

/** Public base for media URLs (what the visitor's browser/Next image optimiser can reach). */
export function mediaBase() {
  return (process.env.ODOO_PUBLIC_URL || (process.env.ODOO_BASE_URL || process.env.ODOO_URL) || "").replace(/\/+$/, "");
}

async function load(fresh = false): Promise<ApiPayload | null> {
  const base = (process.env.ODOO_BASE_URL || process.env.ODOO_URL)?.replace(/\/+$/, "");
  if (!base) return null;
  const url = new URL(base + "/api/iof/site-content");
  const dbName = process.env.ODOO_DATABASE || process.env.ODOO_DB;
  if (dbName) url.searchParams.set("db", dbName);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.CONTENT_TIMEOUT_MS) || 3000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: Number(process.env.CONTENT_REVALIDATE_S) || 30 } }),
    });
    if (!res.ok) return null;
    return (await res.json()) as ApiPayload;
  } catch {
    return null; // Odoo unreachable: render the built-in defaults, never fail the page
  } finally {
    clearTimeout(timer);
  }
}

export function buildContent(data: ApiPayload | null, media = mediaBase(), editing = false): Content {
  const abs = (u?: string) => (u ? (/^https?:\/\//.test(u) ? u : media + u) : "");
  const raw = (key: string) => data?.texts?.[key]?.trim() || TEXTS[key]?.[2] || "";
  const styleOf = (key: string): TextStyle => cleanStyle(data?.styles?.[key]);
  const wrap = (attrs: Record<string, string>, source: string, st: TextStyle): ReactNode => {
    const cls = textClass(st);
    const hasMarkup = /\[\/?[biu]\]|\[a=|\n/.test(source);
    if (!editing && !cls && !hasMarkup) return source;
    if (!editing && !cls) return createElement(Inlines, { source });
    return createElement("span", {
      ...(editing ? attrs : {}), className: cls || undefined,
      ...(editing ? { "data-es": JSON.stringify(st), suppressContentEditableWarning: true } : {}),
    }, createElement(Inlines, { source }));
  };
  return {
    editing,
    t: (key) => stripMarkup(raw(key)),
    raw,
    e: (key) => wrap({ "data-ek": key }, raw(key), styleOf(key)),
    ei: (item, field) => {
      const v = item[field] ?? "";
      if (!editing || !item.id) return createElement(Fragment, null, v);
      return createElement("span", { [`data-eit`]: `${item.id}:${field}`, "data-es": "{}", className: undefined }, v);
    },
    layout: (page) => cleanLayout(data?.layouts?.[page]),
    img: (key) => abs(data?.images?.[key]) || FALLBACK_IMAGES[key] || null,
    events: (today = new Date().toISOString().slice(0, 10)) => {
      const list = (data?.events ?? [])
        .filter((e) => e.title && /^\d{4}-\d{2}-\d{2}$/.test(e.date ?? ""))
        .map((e) => ({
          title: e.title!, date: e.date!, endDate: e.end_date || "", time: e.time || "",
          location: e.location || "", details: e.details || "", image: abs(e.image),
        }));
      const last = (e: SiteEvent) => e.endDate || e.date;
      const up = list.filter((e) => last(e) >= today).sort((a, b) => a.date.localeCompare(b.date));
      const past = list.filter((e) => last(e) < today).sort((a, b) => b.date.localeCompare(a.date));
      return [...up, ...past];
    },
    items: (name) => {
      const live = data?.collections?.[name];
      if (live && live.length) {
        return live.map((i) => ({ ...blank, ...i, image: abs(i.image), file: abs(i.file) }));
      }
      if (name === "gallery") return GALLERY.map((g) => ({ ...blank, title: g.alt, image: g.src }));
      // Odoo reachable but list intentionally emptied: honour it; unreachable: defaults
      if (live) return [];
      return (COLLECTIONS[name]?.items ?? []).map((i) => ({ ...blank, ...i }));
    },
  };
}

/** One fetch per request; Next caches the Odoo response for CONTENT_REVALIDATE_S seconds. */
export const getContent = cache(async (editing: boolean = false) => buildContent(await load(editing), mediaBase(), editing));

export { orderSections };

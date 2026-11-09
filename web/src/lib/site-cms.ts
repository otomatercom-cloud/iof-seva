"use client";
import { create } from "zustand";
import { USE_ODOO as _U } from "./config";
import { persist, createJSONStorage } from "zustand/middleware";
import { CAUSES, CONTACT, FAQS, HERO, NUMBERS, PRINCIPLES, PROVINCES, SERVICES, STEPS } from "@/components/site/site-content";

/**
 * Website CMS. Everything the public website shows lives here and is edited from /website in the portal.
 * Prototype: persisted in browser localStorage. Odoo 19: map each block to otm.iof.site.* models
 * (hero slides as ordered records with ir.attachment images) and serve via GET /iof/api/site-content.
 */
export interface HeroSlide { id: string; eyebrow: string; title: string; text: string; ctaLabel: string; ctaHref: string; altLabel: string; altHref: string; icon: "scale" | "cross" | "home"; image: string }
export interface Heading { eyebrow: string; title: string }
export interface SiteContent {
  contact: { email: string; phone: string; address: string };
  hero: HeroSlide[];
  heroSeconds: number;
  about: { eyebrow: string; title: string; lead: string; badgeNumber: string; badgeText: string; features: { t: string; d: string }[]; buttonLabel: string };
  headings: Record<"services" | "causes" | "provinces" | "process" | "commitments" | "network" | "faq" | "contact", Heading>;
  networkText: string;
  services: { t: string; d: string }[];
  causes: { t: string; p: string; image: string }[];
  provinces: { t: string; s: string; image: string }[];
  steps: { t: string; d: string }[];
  principles: { t: string; q: string }[];
  numbers: { n: number; l: string }[];
  faqs: { q: string; a: string }[];
  cta: { title: string; button: string };
  footer: { tagline: string; copyright: string; note: string };
}

export const DEFAULT_CONTENT: SiteContent = {
  contact: CONTACT,
  hero: HERO.map((h, i) => ({ id: `h${i + 1}`, eyebrow: h.eyebrow, title: h.title, text: h.text, ctaLabel: h.cta[0], ctaHref: h.cta[1], altLabel: h.alt[0], altHref: h.alt[1], icon: h.icon, image: "" })),
  heroSeconds: 6,
  about: { eyebrow: "About IOF Seva", title: "Service beyond borders for the Indian community", lead: "India Overseas Forum volunteers support Indian expatriates facing detention, illness, labour disputes and bereavement. Every case is registered, owned by a named coordinator and followed until it is resolved.", badgeNumber: "10", badgeText: "IOF committees across KSA", features: [{ t: "Compassion first", d: "Practical help and a human voice for families far away." }, { t: "Province network", d: "Eastern, Central and Western committees working as one." }], buttonLabel: "How a case is handled" },
  headings: {
    services: { eyebrow: "What we do", title: "Seva for everyone who needs a helping hand" },
    causes: { eyebrow: "Cases we support", title: "The situations where IOF steps in" },
    provinces: { eyebrow: "Where we work", title: "IOF committees across the Kingdom" },
    process: { eyebrow: "How it works", title: "From first call to a closed case" },
    commitments: { eyebrow: "Our commitments", title: "What you can expect from IOF Seva" },
    network: { eyebrow: "Our network", title: "One register, every province" },
    faq: { eyebrow: "FAQ", title: "Quick answers" },
    contact: { eyebrow: "Get in touch", title: "Report a case, volunteer or sign in" },
  },
  networkText: "A single case-management system lets committees hand cases across provinces without losing the original reporter or history.",
  services: SERVICES.map((s) => ({ t: s.t, d: s.d })),
  causes: CAUSES.map((c) => ({ t: c.t, p: c.p, image: "" })),
  provinces: PROVINCES.map((p) => ({ t: p.t, s: p.s, image: "" })),
  steps: STEPS.map((s) => ({ t: s.t, d: s.d })),
  principles: PRINCIPLES.map((p) => ({ t: p.t, q: p.q })),
  numbers: NUMBERS.map((n) => ({ n: n.n, l: n.l })),
  faqs: FAQS.map(([q, a]) => ({ q, a })),
  cta: { title: "Know someone who needs help? Tell us today.", button: "Report a case" },
  footer: { tagline: "Service beyond borders – supporting Indian expatriates across Saudi Arabia.", copyright: "© 2026 India Overseas Forum. All rights reserved.", note: "Confidential Seva casework" },
};

interface SiteState { content: SiteContent; set: (fn: (c: SiteContent) => SiteContent) => void; reset: () => void }
export const useSiteStore = create<SiteState>()(
  persist(
    (set) => ({ content: DEFAULT_CONTENT, set: (fn) => set((s) => ({ content: fn(s.content) })), reset: () => set({ content: DEFAULT_CONTENT }) }),
    {
      name: "iof-site-cms-v1", storage: createJSONStorage(() => localStorage), skipHydration: true, version: 1, partialize: (s) => (USE_ODOO ? ({} as SiteState) : s),
      // merge so fields added later never break older saved content
      merge: (saved, cur) => ({ ...cur, content: { ...DEFAULT_CONTENT, ...((saved as Partial<SiteState>)?.content ?? {}), headings: { ...DEFAULT_CONTENT.headings, ...(((saved as Partial<SiteState>)?.content?.headings) ?? {}) } } }),
    },
  ),
);

import { USE_ODOO } from "./config";
let loaded = false;
/** Mock: localStorage. Odoo: public GET /api/site (stored in otm.iof.site.content). */
export async function loadSite() {
  if (!USE_ODOO) { await useSiteStore.persist.rehydrate(); loaded = true; return; }
  try {
    const j = await (await fetch("/api/site", { cache: "no-store" })).json();
    if (j && Object.keys(j).length) useSiteStore.setState({ content: { ...DEFAULT_CONTENT, ...j, headings: { ...DEFAULT_CONTENT.headings, ...(j.headings ?? {}) } } });
  } catch {}
  loaded = true;
}
let timer: ReturnType<typeof setTimeout> | undefined;
/** Odoo mode: debounce-save editor changes (President only; server re-checks). Returns error text if any. */
export function saveSiteSoon(content: SiteContent, onDone: (err?: string) => void) {
  if (!USE_ODOO || !loaded) return;
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const r = await fetch("/api/site", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) });
    onDone(r.ok ? undefined : (await r.json().catch(() => ({}))).error || "Could not save");
  }, 900);
}

/** Resize an uploaded image to a web-friendly JPEG data-URL (keeps localStorage small). */
export function fileToDataUrl(file: File, maxW = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, maxW / img.width); const c = document.createElement("canvas");
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Not a valid image")); };
    img.src = url;
  });
}

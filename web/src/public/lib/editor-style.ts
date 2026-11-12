// Allowlists for the visual editor. Keep in sync with odoo/iof_site_content/models/_style.py.
export const ALIGN = ["left", "center", "right", "justify"] as const;
export const SIZE = ["sm", "md", "lg", "xl"] as const;
export const COLOR = ["navy", "orange", "green", "slate", "white"] as const;
export const SECTION_BG = ["none", "white", "soft", "warm"] as const;
export const SECTION_SPACE = ["none", "md", "lg"] as const;

export type TextStyle = { align?: (typeof ALIGN)[number]; size?: (typeof SIZE)[number]; color?: (typeof COLOR)[number] };
export type SectionStyle = { bg?: (typeof SECTION_BG)[number]; space?: (typeof SECTION_SPACE)[number] };
export type Layout = { order: string[]; hidden: string[]; sections: Record<string, SectionStyle> };

const has = <T extends readonly string[]>(list: T, v: unknown): v is T[number] => typeof v === "string" && (list as readonly string[]).includes(v);

export function cleanStyle(raw: unknown): TextStyle {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: TextStyle = {};
  if (has(ALIGN, r.align)) out.align = r.align;
  if (has(SIZE, r.size) && r.size !== "md") out.size = r.size;
  if (has(COLOR, r.color)) out.color = r.color;
  return out;
}

export function cleanLayout(raw: unknown): Layout {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const sections: Record<string, SectionStyle> = {};
  for (const [id, st] of Object.entries((r.sections && typeof r.sections === "object" ? r.sections : {}) as Record<string, Record<string, unknown>>)) {
    const s: SectionStyle = {};
    if (has(SECTION_BG, st?.bg) && st.bg !== "none") s.bg = st.bg;
    if (has(SECTION_SPACE, st?.space) && st.space !== "none") s.space = st.space;
    if (s.bg || s.space) sections[id] = s;
  }
  return { order: ids(r.order), hidden: ids(r.hidden), sections };
}

/** CSS classes (defined in globals.css) for a text style. Empty string = default look. */
export function textClass(s?: TextStyle): string {
  if (!s) return "";
  return [s.align && `te-${s.align}`, s.size && `ts-${s.size}`, s.color && `tc-${s.color}`].filter(Boolean).join(" ");
}

/** Section ids in display order: saved order first, then any section the layout does not know yet (page order). */
export function orderSections<T extends { id: string }>(defs: T[], layout: Layout): T[] {
  const byId = new Map(defs.map((d) => [d.id, d]));
  const seen = new Set<string>();
  const out: T[] = [];
  for (const id of layout.order) {
    const d = byId.get(id);
    if (d && !seen.has(id)) { out.push(d); seen.add(id); }
  }
  for (const d of defs) if (!seen.has(d.id)) out.push(d);
  return out;
}

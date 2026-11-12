import { Fragment, type ReactNode } from "react";
import { orderSections, type Content } from "@/public/lib/content";

export type SectionDef = { id: string; label?: string; dark?: boolean; node: ReactNode };

/** Renders a page's sections in the saved order. Hidden sections only exist in the editor (never in public HTML). */
export function Sections({ page, c, defs }: { page: string; c: Content; defs: SectionDef[] }) {
  const layout = c.layout(page);
  const hidden = new Set(layout.hidden);
  return (
    <>
      {orderSections(defs, layout).map((d) => {
        const isHidden = hidden.has(d.id);
        if (isHidden && !c.editing) return null;
        const st = layout.sections[d.id] ?? {};
        const cls = [st.bg && `sb-${st.bg}`, st.space && `sp-${st.space}`].filter(Boolean).join(" ");
        if (!c.editing && !cls) return <Fragment key={d.id}>{d.node}</Fragment>;
        return (
          <div key={d.id} className={cls || undefined}
            {...(c.editing ? { "data-sec": d.id, "data-page": page, "data-label": d.label ?? d.id, "data-hidden": isHidden ? "1" : "0", "data-dark": d.dark ? "1" : "0", "data-ss": JSON.stringify(st) } : {})}>
            {d.node}
          </div>
        );
      })}
    </>
  );
}

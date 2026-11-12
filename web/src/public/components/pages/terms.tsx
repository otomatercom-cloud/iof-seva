import { PageHero, Prose } from "@/public/components/sections/page-hero";
import { RichText } from "@/public/components/ui/rich-text";
import { getContent } from "@/public/lib/content";
import { Sections } from "@/public/components/sections/sections";

export async function TermsPage({ editing = false }: { editing?: boolean }) {
  const c = await getContent(editing);
  return (
    <Sections page="terms" c={c} defs={[
    { id: "s1", label: "Section 1", node: (
          <PageHero title={c.e("terms.title")} intro={c.e("terms.intro")} />
    ) },
    { id: "s2", label: "Section 2", node: (
          <Prose>
            {/* DRAFT text: IOF's committee / legal adviser must review before launch (edit in Odoo > Website Content). */}
            <div {...(c.editing ? { "data-elong": "terms.body", "data-value": c.raw("terms.body") } : {})}>
            <RichText source={c.raw("terms.body")} email={c.t("site.email")} />
          </div>
          </Prose>
    ) },
    ]} />
  );
}

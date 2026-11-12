import { PageHero, Prose } from "@/public/components/sections/page-hero";
import { RichText } from "@/public/components/ui/rich-text";
import { getContent } from "@/public/lib/content";
import { Sections } from "@/public/components/sections/sections";

export async function PrivacyPage({ editing = false }: { editing?: boolean }) {
  const c = await getContent(editing);
  return (
    <Sections page="privacy-policy" c={c} defs={[
    { id: "s1", label: "Section 1", node: (
          <PageHero title={c.e("privacy.title")} intro={c.e("privacy.intro")} />
    ) },
    { id: "s2", label: "Section 2", node: (
          <Prose>
            {/* DRAFT text: IOF's committee / legal adviser must review before launch (edit in Odoo > Website Content). */}
            <div {...(c.editing ? { "data-elong": "privacy.body", "data-value": c.raw("privacy.body") } : {})}>
            <RichText source={c.raw("privacy.body")} email={c.t("site.email")} />
          </div>
          </Prose>
    ) },
    ]} />
  );
}

import { PageHero, Section } from "@/public/components/sections/page-hero";
import { JoinVolunteerButton } from "@/public/components/ui/button";
import { Card } from "@/public/components/ui/card";
import { getContent } from "@/public/lib/content";
import { Sections } from "@/public/components/sections/sections";

export async function IndiansInKsaPage({ editing = false }: { editing?: boolean }) {
  const c = await getContent(editing);
  return (
    <Sections page="indians-in-ksa" c={c} defs={[
    { id: "s1", label: "Section 1", node: (
          <PageHero title={c.e("indians.title")} intro={c.e("indians.intro")} />
    ) },
    { id: "s2", label: "Section 2", node: (
          <Section title={c.e("indians.helps.title")}>
            <div className="grid gap-6 md:grid-cols-2">
              {c.items("helps").map((h) => (
                <Card key={h.title}><h3 className="text-lg">{c.ei(h, "title")}</h3><p className="mt-2 text-sm text-slate-600">{c.ei(h, "text")}</p></Card>
              ))}
            </div>
          </Section>
    ) },
    { id: "s3", label: "Section 3", node: (
          <Section tone="tint" title={c.e("indians.faq.title")}>
            <dl className="mx-auto max-w-3xl space-y-4">
              {c.items("faq").map((f) => (
                <Card key={f.title}><dt className="font-semibold text-navy-900">{c.ei(f, "title")}</dt><dd className="mt-1 text-sm text-slate-600">{c.ei(f, "text")}</dd></Card>
              ))}
            </dl>
            <p className="mx-auto mt-6 max-w-3xl text-xs text-slate-500">{c.e("indians.faq.note")}</p>
            <div className="mt-8 text-center"><JoinVolunteerButton label={c.t("site.join")} /></div>
          </Section>
    ) },
    ]} />
  );
}

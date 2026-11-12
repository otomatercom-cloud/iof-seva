import { PageHero, Section } from "@/public/components/sections/page-hero";
import { Card } from "@/public/components/ui/card";
import { getContent } from "@/public/lib/content";
import { Sections } from "@/public/components/sections/sections";

export async function ReportsPage({ editing = false }: { editing?: boolean }) {
  const c = await getContent(editing);
  return (
    <Sections page="reports" c={c} defs={[
    { id: "s1", label: "Section 1", node: (
          <PageHero title={c.e("reports.title")} intro={c.e("reports.intro")} />
    ) },
    { id: "s2", label: "Section 2", node: (
          <Section>
            <div className="grid gap-6 md:grid-cols-3">
              {c.items("reports").map((r) => (
                <Card key={r.title}>
                  <h2 className="text-xl">{c.ei(r, "title")}</h2>
                  <p className="mt-2 text-sm text-slate-600">{c.ei(r, "text")}</p>
                  {r.file && (
                    <a href={r.file} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-navy-900 underline">
                      {c.e("reports.download")}
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </Section>
    ) },
    ]} />
  );
}

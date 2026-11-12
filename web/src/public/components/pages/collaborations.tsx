import { PageHero, Section } from "@/public/components/sections/page-hero";
import { Card } from "@/public/components/ui/card";
import { getContent } from "@/public/lib/content";
import { Sections } from "@/public/components/sections/sections";

export async function CollaborationsPage({ editing = false }: { editing?: boolean }) {
  const c = await getContent(editing);
  const email = c.t("site.email");
  const subject = encodeURIComponent("Partnership enquiry");
  return (
    <Sections page="collaborations" c={c} defs={[
    { id: "s1", label: "Section 1", node: (
          <PageHero title={c.e("collab.title")} intro={c.e("collab.intro")} />
    ) },
    { id: "s2", label: "Section 2", node: (
          <Section>
            <div className="grid gap-6 md:grid-cols-3">
              {c.items("collab_cards").map((k) => (
                <Card key={k.title}><h2 className="text-lg">{c.ei(k, "title")}</h2><p className="mt-2 text-sm text-slate-600">{c.ei(k, "text")}</p></Card>
              ))}
            </div>
            <div className="mx-auto mt-12 max-w-2xl rounded-2xl bg-navy-50 p-8 text-center">
              <h2 className="text-2xl">{c.e("collab.enquiry.title")}</h2>
              <p className="mt-2 text-slate-600">{c.e("collab.enquiry.text")}</p>
              <a href={`mailto:${email}?subject=${subject}`}
                className="mt-5 inline-block rounded-full bg-saffron-700 px-6 py-3 text-sm font-semibold text-white hover:bg-saffron-600">
                {c.e("collab.enquiry.button")} {email}
              </a>
            </div>
          </Section>
    ) },
    ]} />
  );
}

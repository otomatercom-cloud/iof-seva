import { PageHero, Section } from "@/public/components/sections/page-hero";
import { JoinVolunteerButton } from "@/public/components/ui/button";
import { Card, FeatureCard } from "@/public/components/ui/card";
import { Icon } from "@/public/components/ui/icon";
import { getContent } from "@/public/lib/content";
import { Sections } from "@/public/components/sections/sections";

export async function AboutPage({ editing = false }: { editing?: boolean }) {
  const c = await getContent(editing);
  const i = "size-6";
  return (
    <Sections page="about" c={c} defs={[
    { id: "s1", label: "Section 1", node: (
          <PageHero title={c.e("about.title")} intro={c.e("about.intro")} />
    ) },
    { id: "s2", label: "Section 2", node: (
          <Section>
            <div className="grid gap-6 md:grid-cols-2">
              <Card><h2 className="text-2xl">{c.e("about.mission.title")}</h2>
                <p className="mt-3 text-slate-600">{c.e("about.mission.text")}</p></Card>
              <Card><h2 className="text-2xl">{c.e("about.goals.title")}</h2>
                <ul className="mt-3 list-decimal space-y-1 pl-5 text-slate-600">
                  {c.items("goals").map((g) => <li key={g.title}>{c.ei(g, "title")}</li>)}
                </ul></Card>
            </div>
          </Section>
    ) },
    { id: "s3", label: "Section 3", node: (
          <Section tone="tint" title={c.e("about.forums.title")} intro={c.e("about.forums.intro")}>
            <div className="grid gap-6 md:grid-cols-3">
              {c.items("forums").map((f) => <FeatureCard key={f.title} icon={<Icon name={f.icon} className={i} />} title={c.ei(f, "title")}>{c.ei(f, "text")}</FeatureCard>)}
            </div>
          </Section>
    ) },
    { id: "s4", label: "Section 4", node: (
          <Section title={c.e("about.support.title")}>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {c.items("support").map((f) => <FeatureCard key={f.title} icon={<Icon name={f.icon} className={i} />} title={c.ei(f, "title")}>{c.ei(f, "text")}</FeatureCard>)}
            </div>
            <div className="mt-10 text-center"><JoinVolunteerButton label={c.t("site.join")} /></div>
          </Section>
    ) },
    ]} />
  );
}

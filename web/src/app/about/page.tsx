import type { Metadata } from "next";
import { PageHero, Section } from "@/components/sections/page-hero";
import { JoinVolunteerButton } from "@/components/ui/button";
import { Card, FeatureCard } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { getContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getContent()).t("nav.about") };
}

export default async function AboutPage() {
  const c = await getContent();
  const i = "size-6";
  return (
    <>
      <PageHero title={c.t("about.title")} intro={c.t("about.intro")} />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <Card><h2 className="text-2xl">{c.t("about.mission.title")}</h2>
            <p className="mt-3 text-slate-600">{c.t("about.mission.text")}</p></Card>
          <Card><h2 className="text-2xl">{c.t("about.goals.title")}</h2>
            <ul className="mt-3 list-decimal space-y-1 pl-5 text-slate-600">
              {c.items("goals").map((g) => <li key={g.title}>{g.title}</li>)}
            </ul></Card>
        </div>
      </Section>
      <Section tone="tint" title={c.t("about.forums.title")} intro={c.t("about.forums.intro")}>
        <div className="grid gap-6 md:grid-cols-3">
          {c.items("forums").map((f) => <FeatureCard key={f.title} icon={<Icon name={f.icon} className={i} />} title={f.title}>{f.text}</FeatureCard>)}
        </div>
      </Section>
      <Section title={c.t("about.support.title")}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {c.items("support").map((f) => <FeatureCard key={f.title} icon={<Icon name={f.icon} className={i} />} title={f.title}>{f.text}</FeatureCard>)}
        </div>
        <div className="mt-10 text-center"><JoinVolunteerButton label={c.t("site.join")} /></div>
      </Section>
    </>
  );
}

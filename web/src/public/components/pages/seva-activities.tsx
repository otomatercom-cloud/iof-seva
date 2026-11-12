import { PageHero, Section } from "@/public/components/sections/page-hero";
import { PhotoGallery } from "@/public/components/sections/photo-gallery";
import { ButtonLink, JoinVolunteerButton } from "@/public/components/ui/button";
import { FeatureCard } from "@/public/components/ui/card";
import { Icon } from "@/public/components/ui/icon";
import { getContent } from "@/public/lib/content";
import { Sections } from "@/public/components/sections/sections";

export async function SevaActivitiesPage({ editing = false }: { editing?: boolean }) {
  const c = await getContent(editing);
  const photos = c.items("gallery").map((g) => ({ src: g.image, alt: g.title }));
  return (
    <Sections page="seva-activities" c={c} defs={[
    { id: "s1", label: "Section 1", node: (
          <PageHero title={c.e("seva.title")} intro={c.e("seva.intro")} />
    ) },
    { id: "s2", label: "Section 2", node: (
          <Section>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {c.items("activities").map((a) => (
                <FeatureCard key={a.title} icon={<Icon name={a.icon} className="size-6" />} title={c.ei(a, "title")}>{c.ei(a, "text")}</FeatureCard>
              ))}
            </div>
          </Section>
    ) },
    { id: "s3", label: "Section 3", node: (
          <Section tone="tint" title={c.e("seva.gallery.title")} intro={c.e("seva.gallery.intro")}>
            <PhotoGallery photos={photos} limit={6} />
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/gallery" variant="secondary">{c.e("seva.gallery.link")}</ButtonLink>
              <JoinVolunteerButton label={c.t("site.join")} />
            </div>
          </Section>
    ) },
    ]} />
  );
}

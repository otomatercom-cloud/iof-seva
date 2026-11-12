import { PageHero, Section } from "@/public/components/sections/page-hero";
import { PhotoGallery } from "@/public/components/sections/photo-gallery";
import { JoinVolunteerButton } from "@/public/components/ui/button";
import { getContent } from "@/public/lib/content";
import { Sections } from "@/public/components/sections/sections";

export async function GalleryPage({ editing = false }: { editing?: boolean }) {
  const c = await getContent(editing);
  const photos = c.items("gallery").map((g) => ({ src: g.image, alt: g.title }));
  return (
    <Sections page="gallery" c={c} defs={[
    { id: "s1", label: "Section 1", node: (
          <PageHero title={c.e("gallery.title")} intro={c.e("gallery.intro")} />
    ) },
    { id: "s2", label: "Section 2", node: (
          <Section>
            <PhotoGallery photos={photos} />
            <div className="mt-12 text-center">
              <p className="mb-4 text-slate-600">{c.e("gallery.cta")}</p>
              <JoinVolunteerButton label={c.t("site.join")} />
            </div>
          </Section>
    ) },
    ]} />
  );
}

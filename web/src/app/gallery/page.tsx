import type { Metadata } from "next";
import { PhotoGallery } from "@/components/sections/photo-gallery";
import { PageHero, Section } from "@/components/sections/page-hero";
import { JoinVolunteerButton } from "@/components/ui/button";
import { GALLERY } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description: "Snapshots of community moments and seva activities by India Overseas Forum in Saudi Arabia.",
};

export default function GalleryPage() {
  return (
    <>
      <PageHero title="Photo Gallery" intro="Snapshots of community moments and heartfelt seva activities across Saudi Arabia." />
      <Section>
        <PhotoGallery photos={GALLERY} />
        <div className="mt-12 text-center">
          <p className="mb-4 text-slate-600">Be part of the next moment.</p>
          <JoinVolunteerButton />
        </div>
      </Section>
    </>
  );
}

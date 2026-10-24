import { Droplet, GraduationCap, HeartPulse, LifeBuoy, Utensils } from "lucide-react";
import type { Metadata } from "next";
import { PageHero, Section } from "@/components/sections/page-hero";
import { ButtonLink, JoinVolunteerButton } from "@/components/ui/button";
import { FeatureCard } from "@/components/ui/card";
import { GALLERY } from "@/lib/gallery";
import { PhotoGallery } from "@/components/sections/photo-gallery";

export const metadata: Metadata = { title: "Seva Activities" };

export default function SevaActivitiesPage() {
  const i = "size-6";
  return (
    <>
      <PageHero title="Seva Activities" intro="Service in action: how IOF volunteers support families across Saudi Arabia." />
      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={<Droplet className={i} />} title="Blood Donation">Regular blood donation camps supporting local hospitals and patients.</FeatureCard>
          <FeatureCard icon={<GraduationCap className={i} />} title="Educational Aid">Scholarships and learning materials for Indian children in Saudi Arabia.</FeatureCard>
          <FeatureCard icon={<HeartPulse className={i} />} title="Medical Support">Help with medical consultations and emergency healthcare for community members.</FeatureCard>
          <FeatureCard icon={<LifeBuoy className={i} />} title="Emergency Relief">Quick crisis response, supplying essentials to Indian families affected by emergencies.</FeatureCard>
          <FeatureCard icon={<Utensils className={i} />} title="Food &amp; Supplies">Food and supplies for families in need across Saudi Arabia.</FeatureCard>
        </div>
      </Section>
      <Section tone="tint" title="Gallery" intro="Snapshots of community moments and seva activities.">
        <PhotoGallery photos={GALLERY} limit={6} />
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/gallery" variant="secondary">View full gallery</ButtonLink>
          <JoinVolunteerButton />
        </div>
      </Section>
    </>
  );
}

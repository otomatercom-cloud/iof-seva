import { Droplet, GraduationCap, HeartPulse, LifeBuoy, Utensils } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import { PageHero, Section } from "@/components/sections/page-hero";
import { JoinVolunteerButton } from "@/components/ui/button";
import { FeatureCard } from "@/components/ui/card";
import { images } from "@/lib/utils";

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
        <div className="grid gap-4 sm:grid-cols-3">
          {images.moments.map((src, n) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-2xl">
              <Image src={src} alt={`Community moment ${n + 1}`} fill sizes="(min-width:640px) 33vw, 100vw" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="mt-10 text-center"><JoinVolunteerButton /></div>
      </Section>
    </>
  );
}

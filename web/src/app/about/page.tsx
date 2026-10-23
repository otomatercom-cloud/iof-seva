import { GraduationCap, HeartPulse, PartyPopper, Siren, Stethoscope, Briefcase, School } from "lucide-react";
import type { Metadata } from "next";
import { PageHero, Section } from "@/components/sections/page-hero";
import { JoinVolunteerButton } from "@/components/ui/button";
import { Card, FeatureCard } from "@/components/ui/card";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  const i = "size-6";
  return (
    <>
      <PageHero title="About India Overseas Forum"
        intro="A nonprofit supporting the Indian community in Saudi Arabia through welfare programs, cultural events, and volunteer-driven initiatives." />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <Card><h2 className="text-2xl">Our mission</h2>
            <p className="mt-3 text-slate-600">To become a leading organization that serves, educates, and creates business opportunities for the Indian diaspora in Saudi Arabia.</p></Card>
          <Card><h2 className="text-2xl">Our goals</h2>
            <ul className="mt-3 list-decimal space-y-1 pl-5 text-slate-600">
              <li>Serve needy members of the Indian diaspora in KSA.</li>
              <li>Expand trade and commerce between KSA and India.</li>
              <li>Educate the diaspora about Indian government policies.</li>
            </ul></Card>
        </div>
      </Section>
      <Section tone="tint" title="Our forums" intro="Three volunteer-led forums are planned to widen IOF's reach.">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard icon={<Stethoscope className={i} />} title="Medical Forum">Connects Indian medical professionals in KSA.</FeatureCard>
          <FeatureCard icon={<School className={i} />} title="Teacher Forum">Connects Indian teachers at IIS schools across KSA and promotes yoga in Indian schools.</FeatureCard>
          <FeatureCard icon={<Briefcase className={i} />} title="Business Forum">Connects Indian business owners to create jobs in KSA and India.</FeatureCard>
        </div>
      </Section>
      <Section title="Community support">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={<PartyPopper className={i} />} title="Cultural Events">Festival celebrations with music and dance.</FeatureCard>
          <FeatureCard icon={<HeartPulse className={i} />} title="Medical Aid">Timely medical assistance and health camps.</FeatureCard>
          <FeatureCard icon={<GraduationCap className={i} />} title="Educational Support">Scholarships and tutoring for Indian students abroad.</FeatureCard>
          <FeatureCard icon={<Siren className={i} />} title="Rapid Response">Aid during crises to help keep the community safe.</FeatureCard>
        </div>
        <div className="mt-10 text-center"><JoinVolunteerButton /></div>
      </Section>
    </>
  );
}

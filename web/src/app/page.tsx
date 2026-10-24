import {
  CollabAndReports, ContactStrip, Hero, Impact, Intro, Marquee, OurMoments, Pillars, VolunteerCta,
} from "@/components/sections/home";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Intro />
      <Pillars />
      <Impact />
      <OurMoments />
      <VolunteerCta />
      <CollabAndReports />
      <ContactStrip />
    </>
  );
}

import {
  CollabAndReports, ContactStrip, Hero, Impact, Intro, Marquee, Pillars, VolunteerCta,
} from "@/components/sections/home";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Intro />
      <Pillars />
      <Impact />
      <VolunteerCta />
      <CollabAndReports />
      <ContactStrip />
    </>
  );
}

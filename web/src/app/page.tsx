import {
  CollabAndReports, ContactStrip, Hero, Impact, Intro, Marquee, OurMoments, Pillars, VolunteerCta,
} from "@/components/sections/home";
import { Events } from "@/components/sections/events";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Intro />
      <Pillars />
      <Impact />
      <Events />
      <OurMoments />
      <VolunteerCta />
      <CollabAndReports />
      <ContactStrip />
    </>
  );
}

import {
  Collaboration, ContactStrip, FeaturedSeva, Hero, Impact, Intro, Pillars, ReportsPreview, VolunteerCta,
} from "@/components/sections/home";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <Pillars />
      <FeaturedSeva />
      <Impact />
      <VolunteerCta />
      <Collaboration />
      <ReportsPreview />
      <ContactStrip />
    </>
  );
}

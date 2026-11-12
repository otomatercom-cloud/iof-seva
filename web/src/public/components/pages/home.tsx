import { Events } from "@/public/components/sections/events";
import {
  CollabAndReports, ContactStrip, Hero, Impact, Intro, Marquee, OurMoments, Pillars, VolunteerCta,
} from "@/public/components/sections/home";
import { Sections } from "@/public/components/sections/sections";
import { getContent } from "@/public/lib/content";

export async function HomePage({ editing = false }: { editing?: boolean }) {
  const c = await getContent(editing);
  const e = editing;
  return (
    <Sections page="home" c={c} defs={[
      { id: "hero", label: "Hero", dark: true, node: <Hero editing={e} /> },
      { id: "marquee", label: "Services strip", node: <Marquee editing={e} /> },
      { id: "intro", label: "About intro", node: <Intro editing={e} /> },
      { id: "pillars", label: "Pillars", node: <Pillars editing={e} /> },
      { id: "impact", label: "Impact", dark: true, node: <Impact editing={e} /> },
      { id: "events", label: "Events", node: <Events editing={e} /> },
      { id: "moments", label: "Our moments", node: <OurMoments editing={e} /> },
      { id: "volunteer", label: "Volunteer call", node: <VolunteerCta editing={e} /> },
      { id: "collab", label: "Collaborations & reports", dark: true, node: <CollabAndReports editing={e} /> },
      { id: "contact", label: "Contact", node: <ContactStrip editing={e} /> },
    ]} />
  );
}

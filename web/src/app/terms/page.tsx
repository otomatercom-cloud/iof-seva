import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/components/layout/site-nav";
import { PageHero, Prose } from "@/components/sections/page-hero";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <>
      <PageHero title="Terms & Conditions" intro="Terms for using this website and registering as a volunteer." />
      <Prose>
        {/* DRAFT: have IOF's committee / legal adviser review before launch. */}
        <h2>Use of this website</h2>
        <p>This website is provided by India Overseas Forum (IOF) to share information about our activities and to register volunteers. Please use it lawfully and do not attempt to disrupt or misuse it.</p>
        <h2>Volunteer registration</h2>
        <p>By registering you confirm that the information you provide is true and accurate and that you voluntarily agree to take part in IOF Seva activities. Registration does not guarantee a volunteer role; IOF may review, accept or decline registrations.</p>
        <h2>Accuracy of information</h2>
        <p>General guidance on this site (for example on passports or Iqama services) is not official advice. Always confirm requirements with the relevant embassy or authority.</p>
        <h2>Changes</h2>
        <p>We may update these terms from time to time. Continued use of the site means you accept the updated terms.</p>
        <h2>Contact</h2>
        <p>Questions: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </Prose>
    </>
  );
}

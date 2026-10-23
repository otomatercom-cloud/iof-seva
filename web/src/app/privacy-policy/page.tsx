import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/components/layout/site-nav";
import { PageHero, Prose } from "@/components/sections/page-hero";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero title="Privacy Policy" intro="How India Overseas Forum handles volunteer information." />
      <Prose>
        {/* DRAFT: have IOF's committee / legal adviser review before launch. */}
        <p>This policy explains what personal information we collect when you register as a volunteer, why we collect it and how it is protected.</p>
        <h2>Information we collect</h2>
        <p>Through the volunteer registration form we collect your name, contact details, optional personal and professional details, volunteer interests and availability, an emergency contact, and your consent. We ask only for what we need to coordinate volunteers.</p>
        <h2>How we use it</h2>
        <ul>
          <li>To review your registration and contact you about volunteer opportunities, events and community initiatives.</li>
          <li>To contact your emergency contact if needed during activities.</li>
          <li>To keep records of volunteer participation.</li>
        </ul>
        <h2>Storage and access</h2>
        <p>Registrations are stored in IOF&apos;s secure registration system and are accessible only to authorised IOF staff. Data is sent over encrypted connections. We do not sell your information.</p>
        <h2>Sharing</h2>
        <p>We do not share your personal information with third parties except where required by law.</p>
        <h2>Your choices</h2>
        <p>You may ask to see, correct or delete your information, or withdraw your consent to be contacted, by emailing <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and quoting your registration reference.</p>
        <h2>Contact</h2>
        <p>Questions about this policy: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </Prose>
    </>
  );
}

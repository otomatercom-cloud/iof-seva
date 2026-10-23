import { Clock, Mail, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/components/layout/site-nav";
import { PageHero, Section } from "@/components/sections/page-hero";
import { JoinVolunteerButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <>
      <PageHero title="Contact Us" intro="We'd love to hear from you." />
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          <Card><Mail className="size-6 text-navy-900" aria-hidden /><h2 className="mt-3 text-lg">Email</h2>
            <a className="mt-1 block text-sm text-navy-900 underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></Card>
          <Card><MapPin className="size-6 text-navy-900" aria-hidden /><h2 className="mt-3 text-lg">Address</h2>
            <p className="mt-1 text-sm text-slate-600">Riyadh, Saudi Arabia</p></Card>
          <Card><Clock className="size-6 text-navy-900" aria-hidden /><h2 className="mt-3 text-lg">Office hours</h2>
            <p className="mt-1 text-sm text-slate-600">9am – 6pm</p></Card>
        </div>
        <div className="mt-12 text-center">
          <p className="mb-4 text-slate-600">Want to help? Support and uplift the Indian community in Saudi Arabia.</p>
          <JoinVolunteerButton />
        </div>
      </Section>
    </>
  );
}

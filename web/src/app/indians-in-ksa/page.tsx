import type { Metadata } from "next";
import { PageHero, Section } from "@/components/sections/page-hero";
import { JoinVolunteerButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Indians in KSA" };

const faqs = [
  ["Passport renewal", "Check the embassy website for current guidelines and required documents."],
  ["Iqama services", "Visit the Jawazat office or use the Absher online portal."],
  ["Madad registration", "Register on the Madad platform through the embassy website."],
  ["Travel advisories", "Look in the news section of the embassy website."],
  ["Volunteering", "Fill out the volunteer registration form on this website."],
];

export default function IndiansInKsaPage() {
  return (
    <>
      <PageHero title="Indians in KSA" intro="Information and support for Indian residents across Saudi Arabia." />
      <Section title="How IOF helps">
        <div className="grid gap-6 md:grid-cols-2">
          <Card><h3 className="text-lg">Medical aid &amp; health awareness</h3><p className="mt-2 text-sm text-slate-600">Support and awareness programs for Indian residents.</p></Card>
          <Card><h3 className="text-lg">Education support</h3><p className="mt-2 text-sm text-slate-600">Free tutoring and resource distribution for students.</p></Card>
        </div>
      </Section>
      <Section tone="tint" title="Frequently asked questions">
        <dl className="mx-auto max-w-3xl space-y-4">
          {faqs.map(([q, a]) => (
            <Card key={q}><dt className="font-semibold text-navy-900">{q}</dt><dd className="mt-1 text-sm text-slate-600">{a}</dd></Card>
          ))}
        </dl>
        <p className="mx-auto mt-6 max-w-3xl text-xs text-slate-500">
          This is general guidance. Always confirm requirements on the official Indian Embassy or Saudi government websites.
        </p>
        <div className="mt-8 text-center"><JoinVolunteerButton /></div>
      </Section>
    </>
  );
}

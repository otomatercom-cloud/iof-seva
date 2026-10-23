import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/components/layout/site-nav";
import { PageHero, Section } from "@/components/sections/page-hero";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Collaborations" };

export default function CollaborationsPage() {
  const subject = encodeURIComponent("Partnership enquiry");
  return (
    <>
      <PageHero title="Collaborations" intro="Partner with IOF to support Indian residents across Saudi Arabia." />
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          <Card><h2 className="text-lg">Health drives</h2><p className="mt-2 text-sm text-slate-600">Free medical check-ups and blood donation camps.</p></Card>
          <Card><h2 className="text-lg">Educational aid</h2><p className="mt-2 text-sm text-slate-600">Scholarships and learning materials for Indian students.</p></Card>
          <Card><h2 className="text-lg">Emergency relief</h2><p className="mt-2 text-sm text-slate-600">Rapid response teams that assist during crises.</p></Card>
        </div>
        <div className="mx-auto mt-12 max-w-2xl rounded-2xl bg-navy-50 p-8 text-center">
          <h2 className="text-2xl">Partnership enquiries</h2>
          <p className="mt-2 text-slate-600">Tell us about your organisation and how you would like to collaborate.</p>
          <a href={`mailto:${CONTACT_EMAIL}?subject=${subject}`}
            className="mt-5 inline-block rounded-full bg-saffron-700 px-6 py-3 text-sm font-semibold text-white hover:bg-saffron-600">
            Email {CONTACT_EMAIL}
          </a>
        </div>
      </Section>
    </>
  );
}

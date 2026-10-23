import type { Metadata } from "next";
import { PageHero, Section } from "@/components/sections/page-hero";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Reports" };

const reports = [
  ["Food Drive", "Providing nutritious meals to over 500 families during Ramadan across Saudi Arabia."],
  ["Education Aid", "Supporting underprivileged children with books and tuition assistance for brighter futures."],
  ["Health Camps", "Organizing free medical checkups and emergency aid for the Indian community in need."],
];

export default function ReportsPage() {
  return (
    <>
      <PageHero title="Reports & Updates" intro="A look at what our volunteers and supporters have achieved together." />
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {reports.map(([title, text]) => (
            <Card key={title}><h2 className="text-xl">{title}</h2><p className="mt-2 text-sm text-slate-600">{text}</p></Card>
          ))}
        </div>
      </Section>
    </>
  );
}

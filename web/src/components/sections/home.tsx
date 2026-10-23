import { Droplet, GraduationCap, HandHeart, HeartPulse, LifeBuoy, Mail, PartyPopper, Utensils } from "lucide-react";
import Image from "next/image";
import { CONTACT_EMAIL } from "@/components/layout/site-nav";
import { ButtonLink, JoinVolunteerButton } from "@/components/ui/button";
import { Card, FeatureCard, ImageCard } from "@/components/ui/card";
import { images } from "@/lib/utils";
import { Section } from "./page-hero";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-900 text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <p className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-medium">
            India Overseas Forum · Saudi Arabia
          </p>
          <h1 className="text-4xl text-white sm:text-5xl lg:text-6xl">Together, We Make a Difference.</h1>
          <p className="mt-5 max-w-xl text-lg text-slate-200">
            Connecting, supporting, and empowering the Indian community across Saudi Arabia every day.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <JoinVolunteerButton />
            <ButtonLink href="/seva-activities" variant="light">Explore Seva Activities</ButtonLink>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/20">
          <Image src={images.about} alt="IOF volunteers serving the community" fill priority
            sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}

export function Intro() {
  return (
    <Section>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl">About India Overseas Forum</h2>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          India Overseas Forum is a nonprofit dedicated to supporting the Indian community in Saudi Arabia through
          cultural events, welfare programs and volunteer-driven initiatives.
        </p>
        <ButtonLink href="/about" variant="secondary" className="mt-6">Learn More</ButtonLink>
      </div>
    </Section>
  );
}

export function Pillars() {
  const icon = "size-6";
  return (
    <Section tone="tint" title="How we support our community" intro="Four ways IOF stands with Indian families abroad.">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard icon={<HandHeart className={icon} />} title="Community Support">
          Assistance for Indian families across Saudi Arabia, delivered with warmth and dedication.
        </FeatureCard>
        <FeatureCard icon={<HeartPulse className={icon} />} title="Medical Aid">
          Timely medical assistance and health camps for those who need them.
        </FeatureCard>
        <FeatureCard icon={<GraduationCap className={icon} />} title="Education">
          Scholarships and tutoring that help Indian students thrive far from home.
        </FeatureCard>
        <FeatureCard icon={<PartyPopper className={icon} />} title="Cultural Activities">
          Festivals and traditions that keep the community spirit alive abroad.
        </FeatureCard>
      </div>
    </Section>
  );
}

export function FeaturedSeva() {
  return (
    <Section title="Featured seva activities">
      <div className="grid gap-6 md:grid-cols-3">
        <ImageCard src={images.community} alt="Community seva activity" title="Seva Programs">
          Blood donation camps, medical aid and educational support for those in need.
        </ImageCard>
        <ImageCard src={images.care} alt="Community care" title="Community Care">
          Support and assistance for Indian families, with warmth and dedication.
        </ImageCard>
        <ImageCard src={images.moments[0]} alt="Cultural celebration" title="Cultural Events">
          Celebrating Indian festivals and traditions to keep our heritage close.
        </ImageCard>
      </div>
      <div className="mt-10 text-center">
        <ButtonLink href="/seva-activities" variant="secondary">View all seva activities</ButtonLink>
      </div>
    </Section>
  );
}

export function Impact() {
  const items = [
    { icon: <Utensils className="size-6" />, title: "Food & supplies", text: "Essentials for families in need across Saudi Arabia." },
    { icon: <Droplet className="size-6" />, title: "Blood donation", text: "Regular camps supporting local hospitals and patients." },
    { icon: <LifeBuoy className="size-6" />, title: "Rapid response", text: "Quick crisis relief for Indian families affected by emergencies." },
  ];
  return (
    <section className="bg-navy-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center text-3xl text-white">Our community impact</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((i) => (
            <div key={i.title} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <div className="mb-3 text-saffron-50">{i.icon}</div>
              <h3 className="text-lg text-white">{i.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{i.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-slate-300">
          Our Ramadan food drive provided nutritious meals to over 500 families across Saudi Arabia.
        </p>
      </div>
    </section>
  );
}

export function VolunteerCta() {
  return (
    <section className="bg-seva-50">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl">Become a volunteer</h2>
        <p className="max-w-2xl text-slate-700">
          Join hands with us to make a difference through meaningful volunteer opportunities in blood donation,
          education, cultural events, medical support, emergency relief and more.
        </p>
        <JoinVolunteerButton />
      </div>
    </section>
  );
}

export function Collaboration() {
  return (
    <Section>
      <Card className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center sm:p-10">
        <h2 className="text-3xl">Collaborate with IOF</h2>
        <p className="max-w-2xl text-slate-600">
          Organisations, businesses and professionals are welcome to partner with us. Our planned Medical, Teacher and
          Business Forums connect the community with those who can help.
        </p>
        <ButtonLink href="/collaborations" variant="secondary">Partnership enquiries</ButtonLink>
      </Card>
    </Section>
  );
}

export function ReportsPreview() {
  const reports = [
    ["Food Drive", "Providing nutritious meals to over 500 families during Ramadan across Saudi Arabia."],
    ["Education Aid", "Supporting underprivileged children with books and tuition assistance."],
    ["Health Camps", "Free medical checkups and emergency aid for the Indian community in need."],
  ];
  return (
    <Section tone="tint" title="Reports and updates">
      <div className="grid gap-6 md:grid-cols-3">
        {reports.map(([t, d]) => (
          <Card key={t}><h3 className="text-lg">{t}</h3><p className="mt-2 text-sm text-slate-600">{d}</p></Card>
        ))}
      </div>
      <div className="mt-8 text-center"><ButtonLink href="/reports" variant="secondary">All reports</ButtonLink></div>
    </Section>
  );
}

export function ContactStrip() {
  return (
    <Section title="Get in touch">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
        <p className="text-slate-600">Riyadh, Saudi Arabia · Office hours 9am – 6pm</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 text-lg font-semibold text-navy-900 hover:underline">
          <Mail className="size-5" aria-hidden /> {CONTACT_EMAIL}
        </a>
      </div>
    </Section>
  );
}

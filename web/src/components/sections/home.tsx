import {
  ArrowRight, Check, Droplet, GraduationCap, HandHeart, HeartPulse, LifeBuoy, Mail, MapPin, PartyPopper, Users, Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/components/layout/site-nav";
import { JoinVolunteerButton } from "@/components/ui/button";
import { images } from "@/lib/utils";
import { Section } from "./page-hero";

const Eyebrow = ({ children, tone = "saffron" }: { children: string; tone?: "saffron" | "green" | "light" }) => (
  <span className={`text-[13px] font-bold uppercase tracking-[2px] ${tone === "green" ? "text-seva-700" : tone === "light" ? "text-[#ff9a5c]" : "text-saffron-700"}`}>
    {children}
  </span>
);

function DotGrid({ id }: { id: string }) {
  return (
    <svg aria-hidden className="absolute inset-0 size-full opacity-50">
      <defs><pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#1d3d6b" /></pattern></defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function FloatCard({ className, icon, tone, title, text }: {
  className: string; icon: React.ReactNode; tone: string; title: string; text: string;
}) {
  return (
    <div className={`absolute flex items-center gap-3.5 rounded-[20px] bg-white px-5 py-4 shadow-[0_24px_40px_-16px_rgba(0,0,0,.45)] ${className}`}>
      <span className={`flex size-11 items-center justify-center rounded-[14px] ${tone}`}>{icon}</span>
      <span className="flex flex-col">
        <b className="text-[15px] text-navy-900">{title}</b>
        <span className="text-xs text-slate-500">{text}</span>
      </span>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-900 text-white">
      <DotGrid id="hero-dots" />
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center gap-14 px-4 pb-24 pt-16 sm:px-8 lg:pt-24">
        <div className="min-w-0 flex-[1_1_520px]">
          <span className="anim-up inline-flex items-center gap-2.5 rounded-full bg-navy-700 px-4 py-2 text-[13px] font-semibold text-slate-200">
            <span className="size-2 rounded-full bg-green-400" /> India Overseas Forum · Saudi Arabia
          </span>
          <h1 className="anim-up delay-1 mt-6 text-5xl font-extrabold leading-[1.04] tracking-[-0.03em] text-white sm:text-6xl lg:text-[68px]">
            Together, We Make a <span className="text-[#ff9a5c]">Difference.</span>
          </h1>
          <p className="anim-up delay-2 mt-6 max-w-[540px] text-lg leading-relaxed text-slate-300 sm:text-xl">
            Connecting, supporting and empowering the Indian community across Saudi Arabia, every day, through service,
            culture and volunteering.
          </p>
          <div className="anim-up delay-3 mt-9 flex flex-wrap gap-3.5">
            <Link href="/volunteer-registration" className="btn-lift anim-pulse inline-flex items-center gap-2.5 rounded-full bg-saffron-600 px-8 py-4 text-base font-bold text-white">
              Join as Volunteer <ArrowRight className="size-[18px]" aria-hidden />
            </Link>
            <Link href="/seva-activities" className="btn-lift inline-flex items-center rounded-full bg-white px-8 py-4 text-base font-bold text-navy-900">
              Explore Seva Activities
            </Link>
          </div>
          <ul className="anim-up delay-4 mt-11 flex flex-wrap gap-7 text-sm font-medium text-slate-300">
            {["Blood donation camps", "Medical and education aid", "Emergency relief"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check className="size-[18px] text-green-400" aria-hidden />{t}</li>
            ))}
          </ul>
        </div>

        <div className="anim-up delay-2 relative h-[540px] min-w-0 max-w-[560px] flex-[1_1_440px]">
          <svg aria-hidden viewBox="0 0 520 520" className="anim-spin absolute inset-0 size-full">
            <circle cx="260" cy="260" r="240" fill="none" stroke="#2a5088" strokeWidth="1.5" strokeDasharray="4 10" />
            <circle cx="260" cy="20" r="9" fill="#ff9a5c" /><circle cx="500" cy="260" r="6" fill="#4ade80" />
          </svg>
          <div className="absolute left-[12%] top-[11%] h-[78%] w-[76%] overflow-hidden rounded-[36px] bg-navy-700 shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)]">
            <svg aria-hidden viewBox="0 0 400 420" className="size-full">
              <path className="anim-draw" d="M-10 330 C80 260 140 360 220 280 S340 200 420 250" fill="none" stroke="#ff9a5c" strokeWidth="3" strokeLinecap="round" />
              <path className="anim-draw" d="M-10 370 C90 310 150 400 230 330 S350 260 420 300" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" opacity=".8" />
              <circle cx="200" cy="130" r="64" fill="#0b2545" /><circle cx="200" cy="130" r="64" fill="none" stroke="#2a5088" strokeWidth="2" />
              <path d="M200 100 c-14 -20 -42 -8 -36 14 c4 16 24 28 36 40 c12 -12 32 -24 36 -40 c6 -22 -22 -34 -36 -14z" fill="#d24e0a" />
            </svg>
          </div>
          <FloatCard className="anim-float left-0 top-[7%]" tone="bg-saffron-50 text-saffron-700" icon={<Droplet className="size-[22px]" />}
            title="Blood Donation" text="Regular camps for local hospitals" />
          <FloatCard className="anim-float-2 right-0 top-[42%]" tone="bg-seva-50 text-seva-700" icon={<Utensils className="size-[22px]" />}
            title="Ramadan Food Drive" text="500+ families fed" />
          <FloatCard className="anim-float-3 bottom-[2%] left-[6%]" tone="bg-navy-50 text-navy-900" icon={<LifeBuoy className="size-[22px]" />}
            title="Rapid Response" text="Aid when the community needs it" />
        </div>
      </div>
    </section>
  );
}

const SERVICES = ["Blood Donation", "Educational Aid", "Medical Support", "Emergency Relief", "Food & Supplies", "Cultural Events"];

export function Marquee() {
  const items = [...SERVICES, ...SERVICES, ...SERVICES, ...SERVICES];
  return (
    <section aria-label="What we do" className="overflow-hidden border-b border-[#dbe5f2] bg-navy-50">
      <div className="anim-marquee flex items-center py-5" aria-hidden>
        {items.map((label, i) => (
          <span key={i} className="inline-flex items-center gap-3 whitespace-nowrap px-7 text-base font-bold text-navy-900">
            <span className="size-2 rounded-full bg-saffron-600" />{label}
          </span>
        ))}
      </div>
      <ul className="sr-only">{SERVICES.map((s) => <li key={s}>{s}</li>)}</ul>
    </section>
  );
}

export function Intro() {
  const goals = [
    "Serve needy members of the Indian diaspora in KSA.",
    "Expand trade and commerce between KSA and India.",
    "Educate the diaspora about Indian government policies.",
  ];
  return (
    <Section>
      <div className="flex flex-wrap items-center gap-16 py-8">
        <div className="reveal relative h-[460px] min-w-0 flex-[1_1_440px]">
          <div className="absolute left-0 top-0 h-[82%] w-[78%] overflow-hidden rounded-[32px] bg-navy-900">
            <Image src={images.about} alt="IOF volunteers serving the community" fill sizes="(min-width:1024px) 40vw, 90vw" className="object-cover" />
          </div>
          <div className="absolute bottom-0 right-0 flex h-[58%] w-[58%] items-center justify-center rounded-[32px] border-8 border-white bg-seva-50 text-seva-700">
            <Users className="size-20" strokeWidth={1.4} aria-hidden />
          </div>
          <div className="anim-float absolute bottom-[6%] left-[8%] rounded-2xl bg-saffron-600 px-5 py-3.5 text-[15px] font-bold text-white shadow-[0_20px_36px_-14px_rgba(184,69,8,.6)]">
            Volunteer-driven since day one
          </div>
        </div>
        <div className="reveal min-w-0 flex-[1_1_480px]">
          <Eyebrow>About IOF</Eyebrow>
          <h2 className="mt-3.5 text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-[44px]">A nonprofit that serves, educates and connects</h2>
          <p className="mt-5 text-lg leading-relaxed">
            India Overseas Forum is dedicated to uplifting the Indian community in Saudi Arabia through support, culture and
            service, with welfare programs, cultural events and volunteer-driven initiatives.
          </p>
          <ul className="mt-7 flex flex-col gap-3.5">
            {goals.map((g) => (
              <li key={g} className="flex items-start gap-3.5">
                <span className="flex size-7 flex-none items-center justify-center rounded-full bg-seva-50 text-seva-700"><Check className="size-4" strokeWidth={2.6} aria-hidden /></span>
                <span className="leading-relaxed text-slate-700">{g}</span>
              </li>
            ))}
          </ul>
          <Link href="/about" className="btn-lift mt-9 inline-flex rounded-full border-2 border-navy-900 px-7 py-3.5 text-[15px] font-bold text-navy-900 hover:bg-navy-900 hover:text-white">
            Learn more about us
          </Link>
        </div>
      </div>
    </Section>
  );
}

export function Pillars() {
  const items = [
    { icon: <HandHeart className="size-7" />, title: "Community Support", text: "Assistance for Indian families across Saudi Arabia, delivered with warmth and dedication." },
    { icon: <HeartPulse className="size-7" />, title: "Medical Aid", text: "Timely medical assistance and health camps for those who need them most." },
    { icon: <GraduationCap className="size-7" />, title: "Education", text: "Scholarships and tutoring that help Indian students thrive far from home." },
    { icon: <PartyPopper className="size-7" />, title: "Cultural Activities", text: "Festival celebrations with music and dance that keep our traditions alive abroad." },
  ];
  return (
    <section className="bg-[#f5f8fc]">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <Eyebrow>Seva Activities</Eyebrow>
          <h2 className="mt-3.5 text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-[44px]">How we stand with our community</h2>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <article key={p.title} className="lift reveal rounded-[28px] border border-slate-200 bg-white p-8">
              <span className="flex size-[60px] items-center justify-center rounded-[18px] bg-navy-50 text-navy-900">{p.icon}</span>
              <h3 className="mt-6 text-xl font-bold">{p.title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed">{p.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Impact() {
  const items = [
    { icon: <Droplet className="size-6" />, title: "Blood donation camps", text: "Regular camps supporting local hospitals and patients." },
    { icon: <HeartPulse className="size-6" />, title: "Health camps", text: "Free medical checkups and emergency aid for the Indian community." },
    { icon: <GraduationCap className="size-6" />, title: "Education aid", text: "Books and tuition assistance for underprivileged children." },
  ];
  return (
    <section className="relative overflow-hidden bg-navy-900 text-white">
      <DotGrid id="impact-dots" />
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center gap-16 px-4 py-24 sm:px-8">
        <div className="reveal min-w-0 flex-[1_1_380px]">
          <Eyebrow tone="light">Community Impact</Eyebrow>
          <div className="mt-3 text-[96px] font-extrabold leading-none tracking-[-0.04em] text-white sm:text-[128px]">
            500<span className="text-[#ff9a5c]">+</span>
          </div>
          <p className="mt-3 max-w-[420px] text-xl leading-relaxed text-slate-300">
            families received nutritious meals during Ramadan across Saudi Arabia through our Food Drive.
          </p>
        </div>
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-4">
          {items.map((i) => (
            <div key={i.title} className="lift reveal flex items-center gap-5 rounded-3xl border border-navy-700 bg-[#12315c] px-7 py-6">
              <span className="flex size-14 flex-none items-center justify-center rounded-2xl bg-navy-700 text-green-400">{i.icon}</span>
              <span className="flex flex-col gap-1">
                <b className="text-[19px] text-white">{i.title}</b>
                <span className="text-[15px] leading-normal text-slate-300">{i.text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VolunteerCta() {
  const tags = ["Community Service", "Blood Donation", "Educational Programs", "Cultural Events", "Youth Activities",
    "Medical Support", "Disaster Relief", "Event Management", "Social Media & Digital", "Fundraising"];
  return (
    <section className="bg-seva-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-10 px-4 py-24 sm:px-8">
        <div className="reveal min-w-0 flex-[1_1_520px]">
          <Eyebrow tone="green">Volunteer Hub</Eyebrow>
          <h2 className="mt-3.5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-[46px]">Your time can change a family&apos;s week.</h2>
          <p className="mt-4 max-w-[560px] text-lg leading-relaxed text-slate-700">
            Join hands with us in blood donation, education, cultural events, medical support, emergency relief and more.
            Registration takes a few minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link href="/volunteer-registration" className="btn-lift anim-pulse inline-flex items-center gap-2.5 rounded-full bg-saffron-700 px-8 py-4 text-base font-bold text-white">
              Join as Volunteer <ArrowRight className="size-[18px]" aria-hidden />
            </Link>
            <span className="text-sm font-semibold text-seva-700">Free · Flexible hours · Every skill welcome</span>
          </div>
        </div>
        <ul className="reveal flex min-w-0 flex-[1_1_380px] flex-wrap gap-3">
          {tags.map((t) => (
            <li key={t} className="lift rounded-full border border-[#bfe3cb] bg-white px-5 py-3 text-sm font-semibold text-[#14532d]">{t}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function CollabAndReports() {
  const reports = [
    ["Food Drive", "Nutritious meals for over 500 families during Ramadan."],
    ["Education Aid", "Books and tuition assistance for brighter futures."],
    ["Health Camps", "Free medical checkups and emergency aid."],
  ];
  return (
    <Section>
      <div className="reveal flex flex-wrap gap-6">
        <div className="min-w-0 flex-[1_1_560px] rounded-[32px] bg-navy-900 p-8 text-white sm:p-12">
          <Eyebrow tone="light">Collaborations</Eyebrow>
          <h3 className="mt-3.5 text-3xl font-extrabold leading-tight text-white">Partner with IOF to reach more families</h3>
          <p className="mt-4 leading-relaxed text-slate-300">
            Organisations and professionals are welcome. Our planned Medical, Teacher and Business Forums connect the
            community with those who can help.
          </p>
          <Link href="/collaborations" className="btn-lift mt-7 inline-flex rounded-full bg-white px-7 py-3.5 text-[15px] font-bold text-navy-900">Partnership enquiries</Link>
        </div>
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-4">
          <Eyebrow>Reports and updates</Eyebrow>
          {reports.map(([title, text]) => (
            <Link key={title} href="/reports" className="lift flex items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-white px-6 py-5">
              <span className="flex flex-col gap-1"><b className="text-lg text-navy-900">{title}</b><span className="text-sm leading-normal">{text}</span></span>
              <ArrowRight className="size-[22px] flex-none text-saffron-700" aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function ContactStrip() {
  return (
    <Section tone="tint" title="Get in touch">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
        <p className="flex items-center gap-2 text-slate-600"><MapPin className="size-4" aria-hidden /> Riyadh, Saudi Arabia · Office hours 9am – 6pm</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 text-lg font-semibold text-navy-900 hover:underline">
          <Mail className="size-5" aria-hidden /> {CONTACT_EMAIL}
        </a>
        <JoinVolunteerButton className="mt-3" />
      </div>
    </Section>
  );
}

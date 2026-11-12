import { Clock, Mail, MapPin } from "lucide-react";
import { PageHero, Section } from "@/public/components/sections/page-hero";
import { JoinVolunteerButton } from "@/public/components/ui/button";
import { Card } from "@/public/components/ui/card";
import { getContent } from "@/public/lib/content";
import { Sections } from "@/public/components/sections/sections";

export async function ContactPage({ editing = false }: { editing?: boolean }) {
  const c = await getContent(editing);
  const email = c.t("site.email");
  return (
    <Sections page="contact" c={c} defs={[
    { id: "s1", label: "Section 1", node: (
          <PageHero title={c.e("contact.title")} intro={c.e("contact.intro")} />
    ) },
    { id: "s2", label: "Section 2", node: (
          <Section>
            <div className="grid gap-6 md:grid-cols-3">
              <Card><Mail className="size-6 text-navy-900" aria-hidden /><h2 className="mt-3 text-lg">{c.e("contact.email_label")}</h2>
                <a className="mt-1 block text-sm text-navy-900 underline" href={`mailto:${email}`}>{email}</a></Card>
              <Card><MapPin className="size-6 text-navy-900" aria-hidden /><h2 className="mt-3 text-lg">{c.e("contact.address_label")}</h2>
                <p className="mt-1 text-sm text-slate-600">{c.e("site.address")}</p></Card>
              <Card><Clock className="size-6 text-navy-900" aria-hidden /><h2 className="mt-3 text-lg">{c.e("contact.hours_label")}</h2>
                <p className="mt-1 text-sm text-slate-600">{c.e("site.hours")}</p></Card>
            </div>
            <div className="mt-12 text-center">
              <p className="mb-4 text-slate-600">{c.e("contact.cta")}</p>
              <JoinVolunteerButton label={c.t("site.join")} />
            </div>
          </Section>
    ) },
    ]} />
  );
}

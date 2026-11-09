"use client";
import Link from "next/link";
import { useEffect } from "react";
import { ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, PageHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { RoleGuard } from "@/components/common/role-guard";
import { ImageField, ListEditor, TextF } from "@/components/site/cms-fields";
import { useSiteStore, loadSite, saveSiteSoon, type SiteContent } from "@/lib/site-cms";
import { canManageWebsite } from "@/lib/permissions";

const HEADS: [keyof SiteContent["headings"], string][] = [["services", "Seva / services"], ["causes", "Cases we support"], ["provinces", "Provinces"], ["process", "How it works"], ["commitments", "Commitments"], ["network", "Network numbers"], ["faq", "FAQ"], ["contact", "Contact"]];

function Editor() {
  const c = useSiteStore((s) => s.content);
  const set = useSiteStore((s) => s.set);
  const reset = useSiteStore((s) => s.reset);
  const { toast } = useToast();
  useEffect(() => { void loadSite(); }, []);
  useEffect(() => { saveSiteSoon(c, (err) => toast(err ? { kind: "error", title: "Website not saved", body: err } : { kind: "success", title: "Website saved" })); }, [c]); // eslint-disable-line react-hooks/exhaustive-deps
  const up = <K extends keyof SiteContent>(k: K, v: SiteContent[K]) => set((x) => ({ ...x, [k]: v }));

  return (
    <div>
      <PageHeader title="Website Content" description="Edit everything on the public IOF Seva website. Changes save automatically and go live on the site instantly."
        actions={<><Button variant="outline" onClick={() => { if (confirm("Reset all website content to the original text and remove uploaded images?")) { reset(); toast({ kind: "success", title: "Website content reset" }); } }}><RotateCcw /> Reset</Button>
          <Link href="/" target="_blank" className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"><ExternalLink className="size-4" /> View website</Link></>} />
      <Tabs defaultValue="hero">
        <TabsList>{[["hero", "Hero slider"], ["about", "About"], ["services", "Services"], ["causes", "Cases"], ["provinces", "Provinces"], ["steps", "How it works"], ["commit", "Commitments"], ["numbers", "Numbers"], ["faq", "FAQ"], ["headings", "Headings"], ["contact", "Contact & footer"]].map(([v, l]) => <TabsTrigger key={v} value={v}>{l}</TabsTrigger>)}</TabsList>

        <TabsContent value="hero">
          <Card className="mb-4"><CardBody className="max-w-xs p-4"><Field label="Seconds per slide" hint="Slides change automatically."><Input type="number" min={3} max={30} value={c.heroSeconds} onChange={(e) => up("heroSeconds", Math.max(3, +e.target.value || 6))} /></Field></CardBody></Card>
          <ListEditor items={c.hero} onChange={(v) => up("hero", v)} addLabel="Add slide" title={(s) => s.title} min={1}
            blank={() => ({ id: `h${Date.now()}`, eyebrow: "New slide", title: "Slide headline", text: "Short supporting text.", ctaLabel: "Report a case", ctaHref: "#contact", altLabel: "Learn more", altHref: "#about", icon: "home" as const, image: "" })}
            render={(s, p) => <>
              <div className="md:col-span-2"><ImageField label="Slide picture" value={s.image} onChange={(v) => p({ image: v })} hint="Wide photo works best (≥1600px). Leave empty to use the animated illustration." /></div>
              <TextF label="Small heading" value={s.eyebrow} onChange={(v) => p({ eyebrow: v })} />
              <Field label="Illustration (when no picture)"><Select value={s.icon} onChange={(e) => p({ icon: e.target.value as typeof s.icon })}><option value="scale">Scales of justice</option><option value="cross">Medical cross</option><option value="home">Home</option></Select></Field>
              <div className="md:col-span-2"><TextF label="Headline" value={s.title} onChange={(v) => p({ title: v })} /></div>
              <div className="md:col-span-2"><TextF label="Text" area value={s.text} onChange={(v) => p({ text: v })} /></div>
              <TextF label="Main button label" value={s.ctaLabel} onChange={(v) => p({ ctaLabel: v })} /><TextF label="Main button link" value={s.ctaHref} onChange={(v) => p({ ctaHref: v })} hint="e.g. #contact or https://…" />
              <TextF label="Second button label" value={s.altLabel} onChange={(v) => p({ altLabel: v })} /><TextF label="Second button link" value={s.altHref} onChange={(v) => p({ altHref: v })} />
            </>} />
        </TabsContent>

        <TabsContent value="about"><Card><CardBody className="grid gap-4 md:grid-cols-2">
          <TextF label="Small heading" value={c.about.eyebrow} onChange={(v) => up("about", { ...c.about, eyebrow: v })} /><TextF label="Button label" value={c.about.buttonLabel} onChange={(v) => up("about", { ...c.about, buttonLabel: v })} />
          <div className="md:col-span-2"><TextF label="Title" value={c.about.title} onChange={(v) => up("about", { ...c.about, title: v })} /></div>
          <div className="md:col-span-2"><TextF label="Paragraph" area rows={4} value={c.about.lead} onChange={(v) => up("about", { ...c.about, lead: v })} /></div>
          <TextF label="Badge number" value={c.about.badgeNumber} onChange={(v) => up("about", { ...c.about, badgeNumber: v })} /><TextF label="Badge text" value={c.about.badgeText} onChange={(v) => up("about", { ...c.about, badgeText: v })} />
          <div className="md:col-span-2"><p className="mb-2 text-sm font-semibold">Feature boxes</p>
            <ListEditor items={c.about.features} onChange={(v) => up("about", { ...c.about, features: v })} addLabel="Add feature" title={(f) => f.t} blank={() => ({ t: "New feature", d: "" })} render={(f, p) => <><TextF label="Title" value={f.t} onChange={(v) => p({ t: v })} /><TextF label="Text" value={f.d} onChange={(v) => p({ d: v })} /></>} /></div>
        </CardBody></Card></TabsContent>

        <TabsContent value="services"><ListEditor items={c.services} onChange={(v) => up("services", v)} addLabel="Add service" title={(s) => s.t} blank={() => ({ t: "New service", d: "" })} render={(s, p) => <><TextF label="Title" value={s.t} onChange={(v) => p({ t: v })} /><TextF label="Description" area value={s.d} onChange={(v) => p({ d: v })} /></>} /></TabsContent>

        <TabsContent value="causes"><ListEditor items={c.causes} onChange={(v) => up("causes", v)} addLabel="Add case type" title={(s) => s.t} blank={() => ({ t: "New case type", p: "", image: "" })} render={(s, p) => <><TextF label="Title" value={s.t} onChange={(v) => p({ t: v })} /><ImageField label="Picture" value={s.image} onChange={(v) => p({ image: v })} /><div className="md:col-span-2"><TextF label="Description" area value={s.p} onChange={(v) => p({ p: v })} /></div></>} /></TabsContent>

        <TabsContent value="provinces"><ListEditor items={c.provinces} onChange={(v) => up("provinces", v)} addLabel="Add committee" title={(s) => s.t} blank={() => ({ t: "New committee", s: "Province", image: "" })} render={(s, p) => <><TextF label="Name" value={s.t} onChange={(v) => p({ t: v })} /><TextF label="Province label" value={s.s} onChange={(v) => p({ s: v })} /><div className="md:col-span-2"><ImageField label="Picture" value={s.image} onChange={(v) => p({ image: v })} /></div></>} /></TabsContent>

        <TabsContent value="steps"><ListEditor items={c.steps} onChange={(v) => up("steps", v)} addLabel="Add step" title={(s) => s.t} blank={() => ({ t: "New step", d: "" })} render={(s, p) => <><TextF label="Title" value={s.t} onChange={(v) => p({ t: v })} /><TextF label="Description" area value={s.d} onChange={(v) => p({ d: v })} /></>} /></TabsContent>

        <TabsContent value="commit"><ListEditor items={c.principles} onChange={(v) => up("principles", v)} addLabel="Add commitment" min={1} title={(s) => s.t} blank={() => ({ t: "New commitment", q: "" })} render={(s, p) => <><TextF label="Title" value={s.t} onChange={(v) => p({ t: v })} /><div className="md:col-span-2"><TextF label="Statement" area value={s.q} onChange={(v) => p({ q: v })} /></div></>} /></TabsContent>

        <TabsContent value="numbers"><Card className="mb-4"><CardBody className="p-4"><TextF label="Network paragraph" area value={c.networkText} onChange={(v) => up("networkText", v)} /></CardBody></Card>
          <ListEditor items={c.numbers} onChange={(v) => up("numbers", v)} addLabel="Add number" title={(s) => s.l} blank={() => ({ n: 0, l: "New figure" })} render={(s, p) => <><Field label="Number"><Input type="number" value={s.n} onChange={(e) => p({ n: +e.target.value || 0 })} /></Field><TextF label="Label" value={s.l} onChange={(v) => p({ l: v })} /></>} /></TabsContent>

        <TabsContent value="faq"><ListEditor items={c.faqs} onChange={(v) => up("faqs", v)} addLabel="Add question" min={1} title={(s) => s.q} blank={() => ({ q: "New question", a: "" })} render={(s, p) => <><div className="md:col-span-2"><TextF label="Question" value={s.q} onChange={(v) => p({ q: v })} /></div><div className="md:col-span-2"><TextF label="Answer" area value={s.a} onChange={(v) => p({ a: v })} /></div></>} /></TabsContent>

        <TabsContent value="headings"><div className="grid gap-4 lg:grid-cols-2">{HEADS.map(([k, l]) => (
          <Card key={k}><CardBody className="space-y-3 p-4"><p className="text-sm font-semibold">{l}</p><TextF label="Small heading" value={c.headings[k].eyebrow} onChange={(v) => up("headings", { ...c.headings, [k]: { ...c.headings[k], eyebrow: v } })} /><TextF label="Title" value={c.headings[k].title} onChange={(v) => up("headings", { ...c.headings, [k]: { ...c.headings[k], title: v } })} /></CardBody></Card>))}
          <Card><CardBody className="space-y-3 p-4"><p className="text-sm font-semibold">Orange call-to-action bar</p><TextF label="Text" value={c.cta.title} onChange={(v) => up("cta", { ...c.cta, title: v })} /><TextF label="Button" value={c.cta.button} onChange={(v) => up("cta", { ...c.cta, button: v })} /></CardBody></Card></div></TabsContent>

        <TabsContent value="contact"><div className="grid gap-4 lg:grid-cols-2">
          <Card><CardBody className="space-y-3 p-4"><p className="text-sm font-semibold">Contact details</p><TextF label="Email" value={c.contact.email} onChange={(v) => up("contact", { ...c.contact, email: v })} /><TextF label="Phone" value={c.contact.phone} onChange={(v) => up("contact", { ...c.contact, phone: v })} /><TextF label="Address / area served" value={c.contact.address} onChange={(v) => up("contact", { ...c.contact, address: v })} /></CardBody></Card>
          <Card><CardBody className="space-y-3 p-4"><p className="text-sm font-semibold">Footer</p><TextF label="Tagline" area rows={2} value={c.footer.tagline} onChange={(v) => up("footer", { ...c.footer, tagline: v })} /><TextF label="Copyright" value={c.footer.copyright} onChange={(v) => up("footer", { ...c.footer, copyright: v })} /><TextF label="Right-hand note" value={c.footer.note} onChange={(v) => up("footer", { ...c.footer, note: v })} /></CardBody></Card></div></TabsContent>
      </Tabs>
    </div>
  );
}
export default function WebsitePage() { return <RoleGuard allow={canManageWebsite}><Editor /></RoleGuard>; }

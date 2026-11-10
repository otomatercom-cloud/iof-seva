"use client";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Avatar, Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser, useStore } from "@/lib/store";
import { USE_ODOO } from "@/lib/config";
import { odoo } from "@/lib/odoo-client";
import { Input } from "@/components/ui/form";
import { ROLE_LABEL, provinceName } from "@/lib/reference-data";

export default function SettingsPage() {
  const me = useCurrentUser()!;
  const reset = useStore((s) => s.resetDemo);
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({ assigned: true, transferred: true, critical: true, pending: true, status: false, followup: true });
  const labels: Record<keyof typeof prefs, string> = { assigned: "New case assigned to me", transferred: "Case transferred / transfer request", critical: "Critical case registered", pending: "Pending assignment alerts", status: "Case status updated", followup: "Follow-up reminders" };
  const [my, setMy] = useState({ email: true, whatsapp: false, number: "" });
  const [events, setEvents] = useState<{ code: string; name: string; email: boolean; whatsapp: boolean }[]>([]);
  useEffect(() => {
    if (!USE_ODOO) return;
    odoo<typeof my>("get_my_notify").then(setMy).catch(() => {});
    if (me.role === "president") odoo<typeof events>("get_notify_events").then(setEvents).catch(() => {});
  }, [me.role]);
  const saveMy = (next: typeof my) => { setMy(next); odoo("set_my_notify", next.email, next.whatsapp, next.number).then(() => toast({ kind: "success", title: "Alert settings saved" })).catch((e: Error) => toast({ kind: "error", title: e.message })); };
  const saveEv = (ev: (typeof events)[number]) => { setEvents(events.map((x) => (x.code === ev.code ? ev : x))); odoo("set_notify_event", ev.code, ev.email, ev.whatsapp).catch((e: Error) => toast({ kind: "error", title: e.message })); };
  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Your profile and notification preferences." />
      <div className="space-y-5">
        <Card><CardHeader title="Profile" /><CardBody className="flex items-center gap-4"><Avatar name={me.name} size={56} /><div><p className="font-display text-lg font-bold">{me.name}</p><p className="text-sm text-muted">{ROLE_LABEL[me.role]} · {provinceName(me.provinceCode)}</p><p className="text-sm text-muted">{me.email} · {me.phone}</p></div></CardBody></Card>
        <Card><CardHeader title="Notifications" description="Choose what appears in your notification centre" /><CardBody className="divide-y divide-line py-2">{(Object.keys(prefs) as (keyof typeof prefs)[]).map((k) => <label key={k} className="flex items-center justify-between py-3 text-sm">{labels[k]}<Switch checked={prefs[k]} onChange={(v) => setPrefs({ ...prefs, [k]: v })} label={labels[k]} /></label>)}</CardBody></Card>
        {USE_ODOO && <Card><CardHeader title="My alerts" description="Receive case alerts by email and WhatsApp (no victim details are ever sent)" /><CardBody className="space-y-3">
          <label className="flex items-center justify-between text-sm">Email alerts<Switch checked={my.email} onChange={(v) => saveMy({ ...my, email: v })} label="Email alerts" /></label>
          <label className="flex items-center justify-between text-sm">WhatsApp alerts<Switch checked={my.whatsapp} onChange={(v) => saveMy({ ...my, whatsapp: v })} label="WhatsApp alerts" /></label>
          <Input aria-label="WhatsApp number" placeholder="+9665XXXXXXXX" value={my.number} onChange={(e) => setMy({ ...my, number: e.target.value })} onBlur={() => saveMy(my)} />
        </CardBody></Card>}
        {USE_ODOO && me.role === "president" && events.length > 0 && <Card><CardHeader title="Alert events" description="Which events are sent, and on which channel" /><CardBody className="divide-y divide-line py-2">
          {events.map((ev) => <div key={ev.code} className="flex items-center justify-between gap-4 py-3 text-sm"><span>{ev.name}</span><span className="flex gap-4"><label className="flex items-center gap-2">Email<Switch checked={ev.email} onChange={(v) => saveEv({ ...ev, email: v })} label={ev.name + " email"} /></label><label className="flex items-center gap-2">WhatsApp<Switch checked={ev.whatsapp} onChange={(v) => saveEv({ ...ev, whatsapp: v })} label={ev.name + " WhatsApp"} /></label></span></div>)}
        </CardBody></Card>}
        <Card><CardHeader title="Prototype data" description="Everything is stored in this browser only." /><CardBody><Button variant="outline" onClick={() => { reset(); toast({ kind: "success", title: "Demo data reset" }); }}><RotateCcw /> Reset demo data</Button></CardBody></Card>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Avatar, Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser, useStore } from "@/lib/store";
import { ROLE_LABEL, provinceName } from "@/lib/reference-data";

export default function SettingsPage() {
  const me = useCurrentUser()!;
  const reset = useStore((s) => s.resetDemo);
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({ assigned: true, transferred: true, critical: true, pending: true, status: false, followup: true });
  const labels: Record<keyof typeof prefs, string> = { assigned: "New case assigned to me", transferred: "Case transferred / transfer request", critical: "Critical case registered", pending: "Pending assignment alerts", status: "Case status updated", followup: "Follow-up reminders" };
  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Your profile and notification preferences." />
      <div className="space-y-5">
        <Card><CardHeader title="Profile" /><CardBody className="flex items-center gap-4"><Avatar name={me.name} size={56} /><div><p className="font-display text-lg font-bold">{me.name}</p><p className="text-sm text-muted">{ROLE_LABEL[me.role]} · {provinceName(me.provinceCode)}</p><p className="text-sm text-muted">{me.email} · {me.phone}</p></div></CardBody></Card>
        <Card><CardHeader title="Notifications" description="Choose what appears in your notification centre" /><CardBody className="divide-y divide-line py-2">{(Object.keys(prefs) as (keyof typeof prefs)[]).map((k) => <label key={k} className="flex items-center justify-between py-3 text-sm">{labels[k]}<Switch checked={prefs[k]} onChange={(v) => setPrefs({ ...prefs, [k]: v })} label={labels[k]} /></label>)}</CardBody></Card>
        <Card><CardHeader title="Prototype data" description="Everything is stored in this browser only." /><CardBody><Button variant="outline" onClick={() => { reset(); toast({ kind: "success", title: "Demo data reset" }); }}><RotateCcw /> Reset demo data</Button></CardBody></Card>
      </div>
    </div>
  );
}

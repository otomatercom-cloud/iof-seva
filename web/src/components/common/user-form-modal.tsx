"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { ProvinceSelector } from "./province-selector";
import { useStore } from "@/lib/store";
import { ROLE_LABEL, regionOf } from "@/lib/reference-data";
import { useToast } from "@/components/ui/toast";
import type { Role, User } from "@/lib/types";

export function UserFormModal({ open, onOpenChange, initial, roles, lockRegion }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: User | null; roles: Role[]; lockRegion?: string }) {
  const upsert = useStore((s) => s.upsertUser);
  const users = useStore((s) => s.users);
  const { toast } = useToast();
  const [f, setF] = useState({ name: initial?.name ?? "", email: initial?.email ?? "", phone: initial?.phone ?? "", role: (initial?.role ?? roles[0]) as Role, provinceCode: initial?.provinceCode ?? "", notifyEmail: initial?.notifyEmail ?? true, notifyWhatsapp: initial?.notifyWhatsapp ?? false, whatsapp: initial?.whatsapp ?? "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const save = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Name is required.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email."; else if (users.some((u) => u.email.toLowerCase() === f.email.toLowerCase() && u.id !== initial?.id)) e.email = "Email already in use.";
    if (!f.provinceCode) e.provinceCode = "Select a province.";
    else if (lockRegion && regionOf(f.provinceCode) !== lockRegion) e.provinceCode = "You can only add people in your own region.";
    setErr(e); if (Object.keys(e).length) return;
    upsert({ ...(initial ?? { active: true }), ...f, title: `${ROLE_LABEL[f.role]} · ${f.provinceCode.replace("IOF-", "")}`, active: initial?.active ?? true, id: initial?.id });
    toast({ kind: "success", title: initial ? "User updated" : "User added" }); onOpenChange(false);
  };
  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm" title={initial ? "Edit user" : "Add user"} footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
      <div className="grid gap-4">
        <Field label="Full name" required error={err.name}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Email" required error={err.email}><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Role"><Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>{roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select></Field>
          <Field label="Province" required error={err.provinceCode}><ProvinceSelector value={f.provinceCode} onChange={(v) => setF({ ...f, provinceCode: v })} invalid={!!err.provinceCode} /></Field></div>
        <Field label="WhatsApp number (alerts)"><Input value={f.whatsapp} placeholder="+9665XXXXXXXX" onChange={(e) => setF({ ...f, whatsapp: e.target.value, notifyWhatsapp: !!e.target.value.trim() })} /></Field>
      </div>
    </Modal>
  );
}

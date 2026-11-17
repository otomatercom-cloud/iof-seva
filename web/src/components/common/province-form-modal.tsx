"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useStore } from "@/lib/store";
import { REGIONS } from "@/lib/reference-data";
import { useToast } from "@/components/ui/toast";
import type { RegionCode } from "@/lib/types";

const CHOICES: RegionCode[] = ["CP", "EP", "WP"];

/** Adds a province chapter (e.g. Madinah) under an existing region. */
export function ProvinceFormModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const add = useStore((s) => s.addProvince);
  const provinces = useStore((s) => s.provinces);
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [region, setRegion] = useState<RegionCode>("WP");
  const [prefix, setPrefix] = useState("");
  const [err, setErr] = useState("");

  const save = () => {
    const n = name.trim();
    if (n.length < 2) return setErr("Enter the province / chapter name.");
    const slug = n.replace(/[^A-Za-z0-9]/g, "");
    if (provinces.some((p) => p.code.toLowerCase() === `iof-${region}-${slug}`.toLowerCase())) return setErr("This province / chapter already exists.");
    add(n, region, prefix.trim() || undefined);
    toast({ kind: "success", title: "Province added", body: `${REGIONS[region].name} · ${n}` });
    setName(""); setPrefix(""); setErr(""); onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm" title="Add province / chapter" description="New chapters belong to a region and report to its Province Head."
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save}>Add province</Button></>}>
      <div className="grid gap-4">
        <Field label="Region" required><Select value={region} onChange={(e) => setRegion(e.target.value as RegionCode)}>{CHOICES.map((r) => <option key={r} value={r}>{REGIONS[r].name}</option>)}</Select></Field>
        <Field label="Province / chapter name" required error={err}><Input value={name} placeholder="e.g. Madinah" onChange={(e) => { setName(e.target.value); setErr(""); }} /></Field>
        <Field label="Case no. prefix (optional)"><Input value={prefix} placeholder="Region prefix is used if empty" onChange={(e) => setPrefix(e.target.value.toUpperCase())} /></Field>
      </div>
    </Modal>
  );
}

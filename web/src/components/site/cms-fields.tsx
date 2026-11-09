"use client";
import { useRef } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { fileToDataUrl } from "@/lib/site-cms";

export function ImageField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const pick = async (f?: File) => {
    if (!f) return;
    try { onChange(await fileToDataUrl(f)); } catch { toast({ kind: "error", title: "Could not read that image", body: "Use a JPG, PNG or WebP file." }); }
  };
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-brand-200 bg-brand-50/50 text-xs text-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : "No image"}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => ref.current?.click()}><ImagePlus /> {value ? "Replace" : "Upload"}</Button>
          {value && <Button size="sm" variant="ghost" onClick={() => onChange("")}><X /> Remove</Button>}
        </div>
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
    </Field>
  );
}

export function TextF({ label, value, onChange, area, rows = 3, hint }: { label: string; value: string; onChange: (v: string) => void; area?: boolean; rows?: number; hint?: string }) {
  return <Field label={label} hint={hint}>{area ? <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /> : <Input value={value} onChange={(e) => onChange(e.target.value)} />}</Field>;
}

export function ListEditor<T>({ items, onChange, render, blank, addLabel, title, min = 0 }: {
  items: T[]; onChange: (items: T[]) => void; render: (item: T, patch: (p: Partial<T>) => void, i: number) => React.ReactNode; blank: () => T; addLabel: string; title: (item: T, i: number) => string; min?: number;
}) {
  const move = (i: number, d: number) => { const a = [...items]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <Card key={i}>
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="truncate text-sm font-semibold">{i + 1}. {title(it, i) || "Untitled"}</span>
            <span className="flex gap-1">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp /></Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"><ArrowDown /></Button>
              <Button variant="ghost" size="icon" className="size-8 text-danger" onClick={() => onChange(items.filter((_, k) => k !== i))} disabled={items.length <= min} aria-label="Delete"><Trash2 /></Button>
            </span>
          </div>
          <CardBody className="grid gap-4 p-4 md:grid-cols-2">{render(it, (p) => onChange(items.map((x, k) => (k === i ? { ...x, ...p } : x))), i)}</CardBody>
        </Card>
      ))}
      <Button variant="outline" onClick={() => onChange([...items, blank()])}><Plus /> {addLabel}</Button>
    </div>
  );
}

"use client";
import { Select } from "@/components/ui/form";
import { EXTERNAL_SOURCES, REGIONS } from "@/lib/reference-data";
import { useStore } from "@/lib/store";
import type { RegionCode } from "@/lib/types";

export function ProvinceSelector({
  value, onChange, exclude = [], includeExternal, placeholder = "Select province", invalid, id,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude?: string[];
  includeExternal?: boolean;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
}) {
  const provinces = useStore((s) => s.provinces);
  const groups = (["NC", "EP", "CP", "WP"] as RegionCode[]).map((r) => ({
    r, items: provinces.filter((p) => p.region === r && p.active && !exclude.includes(p.code)),
  }));
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-invalid={invalid} aria-label={id ? undefined : placeholder}>
      {groups.filter((g) => g.items.length).map((g) => (
        <optgroup key={g.r} label={REGIONS[g.r].name}>
          {g.items.map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
        </optgroup>
      ))}
      {includeExternal && (
        <optgroup label="External sources">
          {EXTERNAL_SOURCES.map((x) => <option key={x} value={x}>{x}</option>)}
        </optgroup>
      )}
    </Select>
  );
}

"use client";
import { Badge, Card, PageHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/form";
import { RoleGuard } from "@/components/common/role-guard";
import { useCurrentUser, useStore } from "@/lib/store";
import { REGIONS, casePrefixOf, regionOf } from "@/lib/reference-data";
import { canSeeProvinces, isNational } from "@/lib/permissions";
import { useStats } from "@/lib/server-data";
import { useToast } from "@/components/ui/toast";

function Page() {
  const me = useCurrentUser()!;
  const provinces = useStore((s) => s.provinces);
  const users = useStore((s) => s.users);
  const { stats: S } = useStats();
  const toggle = useStore((s) => s.toggleProvince);
  const setPrefix = useStore((s) => s.setProvincePrefix);
  const { toast } = useToast();
  const rows = provinces.filter((p) => isNational(me) || p.region === regionOf(me.provinceCode));
  return (
    <div>
      <PageHeader title="Province Management" description="IOF committees from the register's “Responsible IOF” list. Regions group chapters under a Province Head." />
      <Card className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-[13px]"><thead className="bg-brand-50/60 text-xs text-muted"><tr><th className="px-4 py-2.5 font-medium">Committee code</th><th className="px-4 py-2.5 font-medium">Name</th><th className="px-4 py-2.5 font-medium">Case no. prefix</th><th className="px-4 py-2.5 font-medium">Region</th><th className="px-4 py-2.5 font-medium">Lead</th><th className="px-4 py-2.5 text-right font-medium">Staff</th><th className="px-4 py-2.5 text-right font-medium">Open cases</th><th className="px-4 py-2.5 text-right font-medium">Waiting</th><th className="px-4 py-2.5 font-medium">Active</th></tr></thead>
        <tbody>{rows.map((p) => {
          const head = users.find((u) => u.provinceCode === p.code && (u.role === "province_head" || u.role === "president")) ?? users.find((u) => u.role === "province_head" && u.provinceCode === `IOF-${p.region}`);
          const pc = S?.perCommittee[p.code] ?? { total: 0, open: 0, critical: 0, awaiting: 0 };
          return <tr key={p.code} className="border-t border-line"><td className="px-4 py-3 font-semibold text-brand-dark">{p.code}</td><td className="px-4 py-3">{p.name}</td><td className="px-4 py-3">{isNational(me) ? <input aria-label={`Case prefix for ${p.code}`} defaultValue={p.prefix || casePrefixOf(p.code)} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== (p.prefix || casePrefixOf(p.code))) { setPrefix(p.code, v); toast({ kind: "success", title: "Prefix updated", body: "Applies to new cases only; existing case numbers stay unchanged." }); } }} className="h-8 w-28 rounded-md border border-line px-2 font-mono text-xs uppercase focus:border-brand focus:outline-none" /> : <span className="font-mono text-xs">{p.prefix || casePrefixOf(p.code)}</span>}</td><td className="px-4 py-3"><Badge tone={p.kind === "chapter" ? "slate" : "green"}>{REGIONS[p.region].short} · {p.kind}</Badge></td><td className="px-4 py-3">{head?.name ?? "—"}</td><td className="px-4 py-3 text-right tabular">{users.filter((u) => u.provinceCode === p.code && u.role !== "province_head" && u.role !== "president").length}</td><td className="px-4 py-3 text-right tabular">{pc.open}</td><td className="px-4 py-3 text-right tabular">{pc.awaiting}</td>
            <td className="px-4 py-3">{isNational(me) ? <Switch checked={p.active} onChange={() => { toggle(p.code); toast({ kind: "info", title: p.active ? "Province deactivated" : "Province activated" }); }} label={`Toggle ${p.code}`} /> : <Badge tone={p.active ? "green" : "slate"}>{p.active ? "Active" : "Inactive"}</Badge>}</td></tr>;
        })}</tbody></table></Card>
    </div>
  );
}
export default function ProvincesPage() { return <RoleGuard allow={canSeeProvinces}><Page /></RoleGuard>; }

"use client";
import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { Avatar, Badge, Card, CardBody, CardHeader, PageHeader, Progress } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/common/badges";
import { AssignmentDialog } from "@/components/cases/assignment-dialog";
import { useCurrentUser, useStore } from "@/lib/store";
import { useStats } from "@/lib/server-data";
import { REGIONS, regionOf } from "@/lib/reference-data";
import { isOpen } from "@/lib/analytics";
import { canAssign, isNational } from "@/lib/permissions";
import type { Case, RegionCode } from "@/lib/types";
import Link from "next/link";

export default function ProvinceAssignmentPage() {
  const me = useCurrentUser()!;
  const { stats: S } = useStats();
  const users = useStore((s) => s.users);
  const provinces = useStore((s) => s.provinces);
  const [sel, setSel] = useState<Case | null>(null);
  const regions = useMemo(() => (["EP", "CP", "WP", "NC"] as RegionCode[]).filter((r) => isNational(me) || r === regionOf(me.provinceCode)), [me]);
  return (
    <div>
      <PageHeader title="Province-wise Assignment" description="Workload and waiting cases for every committee, so heads can balance assignments." />
      <div className="space-y-6">
        {regions.map((r) => {
          const units = provinces.filter((p) => p.region === r && p.active && (me.role !== "coordinator" || p.code === me.provinceCode));
          return (
            <section key={r}>
              <h2 className="mb-3 font-display text-base font-bold">{REGIONS[r].name}</h2>
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {units.map((p) => {
                  const pc = S?.perCommittee[p.code] ?? { total: 0, open: 0, critical: 0, awaiting: 0 };
                  const wait = S?.awaitingBy[p.code] ?? [];
                  const staff = users.filter((u) => u.active && u.provinceCode === p.code && u.role !== "president" && u.role !== "province_head");
                  const openOf = (id: string) => S?.perHandler[id]?.open ?? 0;
                  const max = Math.max(1, ...staff.map((u) => openOf(u.id)));
                  return (
                    <Card key={p.code}>
                      <CardHeader title={p.code} description={p.name} action={pc.awaiting ? <Badge tone="saffron">{pc.awaiting} waiting</Badge> : <Badge tone="green">Queue clear</Badge>} />
                      <CardBody className="space-y-4 pt-4">
                        <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted"><div className="rounded-lg bg-brand-50 py-2"><b className="block font-display text-lg text-ink tabular">{pc.total}</b>total</div><div className="rounded-lg bg-brand-50 py-2"><b className="block font-display text-lg text-ink tabular">{pc.open}</b>open</div><div className="rounded-lg bg-brand-50 py-2"><b className="block font-display text-lg text-ink tabular">{pc.critical}</b>critical</div></div>
                        {staff.length > 0 ? <ul className="space-y-2.5">{staff.map((u) => { const n = openOf(u.id); return <li key={u.id} className="flex items-center gap-2.5 text-[13px]"><Avatar name={u.name} size={26} /><span className="w-28 truncate font-medium">{u.name}</span><Progress value={(n / max) * 100} className="flex-1" /><span className="w-6 text-right tabular text-muted">{n}</span></li>; })}</ul> : <p className="text-[13px] text-muted">No coordinators configured here.</p>}
                        {wait.map((c) => <div key={c.id} className="flex items-center gap-2 rounded-lg border border-line p-2.5 text-[13px]"><Link href={`/cases/${c.id}`} className="min-w-0 flex-1"><span className="block truncate font-medium">{c.caseNo} · {c.name}</span><span className="text-xs text-muted">from {c.originalReportingProvince}</span></Link><PriorityBadge priority={c.priority} />{canAssign(me, c) && <Button size="sm" variant="soft" onClick={() => setSel(c)}><UserPlus />Assign</Button>}</div>)}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {sel && <AssignmentDialog c={sel} open onOpenChange={(o) => !o && setSel(null)} />}
    </div>
  );
}

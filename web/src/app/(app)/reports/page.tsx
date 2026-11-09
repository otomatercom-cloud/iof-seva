"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Badge, Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { ChartCard, Donut, MonthlyChart, ProvinceBars, TrendChart, statusDonutData } from "@/components/dashboard/charts";
import { ProvincePerformance } from "@/components/dashboard/dashboard-sections";
import { RoleGuard } from "@/components/common/role-guard";
import { useStats } from "@/lib/server-data";
import { useStore } from "@/lib/store";
import { useVisibleCases } from "@/lib/hooks";
import { USE_ODOO } from "@/lib/config";
import { odoo } from "@/lib/odoo-client";
import type { Case } from "@/lib/types";
import { canSeeReports } from "@/lib/permissions";
import { downloadCSV } from "@/lib/export";
import { useToast } from "@/components/ui/toast";

function Page() {
  const { toast } = useToast();
  const users = useStore((x) => x.users);
  const issues = useStore((x) => x.issueTypes);
  const allLocal = useVisibleCases();
  const [range, setRange] = useState("all");
  const RANGES: Record<string, { from?: string; to?: string }> = { all: { from: "2026-01-01", to: "2026-12-31" }, q4: { from: "2026-10-01", to: "2026-12-31" }, q3: { from: "2026-07-01", to: "2026-09-30" }, h1: { from: "2026-01-01", to: "2026-06-30" } };
  const { stats: S } = useStats(RANGES[range]);
  const k = S?.kpis ?? { total: 0, new: 0, pending: 0, in_progress: 0, resolved: 0, critical: 0 };
  const matrix = S?.matrix ?? { provs: [], rows: [] };
  const cross = S?.cross ?? 0, fin = S?.spendIof ?? 0;
  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Trends, workload and outcomes across the cases you are permitted to see." actions={<><Select aria-label="Report period" value={range} onChange={(e) => setRange(e.target.value)} className="w-44"><option value="all">Full year 2026</option><option value="q4">Q4 (Oct–Nov)</option><option value="q3">Q3 (Jul–Sep)</option><option value="h1">H1 (Jan–Jun)</option></Select><Button variant="outline" onClick={async () => { downloadCSV(`iof-seva-report-${range}.csv`, USE_ODOO ? await odoo<Case[]>("export_cases", { ...RANGES[range] }) : allLocal.filter((c) => (!RANGES[range].from || c.registeredOn >= RANGES[range].from!) && (!RANGES[range].to || c.registeredOn <= RANGES[range].to!)), users, issues); toast({ kind: "success", title: "Report exported" }); }}><Download /> Export CSV</Button></>} />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[["Cases in period", k.total], ["Resolution rate", `${k.total ? Math.round((k.resolved / k.total) * 100) : 0}%`], ["Cross-province cases", cross], ["IOF Seva spend", `SAR ${fin.toLocaleString("en-IN")}`]].map(([l, v]) => <Card key={String(l)}><CardBody className="p-4"><p className="text-xs text-muted">{l}</p><p className="mt-1 font-display text-2xl font-bold tabular">{v}</p></CardBody></Card>)}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Monthly registrations vs resolutions"><MonthlyChart data={(S?.monthly ?? [])} /></ChartCard>
        <ChartCard title="Resolution trend"><TrendChart data={(S?.monthly ?? [])} /></ChartCard>
        <ChartCard title="Cases by committee"><ProvinceBars data={(S?.byProvince ?? [])} /></ChartCard>
        <ChartCard title="Status breakdown"><Donut data={statusDonutData(S?.byStatus ?? [])} /></ChartCard>
        <ChartCard title="Issue types" className="xl:col-span-2"><Donut data={(S?.byIssue ?? []).map((i) => ({ name: i.name, value: i.value }))} /></ChartCard>
      </div>
      <div className="mt-5 space-y-5">
        <Card className="overflow-x-auto"><CardHeader title="Issue type × committee" description="Where each kind of case is concentrated" />
          <div className="p-4"><table className="w-full min-w-[640px] text-[13px]"><thead><tr className="text-xs text-muted"><th className="py-2 text-left font-medium">Issue type</th>{matrix.provs.map((p) => <th key={p} className="px-2 py-2 text-center font-medium">{p.replace("IOF-", "")}</th>)}</tr></thead>
            <tbody>{matrix.rows.map((r) => <tr key={r.i.id} className="border-t border-line"><td className="py-2.5 font-medium">{r.i.name}</td>{r.v.map((n, i) => <td key={i} className="px-2 text-center tabular">{n ? <Badge tone="green" className="min-w-7 justify-center">{n}</Badge> : <span className="text-slate-300">·</span>}</td>)}</tr>)}</tbody></table></div></Card>
        <ProvincePerformance rows={S?.perf ?? []} />
      </div>
    </div>
  );
}
export default function ReportsPage() { return <RoleGuard allow={canSeeReports}><Page /></RoleGuard>; }

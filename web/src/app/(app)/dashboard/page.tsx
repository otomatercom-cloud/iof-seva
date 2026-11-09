"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/card";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { ChartCard, Donut, MonthlyChart, ProvinceBars, TrendChart, statusDonutData } from "@/components/dashboard/charts";
import { CriticalCases, MyTasks, PendingAssignments, ProvincePerformance, RecentActivities, RecentCases } from "@/components/dashboard/dashboard-sections";
import { useCurrentUser } from "@/lib/store";
import { useStats } from "@/lib/server-data";
import { canRegister, dashboardTitle, isNational } from "@/lib/permissions";
import { REGIONS, ROLE_LABEL, regionOf } from "@/lib/reference-data";

export default function DashboardPage() {
  const me = useCurrentUser()!;
  const { stats: S } = useStats();
  const k = S?.kpis ?? { total: 0, new: 0, pending: 0, in_progress: 0, resolved: 0, critical: 0 };
  const m = S?.monthly ?? [], prov = S?.byProvince ?? [], iss = S?.byIssue ?? [], st = S?.byStatus ?? [];

  const reg = regionOf(me.provinceCode)!;
  const scope = { president: "All provinces", secretary: "All provinces", province_head: `${REGIONS[reg].name}`, coordinator: me.provinceCode, handler: "Assigned to you" }[me.role];
  const desc = {
    president: "Live picture of every province, assignment bottleneck and critical case.",
    secretary: "Live picture of every province, assignment bottleneck and critical case.",
    province_head: "Incoming cases, your coordinators and the assignment queue for your province.",
    coordinator: "Register cases, hand them over across provinces and follow up on your unit's work.",
    handler: "Your assigned cases, follow-ups and updates.",
  }[me.role];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${dashboardTitle[me.role]}`}
        description={`${ROLE_LABEL[me.role]} · ${scope} — ${desc}`}
        actions={canRegister(me) ? <Link href="/cases/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white shadow-soft hover:bg-brand-dark"><Plus className="size-4" /> Register new case</Link> : undefined}
      />
      <DashboardStats k={k} scope={scope} />

      {me.role === "handler" ? (
        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <MyTasks cases={S?.mine ?? []} />
          <ChartCard title="Case status breakdown" description="Your assigned cases"><Donut data={statusDonutData(st)} /></ChartCard>
          <RecentActivities feed={S?.activity ?? []} />
          <ChartCard title="Case resolution trend" description="Resolved per month and average days"><TrendChart data={m} /></ChartCard>
        </div>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            <ChartCard title="Monthly case registration" description="Registered vs resolved, 2026"><MonthlyChart data={m} /></ChartCard>
            <ChartCard title="Case status breakdown" description="Share of cases by workflow status"><Donut data={statusDonutData(st)} /></ChartCard>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <ChartCard title={isNational(me) ? "Province-wise distribution" : "Committee-wise distribution"} description="Cases by responsible IOF committee"><ProvinceBars data={prov} /></ChartCard>
            <ChartCard title="Issue type distribution" description="Dynamic issue types"><Donut stacked data={iss.map((i) => ({ name: i.name, value: i.value }))} /></ChartCard>
            <ChartCard title="Case resolution trend" description="Resolved cases and average days to resolve"><TrendChart data={m} /></ChartCard>
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <RecentCases cases={S?.recent ?? []} />
            <CriticalCases cases={S?.critical ?? []} />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <PendingAssignments cases={S?.pending ?? []} />
            <RecentActivities feed={S?.activity ?? []} />
          </div>
          {(isNational(me) || me.role === "province_head") && <ProvincePerformance rows={S?.perf ?? []} />}
        </>
      )}
    </div>
  );
}

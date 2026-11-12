"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, AlertOctagon, Clock3, UserPlus } from "lucide-react";
import { Avatar, Badge, Card, CardHeader, EmptyState, Progress } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/common/badges";
import { AssignmentDialog } from "@/components/cases/assignment-dialog";
import { CaseTimelineIcon } from "@/components/cases/case-timeline";
import { useCurrentUser } from "@/lib/store";
import { useUserMap } from "@/lib/hooks";
import { canAssign } from "@/lib/permissions";
import { fmtDate, timeAgo } from "@/lib/utils";
import type { Feed, PerfRow } from "@/lib/server-data";
import { statusById } from "@/lib/reference-data";
import { useStore } from "@/lib/store";
import type { Case } from "@/lib/types";

const ViewAll = ({ href, label = "View all" }: { href: string; label?: string }) => (
  <Link href={href} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-dark">{label} <ArrowRight className="size-3.5" /></Link>
);

export function RecentCases({ cases, limit = 6 }: { cases: Case[]; limit?: number }) {
  const issues = useStore((s) => s.issueTypes);
  const rows = [...cases].filter((c) => c.assignment !== "draft").sort((a, b) => +new Date(b.registeredOn) - +new Date(a.registeredOn)).slice(0, limit);
  return (
    <Card>
      <CardHeader title="Recent cases" description="Latest registrations in your view" action={<ViewAll href="/cases" />} />
      <div className="overflow-x-auto px-2 pb-2 pt-2">
        <table className="w-full text-left text-[13px]">
          <thead><tr className="text-xs text-muted"><th className="px-3 py-2 font-medium">Case</th><th className="px-3 py-2 font-medium">Issue</th><th className="hidden px-3 py-2 font-medium md:table-cell">Responsible</th><th className="px-3 py-2 font-medium">Status</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-line hover:bg-brand-50/50">
                <td className="px-3 py-2.5"><Link href={`/cases/${c.id}`} className="block max-w-[260px]"><span className="block truncate font-medium text-ink hover:text-brand">{c.name}</span><span className="text-xs text-muted">{c.caseNo} · {fmtDate(c.registeredOn)}</span></Link></td>
                <td className="px-3 py-2.5 text-muted">{issues.find((i) => i.id === c.issueTypeId)?.name}</td>
                <td className="hidden px-3 py-2.5 md:table-cell">{c.handlingCommittee}</td>
                <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4}><EmptyState title="No cases yet" /></td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function CriticalCases({ cases }: { cases: Case[] }) {
  const rows = cases.filter((c) => c.priority === "critical" && !["resolved", "closed"].includes(statusById(c.status).bucket) && c.assignment !== "draft").slice(0, 5);
  const users = useUserMap();
  return (
    <Card className="border-[#f9c9c3]">
      <CardHeader title={<span className="flex items-center gap-2"><AlertOctagon className="size-4 text-danger" /> Critical / urgent cases</span>} description="Open cases flagged critical" action={<ViewAll href="/cases?priority=critical&open=1" />} />
      <ul className="divide-y divide-line px-5 pb-2 pt-2">
        {rows.map((c) => (
          <li key={c.id}><Link href={`/cases/${c.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
            <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium">{c.name}</span><span className="text-xs text-muted">{c.caseNo} · {c.handledById ? users.get(c.handledById)?.name : "Unassigned"} · {c.handlingCommittee}</span></span>
            <StatusBadge status={c.status} />
          </Link></li>
        ))}
        {rows.length === 0 && <li><EmptyState title="No critical cases open" description="Great — nothing urgent right now." /></li>}
      </ul>
    </Card>
  );
}

export function PendingAssignments({ cases, limit = 5 }: { cases: Case[]; limit?: number }) {
  const me = useCurrentUser()!;
  const [sel, setSel] = useState<Case | null>(null);
  const rows = cases.filter((c) => c.assignment === "awaiting_assignment").sort((a, b) => +new Date(a.registeredOn) - +new Date(b.registeredOn)).slice(0, limit);
  return (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2"><Clock3 className="size-4 text-saffron" /> Pending assignments</span>} description="Waiting for a coordinator" action={<ViewAll href="/assignment/queue" label="Open queue" />} />
      <ul className="divide-y divide-line px-5 pb-2 pt-2">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center gap-3 py-2.5">
            <Link href={`/cases/${c.id}`} className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium hover:text-brand">{c.name}</span><span className="text-xs text-muted">{c.caseNo} · from {c.originalReportingProvince} → {c.handlingCommittee}</span></Link>
            <PriorityBadge priority={c.priority} />
            {canAssign(me, c) && <Button size="sm" variant="soft" onClick={() => setSel(c)}><UserPlus /> Assign</Button>}
          </li>
        ))}
        {rows.length === 0 && <li><EmptyState title="Queue is clear" description="Every registered case has an owner." /></li>}
      </ul>
      {sel && <AssignmentDialog c={sel} open onOpenChange={(o) => !o && setSel(null)} />}
    </Card>
  );
}

export function RecentActivities({ feed }: { feed: Feed }) {
  const users = useUserMap();
  return (
    <Card>
      <CardHeader title="Recent activities" description="Across cases you can access" />
      <ul className="space-y-0.5 px-3 pb-3 pt-2">
        {feed.map((a) => (
          <li key={a.id}><Link href={`/cases/${a.caseId}`} className="flex gap-3 rounded-lg px-2 py-2 hover:bg-brand-50/60">
            <CaseTimelineIcon type={a.type} />
            <span className="min-w-0 flex-1"><span className="line-clamp-2 block text-[13px]"><b className="font-semibold">{users.get(a.actorId)?.name ?? "System"}</b> · {a.text}</span><span className="text-xs text-muted">{a.caseNo} · {timeAgo(a.at)}</span></span>
          </Link></li>
        ))}
        {feed.length === 0 && <li><EmptyState title="No activity yet" /></li>}
      </ul>
    </Card>
  );
}

export function ProvincePerformance({ rows }: { rows: PerfRow[] }) {
  return (
    <Card>
      <CardHeader title="Province performance" description="Cases handled by each province committee" action={<ViewAll href="/analytics" label="Full report" />} />
      <div className="overflow-x-auto px-2 pb-3 pt-2">
        <table className="w-full text-left text-[13px]">
          <thead><tr className="text-xs text-muted"><th className="px-3 py-2 font-medium">Province</th><th className="px-3 py-2 text-right font-medium">Total</th><th className="px-3 py-2 text-right font-medium">Open</th><th className="px-3 py-2 text-right font-medium">Critical</th><th className="px-3 py-2 text-right font-medium">Avg days</th><th className="w-40 px-3 py-2 font-medium">Resolution rate</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.region} className="border-t border-line">
                <td className="px-3 py-2.5 font-medium">{r.name}</td>
                <td className="px-3 py-2.5 text-right tabular">{r.total}</td>
                <td className="px-3 py-2.5 text-right tabular">{r.open}</td>
                <td className="px-3 py-2.5 text-right tabular">{r.critical > 0 ? <Badge tone="red">{r.critical}</Badge> : "0"}</td>
                <td className="px-3 py-2.5 text-right tabular">{r.avgDays || "—"}</td>
                <td className="px-3 py-2.5"><div className="flex items-center gap-2"><Progress value={r.rate} className="flex-1" /><span className="w-9 text-right text-xs tabular text-muted">{r.rate}%</span></div></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6}><EmptyState title="No data" /></td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function MyTasks({ cases }: { cases: Case[] }) {
  const me = useCurrentUser()!;
  const mine = cases.filter((c) => c.handledById === me.id && !["resolved", "closed"].includes(statusById(c.status).bucket));
  return (
    <Card>
      <CardHeader title="My open cases" description="Update progress and log follow-ups" action={<ViewAll href="/cases/mine" />} />
      <ul className="divide-y divide-line px-5 pb-2 pt-2">
        {mine.slice(0, 6).map((c) => (
          <li key={c.id}><Link href={`/cases/${c.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
            <Avatar name={c.victimName || c.name} size={34} />
            <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium">{c.name}</span><span className="text-xs text-muted">{c.caseNo} · updated {timeAgo(c.updatedAt)}</span></span>
            <PriorityBadge priority={c.priority} /><StatusBadge status={c.status} />
          </Link></li>
        ))}
        {mine.length === 0 && <li><EmptyState title="No open cases assigned to you" /></li>}
      </ul>
    </Card>
  );
}

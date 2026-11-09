"use client";
import { useEffect, useMemo, useState } from "react";
import type { Case, IssueType, TimelineEvent } from "./types";
import { PROVINCES, REGIONS, STATUSES } from "./reference-data";
import { USE_ODOO } from "./config";
import { odoo } from "./odoo-client";
import { useStore } from "./store";
import { activityFeed, byIssue, byProvince, byStatus, isOpen, kpis, monthly, provincePerformance } from "./analytics";
import { useVisibleCases } from "./hooks";

export type Feed = (TimelineEvent & { caseId: string; caseNo: string })[];
export type PerfRow = ReturnType<typeof provincePerformance>[number];
export interface Counts { total: number; open: number; critical: number; awaiting: number }

/** Everything dashboards / reports / province pages show. Odoo mode: computed by PostgreSQL. Demo mode: computed locally. */
export interface Stats {
  kpis: ReturnType<typeof kpis>;
  monthly: ReturnType<typeof monthly>;
  byProvince: ReturnType<typeof byProvince>;
  byIssue: ReturnType<typeof byIssue>;
  byStatus: ReturnType<typeof byStatus>;
  perf: PerfRow[];
  matrix: { provs: string[]; rows: { i: IssueType; v: number[] }[] };
  cross: number;
  spendIof: number;
  recent: Case[]; critical: Case[]; pending: Case[]; mine: Case[];
  activity: Feed;
  queue: { waiting: number; crossProvince: number; critical: number; stale: number };
  perCommittee: Record<string, Counts>;
  perHandler: Record<string, Counts>;
  awaitingBy: Record<string, Case[]>;
}
export interface Range { from?: string; to?: string }

const c0 = (x?: Partial<Counts>): Counts => ({ total: 0, open: 0, critical: 0, awaiting: 0, ...x });

/* ---------------------------- Odoo: raw server aggregates -> UI shapes ---------------------------- */
interface Raw {
  byStatus: Record<string, number>; critical: number; regMonth: Record<string, number>; resMonth: Record<string, { n: number; avg: number }>;
  byProvince: Record<string, number>; byIssue: Record<string, number>; matrix: Record<string, Record<string, number>>; cross: number;
  region: Record<string, { total?: number; open?: number; critical?: number; awaiting?: number; resolved?: number; avgDays?: number }>;
  perCommittee: Record<string, Partial<Counts>>; perHandler: Record<string, Partial<Counts>>; spendIof: number;
  recent: Case[]; criticalCases: Case[]; pendingCases: Case[]; mine: Case[]; activity: Feed; queue: Stats["queue"]; awaitingBy: Record<string, Case[]>;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
function fromRaw(r: Raw, issues: IssueType[]): Stats {
  const bucketSum = (...b: string[]) => STATUSES.filter((s) => b.includes(s.bucket)).reduce((n, s) => n + (r.byStatus[s.id] ?? 0), 0);
  const total = Object.values(r.byStatus).reduce((a, b) => a + b, 0);
  const provs = PROVINCES.filter((p) => r.byProvince[p.code]).map((p) => ({ code: p.code, name: p.code.replace("IOF-", ""), count: r.byProvince[p.code] })).sort((a, b) => b.count - a.count);
  return {
    kpis: { total, new: bucketSum("new"), pending: bucketSum("pending"), in_progress: bucketSum("in_progress"), resolved: bucketSum("resolved", "closed"), critical: r.critical },
    monthly: MONTHS.map((m, i) => ({ month: m, registered: r.regMonth[i + 1] ?? 0, resolved: r.resMonth[i + 1]?.n ?? 0, avgDays: r.resMonth[i + 1]?.n ? r.resMonth[i + 1].avg : null })),
    byProvince: provs,
    byIssue: issues.map((i) => ({ id: i.id, name: i.name, value: r.byIssue[i.id] ?? 0 })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value),
    byStatus: STATUSES.map((s) => ({ id: s.id, label: s.label, bucket: s.bucket, value: r.byStatus[s.id] ?? 0 })).filter((x) => x.value > 0),
    perf: (["EP", "CP", "WP", "NC"] as const).map((k) => {
      const g = r.region[k] ?? {}; const t = g.total ?? 0; const res = g.resolved ?? 0;
      return { region: k, name: REGIONS[k].name, total: t, resolved: res, open: g.open ?? 0, critical: g.critical ?? 0, awaiting: g.awaiting ?? 0, avgDays: g.avgDays ?? 0, rate: t ? Math.round((res / t) * 100) : 0 };
    }).filter((x) => x.total > 0),
    matrix: { provs: provs.map((p) => p.code), rows: issues.map((i) => ({ i, v: provs.map((p) => r.matrix[i.id]?.[p.code] ?? 0) })).filter((x) => x.v.some(Boolean)) },
    cross: r.cross, spendIof: r.spendIof,
    recent: r.recent, critical: r.criticalCases, pending: r.pendingCases, mine: r.mine, activity: r.activity, queue: r.queue,
    perCommittee: Object.fromEntries(Object.entries(r.perCommittee).map(([k, v]) => [k, c0(v)])),
    perHandler: Object.fromEntries(Object.entries(r.perHandler).map(([k, v]) => [k, c0(v)])),
    awaitingBy: r.awaitingBy,
  };
}

/* ---------------------------- Demo mode: same shapes from in-browser data ---------------------------- */
function localStats(all: Case[], issues: IssueType[], range: Range, meProvince: string | undefined, role: string): Stats {
  const cs = all.filter((c) => (!range.from || c.registeredOn >= range.from) && (!range.to || c.registeredOn <= range.to));
  const act = cs.filter((c) => c.assignment !== "draft");
  const bump = (m: Record<string, Counts>, k: string | null, c: Case) => { if (!k) return; const x = (m[k] ??= c0()); x.total++; if (isOpen(c)) { x.open++; if (c.priority === "critical") x.critical++; } if (c.assignment === "awaiting_assignment") x.awaiting++; };
  const perCommittee: Record<string, Counts> = {}, perHandler: Record<string, Counts> = {};
  act.forEach((c) => { bump(perCommittee, c.handlingCommittee, c); bump(perHandler, c.handledById, c); });
  const prov = byProvince(cs);
  const waiting = act.filter((c) => c.assignment === "awaiting_assignment" && (role !== "coordinator" || c.handlingCommittee === meProvince));
  const day = 86400000;
  const awaitingBy: Record<string, Case[]> = {};
  waiting.forEach((c) => { (awaitingBy[c.handlingCommittee] ??= []); if (awaitingBy[c.handlingCommittee].length < 2) awaitingBy[c.handlingCommittee].push(c); });
  return {
    kpis: kpis(cs), monthly: monthly(cs), byProvince: prov, byIssue: byIssue(cs, issues), byStatus: byStatus(cs), perf: provincePerformance(cs),
    matrix: { provs: prov.map((p) => p.code), rows: issues.map((i) => ({ i, v: prov.map((p) => act.filter((c) => c.issueTypeId === i.id && c.handlingCommittee === p.code).length) })).filter((x) => x.v.some(Boolean)) },
    cross: act.filter((c) => c.originalReportingProvince !== c.handlingCommittee).length,
    spendIof: act.flatMap((c) => c.finance).filter((f) => f.paidBy === "IOF").reduce((s, f) => s + f.amountSAR, 0),
    recent: [...act].sort((a, b) => +new Date(b.registeredOn) - +new Date(a.registeredOn)).slice(0, 6),
    critical: act.filter((c) => c.priority === "critical" && isOpen(c)).slice(0, 5),
    pending: waiting.slice(0, 5), mine: [], activity: activityFeed(cs, 7), perCommittee, perHandler, awaitingBy,
    queue: { waiting: waiting.length, crossProvince: waiting.filter((c) => c.originalReportingProvince !== c.handlingCommittee).length, critical: waiting.filter((c) => c.priority === "critical").length, stale: waiting.filter((c) => (Date.parse("2026-11-03") - Date.parse(c.registeredOn)) / day >= 3).length },
  };
}

export function useStats(range: Range = {}): { stats: Stats | null; loading: boolean } {
  const version = useStore((s) => s.version);
  const issues = useStore((s) => s.issueTypes);
  const me = useStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const local = useVisibleCases();
  const [remote, setRemote] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(USE_ODOO);
  const key = `${range.from ?? ""}|${range.to ?? ""}`;
  useEffect(() => {
    if (!USE_ODOO) return;
    let alive = true; setLoading(true);
    odoo<Raw>("stats", { from: range.from, to: range.to })
      .then((r) => alive && setRemote(fromRaw(r, issues)))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [version, key, issues]); // eslint-disable-line react-hooks/exhaustive-deps
  const localS = useMemo(() => (USE_ODOO ? null : localStats(local, issues, range, me?.provinceCode, me?.role ?? "")), [local, issues, key, me]); // eslint-disable-line react-hooks/exhaustive-deps
  const stats = USE_ODOO ? remote : localS;
  if (stats && !USE_ODOO && me) stats.mine = local.filter((c) => c.handledById === me.id && isOpen(c)).slice(0, 6);
  return { stats, loading: loading && !stats };
}

/** Header quick-search: a handful of matches. */
export async function searchCases(q: string, local: Case[]): Promise<Case[]> {
  if (USE_ODOO) return (await odoo<{ rows: Case[] }>("list_cases", { q, size: 6 })).rows;
  const t = q.toLowerCase();
  return local.filter((c) => [c.caseNo, c.name, c.victimName, c.contactDetails].some((f) => f.toLowerCase().includes(t))).slice(0, 6);
}

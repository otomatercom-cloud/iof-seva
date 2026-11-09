import type { Case, IssueType, RegionCode, StatusBucket, TimelineEvent } from "./types";
import { PROVINCES, REGIONS, STATUSES, regionOf, statusById } from "./reference-data";
import { format, parseISO } from "date-fns";

export const bucketOf = (c: Case): StatusBucket => statusById(c.status).bucket;
export const isOpen = (c: Case) => !["resolved", "closed"].includes(bucketOf(c));
const active = (c: Case) => c.assignment !== "draft";

export function kpis(all: Case[]) {
  const cases = all.filter(active);
  return {
    total: cases.length,
    new: cases.filter((c) => bucketOf(c) === "new").length,
    pending: cases.filter((c) => bucketOf(c) === "pending").length,
    in_progress: cases.filter((c) => bucketOf(c) === "in_progress").length,
    resolved: cases.filter((c) => ["resolved", "closed"].includes(bucketOf(c))).length,
    critical: cases.filter((c) => c.priority === "critical" && isOpen(c)).length,
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
export function monthly(all: Case[]) {
  const reg = new Array(11).fill(0);
  const res = new Array(11).fill(0);
  const days: number[][] = MONTHS.map(() => []);
  all.filter(active).forEach((c) => {
    const m = +c.registeredOn.slice(5, 7) - 1;
    if (m >= 0 && m < 11) reg[m]++;
    if (c.resolvedAt) {
      const rm = +c.resolvedAt.slice(5, 7) - 1;
      if (rm >= 0 && rm < 11) { res[rm]++; days[rm].push(Math.max(1, Math.round((+parseISO(c.resolvedAt) - +parseISO(c.registeredOn)) / 86400000))); }
    }
  });
  return MONTHS.map((m, i) => ({ month: m, registered: reg[i], resolved: res[i], avgDays: days[i].length ? Math.round(days[i].reduce((a, b) => a + b, 0) / days[i].length) : null }));
}

export function byProvince(all: Case[]) {
  return PROVINCES.filter((p) => p.kind !== "national" || all.some((c) => c.handlingCommittee === p.code))
    .map((p) => ({ code: p.code, name: p.code.replace("IOF-", ""), count: all.filter((c) => active(c) && c.handlingCommittee === p.code).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function byIssue(all: Case[], issues: IssueType[]) {
  return issues.map((i) => ({ id: i.id, name: i.name, value: all.filter((c) => active(c) && c.issueTypeId === i.id).length })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
}

export function byStatus(all: Case[]) {
  return STATUSES.map((s) => ({ id: s.id, label: s.label, bucket: s.bucket, value: all.filter((c) => active(c) && c.status === s.id).length })).filter((x) => x.value > 0);
}

export function provincePerformance(all: Case[]) {
  const regs: RegionCode[] = ["EP", "CP", "WP", "NC"];
  return regs.map((r) => {
    const cs = all.filter((c) => active(c) && regionOf(c.handlingCommittee) === r);
    const closed = cs.filter((c) => c.resolvedAt);
    const avg = closed.length ? Math.round(closed.reduce((s, c) => s + (+parseISO(c.resolvedAt!) - +parseISO(c.registeredOn)) / 86400000, 0) / closed.length) : 0;
    return { region: r, name: REGIONS[r].name, total: cs.length, resolved: closed.length, open: cs.filter(isOpen).length, critical: cs.filter((c) => c.priority === "critical" && isOpen(c)).length, awaiting: cs.filter((c) => c.assignment === "awaiting_assignment").length, avgDays: avg, rate: cs.length ? Math.round((closed.length / cs.length) * 100) : 0 };
  }).filter((x) => x.total > 0);
}

export function activityFeed(all: Case[], limit = 8): (TimelineEvent & { caseId: string; caseNo: string })[] {
  return all.flatMap((c) => c.timeline.filter((t) => !t.internal).map((t) => ({ ...t, caseId: c.id, caseNo: c.caseNo })))
    .sort((a, b) => +parseISO(b.at) - +parseISO(a.at)).slice(0, limit);
}

export const monthLabel = (iso: string) => format(parseISO(iso), "MMM yyyy");

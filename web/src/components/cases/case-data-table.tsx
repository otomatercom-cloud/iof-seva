"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3, Download, FilterX, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { Dropdown, DropdownCheckbox, DropdownContent, DropdownLabel, DropdownTrigger } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { AssignmentBadge, PriorityBadge, StatusBadge } from "@/components/common/badges";
import { ProvinceSelector } from "@/components/common/province-selector";
import { useCurrentUser, useStore } from "@/lib/store";
import { useVisibleCases } from "@/lib/hooks";
import { USE_ODOO } from "@/lib/config";
import { odoo } from "@/lib/odoo-client";
import { PRIORITIES, STATUSES, statusById } from "@/lib/reference-data";
import { downloadCSV } from "@/lib/export";
import { fmtDate, timeAgo, cn } from "@/lib/utils";
import type { Case, StatusBucket } from "@/lib/types";

export interface Filters { q: string; province: string; status: string; issue: string; priority: string; from: string; to: string; bucket: string; open: boolean }
export const emptyFilters: Filters = { q: "", province: "", status: "", issue: "", priority: "", from: "", to: "", bucket: "", open: false };

type ColKey = "caseNo" | "name" | "issue" | "reporting" | "responsible" | "coordinator" | "registered" | "priority" | "status" | "updated" | "victim" | "assignment" | "ksa" | "state";
const COLS: { key: ColKey; label: string; sort?: (c: Case, ctx: Ctx) => string | number; default: boolean }[] = [
  { key: "caseNo", label: "Case No.", sort: (c) => c.sl, default: true },
  { key: "name", label: "Case name", sort: (c) => c.name.toLowerCase(), default: true },
  { key: "issue", label: "Issue type", sort: (c, x) => x.issue(c), default: true },
  { key: "reporting", label: "Reporting province", sort: (c) => c.originalReportingProvince, default: true },
  { key: "responsible", label: "Responsible province", sort: (c) => c.handlingCommittee, default: true },
  { key: "coordinator", label: "Assigned coordinator", sort: (c, x) => x.user(c.handledById), default: true },
  { key: "registered", label: "Registered", sort: (c) => c.registeredOn, default: true },
  { key: "priority", label: "Priority", sort: (c) => PRIORITIES.find((p) => p.id === c.priority)!.rank, default: true },
  { key: "status", label: "Status", sort: (c) => STATUSES.findIndex((s) => s.id === c.status), default: true },
  { key: "updated", label: "Last updated", sort: (c) => c.updatedAt, default: true },
  { key: "victim", label: "Victim", sort: (c) => c.victimName, default: false },
  { key: "assignment", label: "Assignment", sort: (c) => c.assignment, default: false },
  { key: "ksa", label: "KSA location", sort: (c) => c.regionKSA, default: false },
  { key: "state", label: "State (India)", sort: (c) => c.stateIndia, default: false },
];
interface Ctx { issue: (c: Case) => string; user: (id: string | null) => string }

export function applyFilters(cases: Case[], f: Filters, ctx: Ctx) {
  const q = f.q.trim().toLowerCase();
  return cases.filter((c) => {
    const b: StatusBucket = statusById(c.status).bucket;
    if (q && ![c.caseNo, c.name, c.victimName, c.contactDetails, c.sponsorName, c.stateIndia, c.districtIndia, ctx.issue(c), ctx.user(c.handledById)].some((x) => x.toLowerCase().includes(q))) return false;
    if (f.province && c.handlingCommittee !== f.province && c.originalReportingProvince !== f.province) return false;
    if (f.status && c.status !== f.status) return false;
    if (f.bucket && b !== f.bucket) return false;
    if (f.open && (b === "resolved" || b === "closed")) return false;
    if (f.issue && c.issueTypeId !== f.issue) return false;
    if (f.priority && c.priority !== f.priority) return false;
    if (f.from && c.registeredOn < f.from) return false;
    if (f.to && c.registeredOn > f.to) return false;
    return true;
  });
}

export type CaseView = "all" | "mine" | "pending" | "resolved" | "queue";
interface ListParams { view: CaseView; q: string; province: string; status: string; issue: string; priority: string; from: string; to: string; bucket: string; open: boolean; sort: ColKey; dir: "asc" | "desc"; page: number; size: number }

/** Odoo: one page from PostgreSQL (search/filter/sort/paging all server-side). Demo: same params evaluated in the browser. */
function useCaseList(p: ListParams, ctx: Ctx) {
  const version = useStore((s) => s.version);
  const me = useCurrentUser();
  const local = useVisibleCases();
  const [remote, setRemote] = useState<{ rows: Case[]; total: number }>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(USE_ODOO);
  const key = JSON.stringify(p);
  useEffect(() => {
    if (!USE_ODOO) return;
    let alive = true; setLoading(true);
    const t = setTimeout(() => {
      odoo<{ rows: Case[]; total: number }>("list_cases", p).then((r) => alive && setRemote(r)).catch(() => {}).finally(() => alive && setLoading(false));
    }, p.q ? 250 : 0); // debounce typing
    return () => { alive = false; clearTimeout(t); };
  }, [key, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const localRes = useMemo(() => {
    if (USE_ODOO) return null;
    const base = local.filter((c) => {
      const b = statusById(c.status).bucket;
      if (p.view === "mine") return c.handledById === me?.id;
      if (p.view === "pending") return b === "pending";
      if (p.view === "resolved") return b === "resolved" || b === "closed";
      if (p.view === "queue") return c.assignment === "awaiting_assignment" && (me?.role !== "coordinator" || c.handlingCommittee === me.provinceCode);
      return true;
    });
    const f = applyFilters(base, { ...emptyFilters, q: p.q, province: p.province, status: p.status, issue: p.issue, priority: p.priority, from: p.from, to: p.to, bucket: p.bucket, open: p.open }, ctx);
    const col = COLS.find((c) => c.key === p.sort)!; const d = p.dir === "asc" ? 1 : -1;
    const sorted = [...f].sort((a, b) => { const x = col.sort?.(a, ctx) ?? 0, y = col.sort?.(b, ctx) ?? 0; return (x < y ? -1 : x > y ? 1 : 0) * d; });
    return { rows: sorted.slice(p.page * p.size, p.page * p.size + p.size), total: sorted.length, all: sorted };
  }, [key, local, ctx, me]); // eslint-disable-line react-hooks/exhaustive-deps
  return USE_ODOO ? { ...remote, loading, all: null as Case[] | null } : { rows: localRes!.rows, total: localRes!.total, loading: false, all: localRes!.all };
}

export function CaseDataTable({ view = "all", initial, title, rowAction }: { view?: CaseView; initial?: Partial<Filters>; title?: string; rowAction?: (c: Case) => React.ReactNode }) {
  const users = useStore((s) => s.users);
  const issues = useStore((s) => s.issueTypes);
  const { toast } = useToast();
  const [f, setF] = useState<Filters>({ ...emptyFilters, ...initial });
  const [sort, setSort] = useState<{ key: ColKey; dir: 1 | -1 }>({ key: "updated", dir: -1 });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [vis, setVis] = useState<Record<ColKey, boolean>>(() => Object.fromEntries(COLS.map((c) => [c.key, c.default])) as Record<ColKey, boolean>);

  const ctx: Ctx = useMemo(() => ({ issue: (c) => issues.find((i) => i.id === c.issueTypeId)?.name ?? "", user: (id) => users.find((u) => u.id === id)?.name ?? "" }), [issues, users]);
  const params: ListParams = { view, ...f, sort: sort.key, dir: sort.dir === 1 ? "asc" : "desc", page, size };
  const res = useCaseList(params, ctx);
  const total = res.total;
  const pages = Math.max(1, Math.ceil(total / size));
  const cur = Math.min(page, pages - 1);
  const rows = res.rows;
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => { setF((s) => ({ ...s, [k]: v })); setPage(0); };
  const dirty = JSON.stringify(f) !== JSON.stringify({ ...emptyFilters, ...initial });
  const show = (k: ColKey) => vis[k];

  const cell = (k: ColKey, c: Case) => {
    switch (k) {
      case "caseNo": return <span className="font-medium tabular text-brand-dark">{c.caseNo}</span>;
      case "name": return <span className="block max-w-[260px] truncate font-medium text-ink" title={c.name}>{c.name}</span>;
      case "issue": return <span className="text-slate-600">{ctx.issue(c)}</span>;
      case "reporting": return c.originalReportingProvince;
      case "responsible": return <span className={cn(c.handlingCommittee !== c.originalReportingProvince && "font-medium text-saffron-dark")}>{c.handlingCommittee}</span>;
      case "coordinator": return c.handledById ? ctx.user(c.handledById) : <span className="text-saffron-dark">Unassigned</span>;
      case "registered": return <span className="tabular">{fmtDate(c.registeredOn)}</span>;
      case "priority": return <PriorityBadge priority={c.priority} />;
      case "status": return <StatusBadge status={c.status} />;
      case "updated": return <span className="text-muted">{timeAgo(c.updatedAt)}</span>;
      case "victim": return c.victimName || "—";
      case "assignment": return <AssignmentBadge state={c.assignment} />;
      case "ksa": return c.regionKSA || "—";
      case "state": return c.stateIndia || "—";
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="space-y-3 border-b border-line p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Search case no., name, victim, sponsor, state…" className="pl-9" aria-label="Search cases" />
          </div>
          <Dropdown>
            <DropdownTrigger asChild><Button variant="outline"><Columns3 /> Columns</Button></DropdownTrigger>
            <DropdownContent className="max-h-80 overflow-y-auto">
              <DropdownLabel>Visible columns</DropdownLabel>
              {COLS.map((c) => <DropdownCheckbox key={c.key} checked={vis[c.key]} onCheckedChange={(v) => setVis((s) => ({ ...s, [c.key]: !!v }))} onSelect={(e) => e.preventDefault()}>{c.label}</DropdownCheckbox>)}
            </DropdownContent>
          </Dropdown>
          <Button variant="outline" onClick={async () => { try { const all = USE_ODOO ? await odoo<Case[]>("export_cases", { ...params, page: 0 }) : res.all!; downloadCSV(`iof-seva-cases-${new Date().toISOString().slice(0, 10)}.csv`, all, users, issues); toast({ kind: "success", title: "CSV exported", body: `${all.length} cases · Excel register column layout.` }); } catch (e) { toast({ kind: "error", title: "Export failed", body: e instanceof Error ? e.message : undefined }); } }}><Download /> Export CSV</Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <ProvinceSelector value={f.province} onChange={(v) => set("province", v)} placeholder="All provinces" />
          <Select value={f.status} onChange={(e) => set("status", e.target.value)} placeholder="All statuses" aria-label="Status filter">{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select>
          <Select value={f.issue} onChange={(e) => set("issue", e.target.value)} placeholder="All issue types" aria-label="Issue type filter">{issues.map((i) => <option key={i.id} value={i.id}>{i.name}{i.active ? "" : " (inactive)"}</option>)}</Select>
          <Select value={f.priority} onChange={(e) => set("priority", e.target.value)} placeholder="All priorities" aria-label="Priority filter">{PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</Select>
          <Input type="date" value={f.from} onChange={(e) => set("from", e.target.value)} aria-label="Registered from" title="Registered from" />
          <div className="flex gap-2"><Input type="date" value={f.to} onChange={(e) => set("to", e.target.value)} aria-label="Registered to" title="Registered to" />
            {dirty && <Button variant="ghost" size="icon" onClick={() => { setF({ ...emptyFilters, ...initial }); setPage(0); }} aria-label="Clear filters" title="Clear filters"><FilterX /></Button>}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-[13px]">
          <thead className="bg-brand-50/60 text-xs text-muted">
            <tr>
              {COLS.filter((c) => show(c.key)).map((c) => (
                <th key={c.key} scope="col" className="whitespace-nowrap px-4 py-2.5 font-medium" aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button className="inline-flex cursor-pointer items-center gap-1 hover:text-ink" onClick={() => setSort((s) => (s.key === c.key ? { key: c.key, dir: (s.dir * -1) as 1 | -1 } : { key: c.key, dir: 1 }))}>
                    {c.label}{sort.key === c.key ? (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
                  </button>
                </th>
              ))}
              {rowAction && <th className="sticky right-0 bg-brand-50 px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="group border-t border-line hover:bg-brand-50/50">
                {COLS.filter((x) => show(x.key)).map((x, i) => (
                  <td key={x.key} className="whitespace-nowrap px-4 py-3">
                    {i === 0 ? <Link href={`/cases/${c.id}`} className="hover:underline">{cell(x.key, c)}</Link> : x.key === "name" ? <Link href={`/cases/${c.id}`} className="hover:text-brand">{cell(x.key, c)}</Link> : cell(x.key, c)}
                  </td>
                ))}
                {rowAction && <td className="sticky right-0 whitespace-nowrap bg-white px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(23,43,36,0.12)] group-hover:bg-[#f7fcf9]">{rowAction(c)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !res.loading && <EmptyState icon={<SearchX />} title={title ? `No ${title.toLowerCase()} match` : "No cases match your filters"} description="Try clearing a filter or searching by a different keyword." action={dirty ? <Button variant="outline" onClick={() => { setF({ ...emptyFilters, ...initial }); }}>Clear filters</Button> : undefined} />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-muted">
        <span className="tabular">{total === 0 ? (res.loading ? "Loading…" : "0 cases") : `${cur * size + 1}–${Math.min(total, cur * size + size)} of ${total} cases`}</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">Rows <Select value={String(size)} onChange={(e) => { setSize(+e.target.value); setPage(0); }} className="h-8 w-[72px]">{[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}</Select></label>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" disabled={cur === 0} onClick={() => setPage(cur - 1)} aria-label="Previous page"><ChevronLeft /></Button>
            <span className="px-2 tabular">Page {cur + 1} / {pages}</span>
            <Button variant="outline" size="icon" className="size-8" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} aria-label="Next page"><ChevronRight /></Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

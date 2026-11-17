"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, IdCard, Search } from "lucide-react";
import { Avatar, Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { RoleGuard } from "@/components/common/role-guard";
import { odoo } from "@/lib/odoo-client";
import { canManageVolunteers } from "@/lib/permissions";
import { V_STATES, type VolunteerList } from "@/lib/volunteers";

function Page() {
  const [state, setState] = useState(""); const [city, setCity] = useState(""); const [q, setQ] = useState(""); const [dq, setDq] = useState(""); const [page, setPage] = useState(1);
  const [data, setData] = useState<VolunteerList | null>(null); const [err, setErr] = useState("");
  useEffect(() => { const t = setTimeout(() => { setDq(q.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    let live = true;
    odoo<VolunteerList>("volunteer_list", { state, city, q: dq, page, size: 25 }).then((d) => { if (live) { setData(d); setErr(""); } }).catch((e: Error) => live && setErr(e.message));
    return () => { live = false; };
  }, [state, city, dq, page]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;
  const all = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;
  return (
    <div>
      <PageHeader title="Volunteers" description="Registrations from the website: review, approve, issue ID cards and give portal roles." />
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => { setState(""); setPage(1); }} className={`rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ring-line ${!state ? "bg-brand text-white" : "bg-white text-ink hover:bg-brand-50"}`}>All <span className="opacity-70">{all}</span></button>
        {Object.entries(V_STATES).map(([k, v]) => (
          <button key={k} onClick={() => { setState(k); setPage(1); }} className={`rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ring-line ${state === k ? "bg-brand text-white" : "bg-white text-ink hover:bg-brand-50"}`}>{v.label} <span className="opacity-70">{data?.counts[k] ?? 0}</span></button>
        ))}
      </div>
      <Card className="mb-4 flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted" /><Input aria-label="Search volunteers" className="pl-9" placeholder="Search name, mobile, e-mail, ref, iqama…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select aria-label="City" value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }} className="w-48"><option value="">All cities</option>{data?.cities.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select>
      </Card>
      {err && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <Card className="overflow-x-auto">
        {data && data.rows.length === 0 ? <EmptyState title="No volunteers found" description="Try another status, city or search." /> : (
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead className="bg-brand-50/60 text-xs text-muted"><tr><th className="px-4 py-2.5 font-medium">Volunteer</th><th className="px-4 py-2.5 font-medium">Contact</th><th className="px-4 py-2.5 font-medium">City</th><th className="px-4 py-2.5 font-medium">Status</th><th className="px-4 py-2.5 font-medium">ID card</th><th className="px-4 py-2.5 font-medium">Portal role</th><th className="px-4 py-2.5 font-medium">Registered</th></tr></thead>
            <tbody>{(data?.rows ?? []).map((v) => (
              <tr key={v.id} className="border-t border-line hover:bg-brand-50/40">
                <td className="px-4 py-3"><Link href={`/volunteers/${v.id}`} className="flex items-center gap-3 font-semibold text-brand-dark hover:underline"><Avatar name={v.name || "?"} size={32} /><span>{v.name}<span className="block text-xs font-normal text-muted">{v.ref}</span></span></Link></td>
                <td className="px-4 py-3">{v.mobile}<span className="block text-xs text-muted">{v.email}</span></td>
                <td className="px-4 py-3">{v.city || "—"}</td>
                <td className="px-4 py-3"><Badge tone={V_STATES[v.state]?.tone ?? "slate"} dot>{V_STATES[v.state]?.label ?? v.state}</Badge></td>
                <td className="px-4 py-3">{v.memberNo ? <span className="inline-flex items-center gap-1 font-medium"><IdCard className="size-4 text-brand" />{v.memberNo}</span> : <span className="text-muted">—</span>}</td>
                <td className="px-4 py-3">{v.portalUser ? <Badge tone="green">Portal user</Badge> : <span className="text-muted">—</span>}</td>
                <td className="px-4 py-3 text-muted">{v.date ? v.date.slice(0, 10) : ""}</td>
              </tr>))}</tbody>
          </table>)}
      </Card>
      {data && data.total > data.size && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>{data.total} volunteers · page {page} of {pages}</span>
          <span className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="size-4" />Prev</Button><Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next<ChevronRight className="size-4" /></Button></span>
        </div>)}
    </div>
  );
}
export default function VolunteersPage() { return <RoleGuard allow={canManageVolunteers}><Page /></RoleGuard>; }

"use client";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { PriorityBadge } from "@/components/common/badges";
import { RoleGuard } from "@/components/common/role-guard";
import { useStore } from "@/lib/store";
import { ISSUE_CATEGORIES, PRIORITIES } from "@/lib/reference-data";
import { canManageIssueTypes } from "@/lib/permissions";
import type { IssueType, Priority } from "@/lib/types";

const blank = { name: "", category: "Labour", description: "", active: true, defaultPriority: "medium" as Priority };

function Page() {
  const issues = useStore((s) => s.issueTypes);
  const cases = useStore((s) => s.cases);
  const upsert = useStore((s) => s.upsertIssueType);
  const toggle = useStore((s) => s.toggleIssueType);
  const { toast } = useToast();
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [act, setAct] = useState("");
  const [edit, setEdit] = useState<(Partial<IssueType> & typeof blank) | null>(null);
  const [err, setErr] = useState("");
  const rows = useMemo(() => issues.filter((i) => (!q || i.name.toLowerCase().includes(q.toLowerCase())) && (!cat || i.category === cat) && (!act || (act === "active") === i.active)), [issues, q, cat, act]);
  const cats = [...new Set([...ISSUE_CATEGORIES, ...issues.map((i) => i.category)])];
  const save = () => {
    if (!edit) return;
    const dup = issues.find((i) => i.name.trim().toLowerCase() === edit.name.trim().toLowerCase() && i.id !== edit.id);
    if (edit.name.trim().length < 3) return setErr("Name must be at least 3 characters.");
    if (dup) return setErr("An issue type with this name already exists.");
    upsert({ ...edit, name: edit.name.trim() } as IssueType);
    toast({ kind: "success", title: edit.id ? "Issue type updated" : "Issue type added", body: "It is now available in the registration form." });
    setEdit(null); setErr("");
  };
  return (
    <div>
      <PageHeader title="Issue Type Management" description="Issue types are master data — changes appear instantly in the case form, filters and reports." actions={<Button onClick={() => { setErr(""); setEdit({ ...blank }); }}><Plus /> Add issue type</Button>} />
      <Card className="overflow-hidden">
        <div className="grid gap-2 border-b border-line p-4 sm:grid-cols-[1fr_200px_160px]">
          <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search issue types…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search issue types" /></div>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} placeholder="All categories">{cats.map((c) => <option key={c}>{c}</option>)}</Select>
          <Select value={act} onChange={(e) => setAct(e.target.value)} placeholder="Any status"><option value="active">Active</option><option value="inactive">Inactive</option></Select>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[13px]">
          <thead className="bg-brand-50/60 text-xs text-muted"><tr><th className="px-4 py-2.5 font-medium">Issue type</th><th className="px-4 py-2.5 font-medium">Category</th><th className="px-4 py-2.5 font-medium">Default priority</th><th className="px-4 py-2.5 text-right font-medium">Cases</th><th className="px-4 py-2.5 font-medium">Active</th><th /></tr></thead>
          <tbody>{rows.map((i) => (
            <tr key={i.id} className="border-t border-line hover:bg-brand-50/40"><td className="px-4 py-3"><b className="block font-medium">{i.name}</b><span className="text-xs text-muted">{i.description}</span></td><td className="px-4 py-3"><Badge tone="green">{i.category}</Badge></td><td className="px-4 py-3"><PriorityBadge priority={i.defaultPriority} /></td><td className="px-4 py-3 text-right tabular">{cases.filter((c) => c.issueTypeId === i.id).length}</td>
              <td className="px-4 py-3"><Switch checked={i.active} onChange={() => { toggle(i.id); toast({ kind: "info", title: i.active ? "Issue type deactivated" : "Issue type activated", body: i.active ? "Hidden from new cases; existing cases keep it." : "Available for new cases." }); }} label={`Toggle ${i.name}`} /></td>
              <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => { setErr(""); setEdit({ ...i }); }}><Pencil /> Edit</Button></td></tr>))}</tbody></table>
          {rows.length === 0 && <EmptyState title="No issue types found" />}</div>
      </Card>
      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? "Edit issue type" : "Add issue type"} size="sm" footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {edit && <div className="grid gap-4">
          <Field label="Name" required error={err}><Input value={edit.name} onChange={(e) => { setEdit({ ...edit, name: e.target.value }); setErr(""); }} aria-invalid={!!err} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Category"><Select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>{cats.map((c) => <option key={c}>{c}</option>)}</Select></Field><Field label="Default priority"><Select value={edit.defaultPriority} onChange={(e) => setEdit({ ...edit, defaultPriority: e.target.value as Priority })}>{PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</Select></Field></div>
          <Field label="Description"><Textarea rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          <label className="flex items-center gap-3 text-sm"><Switch checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="Active" /> Active</label>
        </div>}
      </Modal>
    </div>
  );
}
export default function IssueTypesPage() { return <RoleGuard allow={canManageIssueTypes}><Page /></RoleGuard>; }

"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { USE_ODOO } from "@/lib/config";
import { odoo } from "@/lib/odoo-client";
import type { Case } from "@/lib/types";
import { ArrowLeft, RefreshCw, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { AssignmentBadge, PriorityBadge, StatusBadge } from "@/components/common/badges";
import { CaseDetailsTabs } from "@/components/cases/case-details-tabs";
import { useCurrentUser, useStore } from "@/lib/store";
import { canUpdate } from "@/lib/permissions";
import { visibleCases } from "@/lib/permissions";
import { STATUSES, statusById } from "@/lib/reference-data";
import type { StatusId } from "@/lib/types";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const me = useCurrentUser()!;
  const all = useStore((s) => s.cases);
  const updateStatus = useStore((s) => s.updateStatus);
  const addTimeline = useStore((s) => s.addTimeline);
  const { toast } = useToast();
  const c = USE_ODOO ? all.find((x) => x.id === id) : visibleCases(me, all).find((x) => x.id === id);
  const [loaded, setLoaded] = useState(!USE_ODOO);
  useEffect(() => {
    if (!USE_ODOO) return;
    const st = useStore.getState(); st.setOpenCase(id);
    odoo<Case>("get_case", id).then((x) => st.cacheCase(x)).catch(() => {}).finally(() => setLoaded(true));
    return () => useStore.getState().setOpenCase(null);
  }, [id]);
  const [st, setSt] = useState(false);
  const [newStatus, setNewStatus] = useState<StatusId | "">("");
  const [note, setNote] = useState("");
  const [fu, setFu] = useState(false);
  const [fuText, setFuText] = useState("");

  if (!c && !loaded) return <div className="h-64 animate-pulse rounded-xl bg-brand-50" />;
  if (!c) return <EmptyState title="Case not found or not accessible" description="It may not exist, or your role does not permit viewing it." action={<Link href="/cases" className="text-sm font-medium text-brand">Back to all cases</Link>} />;
  const can = canUpdate(me, c);

  return (
    <div>
      <Link href="/cases" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"><ArrowLeft className="size-4" /> All cases</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-display text-sm font-bold text-brand-dark tabular">{c.caseNo}</span><StatusBadge status={c.status} /><PriorityBadge priority={c.priority} /><AssignmentBadge state={c.assignment} />{c.source === "excel" && <Badge tone="slate">From Excel register</Badge>}</div>
          <h1 className="text-2xl font-bold leading-tight">{c.name}</h1>
          <p className="mt-1 text-sm text-muted">{c.victimName ? `${c.victimName} · ` : ""}{c.regionKSA || "KSA"} → {[c.districtIndia, c.stateIndia].filter(Boolean).join(", ") || "India"}</p>
        </div>
        {can && <div className="flex gap-2"><Button variant="outline" onClick={() => setFu(true)}><MessageSquarePlus /> Add update</Button><Button onClick={() => { setNewStatus(c.status); setSt(true); }}><RefreshCw /> Update status</Button></div>}
      </div>
      <CaseDetailsTabs c={c} />

      <Modal open={st} onOpenChange={setSt} size="sm" title="Update case status" description={`Current: ${statusById(c.status).label}`}
        footer={<><Button variant="outline" onClick={() => setSt(false)}>Cancel</Button><Button disabled={!newStatus || newStatus === c.status} onClick={() => { updateStatus(c.id, newStatus as StatusId, me, note.trim() || undefined); toast({ kind: "success", title: "Status updated", body: statusById(newStatus as StatusId).label }); setNote(""); setSt(false); }}>Save status</Button></>}>
        <div className="grid gap-4"><Field label="New status" required><Select value={newStatus} onChange={(e) => setNewStatus(e.target.value as StatusId)}>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select></Field><Field label="Note (optional)"><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason or next step" /></Field></div>
      </Modal>
      <Modal open={fu} onOpenChange={setFu} size="sm" title="Add follow-up update" footer={<><Button variant="outline" onClick={() => setFu(false)}>Cancel</Button><Button disabled={fuText.trim().length < 3} onClick={() => { addTimeline(c.id, "followup", fuText.trim(), me); toast({ kind: "success", title: "Update added to timeline" }); setFuText(""); setFu(false); }}>Post</Button></>}>
        <Field label="Update" required><Textarea rows={4} value={fuText} onChange={(e) => setFuText(e.target.value)} placeholder="Spoke with sponsor; hearing set for…" /></Field>
      </Modal>
    </div>
  );
}

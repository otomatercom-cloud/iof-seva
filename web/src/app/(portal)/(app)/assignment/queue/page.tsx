"use client";
import { useState } from "react";
import { AlertTriangle, ArrowLeftRight, Globe2, Inbox, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, PageHeader } from "@/components/ui/card";
import { CaseDataTable } from "@/components/cases/case-data-table";
import { AssignmentDialog, TransferDialog } from "@/components/cases/assignment-dialog";
import { useCurrentUser } from "@/lib/store";
import { useStats } from "@/lib/server-data";
import { canAssign, canTransfer } from "@/lib/permissions";
import type { Case } from "@/lib/types";

export default function AssignmentQueuePage() {
  const me = useCurrentUser()!;
  const { stats: S } = useStats();
  const [assign, setAssign] = useState<Case | null>(null);
  const [transfer, setTransfer] = useState<Case | null>(null);
  const q = S?.queue ?? { waiting: 0, crossProvince: 0, critical: 0, stale: 0 };
  const stale = q.stale;
  const stats = [
    { l: "Waiting for assignment", v: q.waiting, i: Inbox, t: "bg-saffron-50 text-saffron-dark" },
    { l: "Cross-province cases", v: q.crossProvince, i: Globe2, t: "bg-violet-50 text-violet-soft" },
    { l: "Critical in queue", v: q.critical, i: AlertTriangle, t: "bg-danger-50 text-danger" },
    { l: "Waiting 3+ days", v: q.stale, i: AlertTriangle, t: "bg-saffron-50 text-saffron-dark" },
  ];
  return (
    <div>
      <PageHeader title="Assignment Queue" description="Cases routed to your province that still need a coordinator. Cross-province cases keep their original reporter and province." />
      {stale > 0 && <div role="alert" className="mb-4 flex items-center gap-3 rounded-xl border border-[#f7d9ae] bg-saffron-50 px-4 py-3 text-sm text-saffron-dark"><AlertTriangle className="size-4 shrink-0" /><span><b>{stale} case{stale > 1 ? "s have" : " has"} been waiting 3+ days</b> for a coordinator. Assign them to avoid delays for the victim&apos;s family.</span></div>}
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">{stats.map((s) => <Card key={s.l}><CardBody className="flex items-center gap-3 p-4"><span className={`flex size-10 items-center justify-center rounded-lg ${s.t}`}><s.i className="size-5" /></span><span><b className="block font-display text-2xl leading-none tabular">{s.v}</b><span className="text-xs text-muted">{s.l}</span></span></CardBody></Card>)}</div>
      <CaseDataTable view="queue" title="queue cases" rowAction={(c) => (
        <span className="inline-flex gap-1.5">
          {canAssign(me, c) && <Button size="sm" onClick={() => setAssign(c)}><UserPlus /> Assign</Button>}
          {canTransfer(me, c) && <Button size="sm" variant="outline" onClick={() => setTransfer(c)}><ArrowLeftRight /> Transfer</Button>}
        </span>)} />
      {assign && <AssignmentDialog c={assign} open onOpenChange={(o) => !o && setAssign(null)} />}
      {transfer && <TransferDialog c={transfer} open onOpenChange={(o) => !o && setTransfer(null)} />}
    </div>
  );
}

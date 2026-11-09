"use client";
import { USE_ODOO } from "@/lib/config";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser, useStore } from "@/lib/store";
import { useUserMap, useVisibleCases } from "@/lib/hooks";
import { canDecideTransfer } from "@/lib/permissions";
import { fmtDateTime } from "@/lib/utils";
import type { Transfer } from "@/lib/types";

export default function TransfersPage() {
  const me = useCurrentUser()!;
  const cases = useVisibleCases();
  const transfers = useStore((s) => s.transfers);
  const decide = useStore((s) => s.decideTransfer);
  const users = useUserMap();
  const { toast } = useToast();
  const [dlg, setDlg] = useState<{ t: Transfer; accept: boolean } | null>(null);
  const [note, setNote] = useState("");
  const mine = useMemo(() => (USE_ODOO ? transfers : transfers.filter((t) => cases.some((c) => c.id === t.caseId))), [transfers, cases]);
  const pending = mine.filter((t) => t.status === "pending");
  const history = mine.filter((t) => t.status !== "pending");
  const caseOf = (id: string) => cases.find((c) => c.id === id);

  const List = ({ rows, actions }: { rows: Transfer[]; actions?: boolean }) => rows.length === 0 ? <Card><EmptyState title={actions ? "No pending transfer requests" : "No transfer history yet"} description="Cross-province hand-overs will be listed here with a full audit trail." /></Card> : (
    <Card className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-[13px]"><thead className="bg-brand-50/60 text-xs text-muted"><tr><th className="px-4 py-2.5 font-medium">Case</th><th className="px-4 py-2.5 font-medium">Transfer</th><th className="px-4 py-2.5 font-medium">Reason</th><th className="px-4 py-2.5 font-medium">Requested by</th><th className="px-4 py-2.5 font-medium">Status</th>{actions && <th />}</tr></thead>
      <tbody>{rows.map((t) => { const c = caseOf(t.caseId); return (
        <tr key={t.id} className="border-t border-line align-top"><td className="px-4 py-3"><Link href={`/cases/${t.caseId}`} className="font-medium hover:text-brand">{c?.caseNo ?? t.caseNo}<span className="block max-w-[220px] truncate font-normal text-muted">{c?.name ?? t.caseName}</span></Link></td>
          <td className="whitespace-nowrap px-4 py-3"><span className="inline-flex items-center gap-1.5 font-medium">{t.fromProvince}<ArrowRight className="size-3.5 text-muted" />{t.toProvince}</span><span className="block text-xs text-muted">Original reporter kept: {c?.originalReportingProvince ?? t.originalReporter ?? "—"}</span></td>
          <td className="max-w-[260px] px-4 py-3 text-slate-600">{t.reason}</td>
          <td className="whitespace-nowrap px-4 py-3">{users.get(t.requestedBy)?.name}<span className="block text-xs text-muted">{fmtDateTime(t.at)}</span></td>
          <td className="px-4 py-3"><Badge tone={t.status === "accepted" ? "green" : t.status === "rejected" ? "red" : "violet"} className="capitalize">{t.status}</Badge>{t.decidedBy && <span className="mt-1 block text-xs text-muted">by {users.get(t.decidedBy)?.name}</span>}</td>
          {actions && <td className="whitespace-nowrap px-4 py-3 text-right">{canDecideTransfer(me, t.toProvince) ? <span className="inline-flex gap-1.5"><Button size="sm" onClick={() => { setNote(""); setDlg({ t, accept: true }); }}><Check /> Accept</Button><Button size="sm" variant="outline" onClick={() => { setNote(""); setDlg({ t, accept: false }); }}><X /> Reject</Button></span> : <span className="text-xs text-muted">Awaiting {t.toProvince} head</span>}</td>}
        </tr>); })}</tbody></table></Card>
  );

  return (
    <div>
      <PageHeader title="Transfer Requests" description="Requests to move a case to another province, plus the complete transfer history." />
      <Tabs defaultValue="pending">
        <TabsList><TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger><TabsTrigger value="history">Transfer history ({history.length})</TabsTrigger></TabsList>
        <TabsContent value="pending">{List({ rows: pending, actions: true })}</TabsContent>
        <TabsContent value="history">{List({ rows: history })}</TabsContent>
      </Tabs>
      <Modal open={!!dlg} onOpenChange={(o) => !o && setDlg(null)} size="sm" title={dlg?.accept ? "Accept transfer" : "Reject transfer"} description={dlg ? `${caseOf(dlg.t.caseId)?.caseNo}: ${dlg.t.fromProvince} → ${dlg.t.toProvince}` : ""}
        footer={<><Button variant="outline" onClick={() => setDlg(null)}>Cancel</Button><Button variant={dlg?.accept ? "primary" : "danger"} onClick={() => { decide(dlg!.t.id, dlg!.accept, me, note.trim() || undefined); toast({ kind: dlg!.accept ? "success" : "info", title: dlg!.accept ? "Transfer accepted" : "Transfer rejected", body: dlg!.accept ? "The case is now in the target province's assignment queue." : "The case stays with its current province." }); setDlg(null); }}>{dlg?.accept ? "Accept" : "Reject"}</Button></>}>
        <Field label="Note (optional)"><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </Modal>
    </div>
  );
}

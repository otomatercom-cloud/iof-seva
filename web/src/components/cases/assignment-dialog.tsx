"use client";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Info } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { ProvinceSelector } from "@/components/common/province-selector";
import { useCurrentUser, useStore } from "@/lib/store";
import { assignableUsers, transferMode } from "@/lib/permissions";
import { ROLE_LABEL, provinceName } from "@/lib/reference-data";
import { isOpen } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { Case } from "@/lib/types";

function CaseStrip({ c }: { c: Case }) {
  return (
    <div className="mb-4 rounded-xl border border-line bg-brand-50/60 p-3.5">
      <p className="text-xs font-medium text-brand-dark">{c.caseNo}</p>
      <p className="text-sm font-semibold">{c.name}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
        <span>Reported by <b className="font-medium text-ink">{c.originalReportingProvince}</b></span>
        <ArrowRight className="size-3" />
        <span>Responsible <b className="font-medium text-ink">{c.handlingCommittee}</b></span>
      </p>
    </div>
  );
}

export function AssignmentDialog({ c, open, onOpenChange }: { c: Case; open: boolean; onOpenChange: (o: boolean) => void }) {
  const me = useCurrentUser()!;
  const users = useStore((s) => s.users);
  const cases = useStore((s) => s.cases);
  const assign = useStore((s) => s.assignCase);
  const { toast } = useToast();
  const [sel, setSel] = useState<string>("");
  const [note, setNote] = useState("");
  const options = useMemo(() => assignableUsers(users, c), [users, c]);
  const load = (id: string) => cases.filter((x) => x.handledById === id && isOpen(x)).length;

  const submit = () => {
    if (!sel) return;
    assign(c.id, sel, me, note.trim() || undefined);
    toast({ kind: "success", title: "Coordinator assigned", body: `${c.caseNo} → ${users.find((u) => u.id === sel)?.name}. They have been notified.` });
    setSel(""); setNote(""); onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={c.handledById ? "Re-assign case" : "Assign coordinator"} description={`Choose who in ${provinceName(c.handlingCommittee)} will handle this case.`}
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!sel} onClick={submit}><CheckCircle2 /> Assign</Button></>}>
      <CaseStrip c={c} />
      {options.length === 0 ? (
        <p className="rounded-lg bg-saffron-50 p-3 text-sm text-saffron-dark">No active coordinators or handlers are configured for this province.</p>
      ) : (
        <div role="radiogroup" aria-label="Coordinator" className="grid gap-2">
          {options.map((u) => {
            const on = sel === u.id;
            return (
              <button key={u.id} role="radio" aria-checked={on} onClick={() => setSel(u.id)}
                className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition", on ? "border-brand bg-brand-50 ring-2 ring-brand/20" : "border-line hover:border-brand-300 hover:bg-brand-50/40")}>
                <Avatar name={u.name} size={36} />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{u.name}{c.handledById === u.id && <span className="ml-2 text-xs font-normal text-muted">(current)</span>}</span><span className="block text-xs text-muted">{ROLE_LABEL[u.role]} · {u.provinceCode}</span></span>
                <span className="text-right text-xs text-muted"><b className="block text-sm font-semibold text-ink tabular">{load(u.id)}</b>open cases</span>
              </button>
            );
          })}
        </div>
      )}
      <Field label="Note to assignee" className="mt-4"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Context, urgency, who to call first…" rows={3} /></Field>
    </Modal>
  );
}

export function TransferDialog({ c, open, onOpenChange }: { c: Case; open: boolean; onOpenChange: (o: boolean) => void }) {
  const me = useCurrentUser()!;
  const transfer = useStore((s) => s.transferCase);
  const { toast } = useToast();
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<{ to?: string; reason?: string }>({});
  const mode = transferMode(me);

  const submit = () => {
    const e: typeof err = {};
    if (!to) e.to = "Select the responsible province.";
    if (reason.trim().length < 10) e.reason = "Please give a short reason (min. 10 characters).";
    setErr(e);
    if (Object.keys(e).length) return;
    transfer(c.id, to, reason.trim(), me, mode);
    toast({ kind: "success", title: mode === "direct" ? "Case transferred" : "Transfer requested", body: mode === "direct" ? `${c.caseNo} now sits in ${to}'s assignment queue; its head was notified.` : `${to}'s head will accept or reject the request.` });
    setTo(""); setReason(""); onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={mode === "direct" ? "Transfer case to another province" : "Request case transfer"}
      description="Choose the province that should take responsibility. The original reporting person and province are always preserved."
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}><ArrowRight />{mode === "direct" ? "Transfer case" : "Send request"}</Button></>}>
      <CaseStrip c={c} />
      <div className="grid gap-4">
        <Field label="New responsible province" required error={err.to}><ProvinceSelector value={to} onChange={setTo} exclude={[c.handlingCommittee]} invalid={!!err.to} /></Field>
        <Field label="Reason for transfer" required error={err.reason}><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Victim has been moved to a hospital in Riyadh; sponsor's court is in Riyadh." aria-invalid={!!err.reason} /></Field>
        <div className="flex gap-2.5 rounded-lg bg-info-50 p-3 text-[13px] text-[#1d4ed8]"><Info className="mt-0.5 size-4 shrink-0" />
          <p>{mode === "direct" ? "The case will leave your queue and enter the target province's assignment queue. Their Province Head is notified." : "As a coordinator you can request a transfer. The target Province Head (or President) must accept before the case moves."}</p></div>
        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-line p-3 text-[13px]">
          <div><dt className="text-xs text-muted">Original reporter (preserved)</dt><dd className="font-medium">{c.reportingPerson || "—"}</dd></div>
          <div><dt className="text-xs text-muted">Original reporting province</dt><dd className="font-medium">{c.originalReportingProvince}</dd></div>
        </dl>
      </div>
    </Modal>
  );
}

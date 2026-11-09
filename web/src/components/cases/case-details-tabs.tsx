"use client";
import { USE_ODOO } from "@/lib/config";
import { odoo } from "@/lib/odoo-client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, FileImage, FileText, Landmark, Paperclip, Phone, Plus, Send, Stethoscope, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge, Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import { Avatar } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { AssignmentBadge } from "@/components/common/badges";
import { CaseTimeline } from "./case-timeline";
import { AssignmentDialog, TransferDialog } from "./assignment-dialog";
import { useCurrentUser, useStore } from "@/lib/store";
import { useUserMap } from "@/lib/hooks";
import { canAssign, canDecideTransfer, canTransfer, canUpdate } from "@/lib/permissions";
import { DOC_KIND_LABEL, FINANCE_PAYERS, STATUSES, provinceName, statusById } from "@/lib/reference-data";
import { readDataUrl, cn, fmtDate, fmtDateTime, fmtSAR, timeAgo } from "@/lib/utils";
import type { Case, CaseDocument } from "@/lib/types";

const DL = ({ rows, cols = 2 }: { rows: [string, React.ReactNode][]; cols?: 1 | 2 | 3 }) => (
  <dl className={cn("grid gap-x-8 gap-y-4", cols === 2 && "sm:grid-cols-2", cols === 3 && "sm:grid-cols-3")}>
    {rows.map(([k, v]) => (<div key={k}><dt className="text-xs font-medium text-muted">{k}</dt><dd className="mt-0.5 whitespace-pre-line break-words text-[13.5px] font-medium text-ink">{v || <span className="font-normal text-slate-400">Not provided</span>}</dd></div>))}
  </dl>
);
const Section = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <Card><CardHeader title={title} action={action} /><CardBody>{children}</CardBody></Card>
);

export function CaseDetailsTabs({ c }: { c: Case }) {
  const me = useCurrentUser()!;
  const users = useUserMap();
  const issues = useStore((s) => s.issueTypes);
  const transfers = useStore((s) => s.transfers).filter((t) => t.caseId === c.id);
  const decide = useStore((s) => s.decideTransfer);
  const addTimeline = useStore((s) => s.addTimeline);
  const addDocument = useStore((s) => s.addDocument);
  const addFinance = useStore((s) => s.addFinance);
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [assign, setAssign] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [finOpen, setFinOpen] = useState(false);
  const [note, setNote] = useState({ type: "followup" as "followup" | "update" | "remark", text: "", internal: false });
  const [fin, setFin] = useState({ date: "2026-11-03", description: "", amountSAR: "", paidBy: "IOF" as (typeof FINANCE_PAYERS)[number] });
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<CaseDocument["kind"]>("supporting");
  const [preview, setPreview] = useState<CaseDocument | null>(null);

  const handler = c.handledById ? users.get(c.handledById) : null;
  const issue = issues.find((i) => i.id === c.issueTypeId)?.name ?? "—";
  const allowUpdate = canUpdate(me, c);
  const pendingT = transfers.find((t) => t.status === "pending");
  const totals = useMemo(() => FINANCE_PAYERS.map((p) => ({ p, v: c.finance.filter((f) => f.paidBy === p).reduce((s, f) => s + f.amountSAR, 0) })), [c.finance]);
  const visibleTimeline = c.timeline.filter((e) => !e.internal || me.role !== "handler" || e.actorId === me.id);
  const internal = c.timeline.filter((e) => e.internal || e.type === "remark");

  const postUpdate = () => {
    if (note.text.trim().length < 3) return;
    addTimeline(c.id, note.type, note.text.trim(), me, note.internal || note.type === "remark");
    toast({ kind: "success", title: "Timeline updated" });
    setNote({ ...note, text: "" });
  };

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        {[["overview", "Overview"], ["info", "Case Information"], ["victim", "Victim Details"], ["sponsor", "Sponsor Details"], ["assignment", "Assignment"], ["documents", `Documents (${c.documents.length})`], ["timeline", "Case Timeline"], ["finance", "Financial Details"]].map(([v, l]) => <TabsTrigger key={v} value={v}>{l}</TabsTrigger>)}
      </TabsList>

      {/* OVERVIEW */}
      <TabsContent value="overview">
        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-5">
            <Section title="Case summary">
              <p className="text-[15px] font-medium leading-relaxed">{c.summary || "—"}</p>
              <p className="mt-3 whitespace-pre-line text-[13.5px] leading-relaxed text-slate-600">{c.details || "Full case details have not been entered yet."}</p>
            </Section>
            <Section title="Key facts">
              <DL cols={3} rows={[["Issue type", issue], ["Registered", fmtDate(c.registeredOn)], ["Last updated", timeAgo(c.updatedAt)], ["KSA location", c.regionKSA], ["Home (India)", [c.districtIndia, c.stateIndia].filter(Boolean).join(", ")], ["Case reference by", c.referenceBy]]} />
            </Section>
            <Section title="Follow-up updates" action={allowUpdate ? <Button size="sm" variant="soft" onClick={() => setTab("timeline")}><Plus /> Add update</Button> : undefined}>
              {c.timeline.filter((e) => e.type === "followup" || e.type === "update").slice(-3).reverse().map((e) => (
                <div key={e.id} className="border-b border-line py-2.5 text-[13.5px] last:border-0"><span className="font-semibold">{users.get(e.actorId)?.name}</span> <span className="text-xs text-muted">· {timeAgo(e.at)}</span><p className="mt-0.5 text-slate-600">{e.text}</p></div>
              ))}
              {!c.timeline.some((e) => e.type === "followup" || e.type === "update") && <p className="text-sm text-muted">No follow-up updates yet.</p>}
            </Section>
          </div>
          <div className="space-y-5">
            <Section title="Ownership">
              <div className="space-y-4 text-[13px]">
                <Row label="Assigned coordinator">{handler ? <span className="flex items-center gap-2"><Avatar name={handler.name} size={28} /><span><b className="block text-[13.5px]">{handler.name}</b><span className="text-muted">{handler.title}</span></span></span> : <Badge tone="saffron">Unassigned</Badge>}</Row>
                <Row label="Responsible province"><b>{c.handlingCommittee}</b><span className="block text-muted">{provinceName(c.handlingCommittee)}</span></Row>
                <Row label="Reported by"><b>{c.reportingPerson || "—"}</b><span className="block text-muted">{c.originalReportingProvince} (original — preserved)</span></Row>
                <Row label="Assignment"><AssignmentBadge state={c.assignment} /></Row>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {canAssign(me, c) && <Button size="sm" onClick={() => setAssign(true)}>{c.handledById ? "Re-assign" : "Assign coordinator"}</Button>}
                {canTransfer(me, c) && <Button size="sm" variant="outline" onClick={() => setTransfer(true)}>Transfer province</Button>}
              </div>
            </Section>
            <Section title="Internal remarks">
              {internal.length === 0 && !c.remarks ? <p className="text-sm text-muted">No internal remarks.</p> : (
                <ul className="space-y-3 text-[13px]">
                  {c.remarks && <li className="rounded-lg bg-saffron-50 p-3 text-saffron-dark">{c.remarks}</li>}
                  {internal.slice(-3).map((e) => <li key={e.id} className="rounded-lg bg-slate-50 p-3"><span className="font-semibold">{users.get(e.actorId)?.name}</span> · <span className="text-muted">{timeAgo(e.at)}</span><p className="mt-0.5">{e.text}</p></li>)}
                </ul>
              )}
            </Section>
          </div>
        </div>
      </TabsContent>

      {/* INFO */}
      <TabsContent value="info">
        <div className="space-y-5">
          <Section title="Case information"><DL rows={[["Case number", c.caseNo], ["Serial (SL)", String(c.sl)], ["Case name", c.name], ["Issue type", issue], ["Priority", <span key="p" className="capitalize">{c.priority}</span>], ["Registered on", fmtDate(c.registeredOn)], ["Case report from", c.reportedFrom], ["Case handling committee", c.handlingCommittee], ["Handled by", handler?.name], ["Contact details (reporter)", c.contactDetails]]} /></Section>
          <Section title="Location"><DL cols={3} rows={[["Country", c.country], ["Location region (KSA)", c.regionKSA], ["State in Bharath", c.stateIndia], ["District", c.districtIndia], ["Village / town", c.village], ["Full address", c.fullAddress]]} /></Section>
          <Section title="Reference & Seva"><DL rows={[["Case reference by (name & details)", [c.referenceBy, c.referenceDetails].filter(Boolean).join("\n")], ["IOF involvement", c.iofInvolvement], ["Other organisations involved", c.othersInvolvement], ["Seva support", c.sevaSupport], ["Remarks", c.remarks]]} /></Section>
          <Section title="Legacy register status fields"><DL cols={3} rows={[["Initial status", statusById(c.initialStatus).excel], ["OLD", c.oldStatus], ["Status New (to be followed)", statusById(c.status).excel]]} /></Section>
        </div>
      </TabsContent>

      <TabsContent value="victim"><Section title="Victim / beneficiary"><DL rows={[["Name", c.victimName], ["Contact (victim or dependent)", <span key="v" className="inline-flex items-center gap-1.5"><Phone className="size-3.5 text-brand" />{c.victimContact}</span>], ["Alternative contact", c.alternateContact], ["Local ID / passport details", c.localIdPassport], ["Dependents", c.dependents], ["Home", [c.village, c.districtIndia, c.stateIndia].filter(Boolean).join(", ")]]} /></Section></TabsContent>
      <TabsContent value="sponsor"><Section title="Sponsor"><DL rows={[["Sponsor name", c.sponsorName], ["Sponsor mobile", c.sponsorMobile], ["Sponsor details", c.sponsorDetails]]} cols={2} /></Section></TabsContent>

      {/* ASSIGNMENT */}
      <TabsContent value="assignment">
        <div className="space-y-5">
          <Card><CardBody>
            <div className="flex flex-wrap items-center gap-3">
              <Step label="Reported by" main={c.originalReportingProvince} sub={c.reportingPerson} />
              <ArrowRight className="size-4 text-slate-300" />
              <Step label="Responsible province" main={c.handlingCommittee} sub={provinceName(c.handlingCommittee)} accent />
              <ArrowRight className="size-4 text-slate-300" />
              <Step label="Coordinator" main={handler?.name ?? "Unassigned"} sub={handler?.title ?? "In assignment queue"} />
              <div className="ml-auto flex gap-2">{canAssign(me, c) && <Button size="sm" onClick={() => setAssign(true)}>{c.handledById ? "Re-assign" : "Assign coordinator"}</Button>}{canTransfer(me, c) && <Button size="sm" variant="outline" onClick={() => setTransfer(true)}>Transfer province</Button>}</div>
            </div>
          </CardBody></Card>
          {pendingT && (
            <Card className="border-violet-soft/30 bg-violet-50/50"><CardBody className="flex flex-wrap items-center gap-3">
              <Badge tone="violet">Transfer pending</Badge><span className="text-sm">Requested {pendingT.fromProvince} → <b>{pendingT.toProvince}</b> by {users.get(pendingT.requestedBy)?.name} · “{pendingT.reason}”</span>
              {canDecideTransfer(me, pendingT.toProvince) && <span className="ml-auto flex gap-2"><Button size="sm" onClick={() => { decide(pendingT.id, true, me); toast({ kind: "success", title: "Transfer accepted", body: "Case moved to the assignment queue." }); }}><Check /> Accept</Button><Button size="sm" variant="outline" onClick={() => { decide(pendingT.id, false, me); toast({ kind: "info", title: "Transfer rejected" }); }}><X /> Reject</Button></span>}
            </CardBody></Card>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Assignment history">
              {c.assignments.length === 0 ? <p className="text-sm text-muted">No assignments recorded yet.</p> : <ul className="space-y-3">{[...c.assignments].reverse().map((a) => <li key={a.id} className="flex gap-3 text-[13px]"><Avatar name={users.get(a.toId ?? "")?.name ?? "?"} size={30} /><span><b>{users.get(a.toId ?? "")?.name}</b> <span className="text-muted">assigned by {users.get(a.byId)?.name} · {a.province}</span><span className="block text-xs text-muted">{fmtDateTime(a.at)}{a.note ? ` · ${a.note}` : ""}</span></span></li>)}</ul>}
            </Section>
            <Section title="Transfer history">
              {transfers.length === 0 ? <p className="text-sm text-muted">This case has not been transferred.</p> : <ul className="space-y-3">{transfers.map((t) => <li key={t.id} className="text-[13px]"><div className="flex flex-wrap items-center gap-2"><b>{t.fromProvince}</b><ArrowRight className="size-3.5 text-muted" /><b>{t.toProvince}</b><Badge tone={t.status === "accepted" ? "green" : t.status === "rejected" ? "red" : "violet"} className="capitalize">{t.status}</Badge></div><p className="mt-0.5 text-muted">{t.reason}</p><p className="text-xs text-muted">Requested by {users.get(t.requestedBy)?.name} · {fmtDateTime(t.at)}{t.decidedBy ? ` · decided by ${users.get(t.decidedBy)?.name}` : ""}</p></li>)}</ul>}
            </Section>
          </div>
        </div>
      </TabsContent>

      {/* DOCUMENTS */}
      <TabsContent value="documents">
        <Section title="Attachments" action={allowUpdate ? (
          <div className="flex items-center gap-2"><Select value={kind} onChange={(e) => setKind(e.target.value as CaseDocument["kind"])} className="h-8 w-40 text-[13px]">{Object.entries(DOC_KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
            <Button size="sm" onClick={() => fileRef.current?.click()}><Paperclip /> Upload</Button>
            <input ref={fileRef} type="file" hidden multiple onChange={async (e) => { const files = [...(e.target.files ?? [])]; e.target.value = ""; for (const f of files) { const data = USE_ODOO ? await readDataUrl(f) : undefined; addDocument(c.id, { name: f.name, kind, sizeKb: Math.max(1, Math.round(f.size / 1024)), mime: f.type || "application/octet-stream", data }, me); } if (files.length) toast({ kind: "success", title: "Document uploaded" }); }} /></div>) : undefined}>
          {c.documents.length === 0 ? <EmptyState icon={<Paperclip />} title="No documents attached" description="Upload identity documents, medical reports or supporting files." /> : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {c.documents.map((d) => (
                <button key={d.id} onClick={() => setPreview(d)} className="group flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/50">
                  <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-lg", d.kind === "medical" ? "bg-danger-50 text-danger" : d.kind === "identity" ? "bg-info-50 text-info" : "bg-brand-50 text-brand")}>{d.kind === "medical" ? <Stethoscope className="size-5" /> : d.mime.startsWith("image") ? <FileImage className="size-5" /> : <FileText className="size-5" />}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium">{d.name}</span><span className="text-xs text-muted">{DOC_KIND_LABEL[d.kind]} · {d.sizeKb} KB · {fmtDate(d.at)}</span></span>
                </button>
              ))}
            </div>
          )}
        </Section>
        <Modal open={!!preview} onOpenChange={(o) => !o && setPreview(null)} title={preview?.name ?? ""} description={preview ? `${DOC_KIND_LABEL[preview.kind]} · uploaded by ${users.get(preview.uploadedBy)?.name} · ${fmtDateTime(preview.at)}` : ""}>
          {preview && (USE_ODOO ? <DocViewer doc={preview} /> : <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 text-center"><FileText className="size-10 text-brand" /><p className="text-sm font-medium">Preview placeholder</p><p className="max-w-xs text-xs text-muted">Demo mode – files are not stored.</p></div>)}
        </Modal>
      </TabsContent>

      {/* TIMELINE */}
      <TabsContent value="timeline">
        <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
          {allowUpdate && (
            <Card className="h-fit"><CardHeader title="Add timeline update" description="Visible to everyone with access, unless marked internal." /><CardBody className="space-y-3">
              <Select value={note.type} onChange={(e) => setNote({ ...note, type: e.target.value as typeof note.type })}><option value="followup">Follow-up</option><option value="update">Progress update</option><option value="remark">Internal remark</option></Select>
              <Textarea rows={4} value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })} placeholder="What happened? Who did you speak to? What is next?" />
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-600"><input type="checkbox" checked={note.internal || note.type === "remark"} disabled={note.type === "remark"} onChange={(e) => setNote({ ...note, internal: e.target.checked })} className="size-4 accent-[#138a50]" /> Internal only (hidden from case handlers outside this case)</label>
              <Button onClick={postUpdate} disabled={note.text.trim().length < 3} className="w-full"><Send /> Post update</Button>
            </CardBody></Card>
          )}
          <Card className={cn(!allowUpdate && "xl:col-span-2")}><CardHeader title="Activity timeline" description={`${visibleTimeline.length} events · newest first`} /><CardBody><CaseTimeline events={visibleTimeline} /></CardBody></Card>
        </div>
      </TabsContent>

      {/* FINANCE */}
      <TabsContent value="finance">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-4">
            {totals.map((t) => <Card key={t.p}><CardBody className="p-4"><p className="text-xs text-muted">{t.p}</p><p className="mt-1 font-display text-xl font-bold tabular">{fmtSAR(t.v)}</p></CardBody></Card>)}
          </div>
          <Section title="Expense ledger" action={allowUpdate ? <Button size="sm" onClick={() => setFinOpen(true)}><Plus /> Add entry</Button> : undefined}>
            {c.finance.length === 0 ? <EmptyState icon={<Landmark />} title="No financial entries" description={c.financialExpenses || "Record Seva expenses and who paid for them."} /> : (
              <table className="w-full text-left text-[13px]"><thead className="text-xs text-muted"><tr><th className="py-2 font-medium">Date</th><th className="py-2 font-medium">Description</th><th className="py-2 font-medium">Paid by</th><th className="py-2 text-right font-medium">Amount</th></tr></thead>
                <tbody>{c.finance.map((f) => <tr key={f.id} className="border-t border-line"><td className="py-2.5 tabular">{fmtDate(f.date)}</td><td>{f.description}</td><td><Badge>{f.paidBy}</Badge></td><td className="text-right font-medium tabular">{fmtSAR(f.amountSAR)}</td></tr>)}</tbody></table>
            )}
            <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2 text-[13px]"><div><p className="text-xs text-muted">Financial expenses / Seva (register field)</p><p className="font-medium">{c.financialExpenses || "—"}</p></div><div><p className="text-xs text-muted">Seva support details</p><p className="font-medium">{c.sevaSupport || "—"}</p></div></div>
          </Section>
        </div>
        <Modal open={finOpen} onOpenChange={setFinOpen} title="Add financial entry" size="sm" footer={<><Button variant="outline" onClick={() => setFinOpen(false)}>Cancel</Button><Button disabled={!fin.description.trim() || !(+fin.amountSAR > 0)} onClick={() => { addFinance(c.id, { date: fin.date, description: fin.description.trim(), amountSAR: +fin.amountSAR, paidBy: fin.paidBy }, me); toast({ kind: "success", title: "Entry added" }); setFin({ ...fin, description: "", amountSAR: "" }); setFinOpen(false); }}>Add entry</Button></>}>
          <div className="grid gap-4"><Field label="Description" required><Input value={fin.description} onChange={(e) => setFin({ ...fin, description: e.target.value })} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Amount (SAR)" required><Input type="number" min={1} value={fin.amountSAR} onChange={(e) => setFin({ ...fin, amountSAR: e.target.value })} /></Field><Field label="Date"><Input type="date" value={fin.date} onChange={(e) => setFin({ ...fin, date: e.target.value })} /></Field></div><Field label="Paid by"><Select value={fin.paidBy} onChange={(e) => setFin({ ...fin, paidBy: e.target.value as typeof fin.paidBy })}>{FINANCE_PAYERS.map((p) => <option key={p}>{p}</option>)}</Select></Field></div>
        </Modal>
      </TabsContent>

      {assign && <AssignmentDialog c={c} open onOpenChange={setAssign} />}
      {transfer && <TransferDialog c={c} open onOpenChange={setTransfer} />}
    </Tabs>
  );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => <div><p className="mb-1 text-xs font-medium text-muted">{label}</p><div className="text-[13.5px]">{children}</div></div>;
const Step = ({ label, main, sub, accent }: { label: string; main: string; sub?: string; accent?: boolean }) => (
  <div className={cn("min-w-[160px] rounded-xl border px-4 py-2.5", accent ? "border-brand bg-brand-50" : "border-line")}><p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p><p className="text-sm font-semibold">{main}</p>{sub && <p className="truncate text-xs text-muted">{sub}</p>}</div>
);

/** Fetches the private attachment through the BFF (permission-checked by Odoo) and renders / offers download. */
function DocViewer({ doc }: { doc: CaseDocument }) {
  const [state, setState] = useState<{ url?: string; mime?: string; err?: string }>({});
  useEffect(() => {
    let alive = true;
    odoo<{ name: string; data: string }>("get_document", doc.id)
      .then((r) => {
        if (!alive) return;
        const bin = atob(r.data || ""); const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
        const ext = (r.name.split(".").pop() || "").toLowerCase();
        const mime = ext === "pdf" ? "application/pdf" : ["png", "jpg", "jpeg", "gif", "webp"].includes(ext) ? `image/${ext === "jpg" ? "jpeg" : ext}` : "application/octet-stream";
        setState({ url: URL.createObjectURL(new Blob([bytes], { type: mime })), mime });
      })
      .catch((e) => alive && setState({ err: e instanceof Error ? e.message : "Could not open the file." }));
    return () => { alive = false; };
  }, [doc.id]);
  if (state.err) return <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-[#b42318]">{state.err}</p>;
  if (!state.url) return <p className="py-10 text-center text-sm text-muted">Loading file…</p>;
  return (
    <div className="space-y-3">
      {state.mime?.startsWith("image") ? <img src={state.url} alt={doc.name} className="max-h-[60vh] w-full rounded-xl border border-line object-contain" />
        : state.mime === "application/pdf" ? <iframe src={state.url} title={doc.name} className="h-[60vh] w-full rounded-xl border border-line" />
        : <p className="py-8 text-center text-sm text-muted">No inline preview for this file type.</p>}
      <a href={state.url} download={doc.name} className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark">Download</a>
    </div>
  );
}

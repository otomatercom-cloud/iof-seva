"use client";
import { USE_ODOO } from "@/lib/config";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileText, Info, Lock, Save, Send, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardBody, PageHeader, Progress } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { ProvinceSelector } from "@/components/common/province-selector";
import { PriorityBadge } from "@/components/common/badges";
import { useCurrentUser, useStore } from "@/lib/store";
import { DOC_KIND_LABEL, EXTERNAL_SOURCES, INDIA_GEO, KSA_REGIONS, PRIORITIES, provinceName, regionOf } from "@/lib/reference-data";
import { readDataUrl, cn, fmtDate } from "@/lib/utils";
import type { Case, CaseDocument, Priority } from "@/lib/types";

const STEPS = ["Basic information", "Reporting", "Location", "Victim", "Sponsor", "IOF Seva", "Documents & review"] as const;
const phoneOk = (v: string) => !v.trim() || /^[+\d][\d\s\-()]{6,}$/.test(v.trim());

interface Form {
  name: string; summary: string; details: string; registeredOn: string; issueTypeId: string; priority: Priority | "";
  reportingPerson: string; reportingCoordinatorId: string; reportedFrom: string; contactDetails: string; referenceKind: string; referenceBy: string; referenceDetails: string;
  handlingCommittee: string; handledById: string;
  country: string; regionKSA: string; stateIndia: string; districtIndia: string; village: string; fullAddress: string;
  victimName: string; victimContact: string; alternateContact: string; localIdPassport: string; dependents: string;
  sponsorName: string; sponsorMobile: string; sponsorDetails: string;
  iofInvolvement: string; othersInvolvement: string; financialExpenses: string; sevaSupport: string; remarks: string;
}
type Errors = Partial<Record<keyof Form, string>>;

export function CaseRegistrationWizard() {
  const me = useCurrentUser()!;
  const router = useRouter();
  const { toast } = useToast();
  const issues = useStore((s) => s.issueTypes).filter((i) => i.active);
  const users = useStore((s) => s.users);
  const cases = useStore((s) => s.cases);
  const register = useStore((s) => s.registerCase);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [docs, setDocs] = useState<CaseDocument[]>([]);
  const [done, setDone] = useState<Case | null>(null);
  const [f, setF] = useState<Form>({
    name: "", summary: "", details: "", registeredOn: "2026-11-03", issueTypeId: "", priority: "",
    reportingPerson: me.name, reportingCoordinatorId: me.id, reportedFrom: me.provinceCode, contactDetails: me.phone, referenceKind: "", referenceBy: "", referenceDetails: "",
    handlingCommittee: me.provinceCode, handledById: "",
    country: "Saudi Arabia", regionKSA: "", stateIndia: "", districtIndia: "", village: "", fullAddress: "",
    victimName: "", victimContact: "", alternateContact: "", localIdPassport: "", dependents: "",
    sponsorName: "", sponsorMobile: "", sponsorDetails: "",
    iofInvolvement: "", othersInvolvement: "", financialExpenses: "", sevaSupport: "", remarks: "",
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF((s) => ({ ...s, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined })); };

  const nextSL = useMemo(() => Math.max(...cases.map((c) => c.sl), 0) + 1, [cases]);
  const caseNo = f.handlingCommittee ? `${f.handlingCommittee.slice(0, 6)}-${nextSL}` : `—-${nextSL}`;
  const crossProvince = !!f.handlingCommittee && regionOf(f.handlingCommittee) !== regionOf(f.reportedFrom);
  const sameRegionAsMe = regionOf(f.handlingCommittee) === regionOf(me.provinceCode);
  const handlers = users.filter((u) => u.active && (u.role === "handler" || u.role === "coordinator") && regionOf(u.provinceCode) === regionOf(f.handlingCommittee));
  const reporters = users.filter((u) => u.active && u.role !== "handler" && regionOf(u.provinceCode) === (regionOf(f.reportedFrom) ?? regionOf(me.provinceCode)));
  const ksaAll = useMemo(() => [...new Set(Object.values(KSA_REGIONS).flat())].sort(), []);
  const districts = INDIA_GEO[f.stateIndia] ?? [];

  const validate = (s: number): Errors => {
    const e: Errors = {};
    const req = (k: keyof Form, msg: string) => { if (!String(f[k]).trim()) e[k] = msg; };
    if (s === 0) {
      req("name", "Case title is required."); req("summary", "Add a one-line summary."); req("issueTypeId", "Choose an issue type."); req("priority", "Select a priority."); req("registeredOn", "Registration date is required.");
      if (f.details.trim().length < 20) e.details = "Describe the case in at least 20 characters.";
    }
    if (s === 1) {
      req("reportingPerson", "Who reported this case?"); req("reportedFrom", "Select the reporting province / source."); req("handlingCommittee", "Select the responsible province.");
      if (!f.contactDetails.trim()) e.contactDetails = "Contact number is required."; else if (!phoneOk(f.contactDetails)) e.contactDetails = "Enter a valid phone number.";
    }
    if (s === 2) { req("regionKSA", "Select the KSA location."); req("stateIndia", "Select the Indian state."); if (f.stateIndia && f.stateIndia !== "Other" && !f.districtIndia) e.districtIndia = "Select a district."; if (f.stateIndia === "Other") req("districtIndia", "Enter the district."); }
    if (s === 3) { req("victimName", "Victim / beneficiary name is required."); if (!f.victimContact.trim()) e.victimContact = "Contact is required."; else if (!phoneOk(f.victimContact)) e.victimContact = "Enter a valid phone number."; if (!phoneOk(f.alternateContact)) e.alternateContact = "Enter a valid phone number."; }
    if (s === 4) { if (!phoneOk(f.sponsorMobile)) e.sponsorMobile = "Enter a valid mobile number."; }
    if (s === 5) req("iofInvolvement", "Describe IOF's involvement so far.");
    return e;
  };

  const go = (n: number) => {
    if (n > step) { for (let i = step; i < n; i++) { const e = validate(i); if (Object.keys(e).length) { setErrors(e); setStep(i); toast({ kind: "error", title: "Please complete the required fields" }); return; } } }
    setErrors({}); setStep(n); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const build = () => ({
    name: f.name.trim(), summary: f.summary.trim(), details: f.details.trim(), contactDetails: f.contactDetails.trim(), reportingPerson: f.reportingPerson.trim(),
    reportingCoordinatorId: f.reportingCoordinatorId || null, reportedFrom: f.reportedFrom, handlingCommittee: f.handlingCommittee, handledById: f.handledById || null,
    registeredOn: f.registeredOn, issueTypeId: f.issueTypeId, priority: (f.priority || "medium") as Priority, regionKSA: f.regionKSA, country: f.country,
    stateIndia: f.stateIndia, districtIndia: f.districtIndia, village: f.village, fullAddress: f.fullAddress, localIdPassport: f.localIdPassport,
    victimName: f.victimName, victimContact: f.victimContact, alternateContact: f.alternateContact, dependents: f.dependents,
    referenceBy: [f.referenceKind, f.referenceBy].filter(Boolean).join(" · "), referenceDetails: f.referenceDetails,
    sponsorName: f.sponsorName, sponsorMobile: f.sponsorMobile, sponsorDetails: f.sponsorDetails, iofInvolvement: f.iofInvolvement,
    othersInvolvement: f.othersInvolvement, financialExpenses: f.financialExpenses, sevaSupport: f.sevaSupport, remarks: f.remarks, documents: docs,
  });

  const [saving, setSaving] = useState(false);
  const submit = async (isSubmit: boolean) => {
    if (isSubmit) { for (let i = 0; i < 6; i++) { const e = validate(i); if (Object.keys(e).length) { setErrors(e); setStep(i); toast({ kind: "error", title: "Some required fields are missing", body: `Step ${i + 1}: ${STEPS[i]}` }); return; } } }
    else if (!f.name.trim()) { setErrors({ name: "Give the draft a title first." }); setStep(0); return; }
    if (saving) return;
    setSaving(true);
    let c: Case;
    try { c = await register(build(), me, isSubmit); } catch (e) { setSaving(false); toast({ kind: "error", title: "Could not save the case", body: e instanceof Error ? e.message : undefined }); return; }
    setSaving(false);
    if (isSubmit) setDone(c); else { toast({ kind: "success", title: "Draft saved", body: `${c.caseNo} is visible only to you until submitted.` }); router.push(`/cases/${c.id}`); }
  };

  if (done) {
    const awaiting = done.assignment === "awaiting_assignment";
    return (
      <Card className="mx-auto mt-6 max-w-2xl"><CardBody className="px-8 py-10 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand"><CheckCircle2 className="size-7" /></span>
        <h2 className="mt-4 font-display text-2xl font-bold">Case registered</h2>
        <p className="mt-1 text-muted">Case number <b className="text-brand-dark">{done.caseNo}</b></p>
        <div className="mx-auto mt-6 max-w-md rounded-xl border border-line bg-brand-50/60 p-4 text-left text-sm">
          {awaiting ? <><p className="font-semibold">Now in the {done.handlingCommittee} assignment queue</p><p className="mt-1 text-muted">The Province Head of {provinceName(done.handlingCommittee)} has been notified and will assign a coordinator. Your name and province ({done.originalReportingProvince}) stay on the case as the original reporter.</p></>
            : <><p className="font-semibold">Assigned and in progress</p><p className="mt-1 text-muted">The handler has been notified.</p></>}
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-2"><Button onClick={() => router.push(`/cases/${done.id}`)}>View case</Button><Button variant="outline" onClick={() => router.push("/cases")}>All cases</Button><Button variant="ghost" onClick={() => window.location.reload()}>Register another</Button></div>
      </CardBody></Card>
    );
  }

  const issueName = issues.find((i) => i.id === f.issueTypeId)?.name ?? "—";
  const addFiles = async (kind: CaseDocument["kind"], list: FileList | null) => {
    if (!list) return;
    const datas = await Promise.all([...list].map((x) => (USE_ODOO ? readDataUrl(x) : Promise.resolve(undefined))));
    setDocs((d) => [...d, ...[...list].map((x, i) => ({ data: datas[i], id: `nd${Date.now()}${i}`, name: x.name, kind, sizeKb: Math.max(1, Math.round(x.size / 1024)), mime: x.type || "application/octet-stream", uploadedBy: me.id, at: new Date().toISOString() }))]);
  };

  return (
    <div>
      <PageHeader title="Register new case" description="A guided 7-step form. Required fields are marked *; you can save a draft at any point." actions={<Link href="/cases" className="text-sm font-medium text-muted hover:text-ink">Cancel</Link>} />
      {/* progress */}
      <Card className="mb-5"><CardBody className="py-4">
        <ol className="hidden items-center md:flex">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center last:flex-none">
              <button onClick={() => go(i)} className="group flex cursor-pointer items-center gap-2.5" aria-current={i === step ? "step" : undefined}>
                <span className={cn("flex size-7 items-center justify-center rounded-full text-xs font-bold transition", i < step ? "bg-brand text-white" : i === step ? "bg-saffron text-white ring-4 ring-saffron/20" : "bg-slate-100 text-slate-500")}>{i < step ? <Check className="size-4" /> : i + 1}</span>
                <span className={cn("text-[13px] font-medium", i === step ? "text-ink" : "text-muted group-hover:text-ink")}>{s}</span>
              </button>
              {i < STEPS.length - 1 && <span className={cn("mx-3 h-px flex-1", i < step ? "bg-brand" : "bg-line")} />}
            </li>
          ))}
        </ol>
        <div className="md:hidden"><p className="mb-2 text-sm font-semibold">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p><Progress value={((step + 1) / STEPS.length) * 100} /></div>
      </CardBody></Card>

      <Card><CardBody className="p-6">
        {step === 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Case number" hint="Auto-generated: first 6 characters of the responsible committee + serial (same rule as the Excel register)."><Input value={caseNo} readOnly disabled className="font-semibold tabular text-brand-dark" /></Field>
            <Field label="Registration date" required error={errors.registeredOn}><Input type="date" value={f.registeredOn} onChange={(e) => set("registeredOn", e.target.value)} aria-invalid={!!errors.registeredOn} /></Field>
            <Field label="Case name / title" required error={errors.name} className="md:col-span-2"><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Unpaid wages – 4 months, Al-Rashid Manufacturing" aria-invalid={!!errors.name} /></Field>
            <Field label="Short case description" required error={errors.summary} className="md:col-span-2"><Input value={f.summary} onChange={(e) => set("summary", e.target.value)} maxLength={140} placeholder="One line shown in lists" aria-invalid={!!errors.summary} /></Field>
            <Field label="Issue type" required error={errors.issueTypeId}><Select value={f.issueTypeId} onChange={(e) => { set("issueTypeId", e.target.value); const it = issues.find((i) => i.id === e.target.value); if (it && !f.priority) set("priority", it.defaultPriority); }} placeholder="Select issue type" aria-invalid={!!errors.issueTypeId}>{issues.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></Field>
            <Field label="Priority" required error={errors.priority}>
              <div className="flex gap-2" role="radiogroup" aria-label="Priority">{PRIORITIES.slice().reverse().map((p) => <button key={p.id} role="radio" aria-checked={f.priority === p.id} onClick={() => set("priority", p.id)} className={cn("flex-1 cursor-pointer rounded-lg border py-2 text-[13px] font-medium transition", f.priority === p.id ? "border-brand bg-brand-50 text-brand-dark ring-2 ring-brand/20" : "border-line hover:bg-brand-50/50")}>{p.label}</button>)}</div>
            </Field>
            <Field label="Full case details" required error={errors.details} className="md:col-span-2" hint="Include what happened, current situation, who is affected and what help is needed."><Textarea rows={6} value={f.details} onChange={(e) => set("details", e.target.value)} aria-invalid={!!errors.details} /></Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Reporting person" required error={errors.reportingPerson}><Input value={f.reportingPerson} onChange={(e) => set("reportingPerson", e.target.value)} aria-invalid={!!errors.reportingPerson} /></Field>
            <Field label="Reporting coordinator / staff"><Select value={f.reportingCoordinatorId} onChange={(e) => set("reportingCoordinatorId", e.target.value)} placeholder="— none —">{reporters.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.provinceCode}</option>)}</Select></Field>
            <Field label="Reporting province (case reported from)" required error={errors.reportedFrom} hint="Preserved permanently, even after transfers."><ProvinceSelector value={f.reportedFrom} onChange={(v) => set("reportedFrom", v)} includeExternal invalid={!!errors.reportedFrom} /></Field>
            <Field label="Contact number" required error={errors.contactDetails}><Input value={f.contactDetails} onChange={(e) => set("contactDetails", e.target.value)} placeholder="+966 5x xxx xxxx" aria-invalid={!!errors.contactDetails} /></Field>
            <Field label="Case reference by"><Select value={f.referenceKind} onChange={(e) => set("referenceKind", e.target.value)} placeholder="— select source —">{[...EXTERNAL_SOURCES, "IOF member", "Hospital / police", "Other"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label="Reference name"><Input value={f.referenceBy} onChange={(e) => set("referenceBy", e.target.value)} placeholder="Name of the person who referred" /></Field>
            <Field label="Reference details" className="md:col-span-2"><Textarea rows={2} value={f.referenceDetails} onChange={(e) => set("referenceDetails", e.target.value)} /></Field>

            <div className="md:col-span-2 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
              <div className="mb-3 flex items-center gap-2"><Badge tone="green">Responsibility</Badge><span className="text-sm font-semibold">Which province should handle this case?</span></div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Responsible province (Case Handling Committee)" required error={errors.handlingCommittee}><ProvinceSelector value={f.handlingCommittee} onChange={(v) => { set("handlingCommittee", v); set("handledById", ""); }} invalid={!!errors.handlingCommittee} /></Field>
                {sameRegionAsMe && f.handlingCommittee ? (
                  <Field label="Handled by (optional)" hint="Leave empty to send it to the assignment queue."><Select value={f.handledById} onChange={(e) => set("handledById", e.target.value)} placeholder="Assign later via queue">{handlers.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.provinceCode}</option>)}</Select></Field>
                ) : <div />}
              </div>
              {f.handlingCommittee && (
                <p className="mt-3 flex gap-2 text-[13px] text-slate-600"><Info className="mt-0.5 size-4 shrink-0 text-brand" />
                  {crossProvince || !sameRegionAsMe ? <span><b>Cross-province case.</b> It will enter <b>{f.handlingCommittee}</b>’s assignment queue and its Province Head will be notified. You remain the original reporter.</span>
                    : f.handledById ? <span>The case will be assigned immediately to the selected handler.</span> : <span>The case will wait in your province’s assignment queue until a coordinator is assigned.</span>}</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Country"><Select value={f.country} onChange={(e) => set("country", e.target.value)}>{["Saudi Arabia", "United Arab Emirates", "Kuwait", "Qatar", "Bahrain", "Oman", "Other"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label="Region / city (Location Region KSA)" required error={errors.regionKSA}><Select value={f.regionKSA} onChange={(e) => set("regionKSA", e.target.value)} placeholder="Select region" aria-invalid={!!errors.regionKSA}>{ksaAll.map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label="Indian state" required error={errors.stateIndia} hint="Victim's home state in Bharath"><Select value={f.stateIndia} onChange={(e) => { set("stateIndia", e.target.value); set("districtIndia", ""); }} placeholder="Select state" aria-invalid={!!errors.stateIndia}>{Object.keys(INDIA_GEO).map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label="District" required error={errors.districtIndia}>
              {f.stateIndia === "Other" ? <Input value={f.districtIndia} onChange={(e) => set("districtIndia", e.target.value)} placeholder="Type district" aria-invalid={!!errors.districtIndia} /> : <Select value={f.districtIndia} disabled={!f.stateIndia} onChange={(e) => set("districtIndia", e.target.value)} placeholder={f.stateIndia ? "Select district" : "Choose a state first"} aria-invalid={!!errors.districtIndia}>{districts.map((x) => <option key={x}>{x}</option>)}</Select>}
            </Field>
            <Field label="Village / town" className="md:col-span-2"><Input value={f.village} onChange={(e) => set("village", e.target.value)} /></Field>
            <Field label="Full address" className="md:col-span-2"><Textarea rows={3} value={f.fullAddress} onChange={(e) => set("fullAddress", e.target.value)} /></Field>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Victim / beneficiary name" required error={errors.victimName}><Input value={f.victimName} onChange={(e) => set("victimName", e.target.value)} aria-invalid={!!errors.victimName} /></Field>
            <Field label="Contact details (victim or dependent)" required error={errors.victimContact}><Input value={f.victimContact} onChange={(e) => set("victimContact", e.target.value)} placeholder="+91 …" aria-invalid={!!errors.victimContact} /></Field>
            <Field label="Alternative contact" error={errors.alternateContact}><Input value={f.alternateContact} onChange={(e) => set("alternateContact", e.target.value)} aria-invalid={!!errors.alternateContact} /></Field>
            <Field label="Local ID / passport details"><Input value={f.localIdPassport} onChange={(e) => set("localIdPassport", e.target.value)} placeholder="Passport no. · Iqama no." /></Field>
            <Field label="Dependent information" className="md:col-span-2"><Textarea rows={3} value={f.dependents} onChange={(e) => set("dependents", e.target.value)} placeholder="Family members in India who depend on the victim" /></Field>
            <p className="flex items-center gap-2 text-xs text-muted md:col-span-2"><Lock className="size-3.5" /> Personal data is confidential and visible only to authorised case roles.</p>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Sponsor name"><Input value={f.sponsorName} onChange={(e) => set("sponsorName", e.target.value)} /></Field>
            <Field label="Sponsor mobile number" error={errors.sponsorMobile}><Input value={f.sponsorMobile} onChange={(e) => set("sponsorMobile", e.target.value)} placeholder="+966 5x xxx xxxx" aria-invalid={!!errors.sponsorMobile} /></Field>
            <Field label="Sponsor details" className="md:col-span-2"><Textarea rows={4} value={f.sponsorDetails} onChange={(e) => set("sponsorDetails", e.target.value)} placeholder="Company, location, cooperation level, previous contact…" /></Field>
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="IOF involvement" required error={errors.iofInvolvement} className="md:col-span-2"><Textarea rows={3} value={f.iofInvolvement} onChange={(e) => set("iofInvolvement", e.target.value)} aria-invalid={!!errors.iofInvolvement} placeholder="What IOF has done / will do" /></Field>
            <Field label="Other organisation involvement" className="md:col-span-2"><Textarea rows={2} value={f.othersInvolvement} onChange={(e) => set("othersInvolvement", e.target.value)} placeholder="Embassy, Matur Sangathan, charity, hospital…" /></Field>
            <Field label="Financial expenses / Seva"><Input value={f.financialExpenses} onChange={(e) => set("financialExpenses", e.target.value)} placeholder="e.g. SAR 1,500 hospital deposit" /></Field>
            <Field label="Seva support details"><Input value={f.sevaSupport} onChange={(e) => set("sevaSupport", e.target.value)} placeholder="Food, shelter, legal aid, ticket…" /></Field>
            <Field label="Remarks" className="md:col-span-2"><Textarea rows={3} value={f.remarks} onChange={(e) => set("remarks", e.target.value)} /></Field>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {(["supporting", "medical", "identity"] as const).map((k) => <Dropzone key={k} kind={k} onFiles={(l) => addFiles(k, l)} />)}
            </div>
            {docs.length > 0 && (
              <ul className="divide-y divide-line rounded-xl border border-line">
                {docs.map((d) => <li key={d.id} className="flex items-center gap-3 px-4 py-2.5 text-sm"><FileText className="size-4 text-brand" /><span className="min-w-0 flex-1 truncate">{d.name}</span><Badge>{DOC_KIND_LABEL[d.kind]}</Badge><span className="w-16 text-right text-xs text-muted tabular">{d.sizeKb} KB</span><button onClick={() => setDocs((x) => x.filter((y) => y.id !== d.id))} aria-label={`Remove ${d.name}`} className="cursor-pointer text-muted hover:text-danger"><Trash2 className="size-4" /></button></li>)}
              </ul>
            )}
            <div>
              <h3 className="mb-3 font-display text-base font-bold">Review before submitting</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                <Review title="Basic" step={0} go={go} rows={[["Case no.", caseNo], ["Title", f.name], ["Issue type", issueName], ["Priority", f.priority ? <PriorityBadge key="p" priority={f.priority} /> : "—"], ["Registered", fmtDate(f.registeredOn)], ["Summary", f.summary]]} />
                <Review title="Reporting & responsibility" step={1} go={go} rows={[["Reporting person", f.reportingPerson], ["Reported from", f.reportedFrom], ["Contact", f.contactDetails], ["Responsible province", f.handlingCommittee], ["Handled by", users.find((u) => u.id === f.handledById)?.name || "Assignment queue"]]} />
                <Review title="Location" step={2} go={go} rows={[["KSA", `${f.regionKSA || "—"}, ${f.country}`], ["India", [f.village, f.districtIndia, f.stateIndia].filter(Boolean).join(", ") || "—"]]} />
                <Review title="Victim" step={3} go={go} rows={[["Name", f.victimName], ["Contact", f.victimContact], ["ID / passport", f.localIdPassport || "—"]]} />
                <Review title="Sponsor" step={4} go={go} rows={[["Sponsor", f.sponsorName || "—"], ["Mobile", f.sponsorMobile || "—"]]} />
                <Review title="IOF Seva" step={5} go={go} rows={[["IOF involvement", f.iofInvolvement], ["Financial", f.financialExpenses || "—"], ["Documents", `${docs.length} attached`]]} />
              </div>
            </div>
          </div>
        )}
      </CardBody>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-brand-50/40 px-6 py-4">
        <Button variant="outline" onClick={() => submit(false)}><Save /> Save as draft</Button>
        <div className="flex gap-2">
          {step > 0 && <Button variant="outline" onClick={() => go(step - 1)}><ArrowLeft /> Previous</Button>}
          {step < STEPS.length - 1 ? <Button onClick={() => go(step + 1)}>Next <ArrowRight /></Button> : <Button variant="saffron" onClick={() => submit(true)}><Send /> Submit case</Button>}
        </div>
      </div></Card>
    </div>
  );
}

function Dropzone({ kind, onFiles }: { kind: CaseDocument["kind"]; onFiles: (l: FileList | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const label = { supporting: "Supporting documents", medical: "Medical reports", identity: "Identity documents" }[kind];
  return (
    <button type="button" onClick={() => ref.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-6 text-center transition hover:border-brand hover:bg-brand-50">
      <UploadCloud className="size-6 text-brand" /><span className="text-sm font-semibold">{label}</span><span className="text-xs text-muted">Drop files or click · PDF, JPG, PNG</span>
      <input ref={ref} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
    </button>
  );
}

function Review({ title, rows, step, go }: { title: string; rows: [string, React.ReactNode][]; step: number; go: (n: number) => void }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="mb-2 flex items-center justify-between"><h4 className="text-sm font-semibold">{title}</h4><button onClick={() => go(step)} className="cursor-pointer text-xs font-medium text-brand hover:text-brand-dark">Edit</button></div>
      <dl className="space-y-1.5 text-[13px]">{rows.map(([k, v]) => <div key={k} className="flex gap-3"><dt className="w-32 shrink-0 text-muted">{k}</dt><dd className="min-w-0 flex-1 break-words font-medium">{v || "—"}</dd></div>)}</dl>
    </div>
  );
}

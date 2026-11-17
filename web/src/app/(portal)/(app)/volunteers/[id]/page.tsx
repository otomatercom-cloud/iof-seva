"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, IdCard, Mail, Printer, UserCog, XCircle } from "lucide-react";
import { Avatar, Badge, Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { RoleGuard } from "@/components/common/role-guard";
import { ProvinceSelector } from "@/components/common/province-selector";
import { odoo } from "@/lib/odoo-client";
import { canManageVolunteers } from "@/lib/permissions";
import { ROLE_LABEL } from "@/lib/reference-data";
import { useCurrentUser } from "@/lib/store";
import { V_STATES, type VolunteerDetail } from "@/lib/volunteers";

const FIELDS: [string, string][] = [
  ["first_name", "First name"], ["last_name", "Last name"], ["mobile", "Mobile"], ["whatsapp", "WhatsApp"], ["email", "E-mail"],
  ["city", "City"], ["iqama_number", "Iqama no."], ["nationality", "Nationality"],
  ["occupation", "Occupation"], ["organization", "Organization"], ["qualification", "Qualification"], ["languages", "Languages"],
  ["emergency_name", "Emergency contact"], ["emergency_relationship", "Relationship"], ["emergency_phone", "Emergency phone"],
];

function Page() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const me = useCurrentUser();
  const [v, setV] = useState<VolunteerDetail | null>(null);
  const [edit, setEdit] = useState(false); const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); const [roleOpen, setRoleOpen] = useState(false);
  const [role, setRole] = useState("handler"); const [prov, setProv] = useState(""); const [pw, setPw] = useState("");
  const load = useCallback(() => odoo<VolunteerDetail>("volunteer_get", id).then(setV).catch((e: Error) => toast({ kind: "error", title: e.message })), [id, toast]);
  useEffect(() => { load(); }, [load]);
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast({ kind: "success", title: ok }); await load(); } catch (e) { toast({ kind: "error", title: (e as Error).message }); } finally { setBusy(false); }
  };
  if (!v) return <p className="p-6 text-sm text-muted">Loading…</p>;
  const st = V_STATES[v.state]; const isPres = me?.role === "president";
  const startEdit = () => { setForm(Object.fromEntries(FIELDS.map(([k]) => [k, String(v[k] ?? "")]))); setEdit(true); };
  return (
    <div>
      <Link href="/volunteers" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" />Volunteers</Link>
      <PageHeader title={v.name} description={`${v.ref} · registered ${v.date?.slice(0, 10) ?? ""}`}
        actions={<div className="flex flex-wrap gap-2">
          {v.state !== "approved" && <Button disabled={busy} onClick={() => run(() => odoo("volunteer_set_state", id, "approve"), "Approved")}><BadgeCheck className="size-4" />Approve</Button>}
          {v.state !== "rejected" && <Button variant="danger" disabled={busy} onClick={() => run(() => odoo("volunteer_set_state", id, "reject"), "Rejected")}><XCircle className="size-4" />Reject</Button>}
          {v.state === "new" && <Button variant="outline" disabled={busy} onClick={() => run(() => odoo("volunteer_set_state", id, "review"), "Under review")}>Start review</Button>}
        </div>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Profile" action={!edit ? <Button variant="outline" size="sm" onClick={startEdit}>Edit</Button> : undefined} />
          <CardBody>
            <div className="mb-4 flex items-center gap-4">
              {v.photo ? <img src={v.photo} alt="" className="size-20 rounded-xl object-cover ring-1 ring-line" /> : <Avatar name={v.name || "?"} size={64} />}
              <div><Badge tone={st?.tone ?? "slate"} dot>{st?.label ?? v.state}</Badge>
                {v.duplicates ? <p className="mt-1 text-xs text-amber-700">Possible duplicates: {String(v.duplicates)}</p> : null}</div>
            </div>
            {edit ? (
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(async () => { const ch = Object.fromEntries(FIELDS.filter(([k]) => form[k] !== String(v[k] ?? "")).map(([k]) => [k, form[k]])); if (Object.keys(ch).length) await odoo("volunteer_update", id, ch); setEdit(false); }, "Profile saved"); }}>
                {FIELDS.map(([k, l]) => <Field key={k} label={l}><Input value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></Field>)}
                <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={busy}>Save</Button><Button type="button" variant="outline" onClick={() => setEdit(false)}>Cancel</Button></div>
              </form>
            ) : (
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {FIELDS.map(([k, l]) => <div key={k}><dt className="text-xs text-muted">{l}</dt><dd className="font-medium">{String(v[k] || "—")}</dd></div>)}
                <div className="sm:col-span-2"><dt className="text-xs text-muted">Interests</dt><dd className="font-medium">{v.interests.join(", ") || "—"}</dd></div>
              </dl>)}
          </CardBody>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="ID card" />
            <CardBody className="space-y-3 text-sm">
              {!v.hasCards ? <p className="text-muted">ID card module is not installed on this server.</p> : v.memberNo ? (<>
                <p className="flex items-center gap-2 font-semibold"><IdCard className="size-4 text-brand" />{v.memberNo}</p>
                <div className="flex flex-wrap gap-2">
                  <a href={`/api/volunteer-card/${id}`} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><Printer className="size-4" />Print / PDF</Button></a>
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => run(() => odoo("volunteer_email_card", id), "Card e-mailed")}><Mail className="size-4" />E-mail card</Button>
                </div></>) : v.state === "approved" ? (
                <Button disabled={busy} onClick={() => run(() => odoo("volunteer_issue_card", id), "ID card issued")}><IdCard className="size-4" />Issue ID card</Button>
              ) : <p className="text-muted">Approve the volunteer to issue an ID card.</p>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Portal access" />
            <CardBody className="space-y-3 text-sm">
              {v.portalUser ? <Badge tone="green">Portal user: {v.portalUser}</Badge> : <p className="text-muted">No portal login yet.</p>}
              {isPres && v.state === "approved" ? <Button variant="soft" size="sm" onClick={() => setRoleOpen(true)}><UserCog className="size-4" />{v.portalUser ? "Change role" : "Assign role"}</Button>
                : <p className="text-xs text-muted">{v.state !== "approved" ? "Approve first to assign a role." : "Only the President can assign roles."}</p>}
            </CardBody>
          </Card>
        </div>
      </div>
      <Modal open={roleOpen} onOpenChange={setRoleOpen} size="sm" title="Assign portal role" description="Creates a portal login for this volunteer."
        footer={<><Button variant="outline" onClick={() => setRoleOpen(false)}>Cancel</Button>
          <Button disabled={busy || !prov || (!v.portalUser && pw.length < 8)} onClick={() => run(async () => { await odoo("volunteer_assign_role", id, role, prov, pw || null); setRoleOpen(false); setPw(""); }, "Role assigned")}>Assign</Button></>}>
        <div className="space-y-3">
          <Field label="Role"><Select value={role} onChange={(e) => setRole(e.target.value)}>{(["handler", "coordinator", "province_head", "secretary"] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select></Field>
          <Field label="Province"><ProvinceSelector value={prov} onChange={setProv} /></Field>
          {!v.portalUser && <Field label="Temporary password (min 8)"><Input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>}
        </div>
      </Modal>
    </div>
  );
}
export default function VolunteerDetailPage() { return <RoleGuard allow={canManageVolunteers}><Page /></RoleGuard>; }

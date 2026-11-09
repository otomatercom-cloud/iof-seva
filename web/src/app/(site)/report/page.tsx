"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSiteStore, loadSite } from "@/lib/site-cms";
import { USE_ODOO } from "@/lib/config";
import "./report.css";

type Opt = { id?: string; code?: string; name: string };

export default function ReportPage() {
  const c = useSiteStore((s) => s.content);
  const [issues, setIssues] = useState<Opt[]>([]);
  const [committees, setCommittees] = useState<Opt[]>([]);
  const [f, setF] = useState({ name: "", phone: "", email: "", relation: "relative", victimName: "", victimPhone: "", issueTypeId: "", country: "Saudi Arabia", place: "", committee: "", details: "", urgent: false, consent: false, website: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ref, setRef] = useState("");
  const t0 = useRef(0);
  useEffect(() => { t0.current = Date.now(); void loadSite(); }, []);
  useEffect(() => { if (USE_ODOO) fetch("/api/report").then((r) => r.json()).then((j) => { setIssues(j.issueTypes ?? []); setCommittees(j.committees ?? []); }).catch(() => {}); }, []);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!USE_ODOO) { setRef("DEMO-0001"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, elapsedMs: Date.now() - t0.current }) });
      const j = await r.json();
      if (r.ok && j.ok) setRef(j.ref); else setErr(j.error || "Could not send. Please call us.");
    } catch { setErr("Could not send. Please call us."); }
    setBusy(false);
  };
  const phone = c.contact?.phone ?? "";
  return (
    <main className="rp">
      <div className="wrap">
        <Link href="/" className="back">← Back to website</Link>
        <h1>Report a case</h1>
        <p className="lead">Tell us about a person in need of help. IOF volunteers will contact you. In an emergency, please call us directly{phone ? <> on <b>{phone}</b></> : null}.</p>
        {ref ? (
          <div className="done" role="status">
            <div className="tick">✓</div>
            <h2>Thank you. Your report has been received.</h2>
            <p>Reference number</p>
            <p className="ref">{ref}</p>
            <p>Please keep this number. A coordinator will call you on the phone number you gave.</p>
          </div>
        ) : (
          <form onSubmit={submit} >
            <div className="grid">
              <div><label className="l" htmlFor="r-name">Your name *</label><input id="r-name" required value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" /></div>
              <div><label className="l" htmlFor="r-phone">Your phone / WhatsApp *</label><input id="r-phone" required inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" /></div>
              <div><label className="l" htmlFor="r-email">Email (optional)</label><input id="r-email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></div>
              <div><label className="l" htmlFor="r-rel">You are the victim&apos;s</label><select id="r-rel" value={f.relation} onChange={(e) => set("relation", e.target.value)}><option value="relative">Relative / family</option><option value="community">Friend / local community</option></select></div>
            </div>
            <div className="grid">
              <div><label className="l" htmlFor="r-victim">Name of the person in need</label><input id="r-victim" value={f.victimName} onChange={(e) => set("victimName", e.target.value)} /></div>
              <div><label className="l" htmlFor="r-vphone">Their phone number</label><input id="r-vphone" inputMode="tel" value={f.victimPhone} onChange={(e) => set("victimPhone", e.target.value)} /></div>
              <div><label className="l" htmlFor="r-issue">Type of problem *</label><select id="r-issue" required value={f.issueTypeId} onChange={(e) => set("issueTypeId", e.target.value)}><option value="">Select…</option>{issues.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
              <div><label className="l" htmlFor="r-com">Nearest IOF committee</label><select id="r-com" value={f.committee} onChange={(e) => set("committee", e.target.value)}><option value="">I don&apos;t know</option>{committees.map((i) => <option key={i.code} value={i.code}>{i.name}</option>)}</select></div>
              <div><label className="l" htmlFor="r-country">Country</label><input id="r-country" value={f.country} onChange={(e) => set("country", e.target.value)} /></div>
              <div><label className="l" htmlFor="r-place">City / place</label><input id="r-place" value={f.place} onChange={(e) => set("place", e.target.value)} /></div>
            </div>
            <div><label className="l" htmlFor="r-details">What happened? *</label><textarea id="r-details" required minLength={15} rows={5} value={f.details} onChange={(e) => set("details", e.target.value)} placeholder="Where is the person, what is the problem, since when, what help is needed." /></div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" value={f.website} onChange={(e) => set("website", e.target.value)} />
            <label className="chk"><input type="checkbox" checked={f.urgent} onChange={(e) => set("urgent", e.target.checked)} /> This is urgent (life, safety, jail, hospital)</label>
            <label className="chk"><input type="checkbox" required checked={f.consent} onChange={(e) => set("consent", e.target.checked)} /> <span>I agree that IOF may store this information and contact me about this case. *</span></label>
            {err && <p role="alert" className="err">{err}</p>}
            <button disabled={busy} className="send">{busy ? "Sending…" : "Send report"}</button>
          </form>
        )}
      </div>
    </main>
  );
}

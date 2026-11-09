import type {
  AssignmentRecord, Case, CaseDocument, FinanceEntry, Notification, Priority, StatusId, TimelineEvent, Transfer, User,
} from "./types";
import { EXTERNAL_SOURCES, INDIA_GEO, KSA_REGIONS, PROVINCES, SEED_ISSUE_TYPES, regionOf, casePrefixOf } from "./reference-data";

/* ───────────────────────── Users (sample profiles; first names follow the Excel "IOF Representative" list) ───────────────────────── */
export const USERS: User[] = [
  { id: "u1", name: "Rajeev Menon", email: "president@iof.demo", phone: "+966 50 111 0001", role: "president", provinceCode: "IOF-NC", active: true, title: "Overall President" },
  { id: "u2", name: "Harish Nair", email: "head.ep@iof.demo", phone: "+966 50 111 0002", role: "province_head", provinceCode: "IOF-EP", active: true, title: "Head · Eastern Province" },
  { id: "u3", name: "Salim Rahman", email: "head.cp@iof.demo", phone: "+966 50 111 0003", role: "province_head", provinceCode: "IOF-CP", active: true, title: "Head · Central Province" },
  { id: "u4", name: "Prakash Iyer", email: "head.wp@iof.demo", phone: "+966 50 111 0004", role: "province_head", provinceCode: "IOF-WP", active: true, title: "Head · Western Province" },
  { id: "u5", name: "Mukesh Kumar", email: "mukesh@iof.demo", phone: "+966 50 111 0005", role: "coordinator", provinceCode: "IOF-EP-Dammam", active: true, title: "Coordinator · Dammam" },
  { id: "u6", name: "Libin Thomas", email: "libin@iof.demo", phone: "+966 50 111 0006", role: "coordinator", provinceCode: "IOF-EP-Jubail", active: true, title: "Coordinator · Jubail" },
  { id: "u7", name: "Devendar Reddy", email: "devendar@iof.demo", phone: "+966 50 111 0007", role: "coordinator", provinceCode: "IOF-WP-Jeedha", active: true, title: "Coordinator · Jeddah" },
  { id: "u8", name: "Sivaprasath R", email: "sivaprasath@iof.demo", phone: "+966 50 111 0008", role: "coordinator", provinceCode: "IOF-CP-Riyad", active: true, title: "Coordinator · Riyadh" },
  { id: "u9", name: "Anil Pillai", email: "anil@iof.demo", phone: "+966 50 111 0009", role: "handler", provinceCode: "IOF-EP-Dammam", active: true, title: "Case Handler · Dammam" },
  { id: "u10", name: "Somesh Gupta", email: "somesh@iof.demo", phone: "+966 50 111 0010", role: "handler", provinceCode: "IOF-EP-AlHasa", active: true, title: "Case Handler · Al-Hasa" },
  { id: "u11", name: "Suresh Babu", email: "suresh@iof.demo", phone: "+966 50 111 0011", role: "handler", provinceCode: "IOF-EP-Kobhar", active: true, title: "Case Handler · Khobar" },
  { id: "u12", name: "Faisal Khan", email: "faisal@iof.demo", phone: "+966 50 111 0012", role: "handler", provinceCode: "IOF-WP-Jeedha", active: true, title: "Case Handler · Jeddah" },
  { id: "u13", name: "Naseer Ali", email: "naseer@iof.demo", phone: "+966 50 111 0013", role: "handler", provinceCode: "IOF-CP-Riyad", active: true, title: "Case Handler · Riyadh" },
  { id: "u14", name: "Rahul Das", email: "rahul@iof.demo", phone: "+966 50 111 0014", role: "handler", provinceCode: "IOF-EP-Jubail", active: true, title: "Case Handler · Jubail" },
  { id: "u16", name: "Abdul Rahim", email: "secretary@iof.demo", phone: "+966 50 111 0016", role: "secretary", provinceCode: "IOF-NC", active: true, title: "Secretary" },
  { id: "u15", name: "Imran Sheikh", email: "imran@iof.demo", phone: "+966 50 111 0015", role: "handler", provinceCode: "IOF-WP", active: false, title: "Case Handler · Western (inactive)" },
];

/* ───────────────────────── deterministic PRNG ───────────────────────── */
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261103);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const weighted = <T,>(items: [T, number][]) => {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [v, w] of items) { if ((r -= w) <= 0) return v; }
  return items[0][0];
};
const DAY = 86400000;
const iso = (ms: number) => new Date(ms).toISOString();
const dateOnly = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/* ───────────────────────── Content pools ───────────────────────── */
const FIRST = ["Abdul", "Ravi", "Shaji", "Biju", "Mohan", "Venkat", "Imtiyaz", "Santhosh", "Ramesh", "Nizam", "Gopal", "Arun", "Sajid", "Pradeep", "Krishnan", "Manoj", "Yusuf", "Dinesh", "Jaison", "Rafeeq", "Ajith", "Lakshman", "Hamza", "Sunil"];
const LAST = ["Kutty", "Kumar", "Pillai", "Naik", "Reddy", "Ansari", "Nair", "Singh", "Khan", "Das", "Varghese", "Yadav", "Shaikh", "Menon", "Prasad", "Rao"];
const SPONSORS = ["Al-Faisal Contracting", "Najd Trading Est.", "Gulf Star Logistics", "Saudi Delta Services", "Al-Rashid Manufacturing", "Red Sands Catering", "Horizon Facilities Co.", "Mr. Khalid Al-Otaibi (individual)", "Eastern Steel Works", "Al-Madina Maintenance"];
const ORGS = ["Embassy of India – Consulate Jeddah", "Indian Embassy Riyadh – Labour wing", "Local Saudi charity committee", "Matur Sangathan volunteers", "Indian Community Welfare Fund (ICWF)", "Hospital social-service unit", "None"];

const TEMPLATES: Record<string, { t: string[]; d: string[]; inv: string[] }> = {
  it1: {
    t: ["Unpaid wages – {n} months", "Contract substitution & salary cut", "Final exit refused by sponsor", "Passport withheld by employer"],
    d: ["Worker reports salary unpaid for {n} months and the employer has stopped responding. Contract copy is available; request to negotiate settlement through the Labour Office.", "Job offered differs from signed contract (lower pay, longer hours). Worker wants to return home and claim end-of-service benefits.", "Sponsor refuses to issue final exit despite completed contract. Worker has been waiting {n} months without wages."],
    inv: ["Counselling and complaint filing with the Labour Office; follow-up with sponsor.", "Letter drafted to employer; case raised with the Indian Embassy labour wing."],
  },
  it2: {
    t: ["Detained over unpaid loan", "Bounced cheque – detention", "Financial claim by former sponsor", "Detained in civil monetary dispute"],
    d: ["Detained after a civil claim of SAR {a} filed by a creditor. Family requests intervention for settlement and release.", "Cheque issued for business purchase bounced; claimant filed a police complaint. IOF asked to mediate and arrange partial settlement.", "Former sponsor filed a financial claim after worker changed jobs. Worker is currently held at the local detention centre."],
    inv: ["Mediation with claimant; legal-aid lawyer consulted.", "Fund-raising among members started; waiting for court date."],
  },
  it3: {
    t: ["Detained – assault allegation", "Detained after workplace altercation", "Murder charge – legal assistance requested"],
    d: ["Detained following an altercation at the workplace in which the other party was injured. Case is with the public prosecutor.", "Serious criminal allegation. Family in India requests legal representation and consular access.", "Accused in a violent incident; trial hearing pending. IOF coordinating with embassy for lawyer and consular visit."],
    inv: ["Consular access requested; lawyer engaged.", "Family counselling; hearing attendance by IOF volunteers."],
  },
  it4: {
    t: ["Detained – expired iqama / run-away report", "Huroob (absconding) case filed by sponsor", "Detained during labour inspection"],
    d: ["Detained in an inspection campaign for expired iqama. Sponsor had filed absconding report earlier.", "Sponsor filed a huroob case; worker was arrested at a checkpoint. Seeking cancellation and exit visa.", "Worker picked up during labour inspection. Needs deportation / final-exit processing."],
    inv: ["Coordinating with Embassy for Outpass; clearing fines.", "Sponsor negotiation to cancel the huroob report."],
  },
  it5: {
    t: ["Hospitalised – ICU admission", "Accident injury – surgery required", "Cardiac emergency – family support", "Long-term treatment & repatriation"],
    d: ["Admitted with {x}. Treatment ongoing; hospital bill pending and no insurance cover identified.", "Injured in a road accident; surgery scheduled. Family has no resources for travel and wants medical repatriation.", "Admitted through emergency and is on ventilator support. Sponsor not cooperating on insurance claim."],
    inv: ["Hospital visits by volunteers; bill negotiation with social-service desk.", "Medical repatriation process with air-ambulance quote."],
  },
  it6: {
    t: ["Natural death – repatriation of remains", "Death at residence – documents pending", "Cardiac arrest – mortal remains"],
    d: ["Passed away due to natural causes. Family requests repatriation of the mortal remains to India. Death certificate is pending.", "Found unresponsive at residence; hospital confirmed natural death. Sponsor and family consent letters collected.", "Died of cardiac arrest at the workplace. Documentation for repatriation in progress."],
    inv: ["Documentation, Embassy NOC, cargo booking and funeral support coordinated.", "Family support and end-of-service benefit follow-up."],
  },
  it7: {
    t: ["Suspicious death – police investigation", "Road accident fatality", "Suicide case – family counselling", "Workplace accident death"],
    d: ["Un-natural death reported; police investigation underway. Family needs a post-mortem report and repatriation support.", "Died in a road accident on the highway. Traffic-police report awaited; compensation claim to be filed.", "Workplace accident death. Employer insurance claim and repatriation to be coordinated with Embassy."],
    inv: ["Police liaison; Embassy attestation and cargo clearance support.", "Compensation claim follow-up with insurer."],
  },
};

const ISSUE_IDS = SEED_ISSUE_TYPES.map((i) => i.id);
const RESP_WEIGHTS: [string, number][] = [
  ["IOF-EP-Dammam", 6], ["IOF-EP-Jubail", 3], ["IOF-EP-AlHasa", 2], ["IOF-EP-Kobhar", 3], ["IOF-CP-Riyad", 7], ["IOF-WP-Jeedha", 7], ["IOF-EP", 1], ["IOF-CP", 1], ["IOF-WP", 2],
];
const STATE_W: [string, number][] = [["Kerala", 8], ["Tamil Nadu", 6], ["Telangana", 5], ["Andhra Pradesh", 4], ["Uttar Pradesh", 4], ["Bihar", 3], ["Karnataka", 3], ["West Bengal", 2], ["Maharashtra", 2], ["Punjab", 1], ["Rajasthan", 1]];

const staffFor = (unit: string, include: ("coordinator" | "handler")[] = ["coordinator", "handler"]) => {
  const reg = regionOf(unit);
  const same = USERS.filter((u) => u.active && include.includes(u.role as never) && regionOf(u.provinceCode) === reg);
  const exact = same.filter((u) => u.provinceCode === unit);
  return exact.length ? exact : same;
};

/* ───────────────────────── Case generation ───────────────────────── */
const NOW = new Date("2026-11-03T09:00:00Z").getTime();
const START = new Date("2026-01-06T00:00:00Z").getTime();
const N = 46;

function statusFor(ageDays: number): StatusId {
  if (ageDays > 150) return weighted<StatusId>([["completed", 4], ["closed_finance", 5], ["pending_judiciary", 1], ["pending_indian_authority", 1]]);
  if (ageDays > 60) return weighted<StatusId>([["completed", 3], ["closed_finance", 2], ["inprogress_iof", 2], ["pending_judiciary", 2], ["pending_sponsor", 2], ["pending_indian_authority", 2], ["pending_police", 1], ["pending_medical", 1]]);
  if (ageDays > 20) return weighted<StatusId>([["inprogress_iof", 4], ["pending_judiciary", 2], ["pending_sponsor", 2], ["pending_police", 2], ["pending_medical", 2], ["pending_indian_authority", 1], ["completed", 1]]);
  return weighted<StatusId>([["open_new", 3], ["inprogress_iof", 3], ["pending_medical", 1], ["pending_sponsor", 1]]);
}
const CHAIN: StatusId[] = ["open_new", "inprogress_iof"];

function buildCase(sl: number, awaiting: boolean, crossRegion: boolean): Case {
  const issueTypeId = weighted<string>(ISSUE_IDS.map((id, i) => [id, [4, 3, 1, 2, 3, 2, 1][i]]));
  const issue = SEED_ISSUE_TYPES.find((i) => i.id === issueTypeId)!;
  const tpl = TEMPLATES[issueTypeId];
  const ts = START + Math.floor(rnd() * (NOW - START - 2 * DAY));
  const regMs = awaiting ? NOW - Math.floor(rnd() * 6) * DAY - DAY / 3 : ts;
  const ageDays = Math.floor((NOW - regMs) / DAY);
  const handling = weighted(RESP_WEIGHTS);
  const hReg = regionOf(handling)!;
  // reporting side
  let reportedFrom: string;
  if (crossRegion) {
    const others = PROVINCES.filter((p) => p.region !== hReg && p.region !== "NC");
    reportedFrom = pick(others).code;
  } else {
    const r = rnd();
    reportedFrom = r < 0.55 ? pick(PROVINCES.filter((p) => p.region === hReg)).code : r < 0.8 ? "IOF-NC" : pick(EXTERNAL_SOURCES);
  }
  const reporterIsIof = !!PROVINCES.find((p) => p.code === reportedFrom);
  const reporters = reporterIsIof ? staffFor(reportedFrom, ["coordinator"]) : [];
  const reportingCoordinator = reporters.length ? pick(reporters) : null;

  const status = awaiting ? "open_new" : statusFor(ageDays);
  const victim = `${pick(FIRST)} ${pick(LAST)}`;
  const n = 2 + Math.floor(rnd() * 5);
  const sub = (s: string) => s.replace("{n}", String(n)).replace("{a}", String((8 + Math.floor(rnd() * 90)) * 1000)).replace("{x}", pick(["pneumonia", "a stroke", "kidney failure", "severe diabetes complications"]));
  const state = weighted(STATE_W);
  const district = pick(INDIA_GEO[state] ?? ["—"]);
  const ksa = pick(KSA_REGIONS[hReg === "NC" ? "CP" : hReg]);
  const sponsor = pick(SPONSORS);
  const priority: Priority =
    issueTypeId === "it3" || issueTypeId === "it7" ? "critical" : issueTypeId === "it5" || issueTypeId === "it2" ? weighted<Priority>([["high", 3], ["critical", 1], ["medium", 1]]) : weighted<Priority>([["medium", 3], ["low", 2], ["high", 2]]);
  const title = sub(pick(tpl.t));
  const detail = sub(pick(tpl.d));
  const pool = staffFor(handling);
  const handler = awaiting ? null : pick(pool.filter((u) => u.role === "handler").length ? pool.filter((u) => u.role === "handler") : pool);
  const creator = reportingCoordinator ?? pick(USERS.filter((u) => u.role === "coordinator"));
  const closed = status === "completed" || status === "closed_finance";

  /* timeline */
  const tl: TimelineEvent[] = [];
  let t = regMs;
  const ev = (type: TimelineEvent["type"], actorId: string, text: string, extra: Partial<TimelineEvent> = {}) => {
    tl.push({ id: `t${sl}-${tl.length + 1}`, type, at: iso(t), actorId, text, ...extra });
    t += (0.3 + rnd() * 3) * DAY * Math.min(1, Math.max(0.05, ageDays / 40));
  };
  ev("created", creator.id, `Case registered from ${reportedFrom} and routed to ${handling}.`);
  const assigns: AssignmentRecord[] = [];
  if (handler) {
    const headId = USERS.find((u) => u.role === "province_head" && u.provinceCode === `IOF-${hReg}`)?.id ?? "u1";
    ev("assigned", headId, `Assigned to ${handler.name} (${handling}).`, { meta: { to: handler.name } });
    assigns.push({ id: `a${sl}-1`, caseId: `c${sl}`, at: tl[tl.length - 1].at, byId: headId, toId: handler.id, province: handling, note: "Initial assignment" });
  }
  const ci = status === "open_new" ? -1 : CHAIN.indexOf(status);
  if (status !== "open_new" && !awaiting) {
    ev("status", handler?.id ?? creator.id, "Status changed to In progress · IOF work.", { meta: { from: "open_new", to: "inprogress_iof" } });
    ev("update", handler?.id ?? creator.id, pick(tpl.inv));
    if (ci === -1) ev("status", handler?.id ?? creator.id, `Status changed to ${status.replace(/_/g, " ")}.`, { meta: { from: "inprogress_iof", to: status } });
    if (rnd() > 0.5) ev("followup", handler?.id ?? creator.id, "Follow-up call with family in India; they have been updated on progress.");
    if (rnd() > 0.6) ev("remark", handler?.id ?? creator.id, "Sponsor contacted again – promised response within the week.", { internal: true });
  }
  let resolvedAt: string | undefined;
  if (closed) {
    t = Math.min(t, NOW - DAY);
    ev("resolved", handler?.id ?? creator.id, status === "completed" ? "Case completed – victim/family informed." : "Case closed including finance settlement.");
    resolvedAt = tl[tl.length - 1].at;
  }

  /* documents */
  const docs: CaseDocument[] = [];
  if (!awaiting && rnd() > 0.35) docs.push({ id: `d${sl}-1`, name: `${victim.split(" ")[0]}_passport_copy.pdf`, kind: "identity", sizeKb: 420 + Math.floor(rnd() * 500), mime: "application/pdf", uploadedBy: creator.id, at: iso(regMs + 3600_000) });
  if (issueTypeId === "it5" || issueTypeId === "it6" || issueTypeId === "it7") docs.push({ id: `d${sl}-2`, name: issueTypeId === "it5" ? "hospital_discharge_summary.pdf" : "medical_report_certificate.pdf", kind: "medical", sizeKb: 800 + Math.floor(rnd() * 900), mime: "application/pdf", uploadedBy: handler?.id ?? creator.id, at: iso(regMs + DAY) });
  if (rnd() > 0.5) docs.push({ id: `d${sl}-3`, name: "contract_and_iqama_scan.jpg", kind: "supporting", sizeKb: 300 + Math.floor(rnd() * 400), mime: "image/jpeg", uploadedBy: creator.id, at: iso(regMs + 2 * 3600_000) });

  /* finance */
  const fin: FinanceEntry[] = [];
  if (!awaiting && (issueTypeId !== "it1" || rnd() > 0.5) && rnd() > 0.3) {
    const k = 1 + Math.floor(rnd() * 2);
    for (let i = 0; i < k; i++) fin.push({ id: `f${sl}-${i}`, date: dateOnly(regMs + (i + 2) * 4 * DAY), description: pick(["Hospital deposit", "Legal consultation fee", "Air ticket support", "Mortal-remains cargo charges", "Settlement contribution", "Travel + food support"]), amountSAR: (3 + Math.floor(rnd() * 40)) * 100, paidBy: pick(["IOF", "IOF", "Sponsor", "Other organisation", "Relatives"]) });
  }
  const spent = fin.filter((f) => f.paidBy === "IOF").reduce((s, f) => s + f.amountSAR, 0);

  const lastAt = tl[tl.length - 1].at;
  const caseNo = `${casePrefixOf(handling)}-${sl}`; // prefix = committee setting (default LEFT(code,6)); global SL
  return {
    id: `c${sl}`, sl, caseNo, name: title, summary: detail.slice(0, 110) + (detail.length > 110 ? "…" : ""), details: detail,
    contactDetails: `${reportingCoordinator?.name ?? "IOF volunteer"} · ${reportingCoordinator?.phone ?? "+966 5" + Math.floor(10000000 + rnd() * 89999999)}`,
    reportingPerson: reportingCoordinator?.name ?? (reporterIsIof ? creator.name : `${pick(FIRST)} ${pick(LAST)} (${reportedFrom})`),
    reportingCoordinatorId: reportingCoordinator?.id ?? null,
    reportedFrom, handlingCommittee: handling, handledById: handler?.id ?? null,
    registeredOn: dateOnly(regMs), issueTypeId, priority,
    regionKSA: ksa, country: "Saudi Arabia", stateIndia: state, districtIndia: district,
    village: pick(["Kozhikode town", "Perambra", "Gudur", "Nellore rural", "Chengannur", "Varkala", "Siwan", "Azamgarh city", "Karimnagar", "Mannarkkad", "Ottapalam", "Salem", "Pattukkottai"]),
    fullAddress: `${pick(["House No. 12", "Door 4/118", "Plot 7", "Ward 9"])}, ${district}, ${state}, India`,
    localIdPassport: `Passport ${pick(["K", "M", "P", "R", "T"])}${Math.floor(1000000 + rnd() * 8999999)} · Iqama ${Math.floor(2300000000 + rnd() * 99999999)}`,
    victimName: victim, victimContact: `+91 9${Math.floor(100000000 + rnd() * 899999999)}`, alternateContact: `+91 8${Math.floor(100000000 + rnd() * 899999999)}`,
    dependents: pick(["Wife and 2 children in India", "Parents (elderly) and wife", "Wife, 1 child, aged mother", "Unmarried – parents depend on him"]),
    referenceBy: pick(["Local Matur Sangathan member", "Hospital social worker", "Indian Embassy helpline", "Fellow worker", "Family in India (WhatsApp)"]),
    referenceDetails: "Reference verified by IOF volunteer on first call.",
    sponsorName: sponsor, sponsorMobile: `+966 5${Math.floor(10000000 + rnd() * 89999999)}`,
    sponsorDetails: `${sponsor}, ${ksa}. Sponsor reachable on mobile; cooperation level: ${pick(["low", "partial", "good"])}.`,
    iofInvolvement: pick(tpl.inv), initialStatus: "open_new", othersInvolvement: pick(ORGS),
    financialExpenses: spent ? `SAR ${spent.toLocaleString("en-IN")} spent by IOF` : "Nil so far",
    sevaSupport: pick(["Food & shelter arranged", "Counselling and family contact", "Legal-aid lawyer arranged", "Flight ticket sponsored", "No direct support yet"]),
    remarks: pick(["Handle with confidentiality.", "Family anxious – update weekly.", "Priority follow-up requested by Embassy.", "", ""]),
    oldStatus: "", status,
    assignment: awaiting ? "awaiting_assignment" : "assigned",
    originalReportingProvince: reportedFrom, createdById: creator.id, updatedAt: lastAt, resolvedAt, source: "portal",
    timeline: tl, documents: docs, finance: fin, assignments: assigns,
  };
}

function buildCases(): Case[] {
  // Row 1 is the real entry that already exists in the Excel register — kept untouched.
  const real: Case = {
    id: "c1", sl: 1, caseNo: "IOF-EP-1", name: "(Register entry – details not yet filled)", summary: "Imported from IOF Seva Register 2026 (row 3). Details to be completed.", details: "",
    contactDetails: "", reportingPerson: "", reportingCoordinatorId: null, reportedFrom: "IOF-NC", handlingCommittee: "IOF-EP-Dammam", handledById: "u9",
    registeredOn: "2026-10-09", issueTypeId: "it2", priority: "high", regionKSA: "", country: "Saudi Arabia", stateIndia: "", districtIndia: "", village: "", fullAddress: "",
    localIdPassport: "", victimName: "", victimContact: "", alternateContact: "", dependents: "", referenceBy: "", referenceDetails: "", sponsorName: "", sponsorMobile: "", sponsorDetails: "",
    iofInvolvement: "", initialStatus: "open_new", othersInvolvement: "", financialExpenses: "", sevaSupport: "", remarks: "", oldStatus: "", status: "open_new",
    assignment: "assigned", originalReportingProvince: "IOF-NC", createdById: "u1", updatedAt: "2026-10-09T08:00:00.000Z", source: "excel",
    timeline: [
      { id: "t1-1", type: "created", at: "2026-10-09T08:00:00.000Z", actorId: "u1", text: "Imported from Excel register 'IOF CASE 2026' (SL 1)." },
      { id: "t1-2", type: "assigned", at: "2026-10-09T08:05:00.000Z", actorId: "u1", text: "Handled by Anil (IOF-EP-Dammam) per register.", meta: { to: "Anil Pillai" } },
    ],
    documents: [], finance: [], assignments: [{ id: "a1-1", caseId: "c1", at: "2026-10-09T08:05:00.000Z", byId: "u1", toId: "u9", province: "IOF-EP-Dammam", note: "From Excel register" }],
  };
  const out: Case[] = [real];
  for (let sl = 2; sl <= N; sl++) {
    const late = sl > N - 8; // newest cases wait in the assignment queue
    out.push(buildCase(sl, late, late ? sl % 2 === 0 || sl % 3 === 0 : sl % 4 === 0));
  }
  return out.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export const SEED_CASES: Case[] = buildCases();

/* ───────────────────────── Transfers ───────────────────────── */
function buildTransfers(cases: Case[]): Transfer[] {
  const t: Transfer[] = [];
  const active = cases.filter((c) => c.assignment === "assigned" && c.source === "portal" && !["completed", "closed_finance"].includes(c.status));
  // 3 pending transfer requests
  active.slice(0, 3).forEach((c, i) => {
    const to = PROVINCES.find((p) => p.region !== regionOf(c.handlingCommittee) && p.region !== "NC" && p.kind === "chapter")!;
    const target = [ "IOF-CP-Riyad", "IOF-WP-Jeedha", "IOF-EP-Dammam"][i];
    t.push({ id: `tr${i + 1}`, caseId: c.id, fromProvince: c.handlingCommittee, toProvince: target === c.handlingCommittee ? to.code : target, reason: ["Victim has been shifted to a hospital in the target province.", "Sponsor's head office and court jurisdiction are in the target province.", "Family contact point and embassy desk handling it are in the target province."][i], requestedBy: c.handledById ?? c.createdById, at: iso(NOW - (i + 1) * DAY), status: "pending" });
    c.assignment = "transfer_pending";
    c.timeline.unshift({ id: `tt${c.id}`, type: "transferred", at: iso(NOW - (i + 1) * DAY), actorId: c.handledById ?? c.createdById, text: `Transfer requested to ${t[t.length - 1].toProvince}.`, meta: { to: t[t.length - 1].toProvince } });
    c.updatedAt = iso(NOW - (i + 1) * DAY);
  });
  // historical accepted transfers
  active.slice(3, 7).forEach((c, i) => {
    t.push({ id: `trh${i + 1}`, caseId: c.id, fromProvince: c.originalReportingProvince.startsWith("IOF") ? c.originalReportingProvince : "IOF-NC", toProvince: c.handlingCommittee, reason: "Case concerns a person located in the responsible province.", requestedBy: c.createdById, at: c.registeredOn + "T10:00:00.000Z", status: "accepted", decidedBy: "u1", decidedAt: c.registeredOn + "T14:00:00.000Z", note: "Accepted; assigned locally." });
  });
  return t;
}
export const SEED_TRANSFERS: Transfer[] = buildTransfers(SEED_CASES);

/* ───────────────────────── Notifications ───────────────────────── */
function buildNotifications(cases: Case[]): Notification[] {
  const awaiting = cases.filter((c) => c.assignment === "awaiting_assignment");
  const out: Notification[] = [];
  awaiting.forEach((c, i) => {
    const reg = regionOf(c.handlingCommittee)!;
    out.push({ id: `n-pa${i}`, kind: "pending_assignment", title: "Pending assignment", body: `${c.caseNo} · ${c.name} is waiting for a coordinator in ${c.handlingCommittee}.`, at: iso(NOW - (i + 1) * 3 * 3600_000), read: i > 3, caseId: c.id, forRoles: ["province_head", "president"], forRegion: reg === "NC" ? undefined : reg });
  });
  cases.filter((c) => c.priority === "critical" && c.assignment !== "draft").slice(0, 4).forEach((c, i) => {
    out.push({ id: `n-cr${i}`, kind: "critical", title: "Critical case registered", body: `${c.caseNo} · ${c.name}`, at: iso(NOW - (i + 2) * 5 * 3600_000), read: i > 1, caseId: c.id, forRoles: ["president", "province_head"], forRegion: regionOf(c.handlingCommittee) === "NC" ? undefined : regionOf(c.handlingCommittee)! });
  });
  SEED_TRANSFERS.filter((x) => x.status === "pending").forEach((x, i) => {
    const c = cases.find((k) => k.id === x.caseId)!;
    out.push({ id: `n-tr${i}`, kind: "transferred", title: "Transfer request", body: `${c.caseNo} requested to move ${x.fromProvince} → ${x.toProvince}.`, at: x.at, read: false, caseId: c.id, forRoles: ["province_head", "president"], forRegion: regionOf(x.toProvince)! });
  });
  cases.filter((c) => c.handledById && c.assignment === "assigned" && c.status === "open_new").slice(0, 3).forEach((c, i) => {
    out.push({ id: `n-as${i}`, kind: "assigned", title: "New case assigned to you", body: `${c.caseNo} · ${c.name}`, at: iso(NOW - (i + 1) * 4 * 3600_000), read: false, caseId: c.id, forRoles: ["handler", "coordinator"], forUserId: c.handledById! });
  });
  out.push({ id: "n-as-anil", kind: "assigned", title: "New case assigned to you", body: "IOF-EP-1 · Jailed - financial issue (from IOF-NC)", at: "2026-10-09T08:05:00.000Z", read: false, caseId: "c1", forRoles: ["handler"], forUserId: "u9" });
  cases.filter((c) => c.assignment === "assigned" && c.status.startsWith("pending")).slice(0, 4).forEach((c, i) => {
    out.push({ id: `n-fu${i}`, kind: "followup", title: "Follow-up reminder", body: `${c.caseNo} is waiting on ${c.status.replace("pending_", "").replace(/_/g, " ")} – check progress.`, at: iso(NOW - (i + 1) * 7 * 3600_000), read: i > 1, caseId: c.id, forRoles: ["handler", "coordinator"], forUserId: c.handledById ?? undefined });
  });
  cases.filter((c) => c.status === "completed").slice(0, 2).forEach((c, i) => {
    out.push({ id: `n-st${i}`, kind: "status", title: "Case status updated", body: `${c.caseNo} marked Completed.`, at: iso(NOW - (i + 1) * 30 * 3600_000), read: true, caseId: c.id, forRoles: ["president", "province_head", "coordinator"], forRegion: regionOf(c.handlingCommittee) === "NC" ? undefined : regionOf(c.handlingCommittee)! });
  });
  return out.sort((a, b) => +new Date(b.at) - +new Date(a.at));
}
export const SEED_NOTIFICATIONS: Notification[] = buildNotifications(SEED_CASES);

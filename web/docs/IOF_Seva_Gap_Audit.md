# IOF Seva – Spec vs Prototype Gap & Audit Report

Date: 2026-11-08 · Scope: spec `attachment.txt` (15 sections) + `IOF_Seva_Register_2026.xlsx` vs Next.js prototype (`iof-seva-cms.zip`) · Target: Odoo 19 build

## 1. Verdict
Prototype covers **all 11 required flows and all 15 spec sections at UI level**. Everything is mock (zustand + localStorage). **Nothing is production-ready**: no real auth, no server-side security, no real file storage, no persistence. Those are the "real project" items below.

## 2. Spec coverage matrix
| Spec § | Requirement | Status | Note |
|---|---|---|---|
| 1 | Brand, logo, palette | ✅ Done | Logo unmodified; palette tokens used |
| 2 | Premium SaaS look | ✅ Done | Needs real-device review by IOF leadership |
| 3 | Sidebar (9 items, collapsible), header (breadcrumb, search, notif, profile, quick register) | ✅ Done | Added "Website Content" (extra) |
| 4 | Dashboard KPIs, 5 charts, 5 sections | ✅ Done | Role variants exist; data is seeded mock |
| 5 | 7-step wizard, validation, draft/submit | ✅ Done | Validation is client-only; no duplicate check |
| 6 | Case table: search, filters, sort, paging, columns, CSV | ✅ Done | Client-side only; will not scale past a few thousand rows |
| 7 | Case details 8 tabs, timeline, history | ✅ Done | Internal remarks hidden only in UI |
| 8 | Cross-province assignment, transfer, history, alerts | ✅ Done | Verified end-to-end (Dammam → Riyadh) |
| 9 | 4 role dashboards | ✅ Done | UI visibility only (as spec said) |
| 10 | Issue type management (dynamic) | ✅ Done | |
| 11 | Notification centre (6 kinds) | ⚠️ Partial | In-app only; "follow-up reminder" is not time-triggered |
| 12 | Tech stack + components | ✅ Done | shadcn-style hand-written (not CLI-installed shadcn) |
| 13 | Excel field preservation | ✅ Done | All 25 columns mapped, CSV export same order |
| 14 | 11 flows | ✅ Done | |
| 15 | Quality bar | ⚠️ Partial | No accessibility/performance audit run yet |

## 3. Excel audit findings
1. **Register has 304 pre-numbered SL rows but only 1 filled case** (SL 1, IOF-NC → IOF-EP-Dammam, Anil, 2026-10-09, Jailed – financial issue). Real data volume is small; migration is easy, but a **clean-up of the empty SL rows** is needed (do not import blanks).
2. **Header typos preserved on purpose** ("Handeling", "Handelled", "Resposible") – map to clean labels in Odoo, keep an import alias table.
3. **Dropdown values contain trailing spaces** ("Death - Natural ", "sivaprasath ", "Local Community ", "Anil "). Odoo import must `strip()`; duplicates by whitespace to be avoided.
4. **Status list has 9 values** incl. spelling "Sponor". Keep exact strings as selection keys + display label; do not "fix" silently (reports will compare against history).
5. **Status buckets (new / in-progress / pending / resolved / closed) are our own grouping**, not in Excel – needs IOF confirmation.
6. **"OLD" column** = previous status; prototype auto-fills. In Odoo this should be derived from tracking, not a stored field.
7. **Case Informed By** list ≠ **Responsible IOF** list (includes Matur Sangathan, Embassy, Relatives, Local Community). Must stay two separate fields (`reported_from` vs `handling_committee`).
8. **IOF Representative list (7 names) is free text in Excel** – prototype maps to users; need confirmation which representatives become Odoo users vs. contacts.
9. **Case number rule** `LEFT(committee,6)&"-"&SL`: for `IOF-EP-Dammam` gives `IOF-EP`, **so Dammam/Jubail/AlHasa/Kobhar all share prefix IOF-EP**. Using one global SL avoids clashes, but a **per-committee sequence vs global SL decision is needed**. Also `IOF-CP-Riyad`→`IOF-CP`, `IOF-WP-Jeedha`→`IOF-WP`.
10. **No India State/District master in Excel** – prototype has its own `INDIA_GEO` list; verify completeness (all states + districts) or load from `res.country.state` + district master.

## 4. Gaps (what prototype does NOT do) – by priority
### P0 – blockers for real project
| # | Gap | Fix in Odoo 19 |
|---|---|---|
| G1 | **No real authentication** (any password logs in) | Odoo `res.users` session or JWT; SSO later |
| G2 | **Security is UI-only** | `res.groups` (4) + `ir.rule` per committee/region + `ir.model.access.csv`; field-level groups for passport/medical |
| G3 | **No persistence** (localStorage) | `otm.iof.*` models; Next.js via `/api/iof/*` controllers |
| G4 | **Documents store metadata only, no file** | `ir.attachment` private, size/type limits, AV scan, signed download |
| G5 | **Internal remarks visible by role only in UI** | `internal` flag enforced server-side |
| G6 | **Audit trail is client-generated** | `mail.thread` tracking + immutable timeline model; no delete (archive only) |
| G7 | **Case number generated client-side** | `ir.sequence` / server-side frozen at submit, race-safe |

### P1 – important
| # | Gap | Fix |
|---|---|---|
| G8 | No duplicate-case detection | Name + phone + passport + issue-type match warning |
| G9 | Notifications in-app only; no reminders/escalation | `ir.cron` SLA (e.g. unassigned > N days), `mail.activity`, optional email/WhatsApp |
| G10 | Tables/filters/CSV all client-side | Server pagination, `search_read`/`read_group`, streamed export |
| G11 | Transfer accept/reject rules not enforced server-side | State-machine methods with group checks |
| G12 | Status transition rules open (any→any) | Define allowed transitions + mandatory resolution note on Completed; lock on Closed (President reopen only) |
| G13 | No data migration | Import wizard for Excel (strip spaces, map aliases, skip empty rows) |
| G14 | Public website has no "Report a case" intake | Public form → Draft case, source=Website, captcha + rate limit |
| G15 | Website CMS stored in browser | `otm.iof.site.*` + `ir.attachment` |

### P2 – polish
| # | Gap |
|---|---|
| G16 | No multi-language (Arabic/Hindi/Malayalam/Tamil UI) – confirm need |
| G17 | No accessibility audit (keyboard, contrast, screen reader) beyond label fixes |
| G18 | No automated tests (unit/e2e); only manual Playwright runs |
| G19 | No password reset / 2FA / session timeout |
| G20 | No backup/retention/GDPR-style policy for sensitive victim data |
| G21 | Reports are on-screen only; need PDF/Excel scheduled reports per province |
| G22 | Dashboard KPIs computed from mock; define official KPI formulas with IOF |
| G23 | Case timeline `meta` is loose key/value – define typed event model |

## 5. Business questions to confirm with IOF (before build)
1. Case number: per-committee counter or one global SL? Prefix for Dammam/Jubail etc.?
2. Who can see **victim passport/medical docs** – Handler too, or only coordinator and above?
3. Can a **Handler** register cases? (prototype: no)
4. Can a **Coordinator assign directly across provinces**, or always via Province Head? (prototype: Province Head/President assign; coordinator requests transfer)
5. Is **Province Head per region (EP/CP/WP) or per committee**? NC = national president only?
6. Allowed **status transitions** and who may set *Closed – Including Finance*.
7. SLA targets (unassigned time, update frequency by priority).
8. Financial: currency (SAR only?), approval needed for expenses?
9. Data residency / hosting; retention period.
10. Which notification channels: in-app, email, WhatsApp?

## 6. Proposed Odoo 19 build plan (phases)
| Phase | Scope |
|---|---|
| 1 – Core | Models: committee, issue type, case, update/timeline, document; groups + `ir.rule`; sequence; Excel import |
| 2 – Workflow | Assignment, transfer state machine, status rules, chatter/tracking, notifications + cron SLA |
| 3 – API | `/api/iof/*` (auth, cases, assign, transfer, updates, uploads, dashboard aggregates); swap `store.ts` for API client |
| 4 – Reports | `read_group` dashboards, PDF/Excel exports |
| 5 – Website | CMS models + public intake form |
| 6 – Hardening | Tests, security review, backups, UAT with IOF |

Naming per Otomater convention: `otm.iof.*`, OPL-1 license, Odoo 19 rules (ODOO19_RULES) applied via validation suite before packaging.

## 7. Recommended first step
Confirm Section 5 questions 1–4, then start **Phase 1 + 2 as one Odoo module (`otm_iof_seva`)** with the security rules first, then wire Next.js to it.

---
## 8. Client decisions (2026-11-09) and what changed in the prototype
| # | Question | Decision | Status |
|---|---|---|---|
| 1 | Case number: global SL or per-committee? | **Global SL, with a configurable prefix per committee** (default = first 6 chars of code). Frozen at registration; changing a prefix affects new cases only. | ✅ Implemented (Province Management → "Case no. prefix"); Odoo: `otm.iof.committee.case_prefix` + one global `ir.sequence` |
| 2 | Who may see passport / medical documents? | President, Secretary, Seva Coordinators (Province Heads), Coordinators, and everyone working on that case. | ✅ Same as case visibility; enforce with `ir.rule` + private attachments in Odoo |
| 3 | Can a Handler register a case? | **Yes** | ✅ Implemented |
| 4 | Cross-province assignment | **Via Province Head (and President/Secretary) only.** A coordinator raises a transfer request. *(Assumed from "Yes" – please re-confirm.)* | ✅ Matches prototype |
| 5 | Status transition rules | Not yet defined – **proposal below** | ⏳ Needs approval |
| New | **Secretary role** added | National level: sees all provinces, assigns, monitors, reports, province/coordinator views; cannot manage users, issue types or website. | ✅ Implemented (demo user "Abdul Rahim") |

### Proposed status-transition rules (for approval)
- **Open (New)** → In progress / any Pending status: assigned coordinator or handler.
- **In progress ⇄ Pending (Judiciary / Sponsor / Indian Authority / Police / Medical)**: assigned coordinator or handler; reason mandatory.
- **→ Completed**: assigned coordinator/handler; resolution note mandatory; Province Head confirms.
- **→ Closed – Including Finance**: Province Head, Secretary or President only, after finance entries are reviewed; case locked afterwards.
- **Reopen a Closed case**: President only (reason logged).
- No skipping from Open straight to Closed.

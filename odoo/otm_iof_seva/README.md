# otm_iof_seva – IOF Seva Case Management (Odoo 19)

Phase 1 + 2 of the IOF Seva backend. Copyright Otomater · OPL-1 · https://otomater.com

## Install
Copy the folder to your addons path → Apps → *IOF Seva – Case Management* → Install. Optional: `pip install openpyxl` (Excel import).
After install: **Settings → Users** → set *IOF Committee* (tab “IOF Seva”) and one IOF group per user.

## Roles (security groups, each implies the one below)
Case Handler → Coordinator → Province Head (Seva Coordinator) → Secretary → President

| Rule | Enforced by |
|---|---|
| Visibility per role (all / region / committee / assigned), drafts creator-only | `ir.rule` (security/rules.xml) |
| Case no. frozen at submit; SL global; prefix per committee | `case.action_submit`, `committee.case_prefix` |
| Assign: President/Secretary, Head of region, Coordinator of the committee; assignee must be in the same region | `case._do_assign` |
| Transfer: National/Head move directly, others file a request; destination Head/National decides; original reporting committee never changes | `transfer._submit/_check_can_decide` |
| Status matrix, resolution note on Completed, Closed = Head/Secretary/President, Reopen closed = President only, closed = locked | `case.write/_check_status_change` |
| Timeline immutable; internal remarks hidden from Handlers | `case_event`, `ir.rule` |
| Unassigned > N days (`otm_iof_seva.unassigned_days`, default 2) → to-do for Heads + internal timeline entry | cron |
| Possible-duplicate note (victim contact / passport) | `case._check_duplicates` |
| Excel import (header row “SL”, blank template rows skipped, values trimmed, SL kept, sequence advanced) | Configuration → Import Excel Register |

## Status ids (stable keys) ↔ register strings
open_new, inprogress_iof, pending_judiciary, pending_sponsor, pending_indian_authority, pending_police, pending_medical, completed, closed_finance.

## Verified (Odoo 19.0, fresh DB)
Clean install (0 errors / 0 warnings); 51 scenario checks as real non-admin users (visibility, guards, assign, status matrix, transfer request/accept/reject/direct, handler registration, prefix, SLA cron, duplicate note, Excel import of the real register) – all pass; all views/menus load for the President.

## Next phases
3 – JSON API for the Next.js frontend (`/api/iof/*`, `call_kw`-safe `@api.model` methods) · 4 – dashboards/reports (`formatted_read_group`) · 5 – website CMS + public intake · 6 – hardening/UAT.

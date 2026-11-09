# IOF Seva – User acceptance test (UAT) checklist
Use real-looking test data. Tick each line, note defects with screenshot + case number.
Accounts needed: President, Secretary, Province Head (EP), Province Head (CP), Coordinator (Dammam), Handler (Dammam).

## A. Login & security
- [ ] Wrong password is rejected; after 8 wrong tries a 15-minute lock message appears.
- [ ] Logging out then pressing Back does not show data.
- [ ] Handler cannot open Users, Issue Types, Website, Province management (menu hidden AND direct URL blocked).
- [ ] Head (CP) cannot find or open a Dammam (EP) case by search or by URL.

## B. Register a case
- [ ] Handler registers a draft, saves, edits, submits -> case number = prefix-SL (e.g. IOF-EP-25), SL increases by 1.
- [ ] Draft is visible only to its creator (President does not see others' drafts).
- [ ] Duplicate victim phone/passport shows a duplicate warning in the timeline.
- [ ] Documents: upload PDF and JPG, preview, download. A 12 MB file is refused.
- [ ] Change a committee prefix (Province Management): old cases keep their number, new cases use the new prefix.

## C. Assign / transfer
- [ ] New case appears in Assignment Queue of that region; Head/Secretary/President can assign a coordinator/handler.
- [ ] Coordinator cannot assign across provinces; they raise a transfer request; destination Head accepts/rejects.
- [ ] After transfer the original reporting committee is unchanged; history shows both.
- [ ] Case unassigned 3+ days shows as stale / escalation notification the next morning.

## D. Status rules
- [ ] Open -> Completed is refused. Open -> In progress -> Pending (any) -> In progress works.
- [ ] Completed needs a resolution note.
- [ ] Closed-Finance only by Head/Secretary/President; the case is then locked (no edits).
- [ ] Only the President can reopen a closed case.

## E. Timeline & internal remarks
- [ ] Add update, follow-up, remark. Internal remark is invisible to a handler who is not on the case.
- [ ] Timeline entries cannot be edited or deleted by anyone.

## F. Dashboard / reports / scale
- [ ] Dashboard numbers equal the Case list totals for the same filters.
- [ ] With 10,000 cases: case list first page < 1 s, search < 1 s, dashboard < 2 s.
- [ ] CSV export opens in Excel with the same columns as the IOF register.

## G. Website & public form
- [ ] President edits hero slide / text / images in Website Content; public site updates.
- [ ] Submit Report-a-case form: reference number shown; case appears in queue with source "Website".
- [ ] Submit 6 times quickly from one phone: the 6th is blocked.

## H. Accessibility & devices
- [ ] Keyboard only: login, register a case, open a case, use filters.
- [ ] Phone (360 px) and tablet: no horizontal scroll on website, report form, case list.
- [ ] Text is readable (contrast) in light mode; zoom to 200% still usable.

## I. Backup
- [ ] Restore last night's backup on a spare server and open a case with a document.

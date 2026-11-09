# -*- coding: utf-8 -*-
import base64
import io
import re
import warnings
from datetime import date, datetime

from odoo import fields, models
from odoo.exceptions import UserError

from ..models.case import EXTERNAL_SOURCES, STATUSES

# positional columns of sheet "IOF CASE 2026" (header row has 'SL' in column A)
COL = {k: i for i, k in enumerate([
    "sl", "case_no", "name", "contact_details", "reported_from", "handling", "handled_by", "reg_date", "issue", "details",
    "area_ksa", "state_india", "district_india", "village", "local_id_passport", "victim_contact", "reference_by",
    "sponsor_details", "iof_involvement", "initial_status", "others_involvement", "financial_expenses", "remarks",
    "old", "status"])}


def _clean(v):
    if v is None:
        return ""
    if isinstance(v, str):
        return re.sub(r"\s+", " ", v).strip()
    return v


def _key(v):
    return re.sub(r"\s+", "", str(_clean(v))).lower().replace("sponor", "sponsor")


class OtmIofImportWizard(models.TransientModel):
    _name = "otm.iof.import.wizard"
    _description = "Import IOF Seva Register (Excel)"

    file = fields.Binary(string="IOF_Seva_Register.xlsx", required=True)
    filename = fields.Char()

    def action_import(self):
        self.ensure_one()
        try:
            import openpyxl
        except ImportError as e:  # optional library: never declared in manifest (rule #35)
            raise UserError(self.env._("Install the 'openpyxl' Python package on the server to import Excel files.")) from e
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")  # Excel data-validation extension notice
            wb = openpyxl.load_workbook(io.BytesIO(base64.b64decode(self.file)), data_only=True, read_only=True)
            rows = list(wb.worksheets[0].iter_rows(values_only=True))
        start = next((i for i, r in enumerate(rows) if r and _key(r[0]) == "sl"), None)
        if start is None:
            raise UserError(self.env._("Header row (starting with 'SL') not found in the first sheet."))

        Committee = self.env["otm.iof.committee"]
        Issue = self.env["otm.iof.issue.type"].with_context(active_test=False)
        Case = self.env["otm.iof.case"].sudo()
        committees = {_key(c.code): c for c in Committee.search([])}
        status_map = {_key(label): code for code, label in STATUSES}
        ext_map = {_key(label): code for code, label in EXTERNAL_SOURCES}
        users = self.env["res.users"].search([("share", "=", False)])
        created = skipped = 0
        problems = []
        max_sl = 0
        existing = set(Case.search([("sl", "!=", False)]).mapped("sl"))

        def cell(r, k):
            i = COL[k]
            return _clean(r[i]) if i < len(r) else ""

        for n, r in enumerate(rows[start + 1:], start=start + 2):
            if not r or not any(_clean(x) for x in r[1:]):
                continue  # pre-numbered empty template row
            sl_raw = cell(r, "sl")
            try:
                sl = int(sl_raw)
            except (TypeError, ValueError):
                problems.append("Row %s: invalid SL '%s'" % (n, sl_raw)); skipped += 1; continue
            if sl in existing:
                problems.append("Row %s: SL %s already exists" % (n, sl)); skipped += 1; continue
            handling = committees.get(_key(cell(r, "handling")))
            if not handling:
                problems.append("Row %s: unknown 'Case Handling committee' '%s'" % (n, cell(r, "handling"))); skipped += 1; continue
            issue_name = cell(r, "issue")
            if not issue_name:
                problems.append("Row %s: Issue Type missing" % n); skipped += 1; continue
            issue = Issue.search([("name", "=ilike", issue_name)], limit=1) or Issue.create({"name": issue_name})
            rep_raw = cell(r, "reported_from")
            rep_committee = committees.get(_key(rep_raw))
            rep_ext = ext_map.get(_key(rep_raw))
            reg = r[COL["reg_date"]] if COL["reg_date"] < len(r) else None
            if isinstance(reg, datetime):
                reg = reg.date()
            elif not isinstance(reg, date):
                reg = fields.Date.context_today(self)
            rep_from = rep_committee or (None if rep_ext else handling)
            handled_txt = cell(r, "handled_by")
            handler = users.filtered(lambda u: handled_txt and handled_txt.lower() in (u.name or "").lower())[:1]
            remarks = cell(r, "remarks")
            if handled_txt and not handler:
                remarks = (remarks + " | " if remarks else "") + "Handled by (register): %s" % handled_txt
            status = status_map.get(_key(cell(r, "status")), "open_new")
            vals = {
                "sl": sl, "case_no": "%s-%s" % (handling._get_prefix(), sl), "source": "import",
                "name": cell(r, "name") or "%s (SL %s)" % (issue_name, sl), "contact_details": cell(r, "contact_details"),
                "reported_from_id": rep_from.id if rep_from else False,
                "reported_external": rep_ext or False, "handling_committee_id": handling.id,
                "handled_by_id": handler.id if handler else False, "registration_date": reg, "issue_type_id": issue.id,
                "details": cell(r, "details"), "area_ksa": cell(r, "area_ksa"), "state_india": cell(r, "state_india"),
                "district_india": cell(r, "district_india"), "village": cell(r, "village"),
                "local_id_passport": cell(r, "local_id_passport"), "victim_contact": cell(r, "victim_contact"),
                "reference_by": cell(r, "reference_by"), "sponsor_details": cell(r, "sponsor_details"),
                "iof_involvement": cell(r, "iof_involvement"), "others_involvement": cell(r, "others_involvement"),
                "financial_expenses": cell(r, "financial_expenses"), "remarks": remarks,
                "status": status, "initial_status": status_map.get(_key(cell(r, "initial_status")), "open_new"),
                "assignment_state": "assigned" if handler else "awaiting_assignment",
                "submitted_date": fields.Datetime.now(),
            }
            case = Case.create(vals)
            case._log("created", "Imported from Excel register (SL %s)." % sl)
            existing.add(sl)
            max_sl = max(max_sl, sl)
            created += 1
        if max_sl:
            seq = self.env["ir.sequence"].sudo().search([("code", "=", "otm.iof.case.sl")], limit=1)
            if seq and seq.number_next_actual <= max_sl:
                seq.number_next_actual = max_sl + 1
        msg = self.env._("Imported %(c)s case(s), skipped %(s)s. %(p)s", c=created, s=skipped, p=" ; ".join(problems[:10]))
        return {"type": "ir.actions.client", "tag": "display_notification",
                "params": {"title": self.env._("Excel import"), "message": msg, "sticky": bool(problems), "type": "success"}}

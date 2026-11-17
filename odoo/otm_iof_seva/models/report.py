import base64
import io
from collections import Counter, defaultdict

from odoo import fields, models

from .case import STATUSES

G = "otm_iof_seva."
DONE = {"completed", "closed_finance"}


class OtmIofCaseReport(models.Model):
    _inherit = "otm.iof.case"

    def _report_rows(self, user):
        """Cases visible to `user` (record rules apply). Never includes victim details."""
        return self.with_user(user).search([("assignment_state", "!=", "draft")])

    def _report_xlsx(self, cases):
        import xlsxwriter
        buf = io.BytesIO()
        wb = xlsxwriter.Workbook(buf, {"in_memory": True})
        head = wb.add_format({"bold": True, "bg_color": "#0b2545", "font_color": "#ffffff", "border": 1})
        cell = wb.add_format({"border": 1})
        labels = dict(STATUSES)
        ws = wb.add_worksheet("By province")
        cols = ["Province"] + [labels[k] for k in labels] + ["Total", "Waiting for assignment"]
        for i, c in enumerate(cols):
            ws.write(0, i, c, head)
        per = defaultdict(Counter)
        waiting = Counter()
        for c in cases:
            code = c.handling_committee_id.code or "-"
            per[code][c.status] += 1
            if c.assignment_state == "awaiting_assignment":
                waiting[code] += 1
        for r, code in enumerate(sorted(per), 1):
            ws.write(r, 0, code, cell)
            for i, k in enumerate(labels, 1):
                ws.write(r, i, per[code][k], cell)
            ws.write(r, len(labels) + 1, sum(per[code].values()), cell)
            ws.write(r, len(labels) + 2, waiting[code], cell)
        ws.set_column(0, 0, 22)
        ws.set_column(1, len(cols), 16)
        ws2 = wb.add_worksheet("Open cases")
        for i, c in enumerate(["Case no.", "Province", "Issue type", "Status", "Priority", "Handled by", "Registered", "Days open"]):
            ws2.write(0, i, c, head)
        today = fields.Date.context_today(self)
        row = 1
        for c in cases.filtered(lambda x: x.status not in DONE).sorted(lambda x: x.registration_date or today):
            vals = [c.case_no or "", c.handling_committee_id.code or "", c.issue_type_id.name or "", labels.get(c.status, c.status),
                    c.priority or "", c.handled_by_id.name or "", str(c.registration_date or ""),
                    (today - c.registration_date).days if c.registration_date else ""]
            for i, v in enumerate(vals):
                ws2.write(row, i, v, cell)
            row += 1
        ws2.set_column(0, 7, 20)
        wb.close()
        return buf.getvalue()

    def _cron_weekly_report(self):
        icp = self.env["ir.config_parameter"].sudo()
        if icp.get_param("otm_iof_seva.weekly_report", "1") in ("0", "False", "false"):
            return 0
        users = self.env["res.users"].sudo().search([("active", "=", True), ("share", "=", False), ("email", "!=", False),
                                                     ("iof_notify_email", "=", True)])
        users = users.filtered(lambda u: u.has_group(G + "group_iof_secretary") or u.has_group(G + "group_iof_head"))
        sent = 0
        for user in users:
            cases = self._report_rows(user)
            if not cases:
                continue
            data = self._report_xlsx(cases)
            att = self.env["ir.attachment"].sudo().create({
                "name": "IOF-Seva-weekly-%s.xlsx" % fields.Date.context_today(self), "type": "binary",
                "datas": base64.b64encode(data), "mimetype": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
            open_n = len(cases.filtered(lambda x: x.status not in DONE))
            self.env["mail.mail"].sudo().create({
                "subject": "[IOF Seva] Weekly case report", "email_to": user.email, "auto_delete": True,
                "email_from": self.env.company.email_formatted or False, "attachment_ids": [(4, att.id)],
                "body_html": "<p>Weekly IOF Seva summary: %d cases, %d still open. The Excel file is attached (no victim details).</p>" % (len(cases), open_n)})
            sent += 1
        return sent

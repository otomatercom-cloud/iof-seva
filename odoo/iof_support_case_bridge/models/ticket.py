# -*- coding: utf-8 -*-
import logging

from odoo import fields, models

_logger = logging.getLogger(__name__)

# ticket category -> issue type XML id of otm_iof_seva (anything else -> "Website help request")
CATEGORY_ISSUE = {"labour": "otm_iof_seva.issue_type_1", "medical": "otm_iof_seva.issue_type_5"}
PRIORITY_MAP = {"0": "low", "1": "medium", "2": "high", "3": "critical"}


class IofSupportTicket(models.Model):
    _inherit = "iof.support.ticket"

    case_id = fields.Many2one("otm.iof.case", string="IOF Seva case", readonly=True, copy=False, index=True)

    def _create_case(self):
        """One case per website ticket, registered with the national committee for assignment. Never breaks ticket creation."""
        env = self.env
        for rec in self.sudo():
            if rec.case_id or rec.source != "website":
                continue
            try:
                with env.cr.savepoint():
                    issue = env.ref(CATEGORY_ISSUE.get(rec.category, ""), raise_if_not_found=False) or env.ref(
                        "iof_support_case_bridge.issue_type_support_other")
                    nc = env.ref("otm_iof_seva.committee_iof_nc")
                    case = env["otm.iof.case"].sudo().create({
                        "name": "%s - %s" % (rec.name, rec.requester_name), "summary": rec.subject[:200],
                        "details": "%s\n\nWebsite support ticket %s (category: %s)." % (rec.description, rec.name, rec.category),
                        "contact_details": "%s / %s" % (rec.mobile, rec.email), "reporting_person": rec.requester_name,
                        "country": "Saudi Arabia", "full_address": rec.city or False, "issue_type_id": issue.id,
                        "handling_committee_id": nc.id, "reported_from_id": nc.id,
                        "priority": PRIORITY_MAP.get(rec.priority, "medium"), "source": "website"})
                    case.action_submit()
                    rec.case_id = case
            except Exception:  # noqa: BLE001 - the requester's ticket must be saved even if case creation fails
                _logger.exception("could not create IOF case for ticket %s", rec.name)

    def create(self, vals_list):
        records = super().create(vals_list)
        records._create_case()
        return records

    def action_resolve(self):
        res = super().action_resolve()
        for rec in self.sudo().filtered("case_id"):
            rec.message_post(body="Linked case: %s" % rec.case_id.case_no, subtype_xmlid="mail.mt_note")
        return res

# -*- coding: utf-8 -*-
from odoo import fields, models


class ResUsers(models.Model):
    _inherit = "res.users"

    iof_committee_id = fields.Many2one("otm.iof.committee", string="IOF Committee", index=True)

    iof_notify_email = fields.Boolean("IOF e-mail alerts", default=True)
    iof_notify_whatsapp = fields.Boolean("IOF WhatsApp alerts")
    iof_whatsapp = fields.Char("WhatsApp number (with country code)")

    # ---- role helpers (use env.user semantics; never sudo-based) ----
    def _iof_is_national(self):
        self.ensure_one()
        return self.has_group("otm_iof_seva.group_iof_secretary")

    def _iof_is_head_of(self, region):
        self.ensure_one()
        return bool(region) and self.has_group("otm_iof_seva.group_iof_head") and self.iof_committee_id.region == region

    def _iof_is_coordinator_of(self, committee):
        self.ensure_one()
        return self.has_group("otm_iof_seva.group_iof_coordinator") and bool(committee) and self.iof_committee_id == committee

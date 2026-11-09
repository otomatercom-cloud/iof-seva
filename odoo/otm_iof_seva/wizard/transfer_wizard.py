# -*- coding: utf-8 -*-
from odoo import fields, models


class OtmIofTransferWizard(models.TransientModel):
    _name = "otm.iof.transfer.wizard"
    _description = "Transfer IOF Case"

    case_id = fields.Many2one("otm.iof.case", required=True)
    to_committee_id = fields.Many2one("otm.iof.committee", string="Transfer to", required=True)
    reason = fields.Text(required=True)

    def action_transfer(self):
        self.ensure_one()
        self.env["otm.iof.transfer"]._submit(self.case_id, self.to_committee_id, self.reason)
        return {"type": "ir.actions.act_window_close"}

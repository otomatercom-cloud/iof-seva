# -*- coding: utf-8 -*-
from odoo import fields, models

from ..models.case import STATUSES


class OtmIofStatusWizard(models.TransientModel):
    _name = "otm.iof.status.wizard"
    _description = "Change IOF Case Status"

    case_id = fields.Many2one("otm.iof.case", required=True)
    current_status = fields.Selection(related="case_id.status", string="Current status")
    new_status = fields.Selection(STATUSES, string="New status", required=True)
    note = fields.Text(string="Note / resolution note")

    def action_apply(self):
        self.ensure_one()
        vals = {"status": self.new_status}
        if self.new_status == "completed":
            vals["resolution_note"] = self.note
        self.case_id.write(vals)  # all transition / permission rules are enforced in case.write()
        if self.note and self.new_status != "completed":
            self.case_id._log("update", self.note)
        return {"type": "ir.actions.act_window_close"}

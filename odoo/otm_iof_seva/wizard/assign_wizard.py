# -*- coding: utf-8 -*-
from odoo import fields, models


class OtmIofAssignWizard(models.TransientModel):
    _name = "otm.iof.assign.wizard"
    _description = "Assign IOF Case"

    case_id = fields.Many2one("otm.iof.case", required=True)
    region = fields.Selection(related="case_id.handling_region")
    user_id = fields.Many2one("res.users", string="Assign to", required=True)
    note = fields.Char()

    def action_assign(self):
        self.ensure_one()
        self.case_id._do_assign(self.user_id, self.note)
        return {"type": "ir.actions.act_window_close"}

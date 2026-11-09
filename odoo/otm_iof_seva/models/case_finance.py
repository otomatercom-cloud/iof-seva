# -*- coding: utf-8 -*-
from odoo import api, fields, models
from odoo.exceptions import ValidationError


class OtmIofCaseFinance(models.Model):
    _name = "otm.iof.case.finance"
    _description = "IOF Case Financial Entry"
    _order = "date desc, id desc"

    case_id = fields.Many2one("otm.iof.case", required=True, ondelete="cascade", index=True)
    date = fields.Date(default=fields.Date.context_today, required=True)
    description = fields.Char(required=True)
    amount_sar = fields.Float(string="Amount (SAR)", digits=(16, 2), required=True)
    paid_by = fields.Selection(
        [("iof", "IOF"), ("sponsor", "Sponsor"), ("other_org", "Other organisation"), ("relatives", "Relatives")],
        default="iof", required=True)

    @api.constrains("amount_sar")
    def _check_amount(self):
        for rec in self:
            if rec.amount_sar <= 0:
                raise ValidationError(self.env._("Amount must be greater than zero."))

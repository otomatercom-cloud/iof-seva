# -*- coding: utf-8 -*-
from odoo import fields, models


class OtmIofCaseAssignment(models.Model):
    _name = "otm.iof.case.assignment"
    _description = "IOF Case Assignment History"
    _order = "date desc, id desc"

    case_id = fields.Many2one("otm.iof.case", required=True, ondelete="cascade", index=True)
    date = fields.Datetime(default=fields.Datetime.now, readonly=True)
    by_id = fields.Many2one("res.users", string="Assigned by", readonly=True)
    to_id = fields.Many2one("res.users", string="Assigned to", readonly=True)
    committee_id = fields.Many2one("otm.iof.committee", string="Committee", readonly=True)
    note = fields.Char(readonly=True)

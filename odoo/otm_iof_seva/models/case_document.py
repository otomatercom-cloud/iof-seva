# -*- coding: utf-8 -*-
from odoo import fields, models


class OtmIofCaseDocument(models.Model):
    _name = "otm.iof.case.document"
    _description = "IOF Case Document"
    _order = "id desc"

    case_id = fields.Many2one("otm.iof.case", required=True, ondelete="cascade", index=True)
    name = fields.Char(required=True)
    kind = fields.Selection([("supporting", "Supporting"), ("medical", "Medical report"), ("identity", "Identity")],
                            default="supporting", required=True)
    file = fields.Binary(string="File", attachment=True, required=True)
    filename = fields.Char()

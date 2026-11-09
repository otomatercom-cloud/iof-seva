# -*- coding: utf-8 -*-
from odoo import fields, models

REGIONS = [("NC", "National Committee"), ("EP", "Eastern Province"), ("CP", "Central Province"), ("WP", "Western Province")]


class OtmIofCommittee(models.Model):
    _name = "otm.iof.committee"
    _description = "IOF Committee (Province / Chapter)"
    _order = "region, code"

    name = fields.Char(required=True)
    code = fields.Char(required=True, help="Exact value from the register dropdown, e.g. IOF-EP-Dammam.")
    region = fields.Selection(REGIONS, required=True)
    kind = fields.Selection([("national", "National"), ("region", "Region"), ("chapter", "Chapter")], default="chapter", required=True)
    parent_id = fields.Many2one("otm.iof.committee", string="Parent Committee")
    case_prefix = fields.Char(
        string="Case No. Prefix",
        help="Prefix of new case numbers: <prefix>-<global SL>. Changing it affects NEW cases only; "
             "existing case numbers are frozen.")
    active = fields.Boolean(default=True)

    _code_uniq = models.Constraint("unique(code)", "Committee code must be unique.")

    def _get_prefix(self):
        self.ensure_one()
        return (self.case_prefix or self.code[:6]).strip()

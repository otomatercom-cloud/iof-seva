# -*- coding: utf-8 -*-
import json

from odoo import api, fields, models
from odoo.exceptions import UserError


class OtmIofSiteContent(models.Model):
    _name = "otm.iof.site.content"
    _description = "IOF Public Website Content (single record, JSON)"

    name = fields.Char(default="IOF Seva website", required=True)
    data = fields.Text(string="Content JSON", help="Full website content (hero slides, sections, contact, footer).")

    @api.model
    def _get_record(self):
        rec = self.sudo().search([], limit=1)
        return rec or self.sudo().create({"name": "IOF Seva website", "data": "{}"})

    @api.model
    def get_public(self):
        """Used by the unauthenticated Next.js site route."""
        try:
            return json.loads(self._get_record().data or "{}")
        except ValueError:
            return {}

    @api.model
    def save_content(self, content):
        if not self.env.user.has_group("otm_iof_seva.group_iof_president"):
            raise UserError(self.env._("Only the President can edit the website."))
        if not isinstance(content, dict):
            raise UserError(self.env._("Invalid content."))
        self._get_record().write({"data": json.dumps(content)})
        return True

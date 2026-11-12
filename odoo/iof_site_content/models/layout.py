import json

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

from ._style import PAGE_RE, clean_layout


class IofSiteLayout(models.Model):
    _name = "iof.site.layout"
    _description = "Website page layout (section order, hidden sections, spacing)"
    _order = "page"
    _rec_name = "page"

    _page_uniq = models.Constraint("unique(page)", "Each page has one layout.")

    page = fields.Char(required=True, index=True, help="Page slug, e.g. home, about")
    data = fields.Text(required=True, default="{}", help="Written by the website editor")

    @api.constrains("page", "data")
    def _check(self):
        for rec in self:
            if not PAGE_RE.match(rec.page or ""):
                raise ValidationError(_("Invalid page name."))
            try:
                clean_layout(json.loads(rec.data or "{}"))
            except ValueError as err:
                raise ValidationError(_("Invalid layout: %s", err)) from err

    def action_reset(self):
        self.unlink()

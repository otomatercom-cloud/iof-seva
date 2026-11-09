# -*- coding: utf-8 -*-
import json

from odoo import http
from odoo.http import request


class IofSiteController(http.Controller):
    @http.route("/iof/site", type="http", auth="public", methods=["GET"], csrf=False)
    def site(self, **kw):
        """Public website content for the Next.js site (read-only)."""
        data = request.env["otm.iof.site.content"].sudo().get_public()
        return request.make_response(json.dumps(data), headers=[("Content-Type", "application/json"), ("Cache-Control", "no-store")])

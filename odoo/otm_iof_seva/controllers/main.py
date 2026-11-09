# -*- coding: utf-8 -*-
import hmac
import json
import logging
import re
from datetime import timedelta

from odoo import SUPERUSER_ID, fields

from odoo import http
from odoo.http import request


class IofSiteController(http.Controller):
    @http.route("/iof/site", type="http", auth="public", methods=["GET"], csrf=False)
    def site(self, **kw):
        """Public website content for the Next.js site (read-only)."""
        data = request.env["otm.iof.site.content"].sudo().get_public()
        return request.make_response(json.dumps(data), headers=[("Content-Type", "application/json"), ("Cache-Control", "no-store")])


_logger = logging.getLogger(__name__)
HOURLY_PER_IP = 5
DAILY_TOTAL = 300


def _json(data, status=200):
    return request.make_response(json.dumps(data), headers=[("Content-Type", "application/json"), ("Cache-Control", "no-store")], status=status)


class IofPublicIntake(http.Controller):
    """Public 'Report a case' form.  Only the Next.js server may call it (shared key in ir.config_parameter
    `otm_iof_seva.public_key`); it forwards the visitor's IP so the per-IP rate limit works."""

    def _authorised(self):
        key = request.env["ir.config_parameter"].sudo().get_param("otm_iof_seva.public_key") or ""
        sent = request.httprequest.headers.get("X-IOF-Key", "")
        return (not key) or hmac.compare_digest(key, sent)

    @http.route("/iof/public-config", type="http", auth="public", methods=["GET"], csrf=False)
    def config(self, **kw):
        if not self._authorised():
            return _json({"error": "forbidden"}, 403)
        env = request.env
        return _json({
            "issueTypes": [{"id": str(i.id), "name": i.name} for i in env["otm.iof.issue.type"].sudo().search([])],
            "committees": [{"code": c.code, "name": c.name} for c in env["otm.iof.committee"].sudo().search([("kind", "!=", "national")])],
        })

    @http.route("/iof/public-report", type="http", auth="public", methods=["POST"], csrf=False)
    def report(self, **kw):
        if not self._authorised():
            return _json({"error": "forbidden"}, 403)
        try:
            d = json.loads(request.httprequest.get_data(as_text=True) or "{}")
        except ValueError:
            return _json({"error": "Invalid request."}, 400)
        env = request.env(user=SUPERUSER_ID)
        if d.get("website"):  # honeypot: bots fill hidden fields
            return _json({"ok": True, "ref": "—"})
        if (d.get("elapsedMs") or 0) < 3000:
            return _json({"error": "Please take a moment to fill in the form."}, 400)
        ip = (str(d.get("ip") or request.httprequest.remote_addr or ""))[:64]
        Case = env["otm.iof.case"]
        since = fields.Datetime.now() - timedelta(hours=1)
        if Case.search_count([("source", "=", "website"), ("source_ip", "=", ip), ("create_date", ">=", since)]) >= HOURLY_PER_IP:
            return _json({"error": "Too many reports from your network. Please call us instead."}, 429)
        if Case.search_count([("source", "=", "website"), ("create_date", ">=", fields.Datetime.now() - timedelta(days=1))]) >= DAILY_TOTAL:
            return _json({"error": "Online reporting is busy. Please call us instead."}, 429)
        clean = lambda k, n=300: re.sub(r"\s+", " ", str(d.get(k) or "")).strip()[:n]
        name, phone, details = clean("name", 120), clean("phone", 40), str(d.get("details") or "").strip()[:4000]
        if not name or len(re.sub(r"\D", "", phone)) < 7 or len(details) < 15 or not d.get("consent"):
            return _json({"error": "Please enter your name, a valid phone number, a short description (15+ characters) and tick the consent box."}, 400)
        try:
            issue = env["otm.iof.issue.type"].browse(int(d.get("issueTypeId") or 0)).exists()
            comm = env["otm.iof.committee"].search([("code", "=", d.get("committee"))], limit=1) or env.ref("otm_iof_seva.committee_iof_nc", raise_if_not_found=False) \
                or env["otm.iof.committee"].search([("kind", "=", "national")], limit=1)
            if not issue or not comm:
                return _json({"error": "Please choose the type of problem."}, 400)
            rel = d.get("relation")
            case = Case.create({
                "name": (clean("title", 120) or issue.name + " - " + (clean("victimName", 80) or name)), "summary": details[:200], "details": details,
                "contact_details": phone + (" / " + clean("email", 120) if clean("email", 120) else ""), "reporting_person": name,
                "victim_name": clean("victimName", 120), "victim_contact": clean("victimPhone", 40), "country": clean("country", 80),
                "full_address": clean("place", 300), "issue_type_id": issue.id, "handling_committee_id": comm.id, "reported_from_id": comm.id,
                "reported_external": "relatives" if rel == "relative" else "local_community",
                "priority": "high" if d.get("urgent") else "medium", "source": "website", "source_ip": ip,
            })
            case.action_submit()
            return _json({"ok": True, "ref": case.case_no})
        except Exception:
            _logger.exception("public report failed")
            request.env.cr.rollback()
            return _json({"error": "Could not save your report. Please call us."}, 500)

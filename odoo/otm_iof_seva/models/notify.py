# -*- coding: utf-8 -*-
import json
import logging

import requests
from markupsafe import escape

from odoo import api, fields, models

_logger = logging.getLogger(__name__)

EVENTS = [
    ("new_case", "New case waiting for assignment"),
    ("assigned", "Case assigned to me"),
    ("critical", "Critical case registered"),
    ("transfer_request", "Transfer request to my province"),
    ("transferred_in", "Case transferred to my province"),
    ("transfer_rejected", "My transfer request was decided"),
    ("status", "Status of my case changed"),
    ("overdue", "Assignment overdue"),
]


class OtmIofNotifyEvent(models.Model):
    """Which events are sent, and on which channel. Edited by the President."""
    _name = "otm.iof.notify.event"
    _description = "IOF Notification Event"
    _order = "sequence, id"

    code = fields.Selection(EVENTS, required=True, index=True)
    name = fields.Char(compute="_compute_name")
    sequence = fields.Integer(default=10)
    email = fields.Boolean(default=True)
    whatsapp = fields.Boolean(default=False)

    _code_uniq = models.Constraint("unique(code)", "Each event can be configured only once.")

    @api.depends("code")
    def _compute_name(self):
        labels = dict(EVENTS)
        for rec in self:
            rec.name = labels.get(rec.code, "")


class OtmIofOutbox(models.Model):
    """Queue of WhatsApp messages (e-mails use the standard mail queue). Sent by cron, retried 3 times."""
    _name = "otm.iof.outbox"
    _description = "IOF WhatsApp Outbox"
    _order = "id desc"

    user_id = fields.Many2one("res.users", ondelete="cascade", index=True)
    number = fields.Char(required=True)
    text = fields.Text(required=True)
    event = fields.Char()
    case_id = fields.Many2one("otm.iof.case", ondelete="cascade", index=True)
    state = fields.Selection([("pending", "Pending"), ("sent", "Sent"), ("failed", "Failed")], default="pending", index=True)
    tries = fields.Integer(default=0)
    error = fields.Char()

    @api.model
    def _cron_send(self):
        icp = self.env["ir.config_parameter"].sudo()
        url, token = icp.get_param("otm_iof_seva.whatsapp_url"), icp.get_param("otm_iof_seva.whatsapp_token")
        batch = self.search([("state", "=", "pending")], limit=100, order="id")
        if not url:
            return
        for rec in batch:
            try:
                resp = requests.post(url, json={"to": rec.number, "text": rec.text, "event": rec.event,
                                                "caseId": rec.case_id.id or None},
                                     headers={"Authorization": "Bearer %s" % token} if token else {}, timeout=10)
                resp.raise_for_status()
                rec.write({"state": "sent", "tries": rec.tries + 1, "error": False})
            except Exception as e:  # noqa: BLE001 - gateway failure must never break the cron
                _logger.warning("IOF WhatsApp send failed: %s", e)
                rec.write({"tries": rec.tries + 1, "error": str(e)[:200],
                           "state": "failed" if rec.tries + 1 >= 3 else "pending"})

    @api.model
    def _cron_purge(self):
        self.search([("state", "=", "sent"), ("create_date", "<", fields.Datetime.subtract(fields.Datetime.now(), days=30))]).unlink()


class OtmIofCaseNotify(models.Model):
    _inherit = "otm.iof.case"

    def _notify(self, event, users, text):
        """Send `text` about this case to `users` by e-mail / WhatsApp, as configured. Contains no victim data."""
        cfg = self.env["otm.iof.notify.event"].sudo().search([("code", "=", event)], limit=1)
        if not cfg or not (cfg.email or cfg.whatsapp):
            return
        icp = self.env["ir.config_parameter"].sudo()
        portal = (icp.get_param("otm_iof_seva.portal_url") or "").rstrip("/")
        for rec in self.sudo():
            msg = "%s – %s | %s | %s" % (text, rec.case_no or "", rec.issue_type_id.name or "", rec.handling_committee_id.code or "")
            link = "%s/cases/%s" % (portal, rec.id) if portal else ""
            for user in users.sudo().filtered(lambda u: u.active and not u.share and u.id != self.env.uid):
                if cfg.email and user.iof_notify_email and user.email:
                    html = "<p>%s</p>%s" % (escape(msg), ('<p><a href="%s">%s</a></p>' % (link, link)) if link else "")
                    self.env["mail.mail"].sudo().create({
                        "subject": "[IOF Seva] %s" % text, "body_html": html, "email_to": user.email,
                        "auto_delete": True, "email_from": self.env.company.email_formatted or False})
                if cfg.whatsapp and user.iof_notify_whatsapp and user.iof_whatsapp:
                    self.env["otm.iof.outbox"].sudo().create({
                        "user_id": user.id, "number": user.iof_whatsapp, "event": event, "case_id": rec.id,
                        "text": msg + ("\n" + link if link else "")})

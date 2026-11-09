# -*- coding: utf-8 -*-
from odoo import api, fields, models
from odoo.exceptions import UserError

EVENT_TYPES = [
    ("created", "Created"), ("submitted", "Submitted"), ("assigned", "Assigned"), ("transferred", "Transferred"),
    ("status", "Status change"), ("update", "Update"), ("remark", "Remark"), ("followup", "Follow-up"),
    ("document", "Document"), ("resolved", "Resolved"), ("escalation", "Escalation"),
]
USER_EVENT_TYPES = {"update", "remark", "followup"}


class OtmIofCaseEvent(models.Model):
    _name = "otm.iof.case.event"
    _description = "IOF Case Timeline Event (immutable)"
    _order = "date desc, id desc"

    case_id = fields.Many2one("otm.iof.case", required=True, ondelete="cascade", index=True)
    event_type = fields.Selection(EVENT_TYPES, required=True, default="update")
    text = fields.Text(required=True)
    is_internal = fields.Boolean(string="Internal remark", default=False,
                                 help="Hidden from Case Handlers; visible to Coordinators and above.")
    date = fields.Datetime(default=fields.Datetime.now, readonly=True)
    author_id = fields.Many2one("res.users", string="By", default=lambda self: self.env.user, readonly=True)

    @api.model_create_multi
    def create(self, vals_list):
        if not self.env.su:
            for vals in vals_list:
                if vals.get("event_type", "update") not in USER_EVENT_TYPES:
                    raise UserError(self.env._("Only updates, remarks and follow-ups can be added manually."))
                vals["author_id"] = self.env.uid
                vals.pop("date", None)
                if vals.get("is_internal") and not self.env.user.has_group("otm_iof_seva.group_iof_coordinator"):
                    raise UserError(self.env._("Handlers cannot create internal remarks."))
        return super().create(vals_list)

    def write(self, vals):
        if not self.env.su:
            raise UserError(self.env._("Timeline events are immutable."))
        return super().write(vals)

    def unlink(self):
        if not self.env.su:
            raise UserError(self.env._("Timeline events cannot be deleted."))
        return super().unlink()

# -*- coding: utf-8 -*-
from odoo import api, fields, models
from odoo.exceptions import UserError



class OtmIofTransfer(models.Model):
    _name = "otm.iof.transfer"
    _description = "IOF Case Transfer"
    _order = "id desc"

    case_id = fields.Many2one("otm.iof.case", required=True, ondelete="cascade", index=True, readonly=True)
    # stored copies so the destination Province Head can decide before the case becomes visible to them
    case_no = fields.Char(readonly=True)
    case_name = fields.Char(readonly=True)
    case_issue = fields.Char(readonly=True)
    from_committee_id = fields.Many2one("otm.iof.committee", readonly=True)
    to_committee_id = fields.Many2one("otm.iof.committee", required=True, readonly=True)
    to_region = fields.Selection(related="to_committee_id.region", string="Destination Region", store=True, index=True)
    reason = fields.Text(required=True, readonly=True)
    requested_by_id = fields.Many2one("res.users", readonly=True)
    date = fields.Datetime(default=fields.Datetime.now, readonly=True)
    state = fields.Selection([("pending", "Pending"), ("accepted", "Accepted"), ("rejected", "Rejected")],
                             default="pending", required=True, readonly=True, index=True)
    decided_by_id = fields.Many2one("res.users", readonly=True)
    decided_date = fields.Datetime(readonly=True)
    decision_note = fields.Char(readonly=True)

    # ------------------------------------------------------------------
    @api.model
    def _submit(self, case, to_committee, reason):
        """Direct move for National / Province Head of the current region; otherwise a request."""
        case.ensure_one()
        user = self.env.user
        if case.assignment_state in ("draft", "transfer_pending") or case.status in ("completed", "closed_finance"):
            raise UserError(self.env._("This case cannot be transferred in its current state."))
        if not case._can_update():
            raise UserError(self.env._("You are not allowed to transfer this case."))
        if to_committee == case.handling_committee_id:
            raise UserError(self.env._("Select a different committee."))
        if not (reason or "").strip():
            raise UserError(self.env._("Reason for transfer is required."))
        direct = user._iof_is_national() or user._iof_is_head_of(case.handling_region)
        rec = self.sudo().create({
            "case_id": case.id, "case_no": case.case_no, "case_name": case.name, "case_issue": case.issue_type_id.name,
            "from_committee_id": case.handling_committee_id.id, "to_committee_id": to_committee.id, "reason": reason,
            "requested_by_id": user.id, "state": "accepted" if direct else "pending",
            "decided_by_id": user.id if direct else False, "decided_date": fields.Datetime.now() if direct else False})
        if direct:
            case._apply_transfer(to_committee, reason)
        else:
            case.sudo().write({"assignment_state": "transfer_pending"})
            case._log("transferred", self.env._("Transfer to %s requested. %s", to_committee.code, reason))
            case._todo(case._notify_users(to_committee.region), self.env._("Transfer request: %s", case.case_no))
        return rec

    def _check_can_decide(self):
        self.ensure_one()
        user = self.env.user
        if self.state != "pending":
            raise UserError(self.env._("This request is already decided."))
        if not (user._iof_is_national() or user._iof_is_head_of(self.to_region)):
            raise UserError(self.env._("Only the destination Province Head, Secretary or President can decide."))

    def action_accept(self):
        for rec in self:
            rec._check_can_decide()
            rec.sudo().write({"state": "accepted", "decided_by_id": self.env.uid, "decided_date": fields.Datetime.now()})
            rec.case_id.sudo()._apply_transfer(rec.to_committee_id, self.env._("Accepted: %s", rec.reason))

    def action_reject(self, note=False):
        for rec in self:
            rec._check_can_decide()
            rec.sudo().write({"state": "rejected", "decided_by_id": self.env.uid, "decided_date": fields.Datetime.now(),
                              "decision_note": note})
            case = rec.case_id.sudo()
            case.write({"assignment_state": "assigned" if case.handled_by_id else "awaiting_assignment"})
            case._log("transferred", self.env._("Transfer to %s rejected.", rec.to_committee_id.code))

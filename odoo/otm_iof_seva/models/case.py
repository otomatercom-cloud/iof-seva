# -*- coding: utf-8 -*-
from datetime import timedelta

from odoo import api, fields, models
from odoo.exceptions import UserError, ValidationError

from .issue_type import PRIORITIES

# Exact register strings (sheet "DND-Dropdown_list", column B) – ids are stable keys.
STATUSES = [
    ("open_new", "Open(new)"),
    ("inprogress_iof", "Inprogress - Pending IOF work"),
    ("pending_judiciary", "Inprogress - Pending Saudi Judiciary"),
    ("pending_sponsor", "Inprogress - Pending Sponsor Activity"),
    ("pending_indian_authority", "Inprogress - Pending Indian Authority"),
    ("pending_police", "Inprogress - Pending Saudi Police"),
    ("pending_medical", "Inprogress - Pending Medical"),
    ("completed", "Completed"),
    ("closed_finance", "Closed - Including Finance"),
]
PENDING = {"pending_judiciary", "pending_sponsor", "pending_indian_authority", "pending_police", "pending_medical"}
# Approved transition matrix (decision of 2026-11-09). Open can never jump straight to Completed/Closed.
ALLOWED = {
    "open_new": {"inprogress_iof"} | PENDING,
    "inprogress_iof": PENDING | {"completed"},
    "completed": {"closed_finance", "inprogress_iof"},
    "closed_finance": {"inprogress_iof"},  # reopen: President only
}
for _p in PENDING:
    ALLOWED[_p] = (PENDING - {_p}) | {"inprogress_iof", "completed"}

ASSIGNMENT_STATES = [
    ("draft", "Draft"), ("awaiting_assignment", "Awaiting assignment"),
    ("assigned", "Assigned"), ("transfer_pending", "Transfer pending"),
]
EXTERNAL_SOURCES = [
    ("matur_sangathan", "Matur Sangathan"), ("embassy", "Embassy committed"),
    ("relatives", "Relatives of the Victims"), ("local_community", "Local Community"),
]
FROZEN_AFTER_SUBMIT = {"reported_from_id", "reported_external", "handling_committee_id", "handled_by_id", "assignment_state"}
G = "otm_iof_seva."


class OtmIofCase(models.Model):
    _name = "otm.iof.case"
    _description = "IOF Seva Case"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "sl desc, id desc"

    # ---- Excel columns -------------------------------------------------------------------------
    sl = fields.Integer(string="SL", readonly=True, copy=False, index=True)
    case_no = fields.Char(string="Case No.", readonly=True, copy=False, index=True)
    name = fields.Char(string="Case Name", required=True, tracking=True)
    summary = fields.Char(string="Short Description")
    details = fields.Text(string="Case in details")
    contact_details = fields.Char(string="Contact Details")
    reporting_person = fields.Char()
    reporting_coordinator_id = fields.Many2one("res.users", string="Reporting Coordinator / Staff")
    reported_from_id = fields.Many2one("otm.iof.committee", string="Case Report From (Committee)", tracking=True,
                                       default=lambda self: self.env.user.iof_committee_id)
    reported_external = fields.Selection(EXTERNAL_SOURCES, string="Case Report From (Other)")
    handling_committee_id = fields.Many2one("otm.iof.committee", string="Responsible Committee", required=True, tracking=True, index=True)
    handled_by_id = fields.Many2one("res.users", string="Handled By", tracking=True, copy=False, index=True)
    registration_date = fields.Date(string="Date of Case Register In IOF", default=fields.Date.context_today, required=True, index=True)
    issue_type_id = fields.Many2one("otm.iof.issue.type", string="Issue Type", required=True, tracking=True, index=True)
    priority = fields.Selection(PRIORITIES, default="medium", required=True, tracking=True, index=True)
    area_ksa = fields.Char(string="Location Region KSA")
    country = fields.Char(default="Saudi Arabia")
    state_india = fields.Char(string="State in Bharath")
    district_india = fields.Char(string="District in Bharath")
    village = fields.Char(string="Village / Town")
    full_address = fields.Text()
    local_id_passport = fields.Char(string="Local ID / Passport Details")
    victim_name = fields.Char(string="Victim / Beneficiary Name")
    victim_contact = fields.Char(string="Contact of Victim or Dependent")
    alternate_contact = fields.Char()
    dependents = fields.Text(string="Dependent Information")
    reference_by = fields.Char(string="Case Reference By")
    reference_details = fields.Text()
    sponsor_name = fields.Char()
    sponsor_mobile = fields.Char()
    sponsor_details = fields.Text(string="Sponsor Details / Mob No")
    iof_involvement = fields.Text(string="IOF Involvements")
    others_involvement = fields.Text(string="Other Organisations Involvement")
    financial_expenses = fields.Char(string="Financial Expenses / Seva (summary)")
    seva_support = fields.Text(string="Seva Support Details")
    remarks = fields.Text()
    initial_status = fields.Selection(STATUSES, default="open_new", readonly=True, copy=False)
    old_status = fields.Selection(STATUSES, string="OLD", readonly=True, copy=False)
    status = fields.Selection(STATUSES, string="Status New", default="open_new", required=True, tracking=True, copy=False, index=True)
    resolution_note = fields.Text(help="Mandatory when a case is marked Completed.")
    resolved_on = fields.Datetime(readonly=True, copy=False, index=True)
    days_to_resolve = fields.Integer(compute="_compute_days_to_resolve", store=True)

    # ---- workflow ------------------------------------------------------------------------------
    assignment_state = fields.Selection(ASSIGNMENT_STATES, default="draft", required=True, tracking=True, copy=False, index=True)
    source = fields.Selection([("portal", "Portal"), ("import", "Excel import"), ("website", "Website")], default="portal", readonly=True)
    source_ip = fields.Char(readonly=True, copy=False, index=True, groups="otm_iof_seva.group_iof_secretary")
    submitted_date = fields.Datetime(readonly=True, copy=False)
    escalated_on = fields.Datetime(readonly=True, copy=False)
    handling_region = fields.Selection(related="handling_committee_id.region", string="Responsible Region", store=True, index=True)
    reported_region = fields.Selection(related="reported_from_id.region", string="Reporting Region", store=True, index=True)

    event_ids = fields.One2many("otm.iof.case.event", "case_id", string="Timeline")
    assignment_ids = fields.One2many("otm.iof.case.assignment", "case_id", string="Assignment History")
    finance_ids = fields.One2many("otm.iof.case.finance", "case_id", string="Financial Entries")
    document_ids = fields.One2many("otm.iof.case.document", "case_id", string="Documents")
    transfer_ids = fields.One2many("otm.iof.transfer", "case_id", string="Transfers")
    transfer_count = fields.Integer(compute="_compute_transfer_count", string="Transfer count")
    can_assign = fields.Boolean(compute="_compute_permissions")
    can_update = fields.Boolean(compute="_compute_permissions")

    _sl_uniq = models.Constraint("unique(sl)", "Serial number (SL) must be unique.")

    # ------------------------------------------------------------------------------------------
    # computes
    # ------------------------------------------------------------------------------------------
    @api.depends("case_no", "name")
    def _compute_display_name(self):
        for rec in self:
            rec.display_name = "%s · %s" % (rec.case_no or self.env._("Draft"), rec.name or "")

    @api.depends("transfer_ids")
    def _compute_transfer_count(self):
        for rec in self:
            rec.transfer_count = len(rec.transfer_ids)

    @api.depends_context("uid")
    @api.depends("assignment_state", "status", "handling_committee_id", "handled_by_id")
    def _compute_permissions(self):
        for rec in self:
            rec.can_assign = rec._can_assign()
            rec.can_update = rec._can_update()

    # ------------------------------------------------------------------------------------------
    # permission helpers (evaluated for env.user, regardless of sudo)
    # ------------------------------------------------------------------------------------------
    def _can_assign(self):
        self.ensure_one()
        u = self.env.user
        if self.assignment_state in ("draft", "transfer_pending") or self.status in ("completed", "closed_finance"):
            return False
        return u._iof_is_national() or u._iof_is_head_of(self.handling_region) or u._iof_is_coordinator_of(self.handling_committee_id)

    def _can_update(self):
        self.ensure_one()
        u = self.env.user
        if self.assignment_state == "draft":
            return self.create_uid == u or u._iof_is_national()
        return (u._iof_is_national() or u._iof_is_head_of(self.handling_region)
                or u._iof_is_coordinator_of(self.handling_committee_id) or self.handled_by_id == u)

    def _is_head_or_national(self):
        self.ensure_one()
        u = self.env.user
        return u._iof_is_national() or u._iof_is_head_of(self.handling_region)

    def _notify_users(self, region):
        """Province Heads of `region` + all national (Secretary / President) users."""
        head = self.env.ref(G + "group_iof_head").sudo()
        sec = self.env.ref(G + "group_iof_secretary").sudo()
        national = sec.all_user_ids
        return head.all_user_ids.filtered(lambda u: u.active and not u.share and (u in national or u.iof_committee_id.region == region))

    def _log(self, event_type, text, internal=False):
        self.env["otm.iof.case.event"].sudo().create(
            [{"case_id": rec.id, "event_type": event_type, "text": text, "is_internal": internal,
              "author_id": self.env.uid} for rec in self])

    def _todo(self, users, summary):
        for rec in self.sudo():
            for user in users:
                rec.activity_schedule("mail.mail_activity_data_todo", user_id=user.id, summary=summary)

    # ------------------------------------------------------------------------------------------
    # ORM guards
    # ------------------------------------------------------------------------------------------
    @api.model_create_multi
    def create(self, vals_list):
        if not self.env.su:
            for vals in vals_list:
                for key in ("sl", "case_no", "submitted_date", "escalated_on", "old_status", "initial_status", "source"):
                    vals.pop(key, None)
                vals["assignment_state"] = "draft"
                vals["status"] = "open_new"
        return super().create(vals_list)

    @api.depends("resolved_on", "registration_date")
    def _compute_days_to_resolve(self):
        for rec in self:
            rec.days_to_resolve = max(1, (rec.resolved_on.date() - rec.registration_date).days) if rec.resolved_on and rec.registration_date else 0

    def write(self, vals):
        if not self.env.su:
            if {"sl", "case_no", "submitted_date", "escalated_on", "old_status", "initial_status", "source"} & set(vals):
                raise UserError(self.env._("System fields cannot be edited."))
            for rec in self:
                if rec.assignment_state != "draft" and FROZEN_AFTER_SUBMIT & set(vals):
                    raise UserError(self.env._(
                        "Reporting source, responsible committee, assignee and assignment state can only be changed "
                        "through Assign / Transfer."))
                if rec.status == "closed_finance" and set(vals) != {"status"}:
                    raise UserError(self.env._("A closed case is locked. Only the President can reopen it."))
                if rec.assignment_state != "draft" and not rec._can_update():
                    raise UserError(self.env._("You are not allowed to update this case."))
                if rec.assignment_state == "draft" and not rec._can_update():
                    raise UserError(self.env._("Only the creator can edit a draft case."))
            if "status" in vals:
                for rec in self:
                    rec._check_status_change(vals["status"], vals)
        if "status" in vals:
            for rec in self:
                if rec.status != vals["status"]:
                    done = vals["status"] in ("completed", "closed_finance")
                    super(OtmIofCase, rec).write(dict(vals, old_status=rec.status, resolved_on=(rec.resolved_on or fields.Datetime.now()) if done else False))
                    rec._log("resolved" if vals["status"] == "completed" else "status",
                             self.env._("Status: %(old)s → %(new)s", old=dict(STATUSES)[rec.old_status],
                                        new=dict(STATUSES)[vals["status"]]))
                else:
                    super(OtmIofCase, rec).write(vals)
            return True
        return super().write(vals)

    def unlink(self):
        for rec in self:
            if rec.assignment_state != "draft":
                raise UserError(self.env._("Submitted cases cannot be deleted (audit trail). Close the case instead."))
        return super().unlink()

    def _check_status_change(self, new, vals):
        self.ensure_one()
        old = self.status
        if new == old:
            return
        if self.assignment_state == "draft":
            raise UserError(self.env._("Submit the case before changing its status."))
        if self.assignment_state == "transfer_pending":
            raise UserError(self.env._("A transfer request is pending for this case."))
        if not self._can_update():
            raise UserError(self.env._("You are not allowed to change the status of this case."))
        if new not in ALLOWED.get(old, set()):
            raise UserError(self.env._(
                "Status cannot move from “%(old)s” to “%(new)s”.", old=dict(STATUSES)[old], new=dict(STATUSES)[new]))
        if old == "closed_finance" and not self.env.user.has_group(G + "group_iof_president"):
            raise UserError(self.env._("Only the President can reopen a closed case."))
        if (new == "closed_finance" or (old == "completed" and new == "inprogress_iof")) and not self._is_head_or_national():
            raise UserError(self.env._("Only the Province Head, Secretary or President can do this."))
        if new == "completed" and not (vals.get("resolution_note") or self.resolution_note):
            raise UserError(self.env._("A resolution note is mandatory to complete a case."))

    @api.constrains("reported_from_id", "reported_external")
    def _check_reporting_source(self):
        for rec in self:
            if not rec.reported_from_id and not rec.reported_external:
                raise ValidationError(self.env._("Select the committee or the external source that reported this case."))

    # ------------------------------------------------------------------------------------------
    # workflow actions
    # ------------------------------------------------------------------------------------------
    def action_submit(self):
        for rec in self:
            if rec.assignment_state != "draft":
                raise UserError(self.env._("Only draft cases can be submitted."))
            if not rec._can_update():
                raise UserError(self.env._("Only the creator can submit this draft."))
            missing = [label for label, val in (
                (self.env._("Case details"), rec.details), (self.env._("Contact details"), rec.contact_details)) if not val]
            if missing:
                raise UserError(self.env._("Please fill: %s", ", ".join(missing)))
            sl = int(self.env["ir.sequence"].sudo().next_by_code("otm.iof.case.sl"))
            case_no = "%s-%s" % (rec.handling_committee_id._get_prefix(), sl)  # frozen from now on
            state = "assigned" if rec.handled_by_id else "awaiting_assignment"
            rec.sudo().write({"sl": sl, "case_no": case_no, "assignment_state": state,
                              "submitted_date": fields.Datetime.now(), "initial_status": rec.status})
            rec._log("submitted", self.env._("Case registered as %s.", case_no))
            rec._check_duplicates()
            if state == "awaiting_assignment":
                rec._todo(rec._notify_users(rec.handling_region), self.env._("Assign a coordinator: %s", case_no))
            else:
                rec._todo(rec.handled_by_id, self.env._("New case assigned to you: %s", case_no))
            if rec.priority == "critical":
                rec._todo(rec._notify_users(rec.handling_region), self.env._("Critical case registered: %s", case_no))
                rec.sudo().message_post(body=self.env._("Critical case registered."), subtype_xmlid="mail.mt_note",
                                        partner_ids=rec._notify_users(rec.handling_region).partner_id.ids)
        return True

    def _check_duplicates(self):
        self.ensure_one()
        keys = [("victim_contact", self.victim_contact), ("local_id_passport", self.local_id_passport)]
        domain = [("id", "!=", self.id), ("assignment_state", "!=", "draft"), ("status", "!=", "closed_finance")]
        or_dom = []
        for fname, val in keys:
            if val:
                or_dom = ["|"] + or_dom + [(fname, "=", val)] if or_dom else [(fname, "=", val)]
        if not or_dom:
            return
        visible = self.search(domain + or_dom)
        hidden = self.sudo().search_count(domain + or_dom) - len(visible)
        if visible or hidden:
            body = self.env._("Possible duplicate: %(vis)s%(hid)s", vis=", ".join(visible.mapped("case_no")),
                              hid=self.env._(" (+%s in other provinces)", hidden) if hidden else "")
            self.sudo().message_post(body=body, subtype_xmlid="mail.mt_note")

    def _do_assign(self, user, note=False):
        self.ensure_one()
        if not self._can_assign():
            raise UserError(self.env._("You are not allowed to assign this case."))
        if not user.has_group(G + "group_iof_handler") or user.share:
            raise UserError(self.env._("The assignee must be an IOF user."))
        if user.iof_committee_id.region != self.handling_region:
            raise UserError(self.env._("The assignee must belong to the same province as the responsible committee."))
        self.sudo().write({"handled_by_id": user.id, "assignment_state": "assigned"})
        self.env["otm.iof.case.assignment"].sudo().create({
            "case_id": self.id, "by_id": self.env.uid, "to_id": user.id,
            "committee_id": self.handling_committee_id.id, "note": note})
        self._log("assigned", self.env._("Assigned to %s.", user.name) + (" " + note if note else ""))
        self._todo(user, self.env._("New case assigned to you: %s", self.case_no))

    def _apply_transfer(self, to_committee, note):
        self.ensure_one()
        old = self.handling_committee_id
        self.sudo().write({"handling_committee_id": to_committee.id, "handled_by_id": False,
                           "assignment_state": "awaiting_assignment", "escalated_on": False})
        self._log("transferred", self.env._("Transferred %(a)s → %(b)s. %(n)s", a=old.code, b=to_committee.code, n=note or ""))
        self._todo(self._notify_users(to_committee.region), self.env._("Assign a coordinator (transferred): %s", self.case_no))

    def action_open_assign(self):
        self.ensure_one()
        return self._open_wizard("otm.iof.assign.wizard", self.env._("Assign Case"))

    def action_open_transfer(self):
        self.ensure_one()
        return self._open_wizard("otm.iof.transfer.wizard", self.env._("Transfer Case"))

    def action_open_status(self):
        self.ensure_one()
        return self._open_wizard("otm.iof.status.wizard", self.env._("Change Status"))

    def action_view_transfers(self):
        self.ensure_one()
        return {"type": "ir.actions.act_window", "name": self.env._("Transfers"), "res_model": "otm.iof.transfer",
                "view_mode": "list,form", "domain": [("case_id", "=", self.id)]}

    def _open_wizard(self, model, title):
        return {"type": "ir.actions.act_window", "name": title, "res_model": model, "view_mode": "form",
                "target": "new", "context": {"default_case_id": self.id}}

    # ------------------------------------------------------------------------------------------
    # SLA escalation (cron)
    # ------------------------------------------------------------------------------------------
    @api.model
    def _cron_escalate_unassigned(self):
        days = int(self.env["ir.config_parameter"].sudo().get_param("otm_iof_seva.unassigned_days", "2"))
        limit = fields.Datetime.now() - timedelta(days=days)
        cases = self.sudo().search([("assignment_state", "=", "awaiting_assignment"),
                                    ("submitted_date", "<=", limit), ("escalated_on", "=", False)])
        for case in cases:
            case._todo(case._notify_users(case.handling_region),
                       self.env._("OVERDUE assignment (%(d)s days): %(c)s", d=days, c=case.case_no))
            case._log("escalation", self.env._("Not assigned within %s days – escalated.", days), internal=True)
            case.write({"escalated_on": fields.Datetime.now()})

# -*- coding: utf-8 -*-
import base64
import re

from odoo import api, fields, models
from odoo.exceptions import AccessError, UserError

G = "otm_iof_seva."
STATES = ("new", "under_review", "contacted", "approved", "rejected")
ACTIONS = {"review": "action_review", "contact": "action_contact", "approve": "action_approve",
           "reject": "action_reject", "reset": "action_reset"}
# fields a manager may correct from the portal (everything else stays as submitted)
EDITABLE = ("first_name", "last_name", "gender", "date_of_birth", "nationality", "iqama_number", "saudi_city", "mobile",
            "whatsapp", "email", "address", "city", "region", "occupation", "organization", "qualification", "special_skills",
            "experience", "languages", "hours_per_month", "emergency_name", "emergency_relationship", "emergency_phone")
SORTS = {"new": "registration_date desc, id desc", "old": "registration_date asc, id asc", "name": "full_name asc, id asc"}


class IofVolunteerRegistration(models.Model):
    _inherit = "iof.volunteer.registration"

    portal_user_id = fields.Many2one("res.users", string="Portal user", readonly=True, copy=False, ondelete="set null")


class OtmIofApiVolunteers(models.AbstractModel):
    _inherit = "otm.iof.api"

    # ------------------------------------------------------------------ helpers
    @api.model
    def _need_volunteer_manager(self):
        if not self.env.user.has_group(G + "group_iof_secretary"):
            raise AccessError(self.env._("Only the Secretary or President can manage volunteers."))

    @api.model
    def _vol(self, vid):
        rec = self.env["iof.volunteer.registration"].sudo().browse(int(vid)).exists()
        if not rec:
            raise UserError(self.env._("Volunteer not found."))
        return rec

    @api.model
    def _has_cards(self):
        return "member_id" in self.env["iof.volunteer.registration"]._fields

    @api.model
    def _vol_row(self, r):
        cards = self._has_cards()
        return {"id": str(r.id), "ref": r.name, "name": r.full_name or "", "mobile": r.mobile or "", "email": r.email or "",
                "city": dict(r._fields["saudi_city"].selection).get(r.saudi_city, "") if r.saudi_city else (r.city or ""),
                "state": r.state, "date": fields.Datetime.to_string(r.registration_date) if r.registration_date else "",
                "memberNo": (r.member_number or "") if cards else "", "cardStatus": (r.card_status or "") if cards else "",
                "portalUser": r.portal_user_id.login or "", "source": r.source or ""}

    # ------------------------------------------------------------------ list / profile
    @api.model
    def volunteer_list(self, p=None):
        self._need_volunteer_manager()
        p = p or {}
        dom = []
        if p.get("state") in STATES:
            dom.append(("state", "=", p["state"]))
        if p.get("city"):
            dom.append(("saudi_city", "=", p["city"]))
        q = (p.get("q") or "").strip()[:80]
        if q:
            dom += ["|", "|", "|", "|", ("full_name", "ilike", q), ("mobile", "ilike", q), ("email", "ilike", q),
                    ("name", "ilike", q), ("iqama_number", "ilike", q)]
        V = self.env["iof.volunteer.registration"].sudo()
        size = max(1, min(int(p.get("size") or 25), 100))
        page = max(1, int(p.get("page") or 1))
        total = V.search_count(dom)
        rows = V.search(dom, order=SORTS.get(p.get("sort"), SORTS["new"]), limit=size, offset=(page - 1) * size)
        counts = {s: V.search_count([("state", "=", s)]) for s in STATES}
        return {"rows": [self._vol_row(r) for r in rows], "total": total, "page": page, "size": size, "counts": counts,
                "cities": [{"value": k, "label": v} for k, v in V._fields["saudi_city"].selection],
                "cards": self._has_cards()}

    @api.model
    def volunteer_get(self, vid):
        self._need_volunteer_manager()
        r = self._vol(vid)
        d = self._vol_row(r)
        d.update({f: r[f] or "" for f in EDITABLE if f != "date_of_birth"})
        d["date_of_birth"] = fields.Date.to_string(r.date_of_birth) if r.date_of_birth else ""
        d["gender"] = r.gender or ""
        d.update({"interests": r.interest_ids.mapped("name"), "otherInterest": r.other_interest or "",
                  "availWeekdays": r.avail_weekdays, "availWeekends": r.avail_weekends, "availEmergency": r.avail_emergency,
                  "consent": r.consent_given, "consentDate": fields.Datetime.to_string(r.consent_date) if r.consent_date else "",
                  "duplicates": r.duplicate_count, "photo": "", "hasCards": self._has_cards()})
        if self._has_cards() and r.photo:
            d["photo"] = "data:image/jpeg;base64," + r.photo.decode()
        return d

    # ------------------------------------------------------------------ actions
    @api.model
    def volunteer_set_state(self, vid, action):
        self._need_volunteer_manager()
        if action not in ACTIONS:
            raise UserError(self.env._("Unknown action."))
        r = self._vol(vid)
        getattr(r, ACTIONS[action])()
        r.message_post(body=self.env._("Marked %(a)s from the IOF Seva portal by %(u)s.", a=action, u=self.env.user.name))
        return self._vol_row(r)

    @api.model
    def volunteer_update(self, vid, vals):
        self._need_volunteer_manager()
        r = self._vol(vid)
        clean = {}
        for k, v in (vals or {}).items():
            if k not in EDITABLE:
                continue
            v = (v or "").strip() if isinstance(v, str) else v
            if k in ("first_name", "mobile", "email") and not v:
                raise UserError(self.env._("First name, mobile and e-mail cannot be empty."))
            if k == "email" and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]{2,}", v):
                raise UserError(self.env._("Enter a valid e-mail address."))
            if k == "date_of_birth":
                v = v or False
            fld = r._fields[k]
            if fld.type == "selection" and v and v not in dict(fld._description_selection(self.env)):
                raise UserError(self.env._("Invalid value for %s.", fld.string))
            clean[k] = v if v != "" else False
        r.write(clean)
        return self.volunteer_get(r.id)

    @api.model
    def volunteer_issue_card(self, vid):
        """Issues (or returns) the ID card. Needs the iof_volunteer_card module."""
        self._need_volunteer_manager()
        if not self._has_cards():
            raise UserError(self.env._("The ID card module is not installed on this server."))
        r = self._vol(vid)
        if r.state != "approved":
            raise UserError(self.env._("Approve the volunteer before issuing an ID card."))
        if not r.member_id:
            r.action_issue_card()
        return self._vol_row(r)

    @api.model
    def volunteer_card_ref(self, vid):
        """Report name + record id for the BFF to stream the ID card PDF (as the signed-in user)."""
        self._need_volunteer_manager()
        if not self._has_cards():
            raise UserError(self.env._("The ID card module is not installed on this server."))
        r = self._vol(vid)
        if not r.member_id:
            raise UserError(self.env._("No ID card has been issued yet."))
        act = r.action_print_card()
        return {"reportName": act.get("report_name"), "memberId": r.member_id.id}

    @api.model
    def volunteer_email_card(self, vid):
        self._need_volunteer_manager()
        if not self._has_cards():
            raise UserError(self.env._("The ID card module is not installed on this server."))
        r = self._vol(vid)
        if not r.member_id:
            raise UserError(self.env._("No ID card has been issued yet."))
        r.action_email_card()
        return True

    @api.model
    def volunteer_assign_role(self, vid, role, province_code, password=None):
        """Turns a volunteer into a portal user (or updates their role). President only."""
        self._need_president()
        r = self._vol(vid)
        if r.state != "approved":
            raise UserError(self.env._("Approve the volunteer before giving a portal role."))
        user = r.portal_user_id or self.env["res.users"].sudo().with_context(active_test=False).search([("login", "=", r.email)], limit=1)
        payload = {"id": user.id if user else None, "name": r.full_name, "email": r.email, "phone": r.mobile,
                   "role": role, "provinceCode": province_code}
        if r.whatsapp:
            payload["whatsapp"] = re.sub(r"[^\d+]", "", r.whatsapp)
        if password:
            payload["password"] = password
        if not payload["id"] and not password:
            raise UserError(self.env._("Set an initial password for the new user."))
        self.upsert_user(payload)
        user = self.env["res.users"].sudo().with_context(active_test=False).search([("login", "=", r.email)], limit=1)
        r.portal_user_id = user
        r.message_post(body=self.env._("Portal role %(r)s (%(p)s) given by %(u)s.", r=role, p=province_code, u=self.env.user.name))
        return self._vol_row(r)

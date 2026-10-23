import re
from datetime import date

from odoo import api, fields, models, _

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?[0-9][0-9\s\-()]{6,19}$")
CTRL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")

SAUDI_CITIES = [
    ("riyadh", "Riyadh"), ("jeddah", "Jeddah"), ("dammam", "Dammam"),
    ("khobar", "Khobar"), ("dhahran", "Dhahran"), ("makkah", "Makkah"),
    ("madinah", "Madinah"), ("taif", "Taif"), ("abha", "Abha"),
    ("tabuk", "Tabuk"), ("qassim", "Al Qassim (Buraidah)"), ("hail", "Hail"),
    ("najran", "Najran"), ("jazan", "Jazan"), ("ahsa", "Al Ahsa (Hofuf)"),
    ("yanbu", "Yanbu"), ("jubail", "Jubail"), ("other", "Other"),
]
GENDERS = [("male", "Male"), ("female", "Female"), ("other", "Other")]
AVAILABILITY = {
    "weekdays": "avail_weekdays",
    "weekends": "avail_weekends",
    "emergency": "avail_emergency",
}

# field -> (max length, required)
TEXT_FIELDS = {
    "first_name": (80, True),
    "last_name": (80, True),
    "nationality": (80, False),
    "iqama_number": (20, False),
    "address": (500, False),
    "city": (80, False),
    "region": (80, False),
    "occupation": (120, False),
    "organization": (120, False),
    "qualification": (120, False),
    "other_interest": (120, False),
    "special_skills": (2000, False),
    "experience": (2000, False),
    "languages": (200, False),
    "hours_per_month": (20, False),
    "emergency_name": (120, False),
    "emergency_relationship": (80, False),
}


class IofVolunteerRegistration(models.Model):
    _name = "iof.volunteer.registration"
    _description = "IOF Volunteer Registration"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "registration_date desc, id desc"

    name = fields.Char(string="Reference", readonly=True, copy=False, index=True,
                       default=lambda self: _("New"))
    state = fields.Selection(
        [("new", "New"), ("under_review", "Under Review"), ("contacted", "Contacted"),
         ("approved", "Approved"), ("rejected", "Rejected")],
        string="Status", default="new", required=True, tracking=True, index=True, copy=False)
    registration_date = fields.Datetime(string="Registered On", default=fields.Datetime.now,
                                        readonly=True, index=True, copy=False)
    source = fields.Selection([("website", "Website"), ("manual", "Manual Entry")],
                              default="manual", required=True)
    idempotency_key = fields.Char(copy=False, index=True, readonly=True)

    # Personal
    first_name = fields.Char(required=True, tracking=True)
    last_name = fields.Char(string="Last Name")
    full_name = fields.Char(compute="_compute_full_name", store=True, index=True)
    gender = fields.Selection(GENDERS)
    date_of_birth = fields.Date()
    nationality = fields.Char()
    iqama_number = fields.Char(string="Iqama Number")
    saudi_city = fields.Selection(SAUDI_CITIES, string="City in Saudi Arabia")

    # Contact
    mobile = fields.Char(string="Mobile Number", required=True, tracking=True, index=True)
    whatsapp = fields.Char(string="WhatsApp Number")
    email = fields.Char(string="Email Address", required=True, tracking=True, index=True)
    address = fields.Text(string="Current Residential Address")
    city = fields.Char(string="Address City")
    region = fields.Char(string="Region/Province")

    # Professional
    occupation = fields.Char()
    organization = fields.Char(string="Company/Organization")
    qualification = fields.Char(string="Educational Qualification")

    # Volunteering
    interest_ids = fields.Many2many("iof.volunteer.interest", string="Volunteer Interests")
    other_interest = fields.Char(string="Other Interest (Specified)")
    special_skills = fields.Text()
    experience = fields.Text(string="Previous Volunteer Experience")
    languages = fields.Char(string="Languages Known")
    avail_weekdays = fields.Boolean(string="Available on Weekdays")
    avail_weekends = fields.Boolean(string="Available on Weekends")
    avail_emergency = fields.Boolean(string="Available for Emergency Support")
    hours_per_month = fields.Char(string="Hours Available Per Month")

    # Emergency contact
    emergency_name = fields.Char(string="Emergency Contact Name")
    emergency_relationship = fields.Char(string="Relationship")
    emergency_phone = fields.Char(string="Emergency Contact Number")

    # Consent
    consent_given = fields.Boolean(string="Declaration & Consent", tracking=True)
    consent_date = fields.Datetime(string="Consent Timestamp", readonly=True)

    internal_notes = fields.Html(string="Internal Notes")
    duplicate_count = fields.Integer(compute="_compute_duplicate_count", string="Possible Duplicates")

    _idempotency_uniq = models.Constraint(
        "unique(idempotency_key)", "This submission was already registered.")

    # ------------------------------------------------------------------ compute
    @api.depends("first_name", "last_name")
    def _compute_full_name(self):
        for rec in self:
            rec.full_name = " ".join(p for p in (rec.first_name, rec.last_name) if p)

    def _compute_duplicate_count(self):
        for rec in self:
            if not rec.id:
                rec.duplicate_count = 0
                continue
            rec.duplicate_count = self.search_count([
                ("id", "!=", rec.id),
                "|", ("email", "=ilike", rec.email or "-"), ("mobile", "=", rec.mobile or "-"),
            ])

    @api.depends("name", "full_name")
    def _compute_display_name(self):
        for rec in self:
            rec.display_name = f"{rec.name} - {rec.full_name}" if rec.full_name else (rec.name or "")

    # ------------------------------------------------------------------ CRUD
    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get("name") or vals["name"] == _("New"):
                vals["name"] = (self.env["ir.sequence"].sudo()
                                .next_by_code("iof.volunteer.registration") or _("New"))
            if vals.get("consent_given") and not vals.get("consent_date"):
                vals["consent_date"] = fields.Datetime.now()
        return super().create(vals_list)

    # ------------------------------------------------------------------ workflow
    def action_review(self):
        self.write({"state": "under_review"})

    def action_contact(self):
        self.write({"state": "contacted"})

    def action_approve(self):
        self.write({"state": "approved"})

    def action_reject(self):
        self.write({"state": "rejected"})

    def action_reset(self):
        self.write({"state": "new"})

    # ------------------------------------------------------------------ website API
    @api.model
    def _clean_text(self, value):
        if value is None:
            return ""
        return CTRL_RE.sub("", str(value)).strip()

    @api.model
    def _clean_payload(self, payload):
        """Validate a website payload against a strict allowlist.

        Returns (vals, errors). Unknown keys are ignored, never written.
        """
        vals, errors = {}, {}
        if not isinstance(payload, dict):
            return {}, {"_": "Invalid payload."}

        for fname, (maxlen, required) in TEXT_FIELDS.items():
            raw = payload.get(fname)
            if raw is not None and not isinstance(raw, (str, int, float)):
                errors[fname] = "Invalid value."
                continue
            text = self._clean_text(raw)
            if required and not text:
                errors[fname] = "This field is required."
            elif len(text) > maxlen:
                errors[fname] = f"Maximum {maxlen} characters."
            elif text:
                vals[fname] = text

        def phone(fname, required=False):
            text = self._clean_text(payload.get(fname))
            if not text:
                if required:
                    errors[fname] = "This field is required."
            elif not PHONE_RE.match(text):
                errors[fname] = "Enter a valid phone number."
            else:
                vals[fname] = text

        phone("mobile", required=True)
        phone("whatsapp")
        phone("emergency_phone")

        email = self._clean_text(payload.get("email")).lower()
        if not email:
            errors["email"] = "This field is required."
        elif len(email) > 254 or not EMAIL_RE.match(email):
            errors["email"] = "Enter a valid email address."
        else:
            vals["email"] = email

        for fname, options in (("gender", GENDERS), ("saudi_city", SAUDI_CITIES)):
            text = self._clean_text(payload.get(fname))
            if text:
                if text in dict(options):
                    vals[fname] = text
                else:
                    errors[fname] = "Invalid choice."

        dob = self._clean_text(payload.get("date_of_birth"))
        if dob:
            try:
                parsed = date.fromisoformat(dob)
                today = fields.Date.context_today(self)
                if parsed >= today or parsed.year < today.year - 110:
                    raise ValueError
                vals["date_of_birth"] = parsed
            except ValueError:
                errors["date_of_birth"] = "Enter a valid date of birth."

        codes = payload.get("interests") or []
        if not isinstance(codes, list) or len(codes) > 30:
            errors["interests"] = "Invalid selection."
        else:
            codes = [self._clean_text(c) for c in codes]
            interests = self.env["iof.volunteer.interest"].sudo().search([("code", "in", codes)])
            if len(set(codes)) != len(interests):
                errors["interests"] = "Invalid selection."
            else:
                vals["interest_ids"] = [(6, 0, interests.ids)]

        availability = payload.get("availability") or []
        if not isinstance(availability, list) or any(a not in AVAILABILITY for a in availability):
            errors["availability"] = "Invalid selection."
        else:
            for key, fname in AVAILABILITY.items():
                vals[fname] = key in availability

        if payload.get("consent") is not True:
            errors["consent"] = "You must accept the declaration to register."
        else:
            vals["consent_given"] = True
            vals["consent_date"] = fields.Datetime.now()

        return vals, errors

    @api.model
    def create_from_website(self, payload, idempotency_key=None):
        """Create a registration from the public website. Never raises on bad input.

        Returns {'ok', 'reference', 'replayed'} or {'ok': False, 'errors': {...}}.
        """
        registrations = self.sudo()
        if idempotency_key:
            existing = registrations.search([("idempotency_key", "=", idempotency_key)], limit=1)
            if existing:
                return {"ok": True, "reference": existing.name, "replayed": True}
        vals, errors = registrations._clean_payload(payload)
        if errors:
            return {"ok": False, "errors": errors}
        vals.update(source="website", state="new", idempotency_key=idempotency_key or False)
        record = registrations.create(vals)
        return {"ok": True, "reference": record.name, "replayed": False}

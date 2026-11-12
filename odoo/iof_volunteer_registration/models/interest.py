from odoo import fields, models


class IofVolunteerInterest(models.Model):
    _name = "iof.volunteer.interest"
    _description = "IOF Volunteer Interest"
    _order = "sequence, id"

    name = fields.Char(string="Interest", required=True, translate=True)
    code = fields.Char(string="Code", required=True, index=True)
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)

    _code_uniq = models.Constraint("unique(code)", "Interest code must be unique.")

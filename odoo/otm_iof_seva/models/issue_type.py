# -*- coding: utf-8 -*-
from odoo import fields, models

PRIORITIES = [("low", "Low"), ("medium", "Medium"), ("high", "High"), ("critical", "Critical")]


class OtmIofIssueType(models.Model):
    _name = "otm.iof.issue.type"
    _description = "IOF Issue Type"
    _order = "category, name"

    name = fields.Char(required=True)
    category = fields.Char()
    description = fields.Text()
    default_priority = fields.Selection(PRIORITIES, default="medium", required=True)
    active = fields.Boolean(default=True)

    _name_uniq = models.Constraint("unique(name)", "Issue type name must be unique.")

# -*- coding: utf-8 -*-
from odoo.tests import TransactionCase, tagged


@tagged("post_install", "-at_install", "iof_support_case_bridge")
class TestBridge(TransactionCase):
    def test_website_ticket_creates_case(self):
        res = self.env["iof.support.ticket"].create_from_website({
            "requester_name": "Bridge Tester", "email": "b@example.com", "mobile": "+966551112233", "city": "Jeddah",
            "category": "labour", "urgency": "high", "subject": "Unpaid wages", "description": "Salary unpaid for 3 months.",
            "consent": True}, "bridge-key-0001-abcdefgh")
        self.assertTrue(res["ok"], res)
        t = self.env["iof.support.ticket"].search([("name", "=", res["reference"])])
        self.assertTrue(t.case_id)
        self.assertEqual(t.case_id.source, "website")
        self.assertEqual(t.case_id.assignment_state, "awaiting_assignment")
        self.assertEqual(t.case_id.priority, "high")
        self.assertEqual(t.case_id.issue_type_id.name, "Work contract issue")

    def test_manual_ticket_has_no_case(self):
        t = self.env["iof.support.ticket"].create({"requester_name": "M", "email": "m@example.com", "mobile": "+966551112233",
                                                    "subject": "x", "description": "y"})
        self.assertFalse(t.case_id)

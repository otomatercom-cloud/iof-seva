# -*- coding: utf-8 -*-
from odoo.exceptions import AccessError, UserError
from odoo.tests import TransactionCase, tagged


@tagged("post_install", "-at_install", "otm_iof_volunteer_portal")
class TestVolunteerPortal(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.api = cls.env["otm.iof.api"]
        nc = cls.env.ref("otm_iof_seva.committee_iof_nc")

        def user(login, grp):
            return cls.env["res.users"].create({"name": login, "login": login, "email": login + "@t.test", "iof_committee_id": nc.id,
                                                "group_ids": [(6, 0, [cls.env.ref("base.group_user").id, cls.env.ref("otm_iof_seva." + grp).id])]})
        cls.pres, cls.coord = user("v_pres", "group_iof_president"), user("v_coord", "group_iof_coordinator")
        res = cls.env["iof.volunteer.registration"].create_from_website({
            "first_name": "Vol", "last_name": "Unteer", "mobile": "+966551234567", "email": "vol@example.com",
            "consent_given": True}, "vol-portal-key-000001")
        cls.vol = cls.env["iof.volunteer.registration"].search([("name", "=", res["reference"])]) if res.get("ok") else \
            cls.env["iof.volunteer.registration"].create({"first_name": "Vol", "last_name": "Unteer", "mobile": "+966551234567", "email": "vol@example.com", "consent_given": True})

    def test_list_get_and_permissions(self):
        d = self.api.with_user(self.pres).volunteer_list({"q": "unteer"})
        self.assertTrue(any(r["id"] == str(self.vol.id) for r in d["rows"]))
        self.assertEqual(self.api.with_user(self.pres).volunteer_get(self.vol.id)["first_name"], "Vol")
        with self.assertRaises(UserError):
            self.api.with_user(self.coord).volunteer_list({})  # AccessError is a UserError

    def test_state_edit_and_role(self):
        p = self.api.with_user(self.pres)
        self.assertEqual(p.volunteer_set_state(self.vol.id, "approve")["state"], "approved")
        p.volunteer_update(self.vol.id, {"occupation": "Engineer", "state": "rejected"})  # state is not editable
        self.assertEqual((self.vol.occupation, self.vol.state), ("Engineer", "approved"))
        with self.assertRaises(UserError):
            p.volunteer_update(self.vol.id, {"email": "bad"})
        with self.assertRaises(UserError):
            p.volunteer_assign_role(self.vol.id, "coordinator", "IOF-NC")  # needs a password
        row = p.volunteer_assign_role(self.vol.id, "coordinator", "IOF-NC", "Temp@12345")
        self.assertEqual(row["portalUser"], "vol@example.com")
        self.assertTrue(self.vol.portal_user_id.has_group("otm_iof_seva.group_iof_coordinator"))
        with self.assertRaises(UserError):
            self.api.with_user(self.coord).volunteer_assign_role(self.vol.id, "president", "IOF-NC", "x")

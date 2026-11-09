# -*- coding: utf-8 -*-
from odoo.exceptions import AccessError, UserError
from odoo.tests import TransactionCase, tagged

G = "otm_iof_seva."


@tagged("post_install", "-at_install", "otm_iof_seva")
class TestIofSeva(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        C = cls.env["otm.iof.committee"]
        cls.nc, cls.dam, cls.riy = (C.search([("code", "=", c)], limit=1) for c in ("IOF-NC", "IOF-EP-Dammam", "IOF-CP-Riyad"))
        cls.it = cls.env["otm.iof.issue.type"].search([], limit=1)

        def user(login, role, committee):
            return cls.env["res.users"].with_context(no_reset_password=True).create({
                "name": login, "login": login, "password": "pw-Test-12345", "iof_committee_id": committee.id,
                "group_ids": [(4, cls.env.ref(G + "group_iof_" + role).id)]})
        cls.pres, cls.sec = user("t_pres", "president", cls.nc), user("t_sec", "secretary", cls.nc)
        cls.head_ep, cls.head_cp = user("t_head_ep", "head", cls.dam), user("t_head_cp", "head", cls.riy)
        cls.coord, cls.hand = user("t_coord", "coordinator", cls.dam), user("t_hand", "handler", cls.dam)

    def _case(self, user, submit=True, **kw):
        vals = {"name": "T", "summary": "s", "details": "d", "contact_details": "+966", "issue_type_id": self.it.id,
                "handling_committee_id": self.dam.id, "reported_from_id": self.dam.id, "victim_name": "V"}
        vals.update(kw)
        case = self.env["otm.iof.case"].with_user(user).create(vals)
        if submit:
            case.action_submit()
        return case

    def test_case_number_is_global_sl_with_prefix_and_frozen(self):
        a, b = self._case(self.hand), self._case(self.hand)
        self.assertEqual(b.sl, a.sl + 1)
        self.assertTrue(a.case_no.startswith(self.dam._get_prefix() + "-"))
        old = a.case_no
        self.dam.case_prefix = "DAM"
        self.assertEqual(a.case_no, old)
        self.assertTrue(self._case(self.hand).case_no.startswith("DAM-"))

    def test_handler_can_register_but_not_edit_system_fields(self):
        c = self._case(self.hand)
        with self.assertRaises(UserError):
            c.with_user(self.hand).write({"case_no": "X-1"})

    def test_region_visibility(self):
        c = self._case(self.hand)
        self.assertIn(c, self.env["otm.iof.case"].with_user(self.head_ep).search([]))
        self.assertIn(c, self.env["otm.iof.case"].with_user(self.sec).search([]))
        self.assertNotIn(c, self.env["otm.iof.case"].with_user(self.head_cp).search([]))

    def test_draft_visible_only_to_creator(self):
        d = self._case(self.hand, submit=False)
        self.assertNotIn(d, self.env["otm.iof.case"].with_user(self.coord).search([]))
        self.assertIn(d, self.env["otm.iof.case"].with_user(self.hand).search([]))
        self.assertNotIn(d, self.env["otm.iof.case"].with_user(self.pres).search([]))  # drafts are private to the creator

    def test_status_matrix(self):
        c = self._case(self.hand)
        c.with_user(self.head_ep)._do_assign(self.hand)
        with self.assertRaises(UserError):
            c.with_user(self.hand).write({"status": "closed_finance"})
        with self.assertRaises(UserError):
            c.with_user(self.hand).write({"status": "completed"})  # resolution note mandatory
        c.with_user(self.hand).write({"status": "inprogress_iof"})
        c.with_user(self.hand).write({"status": "completed", "resolution_note": "done"})
        self.assertTrue(c.resolved_on)

    def test_closed_case_locked_and_only_president_reopens(self):
        c = self._case(self.hand)
        c.with_user(self.head_ep)._do_assign(self.hand)
        c.with_user(self.hand).write({"status": "inprogress_iof"})
        c.with_user(self.hand).write({"status": "completed", "resolution_note": "ok"})
        c.with_user(self.head_ep).write({"status": "closed_finance"})
        with self.assertRaises(UserError):
            c.with_user(self.head_ep).write({"summary": "edit"})
        with self.assertRaises(UserError):
            c.with_user(self.head_ep).write({"status": "inprogress_iof"})
        c.with_user(self.pres).write({"status": "inprogress_iof"})

    def test_timeline_is_immutable(self):
        c = self._case(self.hand)
        ev = c.event_ids[:1]
        with self.assertRaises(UserError):
            ev.with_user(self.hand).write({"text": "tamper"})
        with self.assertRaises(UserError):
            ev.with_user(self.hand).unlink()

    def test_handler_cannot_see_internal_events(self):
        c = self._case(self.hand)
        c.with_user(self.head_ep)._do_assign(self.hand)
        self.env["otm.iof.case.event"].with_user(self.coord).create({"case_id": c.id, "event_type": "remark", "text": "secret", "is_internal": True})
        seen = self.env["otm.iof.case.event"].with_user(self.hand).search([("case_id", "=", c.id)]).mapped("text")
        self.assertNotIn("secret", seen)

    def test_api_blocks_admin_actions_for_non_president(self):
        api = self.env["otm.iof.api"].with_user(self.hand)
        with self.assertRaises(AccessError):
            api.upsert_user({"name": "x", "email": "x@x.x", "role": "handler", "provinceCode": "IOF-NC", "password": "pw"})
        with self.assertRaises(AccessError):
            self.env["otm.iof.api"].with_user(self.head_ep).toggle_issue_type(self.it.id)
        with self.assertRaises(UserError):
            self.env["otm.iof.site.content"].with_user(self.sec).save_content({"x": 1})

    def test_api_list_and_stats_are_scoped(self):
        self._case(self.hand)
        c = self._case(self.hand, victim_name="UniqueScopeTest")
        q = {"q": "UniqueScopeTest", "size": 5}
        self.assertEqual(self.env["otm.iof.api"].with_user(self.head_ep).list_cases(q)["total"], 1)
        self.assertEqual(self.env["otm.iof.api"].with_user(self.head_cp).list_cases(q)["total"], 0)
        self.assertEqual(self.env["otm.iof.api"].with_user(self.sec).list_cases(q)["total"], 1)
        self.assertEqual(self.env["otm.iof.api"].with_user(self.sec).get_case(c.id)["caseNo"], c.case_no)
        with self.assertRaises(UserError):
            self.env["otm.iof.api"].with_user(self.head_cp).get_case(c.id)

    def test_transfer_keeps_original_reporter(self):
        c = self._case(self.hand)
        self.env["otm.iof.transfer"].with_user(self.head_ep)._submit(c.with_user(self.head_ep), self.riy, "closer to victim")
        c.invalidate_recordset()
        self.assertEqual(c.handling_committee_id, self.riy)
        self.assertEqual(c.reported_from_id, self.dam)

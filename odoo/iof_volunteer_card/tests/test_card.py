import base64
import io

from PIL import Image

from odoo.exceptions import UserError
from odoo.tests import TransactionCase, tagged

VALID = {
    "first_name": "Asha", "last_name": "Nair", "gender": "female",
    "date_of_birth": "1992-04-12", "nationality": "India",
    "saudi_city": "riyadh", "mobile": "+966 50 123 4567",
    "email": "asha.card@example.com", "interests": ["blood_donation"],
    "availability": ["weekends"], "consent": True,
}


def _jpeg(size=(60, 80)):
    buf = io.BytesIO()
    Image.new("RGB", size, (30, 90, 160)).save(buf, "JPEG")
    return base64.b64encode(buf.getvalue()).decode()


@tagged("post_install", "-at_install")
class TestVolunteerCard(TransactionCase):

    def _make(self, **extra):
        res = self.env["iof.volunteer.registration"].create_from_website({**VALID, **extra})
        self.assertTrue(res["ok"], res)
        return self.env["iof.volunteer.registration"].search([("name", "=", res["reference"])])

    def test_approve_issues_card(self):
        rec = self._make(photo=_jpeg())
        self.assertTrue(rec.photo)
        rec.action_approve()
        self.assertEqual(rec.state, "approved")
        m = rec.member_id
        self.assertTrue(m and m.card_token and m.status == "active")
        self.assertEqual(m.partner_id.email, "asha.card@example.com")
        self.assertTrue(m.photo)
        self.assertEqual(m.iqama_number, False)
        self.assertEqual(rec.card_status, "active")

    def test_idempotent(self):
        rec = self._make()
        rec.action_approve()
        first = rec.member_id
        rec.action_issue_card()
        self.assertEqual(rec.member_id, first)
        self.assertEqual(self.env["association.member"].search_count([("id", "=", first.id)]), 1)

    def test_reject_has_no_card(self):
        rec = self._make()
        rec.action_reject()
        self.assertFalse(rec.member_id)
        with self.assertRaises(UserError):
            rec.action_issue_card()

    def test_bad_photo_rejected(self):
        res = self.env["iof.volunteer.registration"].create_from_website(
            {**VALID, "photo": base64.b64encode(b"<script>alert(1)</script>").decode()})
        self.assertFalse(res["ok"])
        self.assertIn("photo", res["errors"])
        res = self.env["iof.volunteer.registration"].create_from_website({**VALID, "photo": "!!notbase64"})
        self.assertIn("photo", res["errors"])

    def test_pdf_renders(self):
        rec = self._make(photo=_jpeg())
        rec.action_approve()
        report = self.env.ref("association_membership.action_report_membership_card")
        html = report._render_qweb_html(report.report_name, rec.member_id.ids)[0]
        self.assertIn(rec.member_id.member_number.encode(), html)

    def test_manager_can_read_card_attachment(self):
        mgr = self.env.ref("iof_volunteer_registration.group_iof_volunteer_manager")
        self.assertIn(self.env.ref("association_membership.group_membership_staff"), mgr.implied_ids)
        user = self.env["res.users"].create({"name": "VM", "login": "vol_mgr_t", "group_ids": [(6, 0, [mgr.id])]})
        rec = self._make()
        rec.action_approve()
        att = self.env["ir.attachment"].create({
            "name": "c.pdf", "res_model": "association.member", "res_id": rec.member_id.id,
            "raw": b"%PDF-1.4", "mimetype": "application/pdf"})
        self.assertTrue(att.with_user(user).read(["name"]))

    def test_nationality_exact_match_and_card_assets(self):
        rec = self._make(photo=_jpeg())
        rec.action_approve()
        self.assertEqual(rec.member_id.nationality_id, self.env.ref("base.in"))
        self.assertTrue(rec.member_id._iof_card_qr_uri().startswith("data:image/png;base64,"))
        report = self.env.ref("association_membership.action_report_membership_card")
        html = report._render_qweb_html(report.report_name, rec.member_id.ids)[0].decode()
        self.assertIn("Volunteer Identity Card", html)
        self.assertIn("data:image/png;base64", html)

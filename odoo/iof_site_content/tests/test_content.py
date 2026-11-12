import base64
import io
import json

from PIL import Image

from odoo.exceptions import AccessError, UserError, ValidationError
from odoo.tests import HttpCase, TransactionCase, tagged


def _png():
    buf = io.BytesIO()
    Image.new("RGB", (20, 20), (200, 80, 10)).save(buf, "PNG")
    return base64.b64encode(buf.getvalue())


@tagged("post_install", "-at_install")
class TestSiteContent(TransactionCase):

    def test_seed_loaded(self):
        Text, Item = self.env["iof.site.text"], self.env["iof.site.item"]
        self.assertGreater(Text.search_count([]), 100)
        t = Text.search([("key", "=", "home.hero.title_main")])
        self.assertEqual(t.value, t.default_value)
        self.assertFalse(t.is_changed)
        self.assertEqual(Item.search_count([("collection", "=", "pillars")]), 4)

    def test_edit_and_reset(self):
        t = self.env["iof.site.text"].search([("key", "=", "site.email")])
        t.value = "hello@example.org"
        self.assertTrue(t.is_changed)
        t.action_reset()
        self.assertEqual(t.value, "info@iofseva.org")
        self.assertFalse(t.is_changed)

    def test_svg_and_fake_images_rejected(self):
        for payload in (b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>", b"not an image"):
            with self.assertRaises(UserError):
                self.env["iof.site.item"].create({
                    "collection": "gallery", "title": "x", "image": base64.b64encode(payload)})

    def test_pdf_only(self):
        with self.assertRaises(ValidationError):
            self.env["iof.site.item"].create({
                "collection": "reports", "title": "r", "file": base64.b64encode(b"MZ-not-pdf")})
        rec = self.env["iof.site.item"].create({
            "collection": "reports", "title": "r", "file": base64.b64encode(b"%PDF-1.4 test")})
        self.assertTrue(rec.file)

    def test_editor_cannot_create_text_keys(self):
        user = self.env["res.users"].create({
            "name": "Editor", "login": "site_editor_t",
            "group_ids": [(6, 0, [self.env.ref("iof_site_content.group_iof_site_editor").id])]})
        Text = self.env["iof.site.text"].with_user(user)
        with self.assertRaises(AccessError):
            Text.create({"key": "x.y", "page": "X", "label": "L"})
        Text.search([("key", "=", "site.name")]).value = "IOF Test"  # editing allowed


@tagged("post_install", "-at_install")
class TestSiteContentHttp(HttpCase):

    def test_api_and_media(self):
        t = self.env["iof.site.text"].search([("key", "=", "home.hero.title_main")])
        t.value = "Edited headline"
        logo = self.env["iof.site.text"].search([("key", "=", "site.logo")])
        logo.image = _png()
        shown = self.env["iof.site.item"].create({"collection": "gallery", "title": "Visible", "image": _png()})
        hidden = self.env["iof.site.item"].create(
            {"collection": "gallery", "title": "Hidden", "image": _png(), "published": False})
        self.env.cr.flush()
        res = self.url_open("/api/iof/site-content")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.content)
        self.assertEqual(data["texts"]["home.hero.title_main"], "Edited headline")
        self.assertIn("site.logo", data["images"])
        titles = [i["title"] for i in data["collections"]["gallery"]]
        self.assertIn("Visible", titles)
        self.assertNotIn("Hidden", titles)
        self.assertEqual(len(data["collections"]["pillars"]), 4)
        # media
        ok = self.url_open(data["images"]["site.logo"])
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.headers["Content-Type"], "image/png")
        self.assertEqual(ok.headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(self.url_open(f"/iof/site-media/item/{hidden.id}/image").status_code, 404)
        self.assertEqual(self.url_open(f"/iof/site-media/item/{shown.id}/secret").status_code, 404)
        self.assertEqual(self.url_open(f"/iof/site-media/res.users/1/image").status_code, 404)


@tagged("post_install", "-at_install")
class TestSiteEvents(HttpCase):

    def test_event_rules_and_api(self):
        Event = self.env["iof.site.event"]
        with self.assertRaises(ValidationError):
            Event.create({"name": "Bad", "event_date": "2026-11-10", "end_date": "2026-11-09"})
        with self.assertRaises(ValidationError):
            Event.create({"name": "Bad img", "event_date": "2026-11-10", "image": base64.b64encode(b"<svg onload=x>")})
        past = Event.create({"name": "Old camp", "event_date": "2020-01-05"})
        multi = Event.create({"name": "Long fest", "event_date": "2020-01-01", "end_date": "2999-01-01"})
        self.assertFalse(past.is_upcoming)
        self.assertTrue(multi.is_upcoming)
        self.assertIn(multi, Event.search([("is_upcoming", "=", True)]))
        self.assertNotIn(multi, Event.search([("is_upcoming", "=", False)]))
        shown = Event.create({"name": "Blood camp", "event_date": "2999-02-02", "time_text": "6 PM",
                              "location": "Riyadh", "details": "Join us", "image": _png()})
        hidden = Event.create({"name": "Secret", "event_date": "2999-03-03", "image": _png(), "published": False})
        self.env.cr.flush()
        data = json.loads(self.url_open("/api/iof/site-content").content)
        titles = [e["title"] for e in data["events"]]
        self.assertIn("Blood camp", titles)
        self.assertNotIn("Secret", titles)
        ev = next(e for e in data["events"] if e["title"] == "Blood camp")
        self.assertEqual((ev["date"], ev["time"], ev["location"]), ("2999-02-02", "6 PM", "Riyadh"))
        self.assertEqual(self.url_open(ev["image"]).status_code, 200)
        self.assertEqual(self.url_open(f"/iof/site-media/event/{hidden.id}/image").status_code, 404)
        self.assertEqual(self.url_open(f"/iof/site-media/event/{shown.id}/secret").status_code, 404)


@tagged("post_install", "-at_install")
class TestSiteEditorApi(HttpCase):
    HDR = {"Content-Type": "application/json", "X-IOF-Editor": "1"}

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        Users = cls.env["res.users"].with_context(no_reset_password=True)
        cls.editor = Users.create({"name": "Site Editor", "login": "site_editor", "password": "ed1t0r-pass!",
                                   "group_ids": [(6, 0, [cls.env.ref("iof_site_content.group_iof_site_editor").id])]})
        cls.plain = Users.create({"name": "Plain", "login": "plain_user", "password": "pl4in-pass!",
                                  "group_ids": [(6, 0, [cls.env.ref("base.group_user").id])]})

    def _post(self, path, payload, headers=None):
        res = self.url_open(path, data=json.dumps(payload), headers=headers or self.HDR)
        return res.status_code, (res.json() if res.headers.get("Content-Type", "").startswith("application/json") else {})

    def test_access_rules(self):
        self.assertEqual(self._post("/api/iof/editor/whoami", {})[0], 401)  # public
        self.authenticate("plain_user", "pl4in-pass!")
        self.assertEqual(self._post("/api/iof/editor/whoami", {})[0], 403)  # not an editor
        self.authenticate("site_editor", "ed1t0r-pass!")
        self.assertEqual(self._post("/api/iof/editor/whoami", {})[1]["name"], "Site Editor")
        # csrf is off, so the custom header + JSON are mandatory
        self.assertEqual(self._post("/api/iof/editor/whoami", {}, {"Content-Type": "application/json"})[0], 400)
        self.assertEqual(self._post("/api/iof/editor/whoami", {}, {"X-IOF-Editor": "1"})[0], 400)

    def test_save_texts_items_layout(self):
        self.authenticate("site_editor", "ed1t0r-pass!")
        Text, Item = self.env["iof.site.text"], self.env["iof.site.item"]
        item = Item.search([("collection", "=", "pillars")], limit=1)
        code, res = self._post("/api/iof/editor/save", {
            "texts": {"home.intro.title": {"value": "[b]Hello[/b] world", "style": {"align": "center", "size": "xl", "color": "navy", "x": 1}},
                      "no.such.key": {"value": "x"}},
            "items": {str(item.id): {"title": "New title", "text": "New text"}},
            "layouts": {"home": {"order": ["home.hero", "home.intro"], "hidden": ["home.impact"],
                                 "sections": {"home.intro": {"bg": "soft", "space": "lg", "evil": "x"}}}},
        })
        self.assertEqual((code, res["ok"], res["saved"], res["unknown"]),
                         (200, True, {"texts": 1, "items": 1, "layouts": 1}, ["no.such.key"]))
        t = Text.search([("key", "=", "home.intro.title")])
        t.invalidate_recordset()
        self.assertEqual(t.value, "[b]Hello[/b] world")
        self.assertEqual(json.loads(t.style), {"align": "center", "size": "xl", "color": "navy"})
        self.assertTrue(t.is_changed)
        self.assertEqual((item.title, item.text), ("New title", "New text"))
        api = json.loads(self.url_open("/api/iof/site-content").content)
        self.assertEqual(api["styles"]["home.intro.title"]["align"], "center")
        self.assertEqual(api["layouts"]["home"]["hidden"], ["home.impact"])
        self.assertEqual(api["layouts"]["home"]["sections"], {"home.intro": {"bg": "soft", "space": "lg"}})
        self.assertIn(item.id, [i["id"] for i in api["collections"]["pillars"]])
        # reset style by saving an empty one
        self._post("/api/iof/editor/save", {"texts": {"home.intro.title": {"style": {}}}})
        t.invalidate_recordset()
        self.assertFalse(t.style)

    def test_bad_input_changes_nothing(self):
        self.authenticate("site_editor", "ed1t0r-pass!")
        Text, Item = self.env["iof.site.text"], self.env["iof.site.item"]
        item = Item.search([("collection", "=", "pillars")], limit=1)
        old_title = item.title
        for bad in ({"layouts": {"home": {"order": ["Bad Id!"]}}},
                    {"layouts": {"../x": {"order": []}}},
                    {"texts": {"home.intro.title": {"value": "ok"}}, "items": {str(item.id): {"title": ""}}},
                    {"texts": {"home.intro.title": {"value": 5}}}):
            code, res = self._post("/api/iof/editor/save", bad)
            self.assertEqual((code, res["ok"]), (422, False), bad)
        self.assertEqual(Text.search([("key", "=", "home.intro.title")]).value,
                         Text.search([("key", "=", "home.intro.title")]).default_value)  # rolled back
        item.invalidate_recordset()
        self.assertEqual(item.title, old_title)

    def test_image_upload(self):
        self.authenticate("site_editor", "ed1t0r-pass!")
        key = self.env["iof.site.text"].search([("kind", "=", "image")], limit=1).key
        self.assertEqual(self._post("/api/iof/editor/image", {"key": key, "data": _png().decode()})[0], 200)
        self.assertEqual(self._post("/api/iof/editor/image", {"key": key, "data": base64.b64encode(b"<svg onload=x>").decode()})[0], 422)
        self.assertEqual(self._post("/api/iof/editor/image", {"key": "home.intro.title", "data": _png().decode()})[0], 422)
        self.assertEqual(self._post("/api/iof/editor/image", {"key": key, "data": "***not base64***"})[0], 422)
        api = json.loads(self.url_open("/api/iof/site-content").content)
        self.assertIn(key, api["images"])

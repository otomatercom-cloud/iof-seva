import base64
import json
import logging

from odoo import _
from odoo import http
from odoo.exceptions import AccessError, UserError, ValidationError
from odoo.http import request

from ..models._style import PAGE_RE, clean_layout, clean_style

_logger = logging.getLogger(__name__)
GROUP = "iof_site_content.group_iof_site_editor"
MAX_BODY = 600 * 1024
MAX_IMAGE_B64 = 11 * 1024 * 1024


def _reply(payload, status=200):
    return http.Response(json.dumps(payload), status=status, content_type="application/json",
                         headers=[("Cache-Control", "no-store"), ("X-Content-Type-Options", "nosniff")])


def _guard():
    """None when the caller is a signed-in website editor, else the error response.

    csrf is off for these routes, so a cross-site form post must not be able to use the editor's
    Odoo cookie: require JSON + a custom header (browsers cannot send it cross-site without CORS)."""
    req = request.httprequest
    if req.headers.get("X-IOF-Editor") != "1" or not (req.content_type or "").startswith("application/json"):
        return _reply({"ok": False, "error": "bad_request"}, 400)
    user = request.env.user
    if user._is_public():
        return _reply({"ok": False, "error": "not_signed_in"}, 401)
    if not user.has_group(GROUP):
        return _reply({"ok": False, "error": "forbidden"}, 403)
    return None


def _body():
    raw = request.httprequest.get_data(cache=False)
    if len(raw) > MAX_BODY:
        raise UserError(_("Too much data in one save."))
    try:
        data = json.loads(raw or b"{}")
    except ValueError as err:
        raise UserError(_("Invalid JSON.")) from err
    if not isinstance(data, dict):
        raise UserError(_("Invalid request."))
    return data


class IofSiteEditor(http.Controller):

    @http.route("/api/iof/editor/whoami", type="http", auth="public", methods=["POST"], csrf=False,
                save_session=False)
    def whoami(self, **kw):
        err = _guard()
        return err or _reply({"ok": True, "name": request.env.user.name})

    @http.route("/api/iof/editor/save", type="http", auth="public", methods=["POST"], csrf=False,
                save_session=False)
    def save(self, **kw):
        err = _guard()
        if err:
            return err
        env = request.env  # the signed-in user: record rules and ACLs apply
        try:
            data = _body()
            saved = {"texts": 0, "items": 0, "layouts": 0}
            unknown = []
            Text, Item, Layout = env["iof.site.text"], env["iof.site.item"], env["iof.site.layout"]
            for key, change in (data.get("texts") or {}).items():
                rec = Text.search([("key", "=", str(key)[:120])], limit=1)
                if not rec or rec.kind == "image" or not isinstance(change, dict):
                    unknown.append(str(key)[:120])
                    continue
                vals = {}
                if "value" in change:
                    if not isinstance(change["value"], str):
                        raise UserError(_("Invalid text."))
                    vals["value"] = change["value"].replace("\r", "").strip()
                if "style" in change:
                    vals["style"] = clean_style(change["style"]) or False
                if vals:
                    rec.write(vals)
                    saved["texts"] += 1
            for item_id, change in (data.get("items") or {}).items():
                rec = Item.browse(int(item_id)).exists() if str(item_id).isdigit() else Item
                if not rec or not isinstance(change, dict):
                    unknown.append(f"item {item_id}")
                    continue
                vals = {}
                for field in ("title", "text"):
                    if field in change:
                        if not isinstance(change[field], str):
                            raise UserError(_("Invalid text."))
                        vals[field] = change[field].replace("\r", "").strip()
                if "title" in vals and not vals["title"]:
                    raise UserError(_("A card title cannot be empty."))
                if vals:
                    rec.write(vals)
                    saved["items"] += 1
            for page, layout in (data.get("layouts") or {}).items():
                if not PAGE_RE.match(str(page)):
                    raise UserError(_("Invalid page."))
                clean = clean_layout(layout)
                rec = Layout.search([("page", "=", page)], limit=1)
                payload = json.dumps(clean, separators=(",", ":"))
                rec.write({"data": payload}) if rec else Layout.create({"page": page, "data": payload})
                saved["layouts"] += 1
            return _reply({"ok": True, "saved": saved, "unknown": unknown})
        except (UserError, ValidationError, AccessError, ValueError) as err:
            env.cr.rollback()
            return _reply({"ok": False, "error": "invalid", "message": str(err)[:300]}, 422)
        except Exception:
            env.cr.rollback()
            _logger.exception("site editor save failed")
            return _reply({"ok": False, "error": "server_error"}, 500)

    @http.route("/api/iof/editor/image", type="http", auth="public", methods=["POST"], csrf=False,
                save_session=False)
    def image(self, **kw):
        err = _guard()
        if err:
            return err
        env = request.env
        try:
            data = _body()
            rec = env["iof.site.text"].search([("key", "=", str(data.get("key", ""))[:120]),
                                               ("kind", "=", "image")], limit=1)
            b64 = data.get("data")
            if not rec or not isinstance(b64, str) or len(b64) > MAX_IMAGE_B64:
                raise UserError(_("Invalid image request."))
            base64.b64decode(b64, validate=True)  # reject anything that is not base64
            rec.write({"image": b64})
            return _reply({"ok": True})
        except (UserError, ValidationError, AccessError, ValueError) as err:
            env.cr.rollback()
            return _reply({"ok": False, "error": "invalid", "message": str(err)[:300]}, 422)
        except Exception:
            env.cr.rollback()
            _logger.exception("site editor image failed")
            return _reply({"ok": False, "error": "server_error"}, 500)

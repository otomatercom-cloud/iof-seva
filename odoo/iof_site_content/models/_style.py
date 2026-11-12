"""Allowlists for the visual (front-end) editor. Keep in sync with web/src/lib/editor-style.ts."""
import json
import re

ALIGN = ("left", "center", "right", "justify")
SIZE = ("sm", "md", "lg", "xl")
COLOR = ("navy", "orange", "green", "slate", "white")
SECTION_BG = ("none", "white", "soft", "warm")
SECTION_SPACE = ("none", "md", "lg")
SECTION_ID_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{0,59}$")
PAGE_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$|^home$")
MAX_SECTIONS = 40


def clean_style(raw):
    """Text style -> compact JSON string. Unknown keys/values are dropped; 'md' size = default."""
    if isinstance(raw, str):
        try:
            raw = json.loads(raw or "{}")
        except ValueError:
            raw = {}
    out = {}
    if isinstance(raw, dict):
        if raw.get("align") in ALIGN:
            out["align"] = raw["align"]
        if raw.get("size") in SIZE and raw["size"] != "md":
            out["size"] = raw["size"]
        if raw.get("color") in COLOR:
            out["color"] = raw["color"]
    return json.dumps(out, sort_keys=True, separators=(",", ":")) if out else ""


def clean_layout(raw):
    """Page layout -> dict {order:[id], hidden:[id], sections:{id:{bg,space}}} or raises ValueError."""
    if not isinstance(raw, dict):
        raise ValueError("layout must be an object")
    def ids(value):
        if not isinstance(value, list) or len(value) > MAX_SECTIONS:
            raise ValueError("bad section list")
        out = []
        for v in value:
            if not isinstance(v, str) or not SECTION_ID_RE.match(v):
                raise ValueError("bad section id")
            if v not in out:
                out.append(v)
        return out
    order, hidden = ids(raw.get("order", [])), ids(raw.get("hidden", []))
    sections = {}
    for sid, st in (raw.get("sections") or {}).items():
        if not SECTION_ID_RE.match(str(sid)) or not isinstance(st, dict):
            raise ValueError("bad section style")
        item = {}
        if st.get("bg") in SECTION_BG and st["bg"] != "none":
            item["bg"] = st["bg"]
        if st.get("space") in SECTION_SPACE and st["space"] != "none":
            item["space"] = st["space"]
        if item:
            sections[sid] = item
    return {"order": order, "hidden": hidden, "sections": sections}

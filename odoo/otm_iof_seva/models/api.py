# -*- coding: utf-8 -*-
"""JSON API for the Next.js frontend.  Every method is @api.model (safe to call through call_kw with
empty ids) and runs as the *logged-in user*, so all ir.rule / ACL / workflow guards of the module apply.
The Next.js BFF whitelists this model; the browser never talks to Odoo directly."""
import base64

from odoo import api, fields, models
from odoo.exceptions import AccessError, UserError

from .case import EXTERNAL_SOURCES
from .case_event import USER_EVENT_TYPES

G = "otm_iof_seva."
BUCKETS = {
    "new": ["open_new"], "in_progress": ["inprogress_iof"],
    "pending": ["pending_judiciary", "pending_sponsor", "pending_indian_authority", "pending_police", "pending_medical"],
    "resolved": ["completed"], "closed": ["closed_finance"],
}
SORTS = {"caseNo": "sl", "name": "name", "issue": "issue_type_id", "reporting": "reported_from_id", "responsible": "handling_committee_id",
         "coordinator": "handled_by_id", "registered": "registration_date", "priority": "priority", "status": "status",
         "updated": "write_date", "victim": "victim_name", "assignment": "assignment_state", "ksa": "area_ksa", "state": "state_india"}
ROLE_ORDER = [("group_iof_president", "president"), ("group_iof_secretary", "secretary"), ("group_iof_head", "province_head"),
              ("group_iof_coordinator", "coordinator"), ("group_iof_handler", "handler")]
ROLE_TO_GROUP = {v: k for k, v in ROLE_ORDER}
EXT_BY_LABEL = {label: key for key, label in EXTERNAL_SOURCES}
EXT_BY_KEY = dict(EXTERNAL_SOURCES)
EVENT_TO_TS = {"submitted": "created", "escalation": "update"}
CASE_TEXT_FIELDS = {
    "name": "name", "summary": "summary", "details": "details", "contactDetails": "contact_details",
    "reportingPerson": "reporting_person", "registeredOn": "registration_date", "priority": "priority",
    "regionKSA": "area_ksa", "country": "country", "stateIndia": "state_india", "districtIndia": "district_india",
    "village": "village", "fullAddress": "full_address", "localIdPassport": "local_id_passport", "victimName": "victim_name",
    "victimContact": "victim_contact", "alternateContact": "alternate_contact", "dependents": "dependents",
    "referenceBy": "reference_by", "referenceDetails": "reference_details", "sponsorName": "sponsor_name",
    "sponsorMobile": "sponsor_mobile", "sponsorDetails": "sponsor_details", "iofInvolvement": "iof_involvement",
    "othersInvolvement": "others_involvement", "financialExpenses": "financial_expenses", "sevaSupport": "seva_support",
    "remarks": "remarks",
}


def _iso(dt):
    return fields.Datetime.to_string(dt).replace(" ", "T") + "Z" if dt else ""


class OtmIofApi(models.AbstractModel):
    _name = "otm.iof.api"
    _description = "IOF Seva JSON API"

    # ------------------------------------------------------------------ helpers
    def _role_of(self, user):
        for xml, role in ROLE_ORDER:
            if user.has_group(G + xml):
                return role
        return None

    def _need_president(self):
        if not self.env.user.has_group(G + "group_iof_president"):
            raise AccessError(self.env._("Only the President can do this."))

    def _case(self, case_id):
        case = self.env["otm.iof.case"].browse(int(case_id)).exists()
        if not case:
            raise UserError(self.env._("Case not found or not accessible."))
        return case

    def _committee(self, code):
        c = self.env["otm.iof.committee"].search([("code", "=", code)], limit=1)
        if not c:
            raise UserError(self.env._("Unknown committee %s.", code))
        return c

    def _user_dict(self, u, full):
        role = self._role_of(u)
        return {
            "id": str(u.id), "name": u.name, "email": u.login if full else "", "phone": (u.phone or u.partner_id.phone or "") if full else "",
            "role": role, "provinceCode": u.iof_committee_id.code or "", "active": u.active,
            "title": "%s · %s" % (role.replace("_", " ").title(), (u.iof_committee_id.code or "").replace("IOF-", "")),
        }

    def _case_dict(self, c, full=True):
        ext = EXT_BY_KEY.get(c.reported_external)
        d = self._case_base(c, ext)
        if full:
            events = c.event_ids.sorted(key=lambda e: (e.date or fields.Datetime.now(), e.id))
            d.update(self._case_children(c, events))
        return d

    def _case_base(self, c, ext):
        return {
            "id": str(c.id), "sl": c.sl or 0, "caseNo": c.case_no or "", "name": c.name or "", "summary": c.summary or "",
            "details": c.details or "", "contactDetails": c.contact_details or "", "reportingPerson": c.reporting_person or "",
            "reportingCoordinatorId": str(c.reporting_coordinator_id.id) if c.reporting_coordinator_id else None,
            "reportedFrom": c.reported_from_id.code or ext or "", "handlingCommittee": c.handling_committee_id.code,
            "handledById": str(c.handled_by_id.id) if c.handled_by_id else None,
            "registeredOn": fields.Date.to_string(c.registration_date) or "", "issueTypeId": str(c.issue_type_id.id),
            "priority": c.priority, "regionKSA": c.area_ksa or "", "country": c.country or "", "stateIndia": c.state_india or "",
            "districtIndia": c.district_india or "", "village": c.village or "", "fullAddress": c.full_address or "",
            "localIdPassport": c.local_id_passport or "", "victimName": c.victim_name or "", "victimContact": c.victim_contact or "",
            "alternateContact": c.alternate_contact or "", "dependents": c.dependents or "", "referenceBy": c.reference_by or "",
            "referenceDetails": c.reference_details or "", "sponsorName": c.sponsor_name or "", "sponsorMobile": c.sponsor_mobile or "",
            "sponsorDetails": c.sponsor_details or "", "iofInvolvement": c.iof_involvement or "",
            "initialStatus": c.initial_status or "open_new", "othersInvolvement": c.others_involvement or "",
            "financialExpenses": c.financial_expenses or "", "sevaSupport": c.seva_support or "", "remarks": c.remarks or "",
            "oldStatus": c.old_status or "", "status": c.status, "assignment": c.assignment_state,
            "originalReportingProvince": c.reported_from_id.code or "IOF-NC", "createdById": str(c.create_uid.id),
            "updatedAt": _iso(c.write_date), "resolvedAt": _iso(c.resolved_on) or None,
            "source": "excel" if c.source == "import" else c.source,
            "canAssign": c.can_assign, "canUpdate": c.can_update, "resolutionNote": c.resolution_note or "",
            "timeline": [], "documents": [], "finance": [], "assignments": [],
        }

    def _case_children(self, c, events):
        return {
            "timeline": [{
                "id": str(e.id), "type": EVENT_TO_TS.get(e.event_type, e.event_type), "at": _iso(e.date), "actorId": str(e.author_id.id),
                "text": e.text, "internal": e.is_internal} for e in events],
            "documents": [{
                "id": str(d.id), "name": d.name, "kind": d.kind, "sizeKb": 0, "mime": "application/octet-stream",
                "uploadedBy": str(d.create_uid.id), "at": _iso(d.create_date)} for d in c.document_ids],
            "finance": [{
                "id": str(f.id), "date": fields.Date.to_string(f.date), "description": f.description, "amountSAR": f.amount_sar,
                "paidBy": {"iof": "IOF", "sponsor": "Sponsor", "other_org": "Other organisation", "relatives": "Relatives"}[f.paid_by]}
                for f in c.finance_ids],
            "assignments": [{
                "id": str(a.id), "caseId": str(c.id), "at": _iso(a.date), "byId": str(a.by_id.id), "toId": str(a.to_id.id) if a.to_id else None,
                "province": a.committee_id.code or "", "note": a.note or ""} for a in c.assignment_ids.sorted("id")],
        }

    def _transfer_dict(self, t):
        return {"id": str(t.id), "caseId": str(t.case_id.id), "fromProvince": t.from_committee_id.code, "toProvince": t.to_committee_id.code,
                "reason": t.reason or "", "requestedBy": str(t.requested_by_id.id), "at": _iso(t.date), "status": t.state,
                "decidedBy": str(t.decided_by_id.id) if t.decided_by_id else None, "decidedAt": _iso(t.decided_date) or None,
                "note": t.decision_note or "", "caseNo": t.case_no, "caseName": t.case_name,
                "originalReporter": t.case_id.reported_from_id.code or ""}

    def _vals_from_ts(self, v):
        vals = {odoo: v[ts] for ts, odoo in CASE_TEXT_FIELDS.items() if ts in v}
        if v.get("issueTypeId"):
            vals["issue_type_id"] = int(v["issueTypeId"])
        if v.get("handlingCommittee"):
            vals["handling_committee_id"] = self._committee(v["handlingCommittee"]).id
        if "reportedFrom" in v:
            rf = v["reportedFrom"]
            comm = self.env["otm.iof.committee"].search([("code", "=", rf)], limit=1)
            vals["reported_from_id"] = comm.id or False
            vals["reported_external"] = False if comm else EXT_BY_LABEL.get((rf or "").strip(), False)
        if v.get("handledById"):
            vals["handled_by_id"] = int(v["handledById"])
        if v.get("reportingCoordinatorId"):
            vals["reporting_coordinator_id"] = int(v["reportingCoordinatorId"])
        return vals

    def _attach_documents(self, case, docs):
        for d in docs or []:
            self._add_doc(case, d)

    def _add_doc(self, case, d):
        if not d.get("data"):
            return
        raw = d["data"].split(",", 1)[-1]
        if len(raw) > 14_000_000:  # ~10 MB
            raise UserError(self.env._("File is too large (max 10 MB)."))
        self.env["otm.iof.case.document"].create({
            "case_id": case.id, "name": d.get("name") or "document", "kind": d.get("kind") or "supporting",
            "file": raw, "filename": d.get("name")})
        case._log("document", self.env._("Document added: %s", d.get("name") or ""))

    # ------------------------------------------------------------------ reads
    @api.model
    def bootstrap(self):
        user = self.env.user
        staff = user.has_group(G + "group_iof_coordinator")
        transfers = self.env["otm.iof.transfer"].search([], order="id desc", limit=300)
        users = self.env["res.users"].sudo().with_context(active_test=False).search([("iof_committee_id", "!=", False)])
        acts = self.env["mail.activity"].search([("res_model", "=", "otm.iof.case"), ("user_id", "=", user.id)], order="id desc", limit=100)
        notes = []
        for a in acts:
            s = a.summary or ""
            kind = ("critical" if s.startswith("Critical") else "pending_assignment" if s.startswith(("Assign", "OVERDUE"))
                    else "transferred" if s.startswith("Transfer") else "assigned")
            notes.append({"id": str(a.id), "kind": kind, "title": s, "body": a.res_name or "", "at": _iso(a.create_date),
                          "read": False, "caseId": str(a.res_id), "forRoles": [], "forUserId": str(user.id)})
        return {
            "me": self._user_dict(user.sudo(), True),
            "provinces": [{"code": c.code, "name": c.name, "region": c.region, "kind": c.kind, "active": c.active,
                           "prefix": c.case_prefix or c.code[:6]}
                          for c in self.env["otm.iof.committee"].with_context(active_test=False).search([])],
            "issueTypes": [{"id": str(i.id), "name": i.name, "category": i.category or "", "description": i.description or "",
                            "active": i.active, "defaultPriority": i.default_priority}
                           for i in self.env["otm.iof.issue.type"].with_context(active_test=False).search([])],
            "users": [self._user_dict(u, staff) for u in users],
            "cases": [],
            "transfers": [self._transfer_dict(t) for t in transfers],
            "notifications": notes,
        }

    # ------------------------------------------------------------------ fast, server-side reads (10,000+ cases)
    @api.model
    def get_case(self, case_id):
        return self._case_dict(self._case(case_id))

    def _list_domain(self, p):
        user = self.env.user
        d = []
        view = p.get("view") or "all"
        if view == "mine":
            d.append(("handled_by_id", "=", user.id))
        elif view == "pending":
            d.append(("status", "in", BUCKETS["pending"]))
        elif view == "resolved":
            d.append(("status", "in", BUCKETS["resolved"] + BUCKETS["closed"]))
        elif view == "queue":
            d.append(("assignment_state", "=", "awaiting_assignment"))
            if self._role_of(user) == "coordinator":
                d.append(("handling_committee_id", "=", user.iof_committee_id.id))
        q = (p.get("q") or "").strip()
        if q:
            paths = ["case_no", "name", "victim_name", "contact_details", "sponsor_name", "state_india", "district_india",
                     "issue_type_id.name", "handled_by_id.name", "reporting_person", "victim_contact"]
            d += ["|"] * (len(paths) - 1) + [(f, "ilike", q) for f in paths]
        if p.get("province"):
            d += ["|", ("handling_committee_id.code", "=", p["province"]), ("reported_from_id.code", "=", p["province"])]
        if p.get("status"):
            d.append(("status", "=", p["status"]))
        if p.get("bucket"):
            d.append(("status", "in", BUCKETS.get(p["bucket"], [])))
        if p.get("open"):
            d.append(("status", "not in", BUCKETS["resolved"] + BUCKETS["closed"]))
        if p.get("issue"):
            d.append(("issue_type_id", "=", int(p["issue"])))
        if p.get("priority"):
            d.append(("priority", "=", p["priority"]))
        if p.get("assignment"):
            d.append(("assignment_state", "=", p["assignment"]))
        if p.get("handler"):
            d.append(("handled_by_id", "=", int(p["handler"])))
        if p.get("from"):
            d.append(("registration_date", ">=", p["from"]))
        if p.get("to"):
            d.append(("registration_date", "<=", p["to"]))
        return d

    @api.model
    def list_cases(self, p=None):
        """One page of cases (light rows).  Filtering, sorting and paging all happen in PostgreSQL."""
        p = p or {}
        Case = self.env["otm.iof.case"]
        size = max(1, min(int(p.get("size") or 25), 200))
        page = max(0, int(p.get("page") or 0))
        field = SORTS.get(p.get("sort") or "updated", "write_date")
        order = "%s %s, id desc" % (field, "asc" if p.get("dir") == "asc" else "desc")
        domain = self._list_domain(p)
        total = Case.search_count(domain)
        rows = Case.search(domain, order=order, limit=size, offset=page * size)
        return {"total": total, "rows": [self._case_dict(c, full=False) for c in rows]}

    @api.model
    def export_cases(self, p=None):
        """All matching cases (light rows) for CSV export, capped at 50,000."""
        Case = self.env["otm.iof.case"]
        rows = Case.search(self._list_domain(p or {}), order="sl asc", limit=50000)
        return [self._case_dict(c, full=False) for c in rows]

    @api.model
    def stats(self, p=None):
        """Every number on the dashboard / reports / province pages, aggregated in PostgreSQL."""
        p = p or {}
        env, user = self.env, self.env.user
        Case = env["otm.iof.case"]
        done = BUCKETS["resolved"] + BUCKETS["closed"]
        rng = []
        if p.get("from"):
            rng.append(("registration_date", ">=", p["from"]))
        if p.get("to"):
            rng.append(("registration_date", "<=", p["to"]))
        base = [("assignment_state", "!=", "draft")] + rng
        open_d = [("status", "not in", done)]

        def grp(domain, by, aggs=("__count",)):
            return Case.formatted_read_group(domain, list(by), list(aggs))

        def code(v):  # many2one tuple -> committee code
            return env["otm.iof.committee"].browse(v[0]).code if v else ""

        by_status = {r["status"]: r["__count"] for r in grp(base, ["status"])}
        crit = Case.search_count(base + open_d + [("priority", "=", "critical")])
        year = int((p.get("from") or fields.Date.today().isoformat())[:4])
        yr = [("registration_date", ">=", "%d-01-01" % year), ("registration_date", "<=", "%d-12-31" % year)]
        reg_m, res_m = {}, {}
        for r in grp([("assignment_state", "!=", "draft")] + yr, ["registration_date:month"]):
            reg_m[int(r["registration_date:month"][0][5:7])] = r["__count"]
        for r in grp([("assignment_state", "!=", "draft"), ("resolved_on", ">=", "%d-01-01" % year), ("resolved_on", "<=", "%d-12-31 23:59:59" % year)],
                     ["resolved_on:month"], ["__count", "days_to_resolve:avg"]):
            res_m[int(r["resolved_on:month"][0][5:7])] = {"n": r["__count"], "avg": round(r["days_to_resolve:avg"] or 0)}
        prov = {code(r["handling_committee_id"]): r["__count"] for r in grp(base, ["handling_committee_id"])}
        issue = {str(r["issue_type_id"][0]): r["__count"] for r in grp(base, ["issue_type_id"])}
        matrix = {}
        cross = 0
        for r in grp(base, ["issue_type_id", "handling_committee_id", "reported_from_id"]):
            hc = code(r["handling_committee_id"])
            matrix.setdefault(str(r["issue_type_id"][0]), {})
            matrix[str(r["issue_type_id"][0])][hc] = matrix[str(r["issue_type_id"][0])].get(hc, 0) + r["__count"]
            if r["reported_from_id"] and r["reported_from_id"][0] != r["handling_committee_id"][0]:
                cross += r["__count"]
        reg = {}
        for key, dom in (("total", base), ("open", base + open_d), ("critical", base + open_d + [("priority", "=", "critical")]),
                         ("awaiting", base + [("assignment_state", "=", "awaiting_assignment")])):
            for r in grp(dom, ["handling_region"]):
                reg.setdefault(r["handling_region"], {})[key] = r["__count"]
        for r in grp(base + [("resolved_on", "!=", False)], ["handling_region"], ["__count", "days_to_resolve:avg"]):
            reg.setdefault(r["handling_region"], {}).update(resolved=r["__count"], avgDays=round(r["days_to_resolve:avg"] or 0))
        per_c, per_h = {}, {}
        for key, dom in (("total", base), ("open", base + open_d), ("critical", base + open_d + [("priority", "=", "critical")]),
                         ("awaiting", base + [("assignment_state", "=", "awaiting_assignment")])):
            for r in grp(dom, ["handling_committee_id"]):
                per_c.setdefault(code(r["handling_committee_id"]), {})[key] = r["__count"]
            for r in grp(dom, ["handled_by_id"]):
                if r["handled_by_id"]:
                    per_h.setdefault(str(r["handled_by_id"][0]), {})[key] = r["__count"]
        spend = sum(r["amount_sar:sum"] or 0 for r in env["otm.iof.case.finance"].formatted_read_group(
            [("paid_by", "=", "iof"), ("case_id.assignment_state", "!=", "draft")] + [("case_id." + a, b, c) for a, b, c in rng],
            [], ["amount_sar:sum"]))

        def light(domain, order, limit):
            return [self._case_dict(c, full=False) for c in Case.search(domain, order=order, limit=limit)]

        waiting_q = base + [("assignment_state", "=", "awaiting_assignment")]
        if self._role_of(user) == "coordinator":
            waiting_q.append(("handling_committee_id", "=", user.iof_committee_id.id))
        stale_day = fields.Date.subtract(fields.Date.today(), days=3)
        queue = {
            "waiting": Case.search_count(waiting_q),
            "crossProvince": sum(r["__count"] for r in grp(waiting_q, ["reported_from_id", "handling_committee_id"])
                                 if r["reported_from_id"] and r["reported_from_id"][0] != r["handling_committee_id"][0]),
            "critical": Case.search_count(waiting_q + [("priority", "=", "critical")]),
            "stale": Case.search_count(waiting_q + [("registration_date", "<=", stale_day)]),
        }
        awaiting_by = {}
        for c_code in [c for c, v in per_c.items() if v.get("awaiting")]:
            awaiting_by[c_code] = light(waiting_q + [("handling_committee_id.code", "=", c_code)], "registration_date asc, id asc", 2)
        events = env["otm.iof.case.event"].search([("is_internal", "=", False)], order="date desc, id desc", limit=7)
        return {
            "byStatus": by_status, "critical": crit, "regMonth": reg_m, "resMonth": res_m, "byProvince": prov, "byIssue": issue,
            "matrix": matrix, "cross": cross, "region": reg, "perCommittee": per_c, "perHandler": per_h, "spendIof": spend,
            "recent": light(base, "registration_date desc, id desc", 6),
            "criticalCases": light(base + open_d + [("priority", "=", "critical")], "id desc", 5),
            "pendingCases": light(waiting_q, "registration_date asc, id asc", 5),
            "mine": light(base + open_d + [("handled_by_id", "=", user.id)], "write_date desc", 6),
            "queue": queue, "awaitingBy": awaiting_by,
            "activity": [{"id": str(e.id), "type": EVENT_TO_TS.get(e.event_type, e.event_type), "at": _iso(e.date), "actorId": str(e.author_id.id),
                          "text": e.text, "internal": False, "caseId": str(e.case_id.id), "caseNo": e.case_id.case_no or ""} for e in events],
        }

    @api.model
    def get_document(self, doc_id):
        d = self.env["otm.iof.case.document"].browse(int(doc_id)).exists()
        if not d:
            raise UserError(self.env._("Document not found."))
        return {"name": d.filename or d.name, "data": (d.file or b"").decode() if d.file else ""}

    # ------------------------------------------------------------------ case writes
    @api.model
    def register_case(self, values, submit=False, documents=None):
        vals = self._vals_from_ts(values or {})
        case = self.env["otm.iof.case"].create(vals)
        self._attach_documents(case, documents)
        if submit:
            case.action_submit()
        return self._case_dict(case)

    @api.model
    def submit_case(self, case_id):
        case = self._case(case_id)
        case.action_submit()
        return self._case_dict(case)

    @api.model
    def update_case(self, case_id, patch):
        case = self._case(case_id)
        vals = {k: v for k, v in self._vals_from_ts(patch or {}).items() if k not in ("handling_committee_id", "handled_by_id", "reported_from_id", "reported_external")}
        case.write(vals)
        return self._case_dict(case)

    @api.model
    def assign(self, case_id, user_id, note=False):
        case = self._case(case_id)
        case._do_assign(self.env["res.users"].sudo().browse(int(user_id)), note)
        return self._case_dict(case)

    @api.model
    def transfer(self, case_id, to_code, reason):
        case = self._case(case_id)
        self.env["otm.iof.transfer"]._submit(case, self._committee(to_code), reason)
        return self._case_dict(case)

    @api.model
    def decide_transfer(self, transfer_id, accept, note=False):
        t = self.env["otm.iof.transfer"].browse(int(transfer_id)).exists()
        if not t:
            raise UserError(self.env._("Transfer not found."))
        t.action_accept() if accept else t.action_reject(note)
        return True

    @api.model
    def change_status(self, case_id, status, note=False):
        case = self._case(case_id)
        vals = {"status": status}
        if status == "completed":
            vals["resolution_note"] = note
        case.write(vals)
        if note and status != "completed":
            case._log("update", note)
        return self._case_dict(case)

    @api.model
    def add_timeline(self, case_id, etype, text, internal=False):
        case = self._case(case_id)
        if etype not in USER_EVENT_TYPES:
            etype = "update"
        self.env["otm.iof.case.event"].create({"case_id": case.id, "event_type": etype, "text": text, "is_internal": bool(internal)})
        return True

    @api.model
    def add_finance(self, case_id, entry):
        case = self._case(case_id)
        paid = {"IOF": "iof", "Sponsor": "sponsor", "Other organisation": "other_org", "Relatives": "relatives"}.get(entry.get("paidBy"), "iof")
        self.env["otm.iof.case.finance"].create({"case_id": case.id, "date": entry.get("date") or fields.Date.today(),
                                                  "description": entry.get("description"), "amount_sar": float(entry.get("amountSAR") or 0), "paid_by": paid})
        case._log("update", self.env._("Financial entry added: %s", entry.get("description") or ""))
        return True

    @api.model
    def add_document(self, case_id, doc):
        self._add_doc(self._case(case_id), doc)
        return True

    # ------------------------------------------------------------------ administration
    @api.model
    def upsert_issue_type(self, it):
        self._need_president()
        vals = {"name": it["name"], "category": it.get("category"), "description": it.get("description"),
                "default_priority": it.get("defaultPriority") or "medium", "active": it.get("active", True)}
        rec = self.env["otm.iof.issue.type"].with_context(active_test=False).browse(int(it["id"])) if it.get("id") else False
        (rec.write(vals) if rec and rec.exists() else self.env["otm.iof.issue.type"].create(vals))
        return True

    @api.model
    def toggle_issue_type(self, it_id):
        self._need_president()
        rec = self.env["otm.iof.issue.type"].with_context(active_test=False).browse(int(it_id))
        rec.active = not rec.active
        return True

    @api.model
    def toggle_committee(self, code):
        if not self.env.user.has_group(G + "group_iof_secretary"):
            raise AccessError(self.env._("Only the Secretary or President can do this."))
        c = self.env["otm.iof.committee"].with_context(active_test=False).search([("code", "=", code)], limit=1)
        c.sudo().active = not c.active
        return True

    @api.model
    def set_prefix(self, code, prefix):
        if not self.env.user.has_group(G + "group_iof_secretary"):
            raise AccessError(self.env._("Only the Secretary or President can set the case-number prefix."))
        if not (prefix or "").strip():
            raise UserError(self.env._("Prefix cannot be empty."))
        self._committee(code).sudo().case_prefix = prefix.strip().upper()
        return True

    @api.model
    def upsert_user(self, u):
        self._need_president()
        role = u.get("role")
        if role not in ROLE_TO_GROUP:
            raise UserError(self.env._("Unknown role."))
        Users = self.env["res.users"].sudo().with_context(no_reset_password=True, active_test=False)
        groups = [self.env.ref(G + g) for g, _r in ROLE_ORDER]
        vals = {"name": u["name"], "login": u["email"], "email": u["email"], "iof_committee_id": self._committee(u["provinceCode"]).id,
                "group_ids": [(3, g.id) for g in groups] + [(4, self.env.ref(G + ROLE_TO_GROUP[role]).id)]}
        if u.get("phone"):
            vals["phone"] = u["phone"]
        if u.get("password"):
            vals["password"] = u["password"]
        if u.get("id"):
            Users.browse(int(u["id"])).write(vals)
        else:
            if not u.get("password"):
                raise UserError(self.env._("Set an initial password for the new user."))
            Users.create(vals)
        return True

    @api.model
    def toggle_user(self, user_id):
        self._need_president()
        user = self.env["res.users"].sudo().with_context(active_test=False).browse(int(user_id))
        if user.id == self.env.uid:
            raise UserError(self.env._("You cannot deactivate your own account."))
        user.active = not user.active
        return True

    @api.model
    def mark_read(self, activity_id=None):
        domain = [("res_model", "=", "otm.iof.case"), ("user_id", "=", self.env.uid)]
        if activity_id:
            domain.append(("id", "=", int(activity_id)))
        self.env["mail.activity"].search(domain).action_feedback()
        return True

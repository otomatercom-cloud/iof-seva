# Demo CASES for UAT (fictional people). Run AFTER odoo-demo-seed.py:  odoo-bin shell -d <db> < odoo-demo-cases.py
# Safe to re-run: skips if cases named "[DEMO]..." exist. Delete them before go-live.
import random
random.seed(7)
if env["otm.iof.case"].sudo().search_count([("name", "=like", "[DEMO]%")]):
    print("demo cases already exist")
else:
    api = env["otm.iof.api"]
    types = env["otm.iof.issue.type"].search([], limit=6)
    comms = env["otm.iof.committee"].search([("kind", "=", "chapter")])
    ppl = ["Ravi Kumar", "Mohammed Ali", "Suresh Nair", "Shaji Thomas", "Abdul Latheef", "Ramesh Yadav", "Joseph Mathew", "Imran Sheikh", "Biju Pillai", "Salim Khan", "Gopal Das", "Nizar Hassan"]
    prio = ["low", "medium", "high", "critical"]
    made = 0
    for i, p in enumerate(ppl):
        c = comms[i % len(comms)]
        api.register_case({
            "name": "[DEMO] " + p, "victimName": p, "summary": "Demo case for UAT (fictional).", "details": "Fictional demo details for UAT.", "contactDetails": "+966500000000", "reportingPerson": "Demo Reporter",
            "issueTypeId": types[i % len(types)].id, "handlingCommittee": c.code, "reportedFrom": c.code,
            "priority": prio[i % 4], "country": "India", "stateIndia": "Kerala", "regionKSA": "Riyadh",
        }, submit=(i % 4 != 3))
        made += 1
    env.cr.commit()
    print("demo cases created:", made)

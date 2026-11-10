# Demo users for testing only.  Run:  odoo-bin shell -d <db> < odoo-demo-seed.py
# All passwords: Demo@12345   (change/delete before go-live)
G = "otm_iof_seva."
C = env["otm.iof.committee"]
DEMO = [
    ("president@iof.demo", "Imtiyaz Hussain", "president", "IOF-NC"),
    ("secretary@iof.demo", "Abdul Rahim", "secretary", "IOF-NC"),
    ("head.ep@iof.demo", "Faisal Khan", "head", "IOF-EP-Dammam"),
    ("coord.dammam@iof.demo", "Anil Kumar", "coordinator", "IOF-EP-Dammam"),
    ("handler.dammam@iof.demo", "Sivaprasath", "handler", "IOF-EP-Dammam"),
    ("head.cp@iof.demo", "Naseer Ahmed", "head", "IOF-CP-Riyad"),
    ("coord.riyadh@iof.demo", "Rashid Ali", "coordinator", "IOF-CP-Riyad"),
]
for login, name, role, code in DEMO:
    if env["res.users"].sudo().search([("login", "=", login)]):
        continue
    env["res.users"].sudo().with_context(no_reset_password=True).create({
        "name": name, "login": login, "email": login, "password": "Demo@12345",
        "iof_committee_id": C.search([("code", "=", code)], limit=1).id,
        "group_ids": [(4, env.ref(G + "group_iof_" + role).id)],
    })
env.cr.commit()
print("demo users ready")

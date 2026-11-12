"""End-to-end: browser-equivalent POST to Next.js -> Odoo -> verify record via Odoo's ORM (XML-RPC as staff)."""
import json, os, sys, urllib.request, urllib.error, xmlrpc.client, glob

NEXT = os.environ["NEXT_URL"]; NEXT_DOWN = os.environ["NEXT_DOWN_URL"]
ODOO = os.environ["ODOO_URL"]; DB = os.environ["ODOO_DB"]; TOKEN = os.environ["ODOO_API_TOKEN"]
fails = []

def check(name, cond, extra=""):
    print(("PASS " if cond else "FAIL ") + name + (f"  {extra}" if not cond else ""))
    if not cond: fails.append(name)

def post(base, payload, key, origin=None):
    req = urllib.request.Request(base + "/api/volunteer-registration", data=json.dumps(payload).encode(), method="POST",
        headers={"Content-Type": "application/json", "Origin": origin or base, "Idempotency-Key": key, "X-Real-IP": "9.9." + key[-3:].replace("-", "1")[:1] + ".1"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r: return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read())

uid = xmlrpc.client.ServerProxy(f"{ODOO}/xmlrpc/2/common").authenticate(DB, "admin", "admin", {})
models = xmlrpc.client.ServerProxy(f"{ODOO}/xmlrpc/2/object", allow_none=True)
def odoo(method, *args, **kw): return models.execute_kw(DB, uid, "admin", "iof.volunteer.registration", method, list(args), kw)

payload = {
    "first_name": "Meera", "last_name": "Krishnan", "gender": "female", "date_of_birth": "1991-03-05",
    "nationality": "Indian", "iqama_number": "2345678901", "saudi_city": "jeddah",
    "mobile": "+966 55 111 2222", "whatsapp": "+966551112222", "email": "Meera.K@Example.com",
    "address": "Al Hamra, Jeddah", "city": "Jeddah", "region": "Makkah", "occupation": "Nurse",
    "organization": "City Hospital", "qualification": "BSc Nursing",
    "interests": ["blood_donation", "medical_support", "other"], "other_interest": "Counselling",
    "special_skills": "First aid", "experience": "Camps 2024", "languages": "Malayalam, English, Hindi",
    "availability": ["weekends", "emergency"], "hours_per_month": "12",
    "emergency_name": "Arun K", "emergency_relationship": "Brother", "emergency_phone": "+91 98765 43210",
    "consent": True, "website": "",
}
key = "e2e-key-aaaaaaaa-0001"
before = odoo("search_count", [])

status, body = post(NEXT, payload, key)
check("valid submission returns 200 + reference", status == 200 and body.get("ok") and body["reference"].startswith("IOF-VOL-"), str(body))
ref = body.get("reference")
check("exactly one Odoo record created", odoo("search_count", []) == before + 1)

rec = odoo("search_read", [["name", "=", ref]], fields=[
    "name", "state", "source", "first_name", "last_name", "email", "mobile", "saudi_city", "date_of_birth",
    "emergency_phone", "avail_weekends", "avail_weekdays", "avail_emergency", "consent_given", "consent_date",
    "interest_ids", "other_interest", "hours_per_month", "idempotency_key", "full_name"])
r = rec[0] if rec else {}
check("record found in Odoo by the reference shown to the visitor", len(rec) == 1)
check("field values match what was submitted", r.get("first_name") == "Meera" and r.get("last_name") == "Krishnan"
      and r.get("email") == "meera.k@example.com" and r.get("mobile") == "+966 55 111 2222"
      and r.get("saudi_city") == "jeddah" and r.get("date_of_birth") == "1991-03-05"
      and r.get("emergency_phone") == "+91 98765 43210" and r.get("hours_per_month") == "12"
      and r.get("other_interest") == "Counselling", str(r))
check("availability checkboxes mapped", r.get("avail_weekends") and r.get("avail_emergency") and not r.get("avail_weekdays"))
check("3 interests linked", len(r.get("interest_ids", [])) == 3)
check("state New, source website, consent stored", r.get("state") == "new" and r.get("source") == "website" and r.get("consent_given") and r.get("consent_date"))

status2, body2 = post(NEXT, payload, key)
check("retry with same key returns same reference", status2 == 200 and body2.get("reference") == ref, str(body2))
check("retry created no duplicate", odoo("search_count", []) == before + 1)

bad = dict(payload, email="nope")
s3, b3 = post(NEXT, bad, "e2e-key-aaaaaaaa-0002")
check("invalid submission rejected (422)", s3 == 422 and "email" in b3.get("fields", {}))
check("invalid submission created no record", odoo("search_count", []) == before + 1)

s4, b4 = post(NEXT, payload, "e2e-key-aaaaaaaa-0003", origin="https://evil.example")
check("cross-origin submission rejected", s4 == 403)

s5, b5 = post(NEXT_DOWN, payload, "e2e-key-aaaaaaaa-0004")
txt = json.dumps(b5)
check("Odoo unreachable -> safe 503, nothing leaked", s5 == 503 and "not saved" in txt and TOKEN not in txt and "127.0.0.1" not in txt, txt)

# Direct Odoo API: unauthorized and unauthenticated callers rejected, token never needed by browser
for label, hdr in (("no token", {}), ("wrong token", {"Authorization": "Bearer wrong"})):
    req = urllib.request.Request(ODOO + "/api/iof/volunteer-registration", data=b"{}", method="POST", headers={"Content-Type": "application/json", **hdr})
    try: urllib.request.urlopen(req); code = 200
    except urllib.error.HTTPError as e: code = e.code
    check(f"Odoo API rejects {label} (401)", code == 401)
check("no records from rejected calls", odoo("search_count", []) == before + 1)

leaked = [f for f in glob.glob(".next/static/**/*", recursive=True) if os.path.isfile(f) and (TOKEN.encode() in open(f, "rb").read() or b"ODOO_API_TOKEN" in open(f, "rb").read())]
check("token / env names absent from client bundles", not leaked, str(leaked))

print(f"\nREFERENCE {ref}")
sys.exit(1 if fails else 0)

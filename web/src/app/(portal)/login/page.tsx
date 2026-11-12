"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { IofLogo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Avatar } from "@/components/ui/card";
import { useHydrated } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/reference-data";
import { USE_ODOO } from "@/lib/config";
import { apiLogin } from "@/lib/odoo-client";

const DEMO_IDS = ["u1", "u16", "u2", "u5", "u9"];
const ROLE_BLURB: Record<string, string> = {
  president: "All provinces · global analytics · user admin",
  secretary: "All provinces · monitoring, assignment & reports",
  province_head: "Eastern Province · assignment queue",
  coordinator: "Dammam · register & follow up cases",
  handler: "My assigned cases · updates & documents",
};

export default function LoginPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const users = useStore((s) => s.users);
  const login = useStore((s) => s.login);
  const current = useStore((s) => s.currentUserId);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { if (hydrated && current) router.replace("/dashboard"); }, [hydrated, current, router]);

  const refresh = useStore((s) => s.refresh);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (USE_ODOO) {
      if (!email.trim() || !pwd) return setErr("Enter your e-mail and password.");
      setBusy(true);
      try { await apiLogin(email.trim(), pwd); if (await refresh()) router.push("/dashboard"); else setErr("Signed in, but your IOF Seva profile could not be loaded. Ask the President to check your role."); }
      catch (x) { setErr(x instanceof Error ? x.message : "Sign-in failed."); }
      setBusy(false); return;
    }
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.active);
    if (!u || !pwd) return setErr("Enter a demo e-mail (e.g. president@iof.demo) and any password, or pick a role below.");
    login(u.id); router.push("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-dark lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,#138a50_0%,transparent_55%),radial-gradient(ellipse_at_90%_100%,#0a6d42_0%,transparent_50%)]" />
        <div className="absolute -right-24 -top-24 size-80 rounded-full border border-white/10" />
        <div className="absolute -right-10 -top-10 size-52 rounded-full border border-saffron/30" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium ring-1 ring-white/20"><ShieldCheck className="size-4 text-saffron" /> Confidential · Authorised IOF personnel only</div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-saffron">Seva · Service beyond borders</p>
            <h1 className="max-w-lg font-display text-[40px] font-extrabold leading-[1.1]">One register for every Seva case across every province.</h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/75">Register, route and resolve cases for Indian expatriates — from Dammam to Jeddah to Riyadh — with clear ownership, cross-province assignment and a full audit trail.</p>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[["10", "IOF committees"], ["9", "case statuses"], ["7", "issue types"]].map(([n, l]) => (
                <div key={l} className="rounded-xl bg-white/8 p-3.5 ring-1 ring-white/15"><dt className="font-display text-2xl font-bold tabular">{n}</dt><dd className="text-xs text-white/70">{l}</dd></div>
              ))}
            </dl>
          </div>
          <p className="text-xs text-white/50">India Overseas Forum · Seva Case Management · Prototype v0.1</p>
        </div>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <IofLogo width={210} className="mb-8" />
          <h2 className="font-display text-2xl font-bold">Sign in to IOF Seva</h2>
          <p className="mt-1 text-sm text-muted">Use your IOF account to manage Seva cases.</p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <Field label="Email" required><Input type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="name@iof.demo" /></Field>
            <Field label="Password" required>
              <div className="relative">
                <Input type={show ? "text" : "password"} autoComplete="current-password" value={pwd} onChange={(e) => { setPwd(e.target.value); setErr(""); }} placeholder="••••••••" className="pr-10" />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
              </div>
            </Field>
            {err && <p className="rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-[#b42318]" role="alert">{err}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}><Lock /> {busy ? "Signing in…" : "Sign in"}</Button>
          </form>

          {!USE_ODOO && <><div className="my-7 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />Prototype · explore as a role<span className="h-px flex-1 bg-line" /></div>
          <div className="grid gap-2.5">
            {DEMO_IDS.map((id) => {
              const u = users.find((x) => x.id === id);
              if (!u) return null;
              return (
                <button key={id} onClick={() => { login(id); router.push("/dashboard"); }} className="group flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white p-3 text-left transition hover:border-brand hover:bg-brand-50/60">
                  <Avatar name={u.name} size={38} />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{ROLE_LABEL[u.role]} <span className="font-normal text-muted">· {u.name}</span></span><span className="block truncate text-xs text-muted">{ROLE_BLURB[u.role]}</span></span>
                  <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
                </button>
              );
            })}
          </div></>}
          {USE_ODOO && <p className="mt-6 text-center text-xs text-muted">Access is enforced by the IOF Seva server according to your role and committee.</p>}
          {!USE_ODOO && <p className="mt-6 text-center text-xs text-muted">Frontend prototype – role visibility shown here is not security enforcement.</p>}
        </div>
      </div>
    </div>
  );
}

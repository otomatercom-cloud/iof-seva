"use client";
import { searchCases } from "@/lib/server-data";
import type { Case } from "@/lib/types";
import { USE_ODOO } from "@/lib/config";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronRight, LogOut, Menu, Plus, Search, Settings, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/card";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { CRUMBS, SPECIAL_CRUMB_HREF } from "@/lib/nav";
import { useCurrentUser, useStore } from "@/lib/store";
import { useMyNotifications, useVisibleCases } from "@/lib/hooks";
import { ROLE_LABEL, provinceName } from "@/lib/reference-data";
import { canRegister } from "@/lib/permissions";
import { NotificationPanel } from "./notification-panel";
import { StatusBadge } from "@/components/common/badges";

export function AppHeader({ onMenu }: { onMenu: () => void }) {
  const user = useCurrentUser()!;
  const router = useRouter();
  const pathname = usePathname();
  const users = useStore((s) => s.users);
  const login = useStore((s) => s.login);
  const logout = useStore((s) => s.logout);
  const cases = useVisibleCases();
  const notifs = useMyNotifications();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const [bell, setBell] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unread = notifs.filter((n) => !n.read).length;

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((p, i) => {
      const caseMatch = /^(c\d+|\d+)$/.test(p);
      const label = caseMatch ? cases.find((c) => c.id === p)?.caseNo ?? p : CRUMBS[p] ?? p;
      const href = i === parts.length - 1 ? null : SPECIAL_CRUMB_HREF[p] ?? null;
      return { label, href };
    });
  }, [pathname, cases]);

  const [hits, setHits] = useState<Case[]>([]);
  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) { setHits([]); return; }
    let alive = true;
    const h = setTimeout(() => { searchCases(t, cases).then((r) => alive && setHits(r)).catch(() => {}); }, USE_ODOO ? 250 : 0);
    return () => { alive = false; clearTimeout(h); };
  }, [q, cases]);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur lg:px-6">
      <button onClick={onMenu} aria-label="Open menu" className="cursor-pointer rounded-md p-2 text-ink hover:bg-brand-50 lg:hidden"><Menu className="size-5" /></button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
        <Link href="/dashboard" className="text-muted hover:text-ink">IOF Seva</Link>
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            <ChevronRight className="size-3.5 text-slate-300" />
            {c.href ? <Link href={c.href} className="text-muted hover:text-ink">{c.label}</Link> : <span className="truncate font-medium text-ink">{c.label}</span>}
          </Fragment>
        ))}
      </nav>

      <div className="relative ml-auto w-full max-w-md md:ml-6 md:flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setFocus(true); }}
          onBlur={() => { blurTimer.current = setTimeout(() => setFocus(false), 150); }}
          onKeyDown={(e) => { if (e.key === "Enter" && q.trim()) { router.push(`/cases?q=${encodeURIComponent(q.trim())}`); setFocus(false); } }}
          placeholder="Search cases by number, name, victim…"
          aria-label="Global case search"
          className="h-9 w-full rounded-lg border border-line bg-brand-50/50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        {focus && q.trim().length >= 2 && (
          <div className="anim-pop absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-line bg-white shadow-pop">
            {hits.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No matching cases you can access.</p>
            ) : (
              <>
                {hits.map((c) => (
                  <button key={c.id} onMouseDown={(e) => e.preventDefault()} onClick={() => { router.push(`/cases/${c.id}`); setQ(""); setFocus(false); }} className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-brand-50">
                    <span className="min-w-0"><span className="block truncate text-sm font-medium">{c.caseNo} · {c.name}</span><span className="block truncate text-xs text-muted">{c.victimName || "—"} · {c.handlingCommittee}</span></span>
                    <StatusBadge status={c.status} />
                  </button>
                ))}
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { router.push(`/cases?q=${encodeURIComponent(q.trim())}`); setFocus(false); }} className="w-full cursor-pointer border-t border-line px-4 py-2 text-left text-[13px] font-medium text-brand hover:bg-brand-50">See all results for “{q}”</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {canRegister(user) && (
          <Button variant="saffron" size="md" onClick={() => router.push("/cases/new")} className="hidden sm:inline-flex"><Plus /> Register Case</Button>
        )}
        <button onClick={() => setBell(true)} aria-label={`Notifications, ${unread} unread`} className="relative cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-brand-50">
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-saffron px-1 text-[10px] font-bold leading-4 text-white tabular">{unread > 9 ? "9+" : unread}</span>}
        </button>

        <Dropdown>
          <DropdownTrigger asChild>
            <button className="flex cursor-pointer items-center gap-2.5 rounded-lg py-1 pl-1.5 pr-2 hover:bg-brand-50" aria-label="User menu">
              <Avatar name={user.name} size={32} />
              <span className="hidden text-left leading-tight xl:block">
                <span className="block text-[13px] font-semibold">{user.name}</span>
                <span className="block text-xs text-muted">{ROLE_LABEL[user.role]} · {user.provinceCode}</span>
              </span>
            </button>
          </DropdownTrigger>
          <DropdownContent className="w-72">
            <div className="px-2.5 py-2">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted">{ROLE_LABEL[user.role]} · {provinceName(user.provinceCode)}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            <DropdownSeparator />
            {!USE_ODOO && <DropdownLabel>Switch demo role</DropdownLabel>}
            {(USE_ODOO ? [] : [users.find((u) => u.role === "president"), users.find((u) => u.id === "u16"), users.find((u) => u.id === "u2"), users.find((u) => u.id === "u5"), users.find((u) => u.id === "u9")]).filter(Boolean).map((u) => (
              <DropdownItem key={u!.id} onSelect={() => { login(u!.id); router.push("/dashboard"); }}>
                <Repeat2 /> <span className="flex-1">{ROLE_LABEL[u!.role]}</span><span className="text-xs text-muted">{u!.name.split(" ")[0]}</span>
              </DropdownItem>
            ))}
            <DropdownSeparator />
            <DropdownItem onSelect={() => router.push("/settings")}><Settings /> Settings</DropdownItem>
            <DropdownItem onSelect={() => { logout(); router.replace("/login"); }}><LogOut /> Sign out</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
      <NotificationPanel open={bell} onOpenChange={setBell} />
    </header>
  );
}

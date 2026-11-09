"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";
import { NAV, type NavItem } from "@/lib/nav";
import { useCurrentUser, useStore } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/reference-data";
import { cn } from "@/lib/utils";
import { IofLogo, IofMark } from "@/components/common/logo";
import { Avatar } from "@/components/ui/card";
import { visibleCases } from "@/lib/permissions";
import { useRouter } from "next/navigation";

export function AppSidebar({ collapsed, onToggle, onNavigate }: { collapsed: boolean; onToggle: () => void; onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useCurrentUser()!;
  const cases = useStore((s) => s.cases);
  const transfers = useStore((s) => s.transfers);
  const logout = useStore((s) => s.logout);
  const router = useRouter();
  const [open, setOpen] = useState<Record<string, boolean>>({ "Case Management": true, "Case Assignment": true });

  const counts = useMemo(() => {
    const vis = visibleCases(user, cases);
    return {
      queue: vis.filter((c) => c.assignment === "awaiting_assignment" && (user.role !== "coordinator" || c.handlingCommittee === user.provinceCode)).length,
      transfers: transfers.filter((t) => t.status === "pending" && vis.some((c) => c.id === t.caseId)).length,
    };
  }, [user, cases, transfers]);

  const isActive = (href: string) => (href === "/cases" ? pathname === "/cases" || /^\/cases\/c\d+/.test(pathname) : pathname === href || pathname.startsWith(href + "/"));
  const visibleGroups = NAV.filter((g) => !g.show || g.show(user)).map((g) => ({ ...g, children: g.children?.filter((c) => !c.show || c.show(user)) }));

  const Item = ({ item, nested }: { item: NavItem; nested?: boolean }) => {
    const active = isActive(item.href);
    const n = item.badge ? counts[item.badge] : 0;
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors",
          active ? "bg-brand-50 text-brand-dark" : "text-slate-600 hover:bg-brand-50/70 hover:text-ink",
          nested && "py-1.5",
          collapsed && "justify-center",
        )}
      >
        {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-saffron" />}
        <item.icon className={cn("size-[18px] shrink-0", active ? "text-brand" : "text-slate-400 group-hover:text-brand")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && n > 0 && <span className="ml-auto rounded-full bg-saffron px-1.5 text-[11px] font-semibold text-white tabular">{n}</span>}
      </Link>
    );
  };

  return (
    <aside className={cn("flex h-full flex-col border-r border-line bg-white transition-[width] duration-200", collapsed ? "w-[72px]" : "w-[268px]")}>
      <div className={cn("flex h-16 shrink-0 items-center border-b border-line", collapsed ? "justify-center" : "justify-between px-4")}>
        {collapsed ? <IofMark size={40} /> : <IofLogo width={150} />}
        {!collapsed && (
          <button onClick={onToggle} aria-label="Collapse sidebar" className="hidden cursor-pointer rounded-md p-1.5 text-muted hover:bg-brand-50 lg:block">
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>
      {collapsed && (
        <button onClick={onToggle} aria-label="Expand sidebar" className="mx-auto mt-2 hidden cursor-pointer rounded-md p-1.5 text-muted hover:bg-brand-50 lg:block">
          <PanelLeftOpen className="size-4" />
        </button>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3" aria-label="Main">
        {visibleGroups.map((g) => {
          if (!g.children) return <Item key={g.label} item={{ label: g.label, href: g.href!, icon: g.icon }} />;
          const first = g.children[0];
          if (!first) return null;
          if (collapsed) return <Item key={g.label} item={{ ...first, label: g.label, icon: g.icon }} />;
          const expanded = open[g.label] ?? false;
          const groupActive = g.children.some((c) => isActive(c.href));
          return (
            <div key={g.label}>
              <button
                onClick={() => setOpen((s) => ({ ...s, [g.label]: !expanded }))}
                aria-expanded={expanded}
                className={cn("flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px] font-medium hover:bg-brand-50/70", groupActive ? "text-ink" : "text-slate-600")}
              >
                <g.icon className={cn("size-[18px]", groupActive ? "text-brand" : "text-slate-400")} />
                <span>{g.label}</span>
                <ChevronDown className={cn("ml-auto size-4 text-slate-400 transition-transform", expanded && "rotate-180")} />
              </button>
              {expanded && (
                <div className="ml-[22px] mt-0.5 space-y-0.5 border-l border-line pl-2">
                  {g.children.map((c) => <Item key={c.href} item={c} nested />)}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className={cn("flex items-center gap-2.5 rounded-lg p-1.5", collapsed && "justify-center")}>
          <Avatar name={user.name} size={36} />
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted">{ROLE_LABEL[user.role]}</p>
              </div>
              <button onClick={() => { logout(); router.replace("/login"); }} aria-label="Sign out" title="Sign out" className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-brand-50 hover:text-danger">
                <LogOut className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

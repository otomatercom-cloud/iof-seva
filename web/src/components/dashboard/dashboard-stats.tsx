import { AlertOctagon, CheckCircle2, FolderOpen, Hourglass, Loader, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type K = { total: number; new: number; pending: number; in_progress: number; resolved: number; critical: number };

export function DashboardStats({ k, scope = "" }: { k: K; scope?: string }) {
  const items = [
    { label: "Total Cases", v: k.total, icon: FolderOpen, tone: "text-brand bg-brand-50", href: "/cases" },
    { label: "New Cases", v: k.new, icon: Sparkles, tone: "text-info bg-info-50", href: "/cases?bucket=new" },
    { label: "Pending Cases", v: k.pending, icon: Hourglass, tone: "text-violet-soft bg-violet-50", href: "/cases/pending" },
    { label: "In Progress", v: k.in_progress, icon: Loader, tone: "text-saffron-dark bg-saffron-50", href: "/cases?bucket=in_progress" },
    { label: "Resolved Cases", v: k.resolved, icon: CheckCircle2, tone: "text-brand-dark bg-brand-100", href: "/cases/resolved" },
    { label: "Critical Cases", v: k.critical, icon: AlertOctagon, tone: "text-danger bg-danger-50", href: "/cases?priority=critical&open=1", alert: k.critical > 0 },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map((i) => (
        <Link key={i.label} href={i.href} className={cn("group rounded-xl border bg-white p-4 shadow-soft transition hover:border-brand-300 hover:shadow-pop", i.alert ? "border-[#f9c9c3]" : "border-line")}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-muted">{i.label}</span>
            <span className={cn("flex size-8 items-center justify-center rounded-lg", i.tone)}><i.icon className="size-4" /></span>
          </div>
          <p className="mt-2 font-display text-[28px] font-bold leading-none tabular">{i.v}</p>
          <p className="mt-1.5 text-xs text-muted">{scope || "in your view"}</p>
        </Link>
      ))}
    </div>
  );
}

import * as React from "react";
import { cn, initials } from "@/lib/utils";

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-line bg-white shadow-soft", className)} {...p} />;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-4", className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...p} />;
}

type Tone = "green" | "saffron" | "red" | "blue" | "violet" | "slate";
const tones: Record<Tone, string> = {
  green: "bg-brand-50 text-brand-dark ring-brand-200",
  saffron: "bg-saffron-50 text-saffron-dark ring-[#f7d9ae]",
  red: "bg-danger-50 text-[#b42318] ring-[#f9c9c3]",
  blue: "bg-info-50 text-[#1d4ed8] ring-[#cddcfb]",
  violet: "bg-violet-50 text-violet-soft ring-[#dcd3fa]",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function Badge({
  tone = "slate",
  className,
  dot,
  ...p
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...p}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {p.children}
    </span>
  );
}

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 4;
  const palette = ["bg-brand-100 text-brand-dark", "bg-saffron-50 text-saffron-dark", "bg-info-50 text-[#1d4ed8]", "bg-violet-50 text-violet-soft"];
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", palette[hue], className)}
    >
      {initials(name)}
    </span>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-brand-100", className)}>
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand [&_svg]:size-5">{icon}</div>}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-bold leading-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

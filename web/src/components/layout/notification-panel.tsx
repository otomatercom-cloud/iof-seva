"use client";
import { useRouter } from "next/navigation";
import { AlertOctagon, ArrowLeftRight, BellRing, CheckCheck, Clock3, RefreshCw, UserPlus } from "lucide-react";
import { Sheet } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { useMyNotifications } from "@/lib/hooks";
import { cn, timeAgo } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export const notifMeta: Record<Notification["kind"], { icon: typeof BellRing; cls: string; label: string }> = {
  assigned: { icon: UserPlus, cls: "bg-brand-50 text-brand", label: "Assigned" },
  transferred: { icon: ArrowLeftRight, cls: "bg-violet-50 text-violet-soft", label: "Transfer" },
  critical: { icon: AlertOctagon, cls: "bg-danger-50 text-danger", label: "Critical" },
  pending_assignment: { icon: Clock3, cls: "bg-saffron-50 text-saffron-dark", label: "Pending assignment" },
  status: { icon: RefreshCw, cls: "bg-info-50 text-info", label: "Status" },
  followup: { icon: BellRing, cls: "bg-slate-100 text-slate-600", label: "Follow-up" },
};

export function NotificationList({ items, onPick }: { items: Notification[]; onPick?: () => void }) {
  const router = useRouter();
  const markRead = useStore((s) => s.markRead);
  if (!items.length) return <EmptyState icon={<BellRing />} title="You're all caught up" description="New assignments, transfers and reminders will appear here." />;
  return (
    <ul className="divide-y divide-line">
      {items.map((n) => {
        const m = notifMeta[n.kind];
        return (
          <li key={n.id}>
            <button
              onClick={() => { markRead(n.id); onPick?.(); if (n.caseId) router.push(`/cases/${n.caseId}`); }}
              className={cn("flex w-full cursor-pointer items-start gap-3 px-5 py-3.5 text-left hover:bg-brand-50/60", !n.read && "bg-brand-50/40")}
            >
              <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", m.cls)}><m.icon className="size-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[13.5px] font-semibold">{n.title}</span>
                  {!n.read && <span className="size-1.5 rounded-full bg-saffron" aria-label="Unread" />}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[13px] text-muted">{n.body}</span>
                <span className="mt-1 block text-xs text-slate-400">{timeAgo(n.at)}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function NotificationPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const items = useMyNotifications();
  const markRead = useStore((s) => s.markRead);
  const router = useRouter();
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Notifications">
      <div className="flex items-center justify-between border-b border-line px-5 py-2.5">
        <span className="text-xs text-muted">{items.filter((n) => !n.read).length} unread</span>
        <Button variant="ghost" size="sm" onClick={() => markRead()}><CheckCheck /> Mark all read</Button>
      </div>
      <NotificationList items={items.slice(0, 20)} onPick={() => onOpenChange(false)} />
      <div className="border-t border-line p-3">
        <Button variant="outline" className="w-full" onClick={() => { onOpenChange(false); router.push("/notifications"); }}>Open notification centre</Button>
      </div>
    </Sheet>
  );
}

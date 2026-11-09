"use client";
import { ArrowLeftRight, CheckCircle2, FilePlus2, Lock, MessageSquare, PhoneCall, Paperclip, RefreshCw, StickyNote, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { useUserMap } from "@/lib/hooks";
import { cn, fmtDateTime, timeAgo } from "@/lib/utils";
import type { TimelineEvent, TimelineType } from "@/lib/types";

const META: Record<TimelineType, { icon: typeof FilePlus2; cls: string; label: string }> = {
  created: { icon: FilePlus2, cls: "bg-brand-100 text-brand-dark", label: "Created" },
  assigned: { icon: UserCheck, cls: "bg-info-50 text-info", label: "Assigned" },
  transferred: { icon: ArrowLeftRight, cls: "bg-violet-50 text-violet-soft", label: "Transfer" },
  status: { icon: RefreshCw, cls: "bg-saffron-50 text-saffron-dark", label: "Status" },
  update: { icon: MessageSquare, cls: "bg-slate-100 text-slate-600", label: "Update" },
  remark: { icon: StickyNote, cls: "bg-slate-100 text-slate-600", label: "Remark" },
  followup: { icon: PhoneCall, cls: "bg-brand-50 text-brand", label: "Follow-up" },
  document: { icon: Paperclip, cls: "bg-slate-100 text-slate-600", label: "Document" },
  resolved: { icon: CheckCircle2, cls: "bg-brand text-white", label: "Resolved" },
};

export function CaseTimelineIcon({ type, size = 32 }: { type: TimelineType; size?: number }) {
  const m = META[type];
  return <span style={{ width: size, height: size }} className={cn("flex shrink-0 items-center justify-center rounded-full", m.cls)}><m.icon className="size-4" /></span>;
}

export function CaseTimeline({ events }: { events: TimelineEvent[] }) {
  const users = useUserMap();
  const list = [...events].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return (
    <ol className="relative" aria-label="Case timeline">
      {list.map((e, i) => {
        const m = META[e.type];
        return (
          <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < list.length - 1 && <span className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px -translate-x-1/2 bg-line" aria-hidden />}
            <CaseTimelineIcon type={e.type} />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold">{users.get(e.actorId)?.name ?? "System"}</span>
                <Badge tone="slate">{m.label}</Badge>
                {e.internal && <Badge tone="saffron"><Lock className="size-3" /> Internal</Badge>}
                <time className="text-xs text-muted" dateTime={e.at} title={fmtDateTime(e.at)}>{timeAgo(e.at)}</time>
              </div>
              <p className="mt-1 text-[13.5px] leading-relaxed text-slate-700">{e.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

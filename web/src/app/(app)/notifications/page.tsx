"use client";
import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { Card, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationList, notifMeta } from "@/components/layout/notification-panel";
import { useMyNotifications } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export default function NotificationsPage() {
  const items = useMyNotifications();
  const markRead = useStore((s) => s.markRead);
  const [kind, setKind] = useState<"all" | Notification["kind"]>("all");
  const shown = items.filter((n) => kind === "all" || n.kind === kind);
  return (
    <div>
      <PageHeader title="Notification centre" description="Assignments, transfers, critical cases and follow-up reminders for you." actions={<Button variant="outline" onClick={() => markRead()}><CheckCheck /> Mark all read</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...Object.keys(notifMeta)] as const).map((k) => <button key={k} onClick={() => setKind(k as typeof kind)} className={cn("cursor-pointer rounded-full border px-3 py-1 text-[13px] font-medium transition", kind === k ? "border-brand bg-brand text-white" : "border-line bg-white hover:bg-brand-50")}>{k === "all" ? `All (${items.length})` : notifMeta[k as Notification["kind"]].label}</button>)}
      </div>
      <Card className="overflow-hidden"><NotificationList items={shown} /></Card>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Avatar, Badge, Card, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/form";
import { RoleGuard } from "@/components/common/role-guard";
import { UserFormModal } from "@/components/common/user-form-modal";
import { useCurrentUser, useStore } from "@/lib/store";
import { ROLE_LABEL, regionOf } from "@/lib/reference-data";
import { canSeeCoordinators, isNational } from "@/lib/permissions";
import { useStats } from "@/lib/server-data";

function Page() {
  const me = useCurrentUser()!;
  const users = useStore((s) => s.users);
  const { stats: S } = useStats();
  const toggle = useStore((s) => s.toggleUser);
  const [open, setOpen] = useState(false);
  const rows = users.filter((u) => (u.role === "coordinator" || u.role === "handler") && (isNational(me) || regionOf(u.provinceCode) === regionOf(me.provinceCode)));
  return (
    <div>
      <PageHeader title="Coordinator Management" description="Coordinators and case handlers (IOF representatives) who receive assignments." actions={<Button onClick={() => setOpen(true)}><Plus /> Add coordinator</Button>} />
      <Card className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[13px]"><thead className="bg-brand-50/60 text-xs text-muted"><tr><th className="px-4 py-2.5 font-medium">Name</th><th className="px-4 py-2.5 font-medium">Role</th><th className="px-4 py-2.5 font-medium">Province</th><th className="px-4 py-2.5 text-right font-medium">Open</th><th className="px-4 py-2.5 text-right font-medium">Resolved</th><th className="px-4 py-2.5 font-medium">Active</th></tr></thead>
        <tbody>{rows.map((u) => { const h = S?.perHandler[u.id] ?? { total: 0, open: 0, critical: 0, awaiting: 0 }; return (
          <tr key={u.id} className="border-t border-line"><td className="px-4 py-3"><span className="flex items-center gap-3"><Avatar name={u.name} size={34} /><span><b className="block font-medium">{u.name}</b><span className="text-xs text-muted">{u.email} · {u.phone}</span></span></span></td><td className="px-4 py-3"><Badge tone={u.role === "coordinator" ? "green" : "slate"}>{ROLE_LABEL[u.role]}</Badge></td><td className="px-4 py-3">{u.provinceCode}</td><td className="px-4 py-3 text-right tabular">{h.open}</td><td className="px-4 py-3 text-right tabular">{h.total - h.open}</td><td className="px-4 py-3"><Switch checked={u.active} onChange={() => toggle(u.id)} label={`Toggle ${u.name}`} /></td></tr>); })}</tbody></table></Card>
      {open && <UserFormModal open onOpenChange={setOpen} roles={["coordinator", "handler"]} lockRegion={isNational(me) ? undefined : regionOf(me.provinceCode) ?? undefined} />}
    </div>
  );
}
export default function CoordinatorsPage() { return <RoleGuard allow={canSeeCoordinators}><Page /></RoleGuard>; }

"use client";
import { useState } from "react";
import { Check, Minus, Pencil, Plus } from "lucide-react";
import { Avatar, Badge, Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/form";
import { RoleGuard } from "@/components/common/role-guard";
import { UserFormModal } from "@/components/common/user-form-modal";
import { useStore } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/reference-data";
import { canManageUsers } from "@/lib/permissions";
import type { Role, User } from "@/lib/types";

const MATRIX: [string, boolean[]][] = [
  ["See all provinces' cases", [true, true, false, false, false]], ["See own province / region cases", [true, true, true, false, false]], ["See own unit cases", [true, true, true, true, false]], ["See only assigned cases", [true, true, true, true, true]],
  ["Register cases", [true, true, true, true, true]], ["Assign coordinators", [true, true, true, true, false]], ["Transfer cases directly", [true, true, true, false, false]], ["Request a transfer", [true, true, true, true, true]],
  ["Accept / reject transfers", [true, true, true, false, false]], ["Update status & timeline", [true, true, true, true, true]], ["Reports & analytics", [true, true, true, true, false]], ["Manage issue types / users", [true, false, false, false, false]],
];
const ROLES: Role[] = ["president", "secretary", "province_head", "coordinator", "handler"];

function Page() {
  const users = useStore((s) => s.users);
  const toggle = useStore((s) => s.toggleUser);
  const [edit, setEdit] = useState<User | null | "new">(null);
  return (
    <div>
      <PageHeader title="User Management" description="Accounts, roles and permissions. Role-based visibility here is a UI demonstration — real enforcement belongs on the Odoo server." actions={<Button onClick={() => setEdit("new")}><Plus /> Add user</Button>} />
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-[13px]"><thead className="bg-brand-50/60 text-xs text-muted"><tr><th className="px-4 py-2.5 font-medium">User</th><th className="px-4 py-2.5 font-medium">Role</th><th className="px-4 py-2.5 font-medium">Province</th><th className="px-4 py-2.5 font-medium">Active</th><th /></tr></thead>
          <tbody>{users.map((u) => <tr key={u.id} className="border-t border-line"><td className="px-4 py-3"><span className="flex items-center gap-3"><Avatar name={u.name} size={32} /><span><b className="block font-medium">{u.name}</b><span className="text-xs text-muted">{u.email}</span></span></span></td><td className="px-4 py-3"><Badge tone={u.role === "president" ? "saffron" : u.role === "province_head" ? "green" : "slate"}>{ROLE_LABEL[u.role]}</Badge></td><td className="px-4 py-3">{u.provinceCode}</td><td className="px-4 py-3"><Switch checked={u.active} onChange={() => toggle(u.id)} label={`Toggle ${u.name}`} /></td><td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => setEdit(u)}><Pencil /> Edit</Button></td></tr>)}</tbody></table></Card>
        <Card className="h-fit"><CardHeader title="Role permissions" description="What each role can do in the prototype" /><CardBody className="overflow-x-auto pt-3"><table className="w-full text-[12.5px]"><thead><tr className="text-left text-xs text-muted"><th className="pb-2 font-medium">Capability</th>{ROLES.map((r) => <th key={r} className="px-1 pb-2 text-center font-medium">{ROLE_LABEL[r].split(" ").slice(-1)[0]}</th>)}</tr></thead>
          <tbody>{MATRIX.map(([l, v]) => <tr key={l} className="border-t border-line"><td className="py-2 pr-2">{l}</td>{v.map((x, i) => <td key={i} className="text-center">{x ? <Check className="mx-auto size-4 text-brand" /> : <Minus className="mx-auto size-4 text-slate-300" />}</td>)}</tr>)}</tbody></table></CardBody></Card>
      </div>
      {edit && <UserFormModal key={edit === "new" ? "new" : edit.id} open onOpenChange={() => setEdit(null)} initial={edit === "new" ? null : edit} roles={ROLES} />}
    </div>
  );
}
export default function UsersPage() { return <RoleGuard allow={canManageUsers}><Page /></RoleGuard>; }

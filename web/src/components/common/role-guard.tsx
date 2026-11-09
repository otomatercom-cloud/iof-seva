"use client";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/card";
import { useCurrentUser } from "@/lib/store";
import type { User } from "@/lib/types";

export function RoleGuard({ allow, children }: { allow: (u: User) => boolean; children: React.ReactNode }) {
  const me = useCurrentUser();
  if (!me || !allow(me)) return <EmptyState icon={<ShieldAlert />} title="Not available for your role" description="This screen is restricted. (In production this is enforced on the server, not just hidden in the UI.)" />;
  return <>{children}</>;
}

"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CaseRegistrationWizard } from "@/components/cases/case-registration-wizard";
import { useCurrentUser } from "@/lib/store";
import { canRegister } from "@/lib/permissions";
import { EmptyState } from "@/components/ui/card";

export default function NewCasePage() {
  const me = useCurrentUser()!;
  const router = useRouter();
  useEffect(() => { if (!canRegister(me)) router.replace("/dashboard"); }, [me, router]);
  if (!canRegister(me)) return <EmptyState title="Not permitted" description="Case handlers cannot register new cases." />;
  return <CaseRegistrationWizard />;
}

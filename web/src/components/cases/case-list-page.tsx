"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/card";
import { CaseDataTable, type Filters } from "./case-data-table";
import { useCurrentUser } from "@/lib/store";
import { canRegister } from "@/lib/permissions";

type View = "all" | "mine" | "pending" | "resolved";
const META: Record<View, { title: string; desc: string }> = {
  all: { title: "All Cases", desc: "Every case you are permitted to see. Click a row to open the full case file." },
  mine: { title: "My Assigned Cases", desc: "Cases where you are the responsible coordinator / handler." },
  pending: { title: "Pending Cases", desc: "Cases waiting on an external party — Saudi Judiciary, Police, Sponsor, Indian Authority or Medical." },
  resolved: { title: "Resolved Cases", desc: "Completed and closed cases, including finance-settled closures." },
};

function Inner({ view }: { view: View }) {
  const me = useCurrentUser()!;
  const sp = useSearchParams();
  const initial: Partial<Filters> = { q: sp.get("q") ?? "", priority: sp.get("priority") ?? "", bucket: sp.get("bucket") ?? "", open: sp.get("open") === "1", province: sp.get("province") ?? "", status: sp.get("status") ?? "" };
  const m = META[view];
  return (
    <>
      <PageHeader title={m.title} description={m.desc} actions={canRegister(me) ? <Link href="/cases/new" className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white shadow-soft hover:bg-brand-dark"><Plus className="size-4" /> Register case</Link> : undefined} />
      <CaseDataTable key={sp.toString()} view={view} initial={initial} title={m.title} />
    </>
  );
}

export function CaseListPage({ view }: { view: View }) {
  return <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-brand-50" />}><Inner view={view} /></Suspense>;
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useHydrated } from "@/lib/hooks";
import { useCurrentUser } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { IofMark } from "@/components/common/logo";

function ErrorBridge() {
  const { toast } = useToast();
  useEffect(() => {
    const h = (e: Event) => toast({ kind: "error", title: "Action not allowed", body: String((e as CustomEvent).detail) });
    window.addEventListener("iof-error", h); return () => window.removeEventListener("iof-error", h);
  }, [toast]);
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user)
    return (
      <div className="flex h-screen items-center justify-center bg-brand-50">
        <div className="flex flex-col items-center gap-3"><IofMark size={56} /><p className="text-sm text-muted">Loading IOF Seva…</p></div>
      </div>
    );

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafdfb]">
      <ErrorBridge />
      <div className="hidden lg:block"><AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} /></div>
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="anim-fade absolute inset-0 bg-[#0b2218]/40" onClick={() => setMobile(false)} />
          <div className="anim-slide absolute left-0 top-0 h-full"><AppSidebar collapsed={false} onToggle={() => setMobile(false)} onNavigate={() => setMobile(false)} /></div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onMenu={() => setMobile(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

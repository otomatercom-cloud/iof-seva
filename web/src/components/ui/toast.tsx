"use client";
import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface ToastItem { id: number; kind: ToastKind; title: string; body?: string }
const Ctx = React.createContext<{ toast: (t: Omit<ToastItem, "id">) => void }>({ toast: () => {} });
export const useToast = () => React.useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const toast = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { ...t, id }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 4200);
  }, []);
  const icon = { success: CheckCircle2, error: AlertTriangle, info: Info };
  const color = { success: "text-brand", error: "text-danger", info: "text-info" };
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => {
          const Icon = icon[t.kind];
          return (
            <div key={t.id} className="anim-pop pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-pop">
              <Icon className={cn("mt-0.5 size-5 shrink-0", color[t.kind])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.body && <p className="mt-0.5 text-[13px] text-muted">{t.body}</p>}
              </div>
              <button className="cursor-pointer text-muted hover:text-ink" aria-label="Dismiss" onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))}>
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

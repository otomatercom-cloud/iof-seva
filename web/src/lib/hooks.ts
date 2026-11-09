"use client";
import { useEffect, useMemo, useState } from "react";
import { useCurrentUser, useStore } from "./store";
import { visibleCases } from "./permissions";
import type { Notification } from "./types";
import { USE_ODOO } from "./config";
import { regionOf } from "./reference-data";

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    const start = USE_ODOO ? useStore.getState().refresh() : Promise.resolve(useStore.persist.rehydrate());
    Promise.resolve(start).finally(() => {
      useStore.setState({ ready: true });
      setH(true);
    });
  }, []);
  return h;
}

export function useVisibleCases() {
  const user = useCurrentUser();
  const cases = useStore((s) => s.cases);
  return useMemo(() => (user ? visibleCases(user, cases) : []), [user, cases]);
}

export function useMyNotifications(): Notification[] {
  const user = useCurrentUser();
  const all = useStore((s) => s.notifications);
  return useMemo(() => {
    if (!user) return [];
    const reg = regionOf(user.provinceCode);
    return all.filter((n) => {
      if (n.forUserId) return n.forUserId === user.id;
      if (!n.forRoles.includes(user.role)) return false;
      if (user.role === "president" || user.role === "secretary") return true;
      return !n.forRegion || n.forRegion === reg;
    });
  }, [user, all]);
}

export function useUserMap() {
  const users = useStore((s) => s.users);
  return useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
}

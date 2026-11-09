"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Case, CaseDocument, FinanceEntry, IssueType, Notification, Priority, Province, StatusId, TimelineEvent, TimelineType, Transfer, User,
} from "./types";
import { SEED_CASES, SEED_NOTIFICATIONS, SEED_TRANSFERS, USERS } from "./mock-data";
import { PROVINCES, SEED_ISSUE_TYPES, casePrefixOf, regionOf, statusById, provinceName } from "./reference-data";
import { NOW_ISO } from "./utils";
import { USE_ODOO } from "./config";
import { odoo, apiLogout } from "./odoo-client";

/**
 * Mock service layer. Each action below corresponds to one Odoo 19 JSON-RPC / REST call
 * (see src/lib/api/odoo-contract.ts). Components only talk to this store, so swapping in a real
 * backend means re-implementing these actions with fetch() and keeping the same signatures.
 */
export type CaseInput = Omit<
  Case,
  "id" | "sl" | "caseNo" | "updatedAt" | "timeline" | "documents" | "finance" | "assignments" | "source" | "originalReportingProvince" | "createdById" | "assignment" | "status" | "oldStatus" | "initialStatus" | "resolvedAt"
> & { documents?: CaseDocument[] };

interface State {
  ready: boolean;
  currentUserId: string | null;
  users: User[];
  provinces: Province[];
  issueTypes: IssueType[];
  cases: Case[];
  transfers: Transfer[];
  notifications: Notification[];

  loadError: string;
  /** bumped after every Odoo reload so lists / dashboards refetch */
  version: number;
  openCaseId: string | null;
  setOpenCase: (id: string | null) => void;
  cacheCase: (c: Case) => void;
  /** Odoo mode: (re)load everything the signed-in user may see */
  refresh: () => Promise<boolean>;
  login: (userId: string) => void;
  logout: () => void;
  registerCase: (input: CaseInput, by: User, submit: boolean) => Case | Promise<Case>;
  updateStatus: (caseId: string, status: StatusId, by: User, note?: string) => void;
  addTimeline: (caseId: string, type: TimelineType, text: string, by: User, internal?: boolean) => void;
  assignCase: (caseId: string, toUserId: string, by: User, note?: string) => void;
  transferCase: (caseId: string, toProvince: string, reason: string, by: User, mode: "direct" | "request") => void;
  decideTransfer: (transferId: string, accept: boolean, by: User, note?: string) => void;
  addDocument: (caseId: string, doc: Omit<CaseDocument, "id" | "at" | "uploadedBy">, by: User) => void;
  addFinance: (caseId: string, f: Omit<FinanceEntry, "id">, by: User) => void;
  updateCaseFields: (caseId: string, patch: Partial<Case>, by: User) => void;
  upsertIssueType: (it: Omit<IssueType, "id"> & { id?: string }) => void;
  toggleIssueType: (id: string) => void;
  toggleUser: (id: string) => void;
  upsertUser: (u: Omit<User, "id"> & { id?: string }) => void;
  toggleProvince: (code: string) => void;
  setProvincePrefix: (code: string, prefix: string) => void;
  markRead: (id?: string) => void;
  resetDemo: () => void;
}

const nowISO = () => new Date().toISOString();
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
const seed = () => ({
  users: USERS,
  provinces: PROVINCES,
  issueTypes: SEED_ISSUE_TYPES,
  cases: SEED_CASES,
  transfers: SEED_TRANSFERS,
  notifications: SEED_NOTIFICATIONS,
});

const ev = (type: TimelineType, by: User, text: string, extra: Partial<TimelineEvent> = {}): TimelineEvent => ({
  id: uid("t"), type, at: nowISO(), actorId: by.id, text, ...extra,
});

type Setter = (p: Partial<State>) => void;
function odooActions(set: Setter, get: () => State, fail: (e: unknown) => never): Partial<State> {
  // every action: call Odoo (server enforces permissions), then reload — UI shows exactly what Odoo allows.
  const run = async <T,>(fn: () => Promise<T>) => { try { const r = await fn(); await get().refresh(); return r; } catch (e) { return fail(e); } };
  const strip = (d: CaseDocument) => ({ name: d.name, kind: d.kind, data: d.data });
  return {
    logout: () => { void apiLogout(); set({ currentUserId: null, cases: [], transfers: [], notifications: [] }); },
    registerCase: (input, _by, submit) => run(async () => {
      const { documents, ...values } = input as CaseInput;
      const c = await odoo<Case>("register_case", values, submit, (documents ?? []).map(strip));
      return c;
    }),
    updateStatus: (id, status, _by, note) => void run(() => odoo("change_status", id, status, note ?? false)),
    addTimeline: (id, type, text, _by, internal) => void run(() => odoo("add_timeline", id, type, text, !!internal)),
    assignCase: (id, to, _by, note) => void run(() => odoo("assign", id, to, note ?? false)),
    transferCase: (id, to, reason) => void run(() => odoo("transfer", id, to, reason)),
    decideTransfer: (id, accept, _by, note) => void run(() => odoo("decide_transfer", id, accept, note ?? false)),
    addDocument: (id, doc) => void run(() => odoo("add_document", id, strip(doc as CaseDocument))),
    addFinance: (id, f) => void run(() => odoo("add_finance", id, f)),
    updateCaseFields: (id, patch) => void run(() => odoo("update_case", id, patch)),
    upsertIssueType: (it) => void run(() => odoo("upsert_issue_type", it)),
    toggleIssueType: (id) => void run(() => odoo("toggle_issue_type", id)),
    toggleUser: (id) => void run(() => odoo("toggle_user", id)),
    upsertUser: (u) => void run(() => odoo("upsert_user", u)),
    toggleProvince: (code) => void run(() => odoo("toggle_committee", code)),
    setProvincePrefix: (code, prefix) => void run(() => odoo("set_prefix", code, prefix)),
    markRead: (id) => void run(() => odoo("mark_read", id ?? false)),
    resetDemo: () => {},
  };
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const patchCase = (id: string, fn: (c: Case) => Case) =>
        set((s) => ({ cases: s.cases.map((c) => (c.id === id ? { ...fn(c), updatedAt: nowISO() } : c)) }));
      const notify = (n: Omit<Notification, "id" | "at" | "read">) =>
        set((s) => ({ notifications: [{ ...n, id: uid("n"), at: nowISO(), read: false }, ...s.notifications] }));

      const fail = (e: unknown): never => {
        const msg = e instanceof Error ? e.message : "Something went wrong.";
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("iof-error", { detail: msg }));
        throw e;
      };
      const base: State = {
        ready: false,
        loadError: "",
        version: 0,
        openCaseId: null,
        setOpenCase: (id) => set({ openCaseId: id }),
        cacheCase: (c) => set((s) => ({ cases: s.cases.some((x) => x.id === c.id) ? s.cases.map((x) => (x.id === c.id ? c : x)) : [c, ...s.cases] })),
        currentUserId: null,
        ...(USE_ODOO ? { users: [], provinces: [], issueTypes: [], cases: [], transfers: [], notifications: [] } : seed()),
        refresh: async () => {
          if (!USE_ODOO) return true;
          try {
            const b = await odoo<{ me: User } & Pick<State, "users" | "provinces" | "issueTypes" | "cases" | "transfers" | "notifications">>("bootstrap");
            const { me, ...data } = b;
            set({ ...data, cases: get().cases, currentUserId: me.id, loadError: "", version: get().version + 1 });
            const open = get().openCaseId;
            if (open) { try { get().cacheCase(await odoo<Case>("get_case", open)); } catch {} }
            return true;
          } catch { set({ currentUserId: null }); return false; }
        },

        login: (userId) => set({ currentUserId: userId }),
        logout: () => set({ currentUserId: null }),

        registerCase: (input, by, submit) => {
          const sl = Math.max(...get().cases.map((c) => c.sl), 0) + 1;
          const id = `c${sl}`;
          const sameRegion = regionOf(input.handlingCommittee) === regionOf(by.provinceCode);
          const directlyAssigned = submit && !!input.handledById && sameRegion;
          const c: Case = {
            ...input,
            id, sl,
            caseNo: `${casePrefixOf(input.handlingCommittee, get().provinces)}-${sl}`, // prefix configurable per committee; global SL; frozen at registration
            initialStatus: "open_new", status: "open_new", oldStatus: "",
            assignment: !submit ? "draft" : directlyAssigned ? "assigned" : "awaiting_assignment",
            handledById: directlyAssigned ? input.handledById : null,
            originalReportingProvince: input.reportedFrom,
            createdById: by.id, updatedAt: nowISO(), source: "portal",
            documents: input.documents ?? [], finance: [], assignments: [],
            timeline: [ev("created", by, submit ? `Case registered from ${input.reportedFrom} and routed to ${input.handlingCommittee}.` : "Draft saved.")],
          };
          if (directlyAssigned) {
            const h = get().users.find((u) => u.id === c.handledById)!;
            c.timeline.push(ev("assigned", by, `Assigned to ${h.name} (${c.handlingCommittee}).`, { meta: { to: h.name } }));
            c.assignments.push({ id: uid("a"), caseId: id, at: nowISO(), byId: by.id, toId: h.id, province: c.handlingCommittee, note: "Assigned at registration" });
            notify({ kind: "assigned", title: "New case assigned to you", body: `${c.caseNo} · ${c.name}`, caseId: id, forRoles: ["handler", "coordinator"], forUserId: h.id });
          } else if (submit) {
            const reg = regionOf(c.handlingCommittee);
            notify({ kind: "pending_assignment", title: "Pending assignment", body: `${c.caseNo} · ${c.name} (from ${c.reportedFrom}) needs a coordinator.`, caseId: id, forRoles: ["province_head", "president"], forRegion: reg === "NC" ? undefined : reg ?? undefined });
          }
          if (submit && c.priority === "critical")
            notify({ kind: "critical", title: "Critical case registered", body: `${c.caseNo} · ${c.name}`, caseId: id, forRoles: ["president", "secretary", "province_head"], forRegion: regionOf(c.handlingCommittee) === "NC" ? undefined : regionOf(c.handlingCommittee) ?? undefined });
          set((s) => ({ cases: [c, ...s.cases] }));
          return c;
        },

        updateStatus: (caseId, status, by, note) => {
          const cur = get().cases.find((c) => c.id === caseId);
          if (!cur || cur.status === status) return;
          const s = statusById(status);
          patchCase(caseId, (c) => ({
            ...c, oldStatus: statusById(c.status).excel, status,
            resolvedAt: s.bucket === "resolved" || s.bucket === "closed" ? nowISO() : undefined,
            timeline: [...c.timeline, ev(s.bucket === "resolved" || s.bucket === "closed" ? "resolved" : "status", by, `Status changed to ${s.label}.${note ? " " + note : ""}`, { meta: { from: c.status, to: status } })],
          }));
          notify({ kind: "status", title: "Case status updated", body: `${cur.caseNo} → ${s.label}`, caseId, forRoles: ["president", "secretary", "province_head", "coordinator"], forRegion: regionOf(cur.handlingCommittee) === "NC" ? undefined : regionOf(cur.handlingCommittee) ?? undefined });
        },

        addTimeline: (caseId, type, text, by, internal) =>
          patchCase(caseId, (c) => ({ ...c, timeline: [...c.timeline, ev(type, by, text, { internal })] })),

        assignCase: (caseId, toUserId, by, note) => {
          const to = get().users.find((u) => u.id === toUserId)!;
          const cur = get().cases.find((c) => c.id === caseId)!;
          patchCase(caseId, (c) => ({
            ...c, handledById: toUserId, assignment: "assigned",
            assignments: [...c.assignments, { id: uid("a"), caseId, at: nowISO(), byId: by.id, toId: toUserId, province: c.handlingCommittee, note }],
            timeline: [...c.timeline, ev("assigned", by, `${c.handledById ? "Re-assigned" : "Assigned"} to ${to.name} (${c.handlingCommittee}).${note ? " " + note : ""}`, { meta: { to: to.name } })],
          }));
          notify({ kind: "assigned", title: "New case assigned to you", body: `${cur.caseNo} · ${cur.name}`, caseId, forRoles: ["handler", "coordinator"], forUserId: toUserId });
        },

        transferCase: (caseId, toProvince, reason, by, mode) => {
          const cur = get().cases.find((c) => c.id === caseId)!;
          const t: Transfer = { id: uid("tr"), caseId, fromProvince: cur.handlingCommittee, toProvince, reason, requestedBy: by.id, at: nowISO(), status: mode === "direct" ? "accepted" : "pending", decidedBy: mode === "direct" ? by.id : undefined, decidedAt: mode === "direct" ? nowISO() : undefined };
          set((s) => ({ transfers: [t, ...s.transfers] }));
          if (mode === "direct") {
            patchCase(caseId, (c) => ({
              ...c, handlingCommittee: toProvince, handledById: null, assignment: "awaiting_assignment",
              timeline: [...c.timeline, ev("transferred", by, `Transferred ${t.fromProvince} → ${toProvince}. Original reporter (${c.originalReportingProvince}) preserved. Reason: ${reason}`, { meta: { to: toProvince } })],
            }));
            const reg = regionOf(toProvince);
            notify({ kind: "transferred", title: "Case transferred to your province", body: `${cur.caseNo} moved ${t.fromProvince} → ${toProvince}.`, caseId, forRoles: ["province_head", "president"], forRegion: reg === "NC" ? undefined : reg ?? undefined });
          } else {
            patchCase(caseId, (c) => ({ ...c, assignment: "transfer_pending", timeline: [...c.timeline, ev("transferred", by, `Transfer to ${toProvince} requested. Reason: ${reason}`, { meta: { to: toProvince } })] }));
            const reg = regionOf(toProvince);
            notify({ kind: "transferred", title: "Transfer request", body: `${cur.caseNo} requested to move ${t.fromProvince} → ${toProvince}.`, caseId, forRoles: ["province_head", "president"], forRegion: reg === "NC" ? undefined : reg ?? undefined });
          }
        },

        decideTransfer: (transferId, accept, by, note) => {
          const t = get().transfers.find((x) => x.id === transferId);
          if (!t || t.status !== "pending") return;
          set((s) => ({ transfers: s.transfers.map((x) => (x.id === transferId ? { ...x, status: accept ? "accepted" : "rejected", decidedBy: by.id, decidedAt: nowISO(), note } : x)) }));
          patchCase(t.caseId, (c) =>
            accept
              ? { ...c, handlingCommittee: t.toProvince, handledById: null, assignment: "awaiting_assignment", timeline: [...c.timeline, ev("transferred", by, `Transfer accepted: ${t.fromProvince} → ${t.toProvince}. Awaiting local assignment.${note ? " " + note : ""}`, { meta: { to: t.toProvince } })] }
              : { ...c, assignment: c.handledById ? "assigned" : "awaiting_assignment", timeline: [...c.timeline, ev("transferred", by, `Transfer to ${t.toProvince} rejected.${note ? " " + note : ""}`)] },
          );
        },

        addDocument: (caseId, doc, by) =>
          patchCase(caseId, (c) => ({
            ...c,
            documents: [...c.documents, { ...doc, id: uid("d"), at: nowISO(), uploadedBy: by.id }],
            timeline: [...c.timeline, ev("document", by, `Uploaded ${doc.name}.`)],
          })),
        addFinance: (caseId, f, by) =>
          patchCase(caseId, (c) => ({ ...c, finance: [...c.finance, { ...f, id: uid("f") }], timeline: [...c.timeline, ev("update", by, `Financial entry added: ${f.description} (SAR ${f.amountSAR.toLocaleString("en-IN")}, ${f.paidBy}).`)] })),
        updateCaseFields: (caseId, patch, by) =>
          patchCase(caseId, (c) => ({ ...c, ...patch, timeline: [...c.timeline, ev("update", by, "Case information updated.")] })),

        upsertIssueType: (it) =>
          set((s) => ({ issueTypes: it.id ? s.issueTypes.map((x) => (x.id === it.id ? ({ ...x, ...it } as IssueType) : x)) : [...s.issueTypes, { ...it, id: uid("it") } as IssueType] })),
        toggleIssueType: (id) => set((s) => ({ issueTypes: s.issueTypes.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) })),
        toggleUser: (id) => set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) })),
        upsertUser: (u) => set((s) => ({ users: u.id ? s.users.map((x) => (x.id === u.id ? ({ ...x, ...u } as User) : x)) : [...s.users, { ...u, id: uid("u") } as User] })),
        setProvincePrefix: (code, prefix) => set((s) => ({ provinces: s.provinces.map((p) => (p.code === code ? { ...p, prefix: prefix.trim().toUpperCase() } : p)) })),
        toggleProvince: (code) => set((s) => ({ provinces: s.provinces.map((p) => (p.code === code ? { ...p, active: !p.active } : p)) })),
        markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (!id || n.id === id ? { ...n, read: true } : n)) })),
        resetDemo: () => set({ ...seed() }),
      };
      return USE_ODOO ? { ...base, ...odooActions(set, get, fail) } : base;
    },
    {
      name: "iof-seva-demo-v2",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Odoo mode: nothing is cached in the browser (victim data stays on the server)
      partialize: (s) => USE_ODOO ? {} : ({ currentUserId: s.currentUserId, users: s.users, provinces: s.provinces, issueTypes: s.issueTypes, cases: s.cases, transfers: s.transfers, notifications: s.notifications }),
    },
  ),
);

export const useCurrentUser = () => {
  const id = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === id) ?? null;
};
export const userName = (users: User[], id?: string | null) => users.find((u) => u.id === id)?.name ?? "—";
export const priorityOrder: Priority[] = ["critical", "high", "medium", "low"];
export { NOW_ISO, provinceName };

import type { Case, Role, User } from "./types";
import { regionOf } from "./reference-data";

/**
 * ⚠️  UI-LEVEL VISIBILITY ONLY.
 * These helpers decide what the prototype *shows*. They are NOT security. In the Odoo 19 build every rule
 * below must be re-implemented as ir.rule record rules + group access (server side).
 */
export const isStaffRole = (r: Role) => r !== "handler";

export function visibleCases(user: User, cases: Case[]): Case[] {
  const reg = regionOf(user.provinceCode);
  return cases.filter((c) => {
    if (c.assignment === "draft") return c.createdById === user.id;
    switch (user.role) {
      case "president":
      case "secretary":
        return true;
      case "province_head":
        return regionOf(c.handlingCommittee) === reg || regionOf(c.originalReportingProvince) === reg;
      case "coordinator":
        return (
          c.handlingCommittee === user.provinceCode ||
          c.originalReportingProvince === user.provinceCode ||
          c.createdById === user.id ||
          c.handledById === user.id
        );
      case "handler":
        return c.handledById === user.id || c.createdById === user.id;
    }
  });
}

/** Decision 2026-11-09: every role incl. Case Handler may register a case. */
export const canRegister = (_u: User) => true;
/** National-level staff: President and Secretary see/act on all provinces. */
export const isNational = (u: User) => u.role === "president" || u.role === "secretary";
export const canManageIssueTypes = (u: User) => u.role === "president";
export const canManageWebsite = (u: User) => u.role === "president";
export const canManageUsers = (u: User) => u.role === "president";
export const canSeeReports = (u: User) => u.role !== "handler";
export const canSeeProvinces = (u: User) => isNational(u) || u.role === "province_head";
export const canSeeCoordinators = (u: User) => isNational(u) || u.role === "province_head";
export const canSeeAssignment = (u: User) => u.role !== "handler";

export function canAssign(u: User, c: Case) {
  if (c.canAssign !== undefined) return c.canAssign; // Odoo mode: the server decides
  if (c.assignment === "draft" || ["completed", "closed_finance"].includes(c.status)) return false;
  const reg = regionOf(c.handlingCommittee);
  if (isNational(u)) return true;
  if (u.role === "province_head") return regionOf(u.provinceCode) === reg;
  if (u.role === "coordinator") return c.handlingCommittee === u.provinceCode;
  return false;
}

export function canUpdate(u: User, c: Case) {
  if (c.canUpdate !== undefined) return c.canUpdate;
  if (c.assignment === "draft") return c.createdById === u.id;
  if (isNational(u)) return true;
  if (u.role === "province_head") return regionOf(u.provinceCode) === regionOf(c.handlingCommittee);
  if (u.role === "coordinator") return c.handlingCommittee === u.provinceCode || c.handledById === u.id;
  return c.handledById === u.id;
}

/** president / province head can move a case directly; everyone else with access files a transfer request */
export const transferMode = (u: User): "direct" | "request" => (isNational(u) || u.role === "province_head" ? "direct" : "request");
export const canTransfer = (u: User, c: Case) =>
  c.assignment !== "draft" && c.assignment !== "transfer_pending" && !["completed", "closed_finance"].includes(c.status) && canUpdate(u, c);

/** Who may accept/reject a transfer request into a province */
export const canDecideTransfer = (u: User, toProvince: string) =>
  isNational(u) || (u.role === "province_head" && regionOf(u.provinceCode) === regionOf(toProvince));

export function assignableUsers(all: User[], c: Case) {
  const reg = regionOf(c.handlingCommittee);
  return all.filter((x) => x.active && (x.role === "coordinator" || x.role === "handler") && regionOf(x.provinceCode) === reg);
}

export const dashboardTitle: Record<Role, string> = {
  president: "National overview",
  secretary: "National overview",
  province_head: "Province command view",
  coordinator: "Coordinator workspace",
  handler: "My casework",
};

import {
  LayoutDashboard, FolderKanban, UserCheck, MapPinned, Users2, Tags, BarChart3, ShieldCheck, Settings,
  FilePlus2, Globe, ListChecks, Clock3, CheckCircle2, Inbox, Layers, ArrowLeftRight, type LucideIcon,
} from "lucide-react";
import type { Role, User } from "./types";
import { canManageIssueTypes, canManageUsers, canManageWebsite, canRegister, canSeeAssignment, canSeeCoordinators, canSeeProvinces, canSeeReports } from "./permissions";

export interface NavItem { label: string; href: string; icon: LucideIcon; show?: (u: User) => boolean; badge?: "queue" | "transfers" }
export interface NavGroup { label: string; href?: string; icon: LucideIcon; children?: NavItem[]; show?: (u: User) => boolean }

export const NAV: NavGroup[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Case Management", icon: FolderKanban,
    children: [
      { label: "All Cases", href: "/cases", icon: Layers },
      { label: "Register New Case", href: "/cases/new", icon: FilePlus2, show: canRegister },
      { label: "My Assigned Cases", href: "/cases/mine", icon: ListChecks },
      { label: "Pending Cases", href: "/cases/pending", icon: Clock3 },
      { label: "Resolved Cases", href: "/cases/resolved", icon: CheckCircle2 },
    ],
  },
  {
    label: "Case Assignment", icon: UserCheck, show: canSeeAssignment,
    children: [
      { label: "Assignment Queue", href: "/assignment/queue", icon: Inbox, badge: "queue" },
      { label: "Province-wise Assignment", href: "/assignment/provinces", icon: MapPinned },
      { label: "Transfer Requests", href: "/assignment/transfers", icon: ArrowLeftRight, badge: "transfers" },
    ],
  },
  { label: "Province Management", href: "/provinces", icon: MapPinned, show: canSeeProvinces },
  { label: "Coordinator Management", href: "/coordinators", icon: Users2, show: canSeeCoordinators },
  { label: "Issue Type Management", href: "/issue-types", icon: Tags, show: canManageIssueTypes },
  { label: "Reports & Analytics", href: "/analytics", icon: BarChart3, show: canSeeReports },
  { label: "Website Editor", href: "/editor/login", icon: Globe, show: canManageWebsite },
  { label: "User Management", href: "/users", icon: ShieldCheck, show: canManageUsers },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const CRUMBS: Record<string, string> = {
  dashboard: "Dashboard", cases: "Case Management", new: "Register New Case", mine: "My Assigned Cases", pending: "Pending Cases",
  resolved: "Resolved Cases", assignment: "Case Assignment", queue: "Assignment Queue", provinces: "Province-wise Assignment",
  transfers: "Transfer Requests", coordinators: "Coordinator Management", "issue-types": "Issue Type Management",
  analytics: "Reports & Analytics", users: "User Management", settings: "Settings", website: "Website Content", notifications: "Notifications",
};
export const SPECIAL_CRUMB_HREF: Record<string, string> = { cases: "/cases", assignment: "/assignment/queue" };
export const roleAccent: Record<Role, string> = { president: "Super Admin", secretary: "Secretary", province_head: "Province Head", coordinator: "Coordinator", handler: "Case Handler" };

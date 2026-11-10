/**
 * Domain types. Every Case field that exists in the legacy "IOF CASE 2026" Excel register is
 * preserved (see docs/EXCEL_FIELD_MAPPING.md). New workflow fields are marked `NEW`.
 * Models map 1:1 to future Odoo 19 models (otm.iof.case, otm.iof.province, …).
 */
export type Role = "president" | "secretary" | "province_head" | "coordinator" | "handler";
export type RegionCode = "NC" | "EP" | "CP" | "WP";

export type StatusBucket = "new" | "in_progress" | "pending" | "resolved" | "closed";
export type StatusId =
  | "open_new"
  | "inprogress_iof"
  | "pending_judiciary"
  | "pending_sponsor"
  | "pending_indian_authority"
  | "pending_police"
  | "pending_medical"
  | "completed"
  | "closed_finance";

export type Priority = "low" | "medium" | "high" | "critical";
/** NEW – assignment workflow state, independent of the Excel status. */
export type AssignmentState = "draft" | "awaiting_assignment" | "assigned" | "transfer_pending";

export interface Province {
  code: string; // e.g. "IOF-EP-Dammam" (exact Excel dropdown value)
  name: string;
  region: RegionCode;
  kind: "national" | "region" | "chapter";
  active: boolean;
  /** case-number prefix, configurable per committee (default = first 6 chars of code) */
  prefix?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  provinceCode: string;
  active: boolean;
  title: string;
  notifyEmail?: boolean;
  notifyWhatsapp?: boolean;
  whatsapp?: string;
}

export interface IssueType {
  id: string;
  name: string; // exact Excel value
  category: string;
  description: string;
  active: boolean;
  defaultPriority: Priority;
}

export type TimelineType =
  | "created"
  | "assigned"
  | "transferred"
  | "status"
  | "update"
  | "remark"
  | "followup"
  | "document"
  | "resolved";

export interface TimelineEvent {
  id: string;
  type: TimelineType;
  at: string;
  actorId: string;
  text: string;
  internal?: boolean; // internal remark – hidden from non-staff in a real build
  meta?: Record<string, string>;
}

export interface CaseDocument {
  id: string;
  name: string;
  kind: "supporting" | "medical" | "identity";
  sizeKb: number;
  mime: string;
  uploadedBy: string;
  at: string;
  /** data-URL, only while a file is being uploaded (Odoo stores it as a private attachment) */
  data?: string;
}

export interface FinanceEntry {
  id: string;
  date: string;
  description: string;
  amountSAR: number;
  paidBy: "IOF" | "Sponsor" | "Other organisation" | "Relatives";
}

export interface Transfer {
  id: string;
  caseId: string;
  fromProvince: string;
  toProvince: string;
  reason: string;
  requestedBy: string;
  at: string;
  status: "pending" | "accepted" | "rejected";
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
  caseNo?: string;
  caseName?: string;
  originalReporter?: string;
}

export interface AssignmentRecord {
  id: string;
  caseId: string;
  at: string;
  byId: string;
  toId: string | null; // coordinator / handler
  province: string;
  note?: string;
}

export interface Case {
  id: string;
  /** Excel: SL */
  sl: number;
  /** Excel: CASE NO  (= LEFT(handling committee,6) & "-" & SL, frozen at registration) */
  caseNo: string;
  /** Excel: Case Name */
  name: string;
  /** NEW – one-line summary */
  summary: string;
  /** Excel: Case in details */
  details: string;
  /** Excel: Contact Details (reporting person contact) */
  contactDetails: string;
  /** NEW – reporting person / staff */
  reportingPerson: string;
  reportingCoordinatorId: string | null;
  /** Excel: Case report form → reporting province / source */
  reportedFrom: string;
  /** Excel: Case Handeling committee → responsible province */
  handlingCommittee: string;
  /** Excel: Handelled by (IOF representative) */
  handledById: string | null;
  /** Excel: Date of Case Register In IOF */
  registeredOn: string;
  /** Excel: Issue Type */
  issueTypeId: string;
  priority: Priority; // NEW
  /** Excel: Location Region KSA */
  regionKSA: string;
  country: string; // NEW (default Saudi Arabia)
  /** Excel: State / District / Village in Bharath */
  stateIndia: string;
  districtIndia: string;
  village: string;
  fullAddress: string; // NEW
  /** Excel: Local ID or Passport Details */
  localIdPassport: string;
  /** Excel: Contact det of Victim or Depended */
  victimName: string; // NEW
  victimContact: string;
  alternateContact: string; // NEW
  dependents: string; // NEW
  /** Excel: Case Reference By Name and Details */
  referenceBy: string;
  referenceDetails: string; // NEW
  /** Excel: Sponsor details Mob No */
  sponsorName: string; // NEW (split)
  sponsorMobile: string; // NEW (split)
  sponsorDetails: string;
  /** Excel: IOF Involvements */
  iofInvolvement: string;
  /** Excel: Initial Status */
  initialStatus: StatusId;
  /** Excel: Others organization involvements */
  othersInvolvement: string;
  /** Excel: If any Financial Expenses or Seva */
  financialExpenses: string;
  sevaSupport: string; // NEW
  /** Excel: Remarks */
  remarks: string;
  /** Excel: OLD */
  oldStatus: string;
  /** Excel: Status New (to be followed henceforth) */
  status: StatusId;
  // —— NEW workflow fields ——
  assignment: AssignmentState;
  originalReportingProvince: string; // never changes on transfer
  createdById: string;
  updatedAt: string;
  resolvedAt?: string;
  source: "excel" | "portal" | "website";
  timeline: TimelineEvent[];
  documents: CaseDocument[];
  /** set by Odoo (authoritative); absent in demo mode */
  canAssign?: boolean;
  canUpdate?: boolean;
  resolutionNote?: string;
  finance: FinanceEntry[];
  assignments: AssignmentRecord[];
}

export interface Notification {
  id: string;
  kind: "assigned" | "transferred" | "critical" | "pending_assignment" | "status" | "followup";
  title: string;
  body: string;
  at: string;
  read: boolean;
  caseId?: string;
  /** region visibility – demo only, real enforcement is server-side */
  forRoles: Role[];
  forRegion?: RegionCode;
  forUserId?: string;
}

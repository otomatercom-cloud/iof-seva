import type { Case, IssueType, User } from "./types";
import { statusById } from "./reference-data";

/** Column headers & order are identical to sheet "IOF CASE 2026" so exports can be pasted back into the legacy register. */
export const EXCEL_HEADERS = [
  "SL", "CASE NO", "Case Name", "Contact Details", "Case report form", "Case Handeling committee", "Handelled by",
  "Date of Case Register In IOF", "Issue Type", "Case in details", "Location Region KSA", "State in Bharath", "District in Bharath",
  "Village/Town", "Local ID or  Passport Details", "Contact det of Victim or Depended", "Case Reference By Name and Details",
  "Sponsor details Mob No", "IOF Involvements", "Initial Status", "Others organization involvements", "If any Financial Expenses or Seva",
  "Remarks", "OLD", "Status New(to be followed hence forth)",
];

export function caseToExcelRow(c: Case, users: User[], issues: IssueType[]): (string | number)[] {
  const handler = users.find((u) => u.id === c.handledById)?.name ?? "";
  return [
    c.sl, c.caseNo, c.name, c.contactDetails, c.reportedFrom, c.handlingCommittee, handler, c.registeredOn,
    issues.find((i) => i.id === c.issueTypeId)?.name ?? "", c.details, c.regionKSA, c.stateIndia, c.districtIndia, c.village,
    c.localIdPassport, [c.victimName, c.victimContact, c.alternateContact].filter(Boolean).join(" / "),
    [c.referenceBy, c.referenceDetails].filter(Boolean).join(" – "), [c.sponsorName, c.sponsorMobile, c.sponsorDetails].filter(Boolean).join(" · "),
    c.iofInvolvement, statusById(c.initialStatus).excel, c.othersInvolvement, c.financialExpenses, c.remarks, c.oldStatus, statusById(c.status).excel,
  ];
}

const esc = (v: string | number) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadCSV(filename: string, rows: Case[], users: User[], issues: IssueType[]) {
  const lines = [EXCEL_HEADERS, ...rows.map((r) => caseToExcelRow(r, users, issues))].map((r) => r.map(esc).join(","));
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

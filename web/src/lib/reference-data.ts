import type { IssueType, Priority, Province, RegionCode, Role, StatusBucket, StatusId } from "./types";

/**
 * Reference values taken verbatim from the sheet "DND-Dropdown_list" of IOF_Seva_Register_2026.xlsx.
 * `excel` keeps the exact legacy string so CSV/Excel round-trips stay lossless.
 */

// Column A "Resposible IOF" (also column E "Case informed by")
export const PROVINCES: Province[] = [
  { code: "IOF-NC", name: "National Committee", region: "NC", kind: "national", active: true },
  { code: "IOF-EP", name: "Eastern Province", region: "EP", kind: "region", active: true },
  { code: "IOF-EP-Dammam", name: "Eastern Province · Dammam", region: "EP", kind: "chapter", active: true },
  { code: "IOF-EP-Jubail", name: "Eastern Province · Jubail", region: "EP", kind: "chapter", active: true },
  { code: "IOF-EP-AlHasa", name: "Eastern Province · Al-Hasa", region: "EP", kind: "chapter", active: true },
  { code: "IOF-EP-Kobhar", name: "Eastern Province · Khobar", region: "EP", kind: "chapter", active: true },
  { code: "IOF-CP", name: "Central Province", region: "CP", kind: "region", active: true },
  { code: "IOF-CP-Riyad", name: "Central Province · Riyadh", region: "CP", kind: "chapter", active: true },
  { code: "IOF-WP", name: "Western Province", region: "WP", kind: "region", active: true },
  { code: "IOF-WP-Jeedha", name: "Western Province · Jeddah", region: "WP", kind: "chapter", active: true },
];

// Column E "Case informed by" – extra non-IOF sources
export const EXTERNAL_SOURCES = ["Matur Sangathan", "Embassy committed", "Relatives of the Victims", "Local Community"];
export const REPORT_SOURCES = [...PROVINCES.map((p) => p.code), ...EXTERNAL_SOURCES];

export const REGIONS: Record<RegionCode, { name: string; short: string }> = {
  NC: { name: "National Committee", short: "National" },
  EP: { name: "Eastern Province", short: "Eastern" },
  CP: { name: "Central Province", short: "Central" },
  WP: { name: "Western Province", short: "Western" },
};

// Column B "Select Status" (exact strings in `excel`)
export const STATUSES: { id: StatusId; excel: string; label: string; bucket: StatusBucket }[] = [
  { id: "open_new", excel: "Open(new)", label: "Open (New)", bucket: "new" },
  { id: "inprogress_iof", excel: "Inprogress - Pending IOF work", label: "In progress · IOF work", bucket: "in_progress" },
  { id: "pending_judiciary", excel: "Inprogress - Pending Saudi Judiciary", label: "Pending · Saudi Judiciary", bucket: "pending" },
  { id: "pending_sponsor", excel: "Inprogress - Pending Sponor Activity", label: "Pending · Sponsor", bucket: "pending" },
  { id: "pending_indian_authority", excel: "Inprogress - Pending Indian Authority", label: "Pending · Indian Authority", bucket: "pending" },
  { id: "pending_police", excel: "Inprogress - Pending Saudi Police", label: "Pending · Saudi Police", bucket: "pending" },
  { id: "pending_medical", excel: "Inprogress - Pending Medical", label: "Pending · Medical", bucket: "pending" },
  { id: "completed", excel: "Completed", label: "Completed", bucket: "resolved" },
  { id: "closed_finance", excel: "Closed- Including Finance", label: "Closed · incl. Finance", bucket: "closed" },
];
export const statusById = (id: StatusId) => STATUSES.find((s) => s.id === id)!;

// Column C "Issue Type" (seed for the dynamic Issue Type master)
export const SEED_ISSUE_TYPES: IssueType[] = [
  { id: "it1", name: "Work contract issue", category: "Labour", description: "Contract violation, unpaid wages, final exit disputes.", active: true, defaultPriority: "medium" },
  { id: "it2", name: "Jailed - financial issue", category: "Legal", description: "Detained over debts, cheques or financial claims.", active: true, defaultPriority: "high" },
  { id: "it3", name: "Jailed - violent Crime", category: "Legal", description: "Detained in connection with a violent-crime allegation.", active: true, defaultPriority: "critical" },
  { id: "it4", name: "Jailed Labour Issue", category: "Legal", description: "Detained over labour-law or iqama/visa violations.", active: true, defaultPriority: "high" },
  { id: "it5", name: "Hospitalized", category: "Medical", description: "Hospital admission, treatment support, medical repatriation.", active: true, defaultPriority: "high" },
  { id: "it6", name: "Death - Natural", category: "Death & Repatriation", description: "Natural death – documentation and mortal remains repatriation.", active: true, defaultPriority: "high" },
  { id: "it7", name: "Death - UnNatural", category: "Death & Repatriation", description: "Accident, suicide or suspicious death – police and embassy process.", active: true, defaultPriority: "critical" },
];
export const ISSUE_CATEGORIES = ["Labour", "Legal", "Medical", "Death & Repatriation", "Welfare", "Other"];

// Column D "IOF Representative"
export const IOF_REPRESENTATIVES = ["Devendar", "Mukesh", "Libin", "Sivaprasath", "Somesh", "Suresh", "Anil"];

export const PRIORITIES: { id: Priority; label: string; rank: number }[] = [
  { id: "critical", label: "Critical", rank: 4 },
  { id: "high", label: "High", rank: 3 },
  { id: "medium", label: "Medium", rank: 2 },
  { id: "low", label: "Low", rank: 1 },
];

export const ROLE_LABEL: Record<Role, string> = {
  president: "Overall President",
  secretary: "Secretary",
  province_head: "Province Head",
  coordinator: "Province Coordinator",
  handler: "Case Handler",
};

export const KSA_REGIONS: Record<string, string[]> = {
  EP: ["Dammam", "Al Khobar", "Dhahran", "Jubail", "Al-Hasa (Hofuf)", "Qatif", "Hafar Al-Batin", "Ras Tanura"],
  CP: ["Riyadh", "Al Kharj", "Buraidah (Qassim)", "Unaizah", "Hail", "Dawadmi"],
  WP: ["Jeddah", "Makkah", "Madinah", "Taif", "Yanbu", "Tabuk", "Abha", "Jizan"],
  NC: ["Riyadh", "Jeddah", "Dammam"],
};

/** Indian State → Districts (cascading dropdowns). Other states fall back to free text. */
export const INDIA_GEO: Record<string, string[]> = {
  Kerala: ["Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Thanjavur", "Ramanathapuram", "Kanyakumari", "Vellore", "Erode"],
  Telangana: ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad", "Adilabad", "Khammam", "Nalgonda", "Jagtial"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada (NTR)", "Guntur", "Kadapa", "Kurnool", "Chittoor", "East Godavari", "Nellore"],
  Karnataka: ["Bengaluru Urban", "Mysuru", "Mangaluru (Dakshina Kannada)", "Udupi", "Belagavi", "Kalaburagi", "Uttara Kannada"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Kolhapur", "Thane"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Azamgarh", "Gorakhpur", "Allahabad (Prayagraj)", "Agra", "Moradabad"],
  Bihar: ["Patna", "Gaya", "Muzaffarpur", "Siwan", "Darbhanga", "Bhagalpur", "Saran"],
  "West Bengal": ["Kolkata", "Howrah", "Murshidabad", "Nadia", "North 24 Parganas", "Malda"],
  Punjab: ["Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Hoshiarpur", "Kapurthala"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Sikar", "Jhunjhunu", "Kota"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bharuch"],
  Odisha: ["Bhubaneswar (Khordha)", "Cuttack", "Ganjam", "Puri", "Sambalpur"],
  Jharkhand: ["Ranchi", "Dhanbad", "Jamshedpur (East Singhbhum)", "Hazaribagh"],
  Assam: ["Guwahati (Kamrup)", "Dibrugarh", "Silchar (Cachar)", "Nagaon"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
  Other: [],
};

export const DOC_KIND_LABEL = { supporting: "Supporting", medical: "Medical report", identity: "Identity" } as const;
export const FINANCE_PAYERS = ["IOF", "Sponsor", "Other organisation", "Relatives"] as const;

/** Case-number prefix – a per-committee setting (Odoo: otm.iof.committee.case_prefix). Case numbers are frozen at registration. */
export const casePrefixOf = (code: string, list: Province[] = PROVINCES) => list.find((p) => p.code === code)?.prefix || code.slice(0, 6);

export const regionOf = (code: string): RegionCode | null =>
  (PROVINCES.find((p) => p.code === code)?.region as RegionCode) ?? null;
export const provinceName = (code: string) => PROVINCES.find((p) => p.code === code)?.name ?? code;

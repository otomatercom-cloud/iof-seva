export const V_STATES: Record<string, { label: string; tone: "blue" | "saffron" | "violet" | "green" | "red" }> = {
  new: { label: "New", tone: "blue" }, under_review: { label: "Under review", tone: "saffron" }, contacted: { label: "Contacted", tone: "violet" },
  approved: { label: "Approved", tone: "green" }, rejected: { label: "Rejected", tone: "red" },
};
export interface VolunteerRow {
  id: string; ref: string; name: string; mobile: string; email: string; city: string; state: string; date: string;
  memberNo: string; cardStatus: string; portalUser: string; source: string;
}
export interface VolunteerList { rows: VolunteerRow[]; total: number; page: number; size: number; counts: Record<string, number>; cities: { value: string; label: string }[]; cards: boolean }
export type VolunteerDetail = VolunteerRow & Record<string, string | boolean | number | string[]> & { interests: string[]; hasCards: boolean; photo: string };

import "server-only";
import type { VolunteerRegistration } from "@/lib/validation/volunteer-registration";
import { odooPost } from "./client";

/** Map validated form values to the Odoo API contract (explicit allowlist, no spreading). */
export function toOdooPayload(v: VolunteerRegistration) {
  return {
    first_name: v.first_name, last_name: v.last_name, gender: v.gender,
    date_of_birth: v.date_of_birth, nationality: v.nationality, iqama_number: v.iqama_number,
    saudi_city: v.saudi_city, mobile: v.mobile, whatsapp: v.whatsapp, email: v.email,
    address: v.address, city: v.city, region: v.region, occupation: v.occupation,
    organization: v.organization, qualification: v.qualification, interests: v.interests,
    other_interest: v.other_interest, special_skills: v.special_skills, experience: v.experience,
    languages: v.languages, availability: v.availability, hours_per_month: v.hours_per_month,
    emergency_name: v.emergency_name, emergency_relationship: v.emergency_relationship,
    emergency_phone: v.emergency_phone, consent: v.consent, photo: v.photo || undefined,
  };
}

export async function createVolunteerRegistration(v: VolunteerRegistration, idempotencyKey: string) {
  const { data } = await odooPost<{ ok: boolean; reference?: string }>(
    "/api/iof/volunteer-registration",
    toOdooPayload(v),
    { "Idempotency-Key": idempotencyKey },
  );
  if (!data.ok || !data.reference) throw new Error("unexpected_odoo_response");
  return data.reference;
}

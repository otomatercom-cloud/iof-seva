import { z } from "zod";

export const SAUDI_CITIES = [
  ["riyadh", "Riyadh"], ["jeddah", "Jeddah"], ["dammam", "Dammam"], ["khobar", "Khobar"],
  ["dhahran", "Dhahran"], ["makkah", "Makkah"], ["madinah", "Madinah"], ["taif", "Taif"],
  ["abha", "Abha"], ["tabuk", "Tabuk"], ["qassim", "Al Qassim (Buraidah)"], ["hail", "Hail"],
  ["najran", "Najran"], ["jazan", "Jazan"], ["ahsa", "Al Ahsa (Hofuf)"], ["yanbu", "Yanbu"],
  ["jubail", "Jubail"], ["other", "Other"],
] as const;

export const INTERESTS = [
  ["community_service", "Community Service"],
  ["blood_donation", "Blood Donation Campaigns"],
  ["education", "Educational Programs"],
  ["cultural", "Cultural Events"],
  ["youth", "Youth Activities"],
  ["women_empowerment", "Women's Empowerment Programs"],
  ["medical_support", "Medical Support Activities"],
  ["disaster_relief", "Disaster Relief & Emergency Assistance"],
  ["event_management", "Event Management"],
  ["digital_support", "Social Media & Digital Support"],
  ["fundraising", "Fundraising Activities"],
  ["other", "Other (Specify)"],
] as const;

export const AVAILABILITY = [
  ["weekdays", "Available on Weekdays"],
  ["weekends", "Available on Weekends"],
  ["emergency", "Available for Emergency Support"],
] as const;

export const GENDERS = [["male", "Male"], ["female", "Female"], ["other", "Other"]] as const;

const PHONE_RE = /^\+?[0-9][0-9\s\-()]{6,19}$/;
const CTRL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g;

// Missing/null optional fields are treated as empty strings.
const clean = (v: unknown) => (typeof v === "string" ? v.replace(CTRL_RE, "").trim() : (v ?? ""));

const text = (max: number) => z.preprocess(clean, z.string().max(max, `Maximum ${max} characters`));
const requiredText = (max: number) =>
  z.preprocess(clean, z.string().min(1, "This field is required").max(max, `Maximum ${max} characters`));
const optionalPhone = z.preprocess(
  clean,
  z.string().refine((v) => v === "" || PHONE_RE.test(v), "Enter a valid phone number"),
);
const oneOf = <T extends readonly (readonly [string, string])[]>(options: T) =>
  z.preprocess(
    clean,
    z.string().refine((v) => v === "" || options.some(([k]) => k === v), "Invalid choice"),
  );

export const volunteerRegistrationSchema = z.object({
  first_name: requiredText(80),
  last_name: requiredText(80),
  gender: oneOf(GENDERS),
  date_of_birth: z.preprocess(
    clean,
    z.string().refine((v) => {
      if (v === "") return true;
      const d = new Date(v);
      return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(d.getTime()) && d < new Date() &&
        d.getFullYear() > new Date().getFullYear() - 110;
    }, "Enter a valid date of birth"),
  ),
  nationality: text(80),
  iqama_number: text(20),
  saudi_city: oneOf(SAUDI_CITIES),
  mobile: z.preprocess(
    clean,
    z.string().min(1, "This field is required").regex(PHONE_RE, "Enter a valid phone number"),
  ),
  whatsapp: optionalPhone,
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.replace(CTRL_RE, "").trim().toLowerCase() : (v ?? "")),
    z.string().min(1, "This field is required").max(254).email("Enter a valid email address"),
  ),
  address: text(500),
  city: text(80),
  region: text(80),
  occupation: text(120),
  organization: text(120),
  qualification: text(120),
  interests: z.array(z.enum(INTERESTS.map(([k]) => k) as [string, ...string[]])).max(12).default([]),
  other_interest: text(120),
  special_skills: text(2000),
  experience: text(2000),
  languages: text(200),
  availability: z.array(z.enum(AVAILABILITY.map(([k]) => k) as [string, ...string[]])).max(3).default([]),
  hours_per_month: text(20),
  emergency_name: text(120),
  emergency_relationship: text(80),
  emergency_phone: optionalPhone,
  consent: z.literal(true, { errorMap: () => ({ message: "You must accept the declaration to register" }) }),
});

/** Submitted body = form values + honeypot (must stay empty). */
export const submissionSchema = volunteerRegistrationSchema.extend({
  website: z.string().max(0).optional(),
});

export type VolunteerRegistrationInput = z.input<typeof volunteerRegistrationSchema>;
export type VolunteerRegistration = z.output<typeof volunteerRegistrationSchema>;

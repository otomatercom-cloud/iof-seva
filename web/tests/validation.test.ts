import { describe, expect, it } from "vitest";
import { submissionSchema, volunteerRegistrationSchema } from "@/lib/validation/volunteer-registration";

const valid = {
  first_name: " Asha ", last_name: "Nair", mobile: "+966 50 123 4567", email: "Asha@Example.com", consent: true,
};

describe("volunteer registration schema", () => {
  it("accepts the minimal required set and normalises values", () => {
    const r = volunteerRegistrationSchema.parse(valid);
    expect(r.first_name).toBe("Asha");
    expect(r.email).toBe("asha@example.com");
    expect(r.interests).toEqual([]);
  });

  it.each(["first_name", "last_name", "mobile", "email"])("requires %s", (field) => {
    const r = volunteerRegistrationSchema.safeParse({ ...valid, [field]: "" });
    expect(r.success).toBe(false);
  });

  it("requires explicit consent", () => {
    expect(volunteerRegistrationSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
    expect(volunteerRegistrationSchema.safeParse({ ...valid, consent: "true" }).success).toBe(false);
  });

  it.each(["not-an-email", "a@b", "a b@c.com"])("rejects invalid email %s", (email) => {
    expect(volunteerRegistrationSchema.safeParse({ ...valid, email }).success).toBe(false);
  });

  it.each(["abc", "12", "+966-abc-123"])("rejects invalid phone %s", (mobile) => {
    expect(volunteerRegistrationSchema.safeParse({ ...valid, mobile }).success).toBe(false);
  });

  it("rejects future and malformed birth dates, accepts empty", () => {
    expect(volunteerRegistrationSchema.safeParse({ ...valid, date_of_birth: "2999-01-01" }).success).toBe(false);
    expect(volunteerRegistrationSchema.safeParse({ ...valid, date_of_birth: "12/04/1990" }).success).toBe(false);
    expect(volunteerRegistrationSchema.safeParse({ ...valid, date_of_birth: "1990-04-12" }).success).toBe(true);
    expect(volunteerRegistrationSchema.safeParse({ ...valid, date_of_birth: "" }).success).toBe(true);
  });

  it("rejects unknown interests and strips unknown keys (no mass assignment)", () => {
    expect(volunteerRegistrationSchema.safeParse({ ...valid, interests: ["hacking"] }).success).toBe(false);
    const r = volunteerRegistrationSchema.parse({ ...valid, state: "approved", id: 1 });
    expect(r).not.toHaveProperty("state");
    expect(r).not.toHaveProperty("id");
  });

  it("enforces length limits", () => {
    expect(volunteerRegistrationSchema.safeParse({ ...valid, special_skills: "x".repeat(2001) }).success).toBe(false);
  });

  it("honeypot must stay empty", () => {
    expect(submissionSchema.safeParse({ ...valid, website: "http://spam" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...valid, website: "" }).success).toBe(true);
  });
});

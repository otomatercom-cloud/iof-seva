"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxGroup, SelectField, TextAreaField, TextField } from "@/components/ui/form-fields";
import {
  AVAILABILITY, GENDERS, INTERESTS, SAUDI_CITIES, volunteerRegistrationSchema,
  type VolunteerRegistration,
} from "@/lib/validation/volunteer-registration";
import type { SubmitResult } from "@/types/volunteer-registration";

const defaults: VolunteerRegistration = {
  first_name: "", last_name: "", gender: "", date_of_birth: "", nationality: "", iqama_number: "",
  saudi_city: "", mobile: "", whatsapp: "", email: "", address: "", city: "", region: "",
  occupation: "", organization: "", qualification: "", interests: [], other_interest: "",
  special_skills: "", experience: "", languages: "", availability: [], hours_per_month: "",
  emergency_name: "", emergency_relationship: "", emergency_phone: "", consent: false as unknown as true,
};

const newKey = () => crypto.randomUUID();

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 p-5 sm:p-6">
      <legend className="px-2 text-lg font-bold text-navy-900">{title}</legend>
      <div className="mt-2 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function VolunteerForm() {
  const {
    register, handleSubmit, control, setError, reset, watch, formState: { errors, isSubmitting },
  } = useForm<VolunteerRegistration>({
    // zod preprocessors make the input type opaque; the output type is what the form edits.
    resolver: zodResolver(volunteerRegistrationSchema) as unknown as Resolver<VolunteerRegistration>,
    defaultValues: defaults,
    mode: "onTouched",
  });

  // One key per attempt: a retry of the same submission can never create a second record.
  const idempotencyKey = useRef<string | null>(null);
  const inFlight = useRef(false);
  const [reference, setReference] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const showsOther = watch("interests")?.includes("other");
  const err = (name: keyof VolunteerRegistration) => errors[name]?.message as string | undefined;
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(values: VolunteerRegistration) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBanner(null);
    idempotencyKey.current ??= newKey();
    const honeypot = (document.getElementById("website") as HTMLInputElement | null)?.value ?? "";
    try {
      const res = await fetch("/api/volunteer-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify({ ...values, website: honeypot }),
      });
      const result = (await res.json().catch(() => null)) as SubmitResult | null;
      if (res.ok && result?.ok) {
        setReference(result.reference);
        idempotencyKey.current = null;
        reset(defaults);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (result && !result.ok && result.fields) {
        for (const [field, message] of Object.entries(result.fields)) {
          setError(field as keyof VolunteerRegistration, { message });
        }
        // The data changed server-side expectations: the next attempt is a new submission.
        idempotencyKey.current = null;
      }
      setBanner(result && !result.ok ? result.message : "Something went wrong and your registration was not saved. Please try again.");
    } catch {
      setBanner("We could not reach the server. Your registration was not saved. Please check your connection and try again.");
    } finally {
      inFlight.current = false;
    }
  }

  if (reference) {
    return (
      <Card className="mx-auto max-w-2xl text-center sm:p-10" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto size-14 text-seva-700" aria-hidden />
        <h2 className="mt-4 text-2xl">Registration received</h2>
        <p className="mt-3 text-slate-600">
          Thank you for your interest in volunteering with India Overseas Forum. Your registration has been received
          successfully. Please keep your registration reference for future communication.
        </p>
        <p className="mt-6 text-sm text-slate-500">Your registration reference</p>
        <p data-testid="reference" className="mt-1 text-3xl font-bold tracking-wide text-navy-900">{reference}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" variant="secondary">Back to home</ButtonLink>
          <Button type="button" variant="ghost" onClick={() => setReference(null)}>Register another volunteer</Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-4xl space-y-6" aria-label="Volunteer registration">
      <p className="text-sm text-slate-500"><span className="text-red-700">*</span> Required field</p>

      {banner && <Alert tone="error" title="Registration not saved">{banner}</Alert>}

      <SectionCard title="Personal details">
        <TextField label="First name" required autoComplete="given-name" error={err("first_name")} {...register("first_name")} />
        <TextField label="Last name" required autoComplete="family-name" error={err("last_name")} {...register("last_name")} />
        <SelectField label="Gender" options={GENDERS} error={err("gender")} {...register("gender")} />
        <TextField label="Date of birth" type="date" max={today} error={err("date_of_birth")} {...register("date_of_birth")} />
        <TextField label="Nationality" error={err("nationality")} {...register("nationality")} />
        <TextField label="Iqama number (optional)" error={err("iqama_number")} {...register("iqama_number")} />
        <SelectField label="City in Saudi Arabia" options={SAUDI_CITIES} error={err("saudi_city")} {...register("saudi_city")} />
      </SectionCard>

      <SectionCard title="Contact details">
        <TextField label="Mobile number" required type="tel" autoComplete="tel" placeholder="+966 5X XXX XXXX"
          hint="Include the country code" error={err("mobile")} {...register("mobile")} />
        <TextField label="WhatsApp number" type="tel" placeholder="+966 5X XXX XXXX" error={err("whatsapp")} {...register("whatsapp")} />
        <TextField label="Email address" required type="email" autoComplete="email" error={err("email")} {...register("email")} />
        <div className="hidden sm:block" />
        <div className="sm:col-span-2">
          <TextAreaField label="Current residential address" error={err("address")} {...register("address")} />
        </div>
        <TextField label="City" error={err("city")} {...register("city")} />
        <TextField label="Region/Province" error={err("region")} {...register("region")} />
      </SectionCard>

      <SectionCard title="Professional background">
        <TextField label="Occupation" error={err("occupation")} {...register("occupation")} />
        <TextField label="Company/Organization name" error={err("organization")} {...register("organization")} />
        <TextField label="Educational qualification" error={err("qualification")} {...register("qualification")} />
      </SectionCard>

      <SectionCard title="Volunteering">
        <div className="sm:col-span-2">
          <Controller
            control={control}
            name="interests"
            render={({ field }) => (
              <CheckboxGroup legend="Volunteer interests" options={INTERESTS}
                value={(field.value as string[]) ?? []} onChange={field.onChange} error={err("interests")} />
            )}
          />
        </div>
        {showsOther && (
          <div className="sm:col-span-2">
            <TextField label="Other interest (please specify)" error={err("other_interest")} {...register("other_interest")} />
          </div>
        )}
        <div className="sm:col-span-2"><TextAreaField label="Special skills" error={err("special_skills")} {...register("special_skills")} /></div>
        <div className="sm:col-span-2"><TextAreaField label="Previous volunteer experience" error={err("experience")} {...register("experience")} /></div>
        <TextField label="Languages known" error={err("languages")} {...register("languages")} />
        <TextField label="Hours available per month" inputMode="numeric" error={err("hours_per_month")} {...register("hours_per_month")} />
        <div className="sm:col-span-2">
          <Controller
            control={control}
            name="availability"
            render={({ field }) => (
              <CheckboxGroup legend="Availability" options={AVAILABILITY} columns={1}
                value={(field.value as string[]) ?? []} onChange={field.onChange} error={err("availability")} />
            )}
          />
        </div>
      </SectionCard>

      <SectionCard title="Emergency contact">
        <TextField label="Emergency contact name" error={err("emergency_name")} {...register("emergency_name")} />
        <TextField label="Relationship" error={err("emergency_relationship")} {...register("emergency_relationship")} />
        <TextField label="Emergency contact number" type="tel" placeholder="+966 5X XXX XXXX" error={err("emergency_phone")} {...register("emergency_phone")} />
      </SectionCard>

      <fieldset className="rounded-2xl border border-slate-200 bg-navy-50/50 p-5 sm:p-6">
        <legend className="px-2 text-lg font-bold text-navy-900">Declaration &amp; consent</legend>
        <p className="text-sm leading-relaxed text-slate-700">
          I hereby confirm that the information provided is true and accurate. I voluntarily agree to participate in IOF
          Seva activities and consent to being contacted regarding volunteer opportunities, events, and community
          service initiatives. See our <a href="/privacy-policy" className="font-medium text-navy-900 underline">Privacy Policy</a>.
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm font-medium text-navy-900">
          <input type="checkbox" className="mt-0.5 size-5 accent-[var(--color-navy-900)]" aria-required
            aria-invalid={!!errors.consent} {...register("consent")} />
          <span>I Agree <span className="text-red-700" aria-hidden>*</span><span className="sr-only">(required)</span></span>
        </label>
        {errors.consent && <p className="mt-2 text-xs font-medium text-red-700">{err("consent")}</p>}
      </fieldset>

      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="min-w-52">
          {isSubmitting ? (<><Loader2 className="size-4 animate-spin" aria-hidden /> Submitting…</>) : "Register as a Volunteer"}
        </Button>
        <Button type="button" variant="ghost" disabled={isSubmitting} onClick={() => { reset(defaults); setBanner(null); idempotencyKey.current = null; }}>
          Reset form
        </Button>
      </div>
    </form>
  );
}

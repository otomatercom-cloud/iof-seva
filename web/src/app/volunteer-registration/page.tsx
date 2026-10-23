import type { Metadata } from "next";
import { VolunteerForm } from "@/components/forms/volunteer-form";
import { PageHero } from "@/components/sections/page-hero";

export const metadata: Metadata = {
  title: "Volunteer Registration",
  description: "Join India Overseas Forum's volunteer team to support the Indian community across Saudi Arabia.",
};

export default function VolunteerRegistrationPage() {
  return (
    <>
      <PageHero
        title="Register as an IOF Volunteer"
        intro="Become a volunteer and help strengthen our Indian community in Saudi Arabia. Tell us about yourself and where you would like to help."
      />
      <div className="px-4 pb-20 sm:px-6">
        <VolunteerForm />
      </div>
    </>
  );
}

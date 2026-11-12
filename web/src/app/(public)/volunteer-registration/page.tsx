import type { Metadata } from "next";
import { VolunteerRegistrationPage } from "@/public/components/pages/volunteer-registration";

export const metadata: Metadata = {
  title: "Volunteer Registration",
  description: "Join India Overseas Forum's volunteer team to support the Indian community across Saudi Arabia.",
};

export default function Page() {
  return <VolunteerRegistrationPage />;
}

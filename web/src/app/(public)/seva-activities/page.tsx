import type { Metadata } from "next";
import { SevaActivitiesPage } from "@/public/components/pages/seva-activities";
import { getContent } from "@/public/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getContent()).t("nav.seva") };
}

export default function Page() {
  return <SevaActivitiesPage />;
}

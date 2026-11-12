import type { Metadata } from "next";
import { ReportsPage } from "@/public/components/pages/reports";
import { getContent } from "@/public/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getContent()).t("nav.reports") };
}

export default function Page() {
  return <ReportsPage />;
}

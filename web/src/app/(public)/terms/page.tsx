import type { Metadata } from "next";
import { TermsPage } from "@/public/components/pages/terms";
import { getContent } from "@/public/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getContent()).t("terms.title") };
}

export default function Page() {
  return <TermsPage />;
}

import type { Metadata } from "next";
import { PrivacyPage } from "@/public/components/pages/privacy-policy";
import { getContent } from "@/public/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getContent()).t("privacy.title") };
}

export default function Page() {
  return <PrivacyPage />;
}

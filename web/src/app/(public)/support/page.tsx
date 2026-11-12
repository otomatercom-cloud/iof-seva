import type { Metadata } from "next";
import { SupportPage } from "@/public/components/pages/support";
import { getContent } from "@/public/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return { title: c.t("nav.support"), description: c.t("support.intro") };
}

export default function Page() {
  return <SupportPage />;
}

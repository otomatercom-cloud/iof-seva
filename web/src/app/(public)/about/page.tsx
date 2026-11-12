import type { Metadata } from "next";
import { AboutPage } from "@/public/components/pages/about";
import { getContent } from "@/public/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getContent()).t("nav.about") };
}

export default function Page() {
  return <AboutPage />;
}

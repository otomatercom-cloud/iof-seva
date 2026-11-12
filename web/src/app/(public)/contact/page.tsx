import type { Metadata } from "next";
import { ContactPage } from "@/public/components/pages/contact";
import { getContent } from "@/public/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getContent()).t("contact.title") };
}

export default function Page() {
  return <ContactPage />;
}

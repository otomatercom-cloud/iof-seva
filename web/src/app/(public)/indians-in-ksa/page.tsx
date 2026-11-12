import type { Metadata } from "next";
import { IndiansInKsaPage } from "@/public/components/pages/indians-in-ksa";
import { getContent } from "@/public/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getContent()).t("nav.indians") };
}

export default function Page() {
  return <IndiansInKsaPage />;
}

import type { Metadata } from "next";
import { CollaborationsPage } from "@/public/components/pages/collaborations";
import { getContent } from "@/public/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getContent()).t("nav.collab") };
}

export default function Page() {
  return <CollaborationsPage />;
}

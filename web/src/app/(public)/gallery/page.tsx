import type { Metadata } from "next";
import { GalleryPage } from "@/public/components/pages/gallery";
import { getContent } from "@/public/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return { title: c.t("gallery.title"), description: c.t("gallery.intro") };
}

export default function Page() {
  return <GalleryPage />;
}

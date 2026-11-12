import type { Metadata } from "next";
import { TrackPage } from "@/public/components/pages/support-track";
import { getContent } from "@/public/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return { title: c.t("track.title"), robots: { index: false } };
}

export default function Page() {
  return <TrackPage />;
}

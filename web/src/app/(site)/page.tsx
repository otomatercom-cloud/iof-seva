import type { Metadata } from "next";
import { SiteHome } from "@/components/site/site-home";

export const metadata: Metadata = {
  title: "India Overseas Forum · Seva",
  description: "IOF Seva – legal, medical and welfare support for Indian expatriates across Saudi Arabia.",
};
export default function Page() {
  return <SiteHome />;
}

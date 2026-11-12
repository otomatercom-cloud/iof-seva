import Link from "next/link";
import { TrackForm } from "@/public/components/forms/track-form";
import { PageHero, Section } from "@/public/components/sections/page-hero";
import { getContent } from "@/public/lib/content";
import { Sections } from "@/public/components/sections/sections";

export async function TrackPage({ editing = false }: { editing?: boolean }) {
  const c = await getContent(editing);
  return (
    <Sections page="support-track" c={c} defs={[
    { id: "s1", label: "Section 1", node: (
          <PageHero title={c.e("track.title")} intro={c.e("track.intro")} />
    ) },
    { id: "s2", label: "Section 2", node: (
          <Section>
            <div className="mx-auto max-w-3xl">
              <TrackForm />
              <p className="mt-8 text-center text-sm text-slate-600">
                <Link href="/support" className="font-semibold text-navy-900 underline">{c.e("track.new")}</Link>
              </p>
            </div>
          </Section>
    ) },
    ]} />
  );
}

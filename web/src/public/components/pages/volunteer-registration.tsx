import { VolunteerForm } from "@/public/components/forms/volunteer-form";
import { getContent } from "@/public/lib/content";
import { Sections } from "@/public/components/sections/sections";

export async function VolunteerRegistrationPage({ editing = false }: { editing?: boolean }) {
  const c = await getContent(editing);
  const steps = c.items("steps");
  return (
    <Sections page="volunteer-registration" c={c} defs={[
    { id: "s1", label: "Section 1", dark: true, node: (
          <section className="relative overflow-hidden bg-navy-900 text-white">
            <svg aria-hidden className="absolute inset-0 size-full opacity-50">
              <defs><pattern id="vol-dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#1d3d6b" /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#vol-dots)" />
            </svg>
            <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-16 sm:px-8">
              <span className="anim-up text-[13px] font-bold uppercase tracking-[2px] text-[#ff9a5c]">{c.e("volunteer.eyebrow")}</span>
              <h1 className="anim-up delay-1 mt-3.5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-[54px]">
                {c.e("volunteer.title")}
              </h1>
              <p className="anim-up delay-2 mt-4 max-w-xl text-lg leading-relaxed text-slate-300">
                {c.e("volunteer.intro")}
              </p>
              <div className="anim-up delay-3 mt-8 max-w-lg">
                <div className="mb-2.5 flex justify-between text-[13px] font-semibold text-slate-300"><span>{c.e("volunteer.time")}</span><span>{c.e("volunteer.sections")}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-navy-700"><div className="anim-bar h-full rounded-full bg-green-400" /></div>
              </div>
            </div>
          </section>
    ) },
    { id: "s2", label: "Section 2", node: (
          <section className="bg-[#f5f8fc]">
            <div className="relative mx-auto -mt-16 flex max-w-7xl flex-wrap items-start gap-8 px-4 pb-24 sm:px-8">
              <div className="min-w-0 flex-[1_1_720px]"><VolunteerForm /></div>
              <aside className="flex min-w-0 max-w-md flex-[1_1_300px] flex-col gap-5">
                <div className="rounded-[28px] border border-slate-200 bg-white p-8">
                  <b className="text-[19px] text-navy-900">{c.e("volunteer.next.title")}</b>
                  <ol className="mt-5 flex flex-col gap-5">
                    {steps.map((st, i) => (
                      <li key={st.title} className="flex gap-4">
                        <span className="flex size-9 flex-none items-center justify-center rounded-full bg-seva-50 font-extrabold text-seva-700">{i + 1}</span>
                        <span className="flex flex-col gap-1"><b className="text-[15px] text-navy-900">{c.ei(st, "title")}</b><span className="text-sm leading-relaxed">{c.ei(st, "text")}</span></span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-[28px] bg-navy-900 p-8 text-slate-300">
                  <b className="text-[19px] text-white">{c.e("volunteer.help.title")}</b>
                  <p className="mt-2.5 text-sm leading-relaxed">{c.e("volunteer.help.text")}</p>
                  <a href={`mailto:${c.t("site.email")}`} className="mt-3.5 block text-[15px] font-bold text-[#ff9a5c] hover:underline">{c.e("site.email")}</a>
                </div>
              </aside>
            </div>
          </section>
    ) },
    ]} />
  );
}

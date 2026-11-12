import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { ReactElement } from "react";
import { EditorShell } from "@/public/components/editor/editor-shell";
import { AboutPage } from "@/public/components/pages/about";
import { CollaborationsPage } from "@/public/components/pages/collaborations";
import { ContactPage } from "@/public/components/pages/contact";
import { GalleryPage } from "@/public/components/pages/gallery";
import { HomePage } from "@/public/components/pages/home";
import { IndiansInKsaPage } from "@/public/components/pages/indians-in-ksa";
import { PrivacyPage } from "@/public/components/pages/privacy-policy";
import { ReportsPage } from "@/public/components/pages/reports";
import { SevaActivitiesPage } from "@/public/components/pages/seva-activities";
import { SupportPage } from "@/public/components/pages/support";
import { TermsPage } from "@/public/components/pages/terms";
import { VolunteerRegistrationPage } from "@/public/components/pages/volunteer-registration";
import { getEditor } from "@/public/lib/editor-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editing", robots: { index: false, follow: false } };

// slug -> [layout page key, element]. Pages with no editable sections (forms, tracking) are not listed.
const PAGES: Record<string, () => ReactElement> = {
  "": () => <HomePage editing />,
  about: () => <AboutPage editing />,
  collaborations: () => <CollaborationsPage editing />,
  contact: () => <ContactPage editing />,
  gallery: () => <GalleryPage editing />,
  "indians-in-ksa": () => <IndiansInKsaPage editing />,
  "privacy-policy": () => <PrivacyPage editing />,
  reports: () => <ReportsPage editing />,
  "seva-activities": () => <SevaActivitiesPage editing />,
  support: () => <SupportPage editing />,
  terms: () => <TermsPage editing />,
  "volunteer-registration": () => <VolunteerRegistrationPage editing />,
};

export default async function EditPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const slug = ((await params).slug ?? []).join("/");
  const editor = await getEditor();
  if (!editor) redirect("/api/editor/logout?next=/editor/login");
  const render = PAGES[slug];
  if (!render) notFound();
  return <EditorShell user={editor.name} page={slug || "home"}>{render()}</EditorShell>;
}

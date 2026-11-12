import type { Metadata } from "next";
import { LoginForm } from "@/public/components/editor/login-form";

export const metadata: Metadata = { title: "Editor sign in", robots: { index: false, follow: false } };

export default function EditorLoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-3xl">Website editor</h1>
      <p className="mt-2 text-slate-600">Sign in with your Odoo user (must be in the “Website Editor” group).</p>
      <LoginForm />
    </div>
  );
}

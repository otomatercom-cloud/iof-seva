import { Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { JoinVolunteerButton } from "@/components/ui/button";
import { CONTACT_EMAIL, NAV } from "./site-nav";

export function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="text-lg font-bold text-white">India Overseas Forum</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed">
            Uplifting the Indian community in Saudi Arabia through support, culture and service.
          </p>
          <JoinVolunteerButton className="mt-6" />
        </div>
        <nav aria-label="Footer">
          <p className="text-sm font-semibold uppercase tracking-wider text-white">Explore</p>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {NAV.map((item) => (
              <li key={item.href}><Link href={item.href} className="hover:text-white">{item.label}</Link></li>
            ))}
            <li><Link href="/volunteer-registration" className="hover:text-white">Volunteer Registration</Link></li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white">Contact</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2"><Mail className="size-4" aria-hidden />
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">{CONTACT_EMAIL}</a></li>
            <li className="flex items-center gap-2"><MapPin className="size-4" aria-hidden /> Riyadh, Saudi Arabia</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} India Overseas Forum. All rights reserved.</p>
          <p className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms &amp; Conditions</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition " +
  "disabled:cursor-not-allowed disabled:opacity-60";
const variants = {
  primary: "bg-saffron-700 text-white shadow-sm hover:bg-saffron-600 hover:shadow-md",
  secondary: "border-2 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white",
  green: "bg-seva-700 text-white hover:bg-seva-700/90",
  ghost: "text-navy-900 hover:bg-navy-50",
  light: "bg-white text-navy-900 hover:bg-navy-50",
} as const;

type Variant = keyof typeof variants;

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}

export function JoinVolunteerButton({ className, variant = "primary" }: { className?: string; variant?: Variant }) {
  return (
    <ButtonLink href="/volunteer-registration" variant={variant} className={className}>
      Join as Volunteer
    </ButtonLink>
  );
}

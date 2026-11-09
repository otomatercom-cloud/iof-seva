/** "odoo" = real backend through the Next.js BFF (/api/*). "mock" = browser-only demo data. */
export const USE_ODOO = process.env.NEXT_PUBLIC_DATA_SOURCE === "odoo";

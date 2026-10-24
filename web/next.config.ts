import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Photos uploaded in Odoo (Website Content) are served from the Odoo host.
const odooMedia = (() => {
  try {
    const u = new URL(process.env.ODOO_PUBLIC_URL || process.env.ODOO_BASE_URL || "");
    return [{ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname, ...(u.port ? { port: u.port } : {}) }];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Temporary: images are hot-linked from the current WordPress site.
    // Copy them into /public/images and remove this once the old site is retired.
    remotePatterns: [{ protocol: "https", hostname: "iofseva.org" }, ...odooMedia],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Keep old WordPress URLs working for SEO and bookmarks.
  async redirects() {
    return [
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us-2", destination: "/contact", permanent: true },
      { source: "/home", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

// Public-site photos: hot-linked WordPress images + media uploaded in Odoo.
const odooHost = (() => {
  try { return new URL(process.env.ODOO_PUBLIC_URL || process.env.ODOO_BASE_URL || process.env.ODOO_URL || "").origin; } catch { return ""; }
})();
const odooMedia = (() => {
  try {
    const u = new URL(odooHost);
    return [{ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname, ...(u.port ? { port: u.port } : {}) }];
  } catch { return []; }
})();

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "iofseva.org" }, ...odooMedia] },
  async redirects() {
    return [
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us-2", destination: "/contact", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/report", destination: "/support", permanent: false },
    ];
  },
  /* config options here */
  poweredByHeader: false,
  async headers() {
    const dev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: https://iofseva.org ${odooHost}`,
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      ],
    }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

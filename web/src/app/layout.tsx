import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: "India Overseas Forum | Serving Indians in Saudi Arabia", template: "%s | India Overseas Forum" },
  description:
    "India Overseas Forum supports the Indian community in Saudi Arabia through volunteer programs, cultural activities and essential support services.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b2545" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

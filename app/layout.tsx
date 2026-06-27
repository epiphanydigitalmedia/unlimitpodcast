import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SHOW } from "@/lib/content";

/*
  Font loading:
  - Effra via Adobe Fonts (NEXT_PUBLIC_ADOBE_FONTS_KIT env var) — display + body
  - Inter via next/font/google as system fallback while Typekit loads
*/

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const ADOBE_FONTS_KIT = process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT;

export const metadata: Metadata = {
  metadataBase: new URL(SHOW.url),
  title: {
    default: `${SHOW.name} — A Podcast Hosted by Seth Pepper`,
    template: `%s — ${SHOW.name}`,
  },
  description: SHOW.description,
  openGraph: {
    title: SHOW.name,
    description: SHOW.tagline,
    url: SHOW.url,
    siteName: SHOW.name,
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${SHOW.name} — show artwork`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SHOW.name,
    description: SHOW.tagline,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {ADOBE_FONTS_KIT && (
          <link
            rel="stylesheet"
            href={`https://use.typekit.net/${ADOBE_FONTS_KIT}.css`}
            precedence="default"
          />
        )}
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

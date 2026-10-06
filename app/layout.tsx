import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, siteUrl } from "@/lib/site";
import "./globals.css";

// Self-hosted fonts (latin subsets from the original design).
const anton = localFont({
  src: "./fonts/anton-latin.woff2",
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const archivo = localFont({
  src: "./fonts/archivo-latin.woff2",
  weight: "100 900",
  variable: "--font-archivo",
  display: "swap",
});

const caveat = localFont({
  src: "./fonts/caveat-latin.woff2",
  weight: "600",
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

// Latin-extended subsets, only for characters the latin files lack
// (e.g. the peso sign ₱). The unicode-range means browsers download them
// only when such a character is on the page. No size-adjusted fallback
// face: it would cover every character and override the fonts above.
// (next/font needs literal option values, so the range is repeated.)
const antonExt = localFont({
  src: "./fonts/anton-latin-ext.woff2",
  weight: "400",
  variable: "--font-anton-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

const archivoExt = localFont({
  src: "./fonts/archivo-latin-ext.woff2",
  weight: "100 900",
  variable: "--font-archivo-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "LEID",
    "Licensure Examination for Interior Designers",
    "Interior Design board exam",
    "board exam reviewer",
    "active recall",
    "IDLE Sets",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f0ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${anton.variable} ${archivo.variable} ${caveat.variable} ${antonExt.variable} ${archivoExt.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Heebo } from "next/font/google";
import { CookieNotice } from "@/components/cookie-notice";
import { dirOf } from "@/i18n/config";
import { I18nProvider } from "@/i18n/client";
import { getLocale } from "@/i18n/server";
import "./globals.css";

// Cyrillic too, for Russian. The browser only downloads the parts a page's text uses.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

// Geist has no Hebrew letters; Heebo fills them in. It's listed first, but its faces only cover Hebrew
// (and no fallback face is generated), so everything else still uses Geist. Not preloaded, since only
// Hebrew pages need it.
const heebo = Heebo({
  variable: "--font-hebrew",
  subsets: ["hebrew"],
  preload: false,
  adjustFontFallback: false,
  fallback: [],
});

const description = "Plan a shared trip: map, weather, schedule, money, documents, and packing.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  title: "Duffle",
  description,
  openGraph: {
    type: "website",
    siteName: "Duffle",
    title: "Duffle",
    description,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      className={`${geistSans.variable} ${geistMono.variable} ${heebo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale}>
          {children}
          <CookieNotice />
        </I18nProvider>
      </body>
    </html>
  );
}

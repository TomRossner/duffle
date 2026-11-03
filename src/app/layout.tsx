import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CookieNotice } from "@/components/cookie-notice";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieNotice />
      </body>
    </html>
  );
}

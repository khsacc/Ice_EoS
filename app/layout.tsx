import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ice-eos.vercel.app"),
  title: {
    default: "Water Ice EoS Dictionary",
    template: "%s | Water Ice EoS Dictionary",
  },
  description:
    "Interactive calculator for equations of state of water ice polymorphs (Ih, II, III, V, VI, VII, VIII, X) for H₂O and D₂O. Covers BM3, Vinet, AP1, and SeaFreeze EoS from literature.",
  keywords: [
    "ice",
    "equation of state",
    "EoS",
    "ice polymorphs",
    "high pressure",
    "H2O",
    "D2O",
    "Birch-Murnaghan",
    "Vinet",
    "thermodynamics",
    "SeaFreeze",
  ],
  openGraph: {
    type: "website",
    siteName: "Water Ice EoS Dictionary",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

export const metadata: Metadata = {
  title: "PRAWDOWID | Weryfikacja treści z AI",
  description:
    "Analiza tekstu, linków i multimediów. Werdykt, poziom pewności i źródła.",
  applicationName: "PRAWDOWID",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#264653",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" data-theme="prawdowid" className={GeistSans.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

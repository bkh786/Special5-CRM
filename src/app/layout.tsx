import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Special5 - Online Tuitions CRM",
  description: "Advanced CRM for Education Services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body style={{ minHeight: '100vh', width: '100%', margin: 0, display: 'flex', flexDirection: 'column' }}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Script src="https://cdn.botpress.cloud/webchat/v3.6/inject.js" strategy="afterInteractive" />
        <Script src="https://files.bpcontent.cloud/2026/04/12/07/20260412074840-JPHH5AD4.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

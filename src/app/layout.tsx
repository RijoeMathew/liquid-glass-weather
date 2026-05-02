import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Weather",
  description: "A beautiful and modern weather app",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Weather",
  },
  icons: {
    icon: '/weather-app/favicon.svg',
    apple: '/weather-app/favicon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

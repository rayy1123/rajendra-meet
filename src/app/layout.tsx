import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Rajendra Meet — Sistem Manajemen Kejuaraan Renang",
    template: "%s · Rajendra Meet",
  },
  description:
    "Sistem manajemen kejuaraan renang: event, peserta, heat, hasil, ranking, dan live result secara real-time.",
  applicationName: "Rajendra Meet",
  authors: [{ name: "Rajendra Project" }],
  icons: {
    icon: [{ url: "/brand/favicon.png", type: "image/png" }],
    shortcut: [{ url: "/brand/favicon.png", type: "image/png" }],
    apple: [{ url: "/brand/favicon.png", type: "image/png" }],
  },
  appleWebApp: {
    title: "Rajendra Meet",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

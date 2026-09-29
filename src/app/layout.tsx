import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { LoadingScreen } from '@/components/loading-screen';

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-heading',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Rajendra Meet',
  description: 'Rajendra Meet — Platform Manajemen Kejuaraan Renang',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/brand/favicon.png', type: 'image/png' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} ${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

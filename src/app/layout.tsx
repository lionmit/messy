import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Messy — Turn Your Noise Into Clarity',
  description:
    'A conversational identity extraction tool that interviews professionals and generates structured identity documents. You come in messy. You leave with clarity.',
  openGraph: {
    title: 'Messy — Turn Your Noise Into Clarity',
    description: 'You come in messy. You leave with clarity.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

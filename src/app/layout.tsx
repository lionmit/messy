import type { Metadata } from 'next';
import { Heebo, Space_Grotesk } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  variable: '--font-heebo',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
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
    <html lang="en" className={`${heebo.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-heebo)]">
        {children}
      </body>
    </html>
  );
}

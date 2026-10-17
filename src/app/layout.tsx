import type { Metadata } from 'next';
import { Assistant, Heebo, Space_Grotesk } from 'next/font/google';
import './globals.css';
import LegalFooter from '@/components/LegalFooter';

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  variable: '--font-heebo',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
});

const assistant = Assistant({
  subsets: ['latin', 'hebrew'],
  variable: '--font-assistant',
});

export const metadata: Metadata = {
  // Hebrew: the page is Hebrew (Shani's smoke, 2026-10-17). The English copy lives only behind the in-page toggle.
  title: 'MESSY · שיחה · אתר · דיוק',
  description:
    'שיחה בכתב עם כלי AI שבנה ליונל מיטלפונקט. מהמילים שלך נבנים מסמך ותצוגה של אתר, ורואים אותו לפני שמשלמים.',
  openGraph: {
    title: 'MESSY · שיחה · אתר · דיוק',
    description: 'שיחה בכתב עם כלי AI שבנה ליונל מיטלפונקט. מהמילים שלך נבנים מסמך ותצוגה של אתר.',
    type: 'website',
    locale: 'he_IL',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${spaceGrotesk.variable} ${assistant.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-heebo)]">
        {children}
        <LegalFooter />
      </body>
    </html>
  );
}

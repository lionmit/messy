import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import StudioClient from '@/components/studio/StudioClient';
import { getStudioConfig, publicStudioConfig } from '@/lib/studio/config';

export const metadata: Metadata = {
  title: 'Messy Studio',
  robots: { index: false, follow: false },
};

export default async function StudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = getStudioConfig(slug);
  if (!config) notFound();
  return <StudioClient config={publicStudioConfig(config)} />;
}

import { notFound } from 'next/navigation';

/** The studio is per owner: /studio/<slug>. There is nothing to show without one. */
export default function StudioIndexPage() {
  notFound();
}

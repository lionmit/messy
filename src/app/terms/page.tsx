import LegalPage from '@/components/LegalPage';
import { LEGAL } from '@/content/legal.generated';

export const metadata = { title: 'תנאים והחזרים · MESSY' };

export default function Page() {
  return <LegalPage md={LEGAL.terms} />;
}

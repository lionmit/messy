import LegalPage from '@/components/LegalPage';
import { LEGAL } from '@/content/legal.generated';

export const metadata = { title: 'פרטיות · MESSY' };

export default function Page() {
  return <LegalPage md={LEGAL.privacy} />;
}

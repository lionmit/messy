import LegalPage from '@/components/LegalPage';
import { LEGAL } from '@/content/legal.generated';

export const metadata = { title: 'הצהרת נגישות · MESSY' };

export default function Page() {
  return <LegalPage md={LEGAL.accessibility} />;
}

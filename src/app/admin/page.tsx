import type { Metadata } from 'next';
import Image from 'next/image';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { ADMIN } from '@/content/admin';
import './admin.css';

export const metadata: Metadata = {
  title: ADMIN.title,
  robots: { index: false, follow: false },
};

/**
 * Lionel's dashboard. The middleware (src/middleware.ts) puts HTTP Basic auth in
 * front of this page and of /api/admin/*; the page itself holds no data, the
 * client component fetches the overview with the same credentials.
 */
export default function AdminPage() {
  return (
    <main className="admin flex-1" lang="he" dir="rtl">
      <header className="admin-header">
        <div className="admin-wrap flex items-center gap-4">
          <Image src="/logo-messy.png" alt={ADMIN.logoAlt} width={249} height={227} priority className="h-10 w-auto" />
          <div>
            <h1 className="admin-title">{ADMIN.title}</h1>
            <p className="admin-subtitle">{ADMIN.subtitle}</p>
          </div>
        </div>
      </header>
      <AdminDashboard />
    </main>
  );
}

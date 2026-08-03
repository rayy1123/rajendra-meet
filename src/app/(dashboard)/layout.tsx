import DashboardLayout from '@/components/layout/layout';

/**
 * Layout untuk seluruh halaman dashboard.
 *
 * Route group (dashboard) sebelumnya tidak punya layout, sehingga sidebar
 * dan header mobile tidak pernah tampil di halaman mana pun.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

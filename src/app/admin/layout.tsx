import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { AdminSidebar } from "@/components/AdminSidebar";
import { getSession } from "@/lib/auth";
import { AREAS, can } from "@/lib/roles";

/**
 * Общий каркас всех страниц админки: шапка, боковое меню, содержимое.
 * Раньше каждая страница рисовала шапку и обёртку сама, и переходов между
 * разделами не было.
 *
 * Здесь проверяется только сам факт доступа хоть куда-то. Права на
 * конкретный раздел проверяет страница: у разделов они разные.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const hasAny = AREAS.some((a) => can(session.role, a.area));
  if (!session.accountId || !hasAny) redirect("/login");

  return (
    <>
      <Header variant="shop" withSearch={false} />
      <section className="section">
        <div className="wrap admin-shell">
          <AdminSidebar role={session.role} />
          <div className="admin-body">{children}</div>
        </div>
      </section>
    </>
  );
}

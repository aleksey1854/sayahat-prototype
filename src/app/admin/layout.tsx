import { redirect } from "next/navigation";
import { AdminBar } from "@/components/AdminBar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { db } from "@/lib/db";
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

  const account = await db.account.findUnique({
    where: { id: session.accountId },
    select: { login: true },
  });

  return (
    <>
      <AdminBar login={account?.login ?? ""} role={session.role} />
      <section className="section" style={{ paddingTop: 28 }}>
        <div className="wrap admin-shell">
          <AdminSidebar role={session.role} />
          <div className="admin-body">{children}</div>
        </div>
      </section>
    </>
  );
}

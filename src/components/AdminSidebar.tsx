"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AREAS, can, type Role } from "@/lib/roles";

/**
 * Боковое меню админки. Разделы, недоступные роли, не рисуются вовсе:
 * заблокированный пункт вызывает вопросы, которых лучше избежать.
 *
 * Клиентский компонент нужен только ради usePathname — layout не получает
 * текущий адрес, а подсветка активного пункта без него не работает.
 */
export function AdminSidebar({ role }: { role: Role | undefined }) {
  const pathname = usePathname() ?? "";
  const items = AREAS.filter((a) => can(role, a.area));
  if (!items.length) return null;

  return (
    <aside className="admin-side">
      <nav aria-label="Разделы админки">
        {items.map((a) => {
          const active = a.href === "/admin" ? pathname === "/admin" : pathname.startsWith(a.href);
          return (
            <Link key={a.href} className={`admin-side__link ${active ? "is-on" : ""}`} href={a.href}>
              {a.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

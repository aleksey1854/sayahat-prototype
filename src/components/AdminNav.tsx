import Link from "next/link";
import { AREAS, can, type Role } from "@/lib/roles";

/**
 * Переходы между разделами админки.
 *
 * До этого их не было: из магазинов вела одна ссылка в новости, а обратно
 * из отзывов только в магазины. Человек с ролью оператора попадал в раздел
 * и не мог уйти в соседний иначе как через адресную строку.
 *
 * Чужие разделы не рисуются вовсе, а не блокируются: пункт, на который
 * нельзя нажать, вызывает вопросы, которых лучше избежать.
 */
export function AdminNav({ role, current }: { role: Role | undefined; current: string }) {
  const items = AREAS.filter((a) => can(role, a.area));
  if (items.length < 2) return null;

  return (
    <nav className="admin-nav" aria-label="Разделы">
      {items.map((a) => (
        <Link key={a.href} className={`chip ${a.href === current ? "chip--on" : ""}`} href={a.href}>
          {a.label}
        </Link>
      ))}
    </nav>
  );
}

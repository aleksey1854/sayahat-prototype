import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLE_NAMES, type Role } from "@/lib/roles";

async function logout() {
  "use server";
  const session = await getSession();
  session.destroy();
  redirect("/login");
}

/**
 * Шапка админки.
 *
 * Раньше здесь стояла шапка сайта: логотип, иконки Instagram и WhatsApp,
 * переключатель языка. В рабочей панели это шум — ни на что из этого
 * оператор не нажимает, а место и внимание отнимает.
 *
 * Оставлено то, что нужно: где я нахожусь, под кем вошёл, как выйти
 * и как посмотреть сам сайт.
 */
export function AdminBar({ login, role }: { login: string; role: Role | undefined }) {
  return (
    <div className="adminbar">
      <div className="adminbar__in">
        <Link className="adminbar__brand" href="/admin">
          Саяхат · панель
        </Link>
        <div className="adminbar__right">
          <span className="adminbar__who">
            {login}
            {role && <span className="adminbar__role">{ROLE_NAMES[role]}</span>}
          </span>
          <Link className="btn btn--ghost btn--sm" href="/" target="_blank" rel="noopener">
            Сайт ↗
          </Link>
          <form action={logout}>
            <button className="btn btn--ghost btn--sm" type="submit">
              Выйти
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

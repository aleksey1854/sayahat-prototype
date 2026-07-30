import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/roles";
import { SubmitButton } from "@/components/SubmitButton";
import { setCategory, setCredentials, deleteShop, toggleStatus, impersonate } from "../../actions";
import { Toast } from "@/components/Toast";

export const metadata: Metadata = { title: "Магазин", robots: { index: false } };

/**
 * Карточка одного магазина.
 *
 * Раньше всё это висело под «Ещё» внутри каждой строки списка: на полусотне
 * точек браузер строил около 2250 элементов, из которых 78 процентов никто
 * не видел, и админка ощутимо тормозила. Теперь список это только строки,
 * а редкие действия живут здесь и грузятся по одному магазину.
 */
export default async function AdminShopPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ok?: string; err?: string };
}) {
  const session = await getSession();
  if (!session.accountId || !can(session.role, "shops")) redirect("/login");
  const isAdmin = session.role === "admin";

  const [shop, categories] = await Promise.all([
    db.shop.findUnique({
      where: { id: params.id },
      include: { category: true, account: true, _count: { select: { products: true } } },
    }),
    db.category.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (!shop) notFound();

  const back = `/admin/shop/${shop.id}`;
  const live = shop.status === "published";

  const gaps: string[] = [];
  if (!shop.phone) gaps.push("нет телефона");
  if (!shop.cover) gaps.push("нет фото");
  if (!shop.descRu) gaps.push("нет описания");
  if (!shop.row) gaps.push("нет бутика");

  return (
    <>
      <div className="cab__top">
        <div>
          <div className="eyebrow">
            <Link href="/admin">← Все магазины</Link>
          </div>
          <h1 style={{ fontSize: 32, margin: "8px 0 0" }}>{shop.nameRu}</h1>
        </div>
        <span className={live ? "pill pill--ok" : "pill pill--muted"}>{live ? "на сайте" : "не на сайте"}</span>
      </div>

      {searchParams.ok && <Toast kind="ok" param={["ok", "saved", "kb"]}>Готово.</Toast>}
      {searchParams.err === "cat" && <Toast kind="err" param={["err", "perr"]}>Категория не выбрана или не найдена.</Toast>}
      {searchParams.err === "login" && <Toast kind="err" param={["err", "perr"]}>Такой логин уже занят.</Toast>}
      {searchParams.err === "pass" && <Toast kind="err" param={["err", "perr"]}>Пароль короче шести символов.</Toast>}

      <div className="admin-meta" style={{ marginBottom: 18 }}>
        <span>{shop.category.nameRu}</span>
        <span>· товаров: {shop._count.products}</span>
        <span>· /shop/{shop.slug}</span>
        <span>· {shop.account ? `доступ: ${shop.account.login}` : "доступа нет"}</span>
      </div>

      {gaps.length > 0 && (
        <div className="notice notice--warn" style={{ marginBottom: 18 }}>
          Не хватает: {gaps.join(", ")}.
        </div>
      )}

      <div className="shop-row__acts" style={{ marginBottom: 26 }}>
        <form action={impersonate}>
          <input type="hidden" name="id" value={shop.id} />
          <button className="btn btn--primary" type="submit">
            Заполнить
          </button>
        </form>
        <Link className="btn btn--ghost" href={`/shop/${shop.slug}`}>
          Посмотреть
        </Link>
        <form action={toggleStatus}>
          <input type="hidden" name="id" value={shop.id} />
          <input type="hidden" name="back" value={back} />
          <button className="btn btn--ghost" type="submit">
            {live ? "Убрать с сайта" : "Показать на сайте"}
          </button>
        </form>
      </div>

      <form action={setCategory} className="panel form-grid" style={{ marginBottom: 18 }}>
        <h3 style={{ margin: 0 }}>Категория</h3>
        <input type="hidden" name="id" value={shop.id} />
        <input type="hidden" name="back" value={back} />
        <div className="shop-row__cat">
          <select className="select" name="categoryId" defaultValue={shop.categoryId}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameRu}
              </option>
            ))}
          </select>
          <SubmitButton className="btn btn--ghost" pendingText="Меняю…">
            Сменить
          </SubmitButton>
        </div>
      </form>

      {isAdmin && (
        <>
          <form action={setCredentials} className="panel form-grid" style={{ marginBottom: 18 }}>
            <h3 style={{ margin: 0 }}>Доступ арендатора</h3>
            <input type="hidden" name="shopId" value={shop.id} />
            <input type="hidden" name="back" value={back} />
            <div className="grid2">
              <div className="field">
                <label htmlFor="a-login">Логин</label>
                <input className="input" id="a-login" name="login" defaultValue={shop.account?.login ?? shop.slug} required />
              </div>
              <div className="field">
                <label htmlFor="a-pass">Новый пароль (придумайте и сообщите арендатору)</label>
                <input className="input" id="a-pass" name="password" required minLength={6} placeholder="минимум 6 символов" />
              </div>
            </div>
            <SubmitButton className="btn btn--ghost" pendingText="Сохраняю…" style={{ justifySelf: "start" }}>
              {shop.account ? "Сменить доступ" : "Создать доступ"}
            </SubmitButton>
          </form>

          <form action={deleteShop} className="panel form-grid">
            <h3 style={{ margin: 0 }}>Удаление</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
              Вместе с магазином удалятся его товары, отзывы и доступ арендатора. Восстановить не получится.
            </p>
            <input type="hidden" name="id" value={shop.id} />
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, color: "var(--muted)" }}>
                <input type="checkbox" required /> подтверждаю удаление
              </label>
              <button className="btn btn--ghost btn--danger" type="submit">
                Удалить магазин
              </button>
            </div>
          </form>
        </>
      )}
    </>
  );
}

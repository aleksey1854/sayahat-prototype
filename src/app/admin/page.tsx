import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cached";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { makeSlug } from "@/lib/slug";
import { site } from "@/lib/site";
import { SubmitButton } from "@/components/SubmitButton";
import { can } from "@/lib/roles";
import { setCategory, toggleStatus, impersonate } from "./actions";

export const metadata: Metadata = {
  title: "Админка базара",
  robots: { index: false },
};

// Раздел «Магазины» открыт админу и оператору. Выдача доступов арендаторам
// и удаление магазина внутри раздела остаются только у админа.
async function requireShopsAccess() {
  const session = await getSession();
  if (!session.accountId || !can(session.role, "shops")) redirect("/login");
  return session;
}

// Действия, которые оператору недоступны: пароли арендаторов и удаление.
async function requireAdmin() {
  const session = await getSession();
  if (!session.accountId || session.role !== "admin") redirect("/login");
  return session;
}

function str(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function uniqueSlug(base: string) {
  let slug = base;
  let n = 2;
  while (await db.shop.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

async function createShop(formData: FormData) {
  "use server";
  const session = await requireShopsAccess();

  const nameRu = str(formData, "nameRu");
  const categoryId = str(formData, "categoryId");
  if (!nameRu || !categoryId) redirect("/admin?err=name");

  const requested = str(formData, "slug");
  const slug = await uniqueSlug(makeSlug(requested || nameRu));

  const created = await db.shop.create({
    data: {
      slug,
      nameRu,
      nameKz: str(formData, "nameKz") || nameRu,
      categoryId,
      hours: site.hours,
      status: "draft",
    },
  });

  revalidatePath("/");
  revalidateTag(CATALOG_TAG);

  // Сразу открываем форму заполнения. Раньше человек создавал магазин,
  // возвращался в список, искал его там и жал «Заполнить» — три лишних
  // действия на каждую из пятидесяти точек.
  session.shopId = created.id;
  await session.save();
  redirect("/cabinet?from=admin");
}


export default async function AdminPage({
  searchParams,
}: {
  searchParams: { ok?: string; err?: string; q?: string; f?: string };
}) {
  const session = await requireShopsAccess();
  const isAdmin = session.role === "admin";

  const [shops, categories] = await Promise.all([
    // Только то, что рисует список. Раньше здесь был include, а он тянет
    // все колонки, включая layout — вёрстку витрины на пару килобайт JSON
    // на магазин, которую список не открывает ни разу. На полусотне точек
    // это около 60 КБ впустую в каждом запросе, плюс join к аккаунтам и
    // подзапрос на счёт товаров, которые тоже переехали на карточку.
    db.shop.findMany({
      select: {
        id: true,
        nameRu: true,
        slug: true,
        status: true,
        phone: true,
        cover: true,
        descRu: true,
        row: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    // Категории нужны только для выпадающего списка в форме создания.
    db.category.findMany({ select: { id: true, nameRu: true }, orderBy: { order: "asc" } }),
  ]);

  const err = searchParams.err;

  // Поиск и фильтры считаем на месте: полсотни магазинов, отдельные
  // запросы к базе тут дороже, чем фильтр массива.
  const q = (searchParams.q ?? "").trim().toLowerCase();

  // Чего не хватает точке, чтобы её было не стыдно показать: без телефона
  // карточка бесполезна, без обложки выглядит пустой.
  const gapsOf = (x: (typeof shops)[number]) => {
    const g: string[] = [];
    if (!x.phone) g.push("нет телефона");
    if (!x.cover) g.push("нет фото");
    if (!x.descRu) g.push("нет описания");
    if (!x.row) g.push("нет бутика");
    return g;
  };

  const counts = {
    all: shops.length,
    hidden: shops.filter((x) => x.status !== "published").length,
    todo: shops.filter((x) => gapsOf(x).length > 0).length,
  };

  const visible = shops
    .filter((x) => (q ? x.nameRu.toLowerCase().includes(q) || x.slug.includes(q) : true))
    .filter((x) =>
      searchParams.f === "hidden"
        ? x.status !== "published"
        : searchParams.f === "todo"
          ? gapsOf(x).length > 0
          : true,
    );


  return (
    <>
          <div className="cab__top">
            <div>
              <div className="eyebrow">Администрация рынка</div>
              <h1 style={{ fontSize: 34, margin: "8px 0 0" }}>Магазины ({shops.length})</h1>
            </div>
          </div>


          {searchParams.ok && <div className="notice notice--ok">Готово.</div>}
          {err === "name" && <div className="notice notice--err">Заполните название и категорию.</div>}
          {err === "cat" && <div className="notice notice--err">Категория не выбрана или не найдена.</div>}
          {err === "login" && <div className="notice notice--err">Такой логин уже занят — выберите другой.</div>}
          {err === "pass" && <div className="notice notice--err">Пароль слишком короткий — минимум 6 символов.</div>}
          {err === "catUsed" && (
            <div className="notice notice--err">В категории есть магазины — сначала перенесите их в другую.</div>
          )}

          {/* Форма создания свёрнута: она нужна один раз на магазин,
              а занимала целый экран над списком. */}
          <details className="panel" style={{ marginBottom: 20 }}>
            <summary className="admin-add">Добавить магазин</summary>
            <form action={createShop} className="form-grid" style={{ marginTop: 16 }}>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="c-nameRu">Название (русский)</label>
                  <input className="input" id="c-nameRu" name="nameRu" maxLength={40} required />
                </div>
                <div className="field">
                  <label htmlFor="c-nameKz">Название (қазақша)</label>
                  <input className="input" id="c-nameKz" name="nameKz" maxLength={40} />
                </div>
              </div>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="c-cat">Категория</label>
                  <select className="select" id="c-cat" name="categoryId" required defaultValue="">
                    <option value="" disabled>
                      Выберите категорию
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameRu}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="c-slug">Адрес страницы (можно пусто, создастся сам)</label>
                  <input className="input" id="c-slug" name="slug" placeholder="naprimer-lavka" />
                </div>
              </div>
              <SubmitButton pendingText="Создаю…" style={{ justifySelf: "start" }}>
                Создать
              </SubmitButton>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
                Магазин создаётся скрытым. На сайте он появится, когда вы нажмёте «Показать на сайте».
              </p>
            </form>
          </details>

          {/* Поиск и фильтры. Обычная GET-форма, без скриптов. */}
          <form method="get" className="admin-search">
            <input
              className="input"
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Поиск по названию"
              aria-label="Поиск по названию"
            />
            {searchParams.f && <input type="hidden" name="f" value={searchParams.f} />}
            <button className="btn btn--ghost" type="submit">
              Найти
            </button>
          </form>

          <div className="admin-tabs">
            <Link className={`chip ${!searchParams.f ? "chip--on" : ""}`} href="/admin">
              Все ({counts.all})
            </Link>
            <Link className={`chip ${searchParams.f === "hidden" ? "chip--on" : ""}`} href="/admin?f=hidden">
              Не на сайте ({counts.hidden})
            </Link>
            <Link className={`chip ${searchParams.f === "todo" ? "chip--on" : ""}`} href="/admin?f=todo">
              Нужно дозаполнить ({counts.todo})
            </Link>
          </div>

          {visible.length === 0 && (
            <p style={{ color: "var(--muted)" }}>Ничего не нашлось. Попробуйте другое слово или снимите фильтр.</p>
          )}

          <div className="shop-rows">
            {visible.map((s) => {
              const gaps = gapsOf(s);
              const live = s.status === "published";
              return (
                <div className="shop-row" key={s.id}>
                  <div className="shop-row__top">
                    <span className="shop-row__name">{s.nameRu}</span>
                    <span className={live ? "pill pill--ok" : "pill pill--muted"}>
                      {live ? "на сайте" : "не на сайте"}
                    </span>
                    {gaps.length > 0 && <span className="shop-row__gaps">{gaps.join(" · ")}</span>}
                  </div>

                  <div className="shop-row__acts">
                    <form action={impersonate}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="btn btn--primary btn--sm" type="submit">
                        Заполнить
                      </button>
                    </form>
                    <Link className="btn btn--ghost btn--sm" href={`/shop/${s.slug}`}>
                      Посмотреть
                    </Link>
                    <form action={toggleStatus}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="btn btn--ghost btn--sm" type="submit">
                        {live ? "Убрать с сайта" : "Показать на сайте"}
                      </button>
                    </form>
                  </div>

                  <Link className="shop-row__more-link" href={`/admin/shop/${s.id}`}>
                    Ещё
                  </Link>
                </div>
              );
            })}
          </div>

    </>
  );
}

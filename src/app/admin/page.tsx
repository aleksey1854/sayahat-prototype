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
import { ConfirmButton } from "@/components/ConfirmButton";
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
  await requireShopsAccess();

  const nameRu = str(formData, "nameRu");
  const categoryId = str(formData, "categoryId");
  if (!nameRu || !categoryId) redirect("/admin?err=name");

  const requested = str(formData, "slug");
  const slug = await uniqueSlug(makeSlug(requested || nameRu));

  await db.shop.create({
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
  redirect("/admin?ok=1");
}


async function uniqueCategorySlug(base: string) {
  let slug = base;
  let n = 2;
  while (await db.category.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

async function addCategory(formData: FormData) {
  "use server";
  await requireShopsAccess();
  const nameRu = str(formData, "nameRu");
  if (!nameRu) redirect("/admin?err=name");

  const slug = await uniqueCategorySlug(makeSlug(nameRu));
  const max = await db.category.aggregate({ _max: { order: true } });
  await db.category.create({
    data: {
      slug,
      nameRu,
      nameKz: str(formData, "nameKz") || nameRu,
      order: (max._max.order ?? 0) + 1,
    },
  });

  revalidatePath("/");
  revalidateTag(CATALOG_TAG);
  redirect("/admin?ok=1");
}

async function renameCategory(formData: FormData) {
  "use server";
  await requireShopsAccess();
  const id = str(formData, "id");
  const nameRu = str(formData, "nameRu");
  if (!nameRu) redirect("/admin?err=name");

  await db.category.update({
    where: { id },
    data: { nameRu, nameKz: str(formData, "nameKz") || nameRu },
  });

  revalidatePath("/");
  revalidateTag(CATALOG_TAG);
  redirect("/admin?ok=1");
}

async function moveCategory(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = str(formData, "id");
  const dir = str(formData, "dir");

  const cats = await db.category.findMany({ orderBy: { order: "asc" } });
  const idx = cats.findIndex((c) => c.id === id);
  const j = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || j < 0 || j >= cats.length) redirect("/admin");

  await db.$transaction([
    db.category.update({ where: { id: cats[idx].id }, data: { order: cats[j].order } }),
    db.category.update({ where: { id: cats[j].id }, data: { order: cats[idx].order } }),
  ]);

  revalidatePath("/");
  revalidateTag(CATALOG_TAG);
  redirect("/admin?ok=1");
}

async function deleteCategory(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = str(formData, "id");

  const count = await db.shop.count({ where: { categoryId: id } });
  if (count > 0) redirect("/admin?err=catUsed");

  await db.category.delete({ where: { id } });
  revalidatePath("/");
  revalidateTag(CATALOG_TAG);
  redirect("/admin?ok=1");
}

async function logout() {
  "use server";
  const session = await getSession();
  session.destroy();
  redirect("/");
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { ok?: string; err?: string; q?: string; f?: string };
}) {
  const session = await requireShopsAccess();
  const isAdmin = session.role === "admin";

  const [shops, categories] = await Promise.all([
    db.shop.findMany({
      include: { category: true, account: true, _count: { select: { products: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.category.findMany({ include: { _count: { select: { shops: true } } }, orderBy: { order: "asc" } }),
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
            <form action={logout}>
              <button className="btn btn--ghost" type="submit">
                Выйти
              </button>
            </form>
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

          <div className="cab__top" style={{ marginTop: 40 }}>
            <div>
              <h2 style={{ fontSize: 28, margin: "8px 0 0" }}>Категории ({categories.length})</h2>
            </div>
          </div>

          <div className="form-grid">
            {categories.map((c) => (
              <form action={renameCategory} className="panel form-grid" key={c.id}>
                <input type="hidden" name="id" value={c.id} />
                <div className="grid2">
                  <div className="field">
                    <label>Название (русский)</label>
                    <input className="input" name="nameRu" defaultValue={c.nameRu} required />
                  </div>
                  <div className="field">
                    <label>Название (қазақша)</label>
                    <input className="input" name="nameKz" defaultValue={c.nameKz} />
                  </div>
                </div>
                <div className="admin-meta">
                  <span>магазинов: {c._count.shops}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <SubmitButton pendingText="Сохраняю…">Сохранить</SubmitButton>
                  <button className="btn btn--ghost" formAction={moveCategory} name="dir" value="up" aria-label="Выше">
                    ↑
                  </button>
                  <button className="btn btn--ghost" formAction={moveCategory} name="dir" value="down" aria-label="Ниже">
                    ↓
                  </button>
                  <ConfirmButton
                    formAction={deleteCategory}
                    message="Удалить категорию? Магазины из неё не удалятся, но категорию придётся создавать заново."
                  >
                    Удалить
                  </ConfirmButton>
                </div>
              </form>
            ))}

            <form action={addCategory} className="panel form-grid">
              <h3 style={{ margin: 0 }}>Добавить категорию</h3>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="cat-nameRu">Название (русский)</label>
                  <input className="input" id="cat-nameRu" name="nameRu" required />
                </div>
                <div className="field">
                  <label htmlFor="cat-nameKz">Название (қазақша)</label>
                  <input className="input" id="cat-nameKz" name="nameKz" />
                </div>
              </div>
              <SubmitButton className="btn btn--accent" pendingText="Добавляю…" style={{ justifySelf: "start" }}>
                Добавить категорию
              </SubmitButton>
            </form>
          </div>

          <div className="panel" style={{ marginTop: 40, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <strong>Новости рынка</strong>
              <div style={{ color: "var(--muted)", fontSize: 14 }}>
                Добавление, текст, закрепление, порядок и ссылки на Instagram.
              </div>
            </div>
            <Link href="/admin/news" className="btn btn--accent">
              Управление новостями →
            </Link>
          </div>
    </>
  );
}

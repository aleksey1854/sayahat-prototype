import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cached";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { makeSlug } from "@/lib/slug";
import { removeUpload } from "@/lib/img";
import { site } from "@/lib/site";
import { Header } from "@/components/Header";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata: Metadata = {
  title: "Админка базара",
  robots: { index: false },
};

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
  await requireAdmin();

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

async function toggleStatus(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = str(formData, "id");
  const shop = await db.shop.findUnique({ where: { id } });
  if (!shop) redirect("/admin");

  await db.shop.update({
    where: { id: shop.id },
    data: { status: shop.status === "published" ? "draft" : "published" },
  });

  revalidatePath("/");
  revalidateTag(CATALOG_TAG);
  revalidatePath(`/shop/${shop.slug}`);
  redirect("/admin?ok=1");
}

async function impersonate(formData: FormData) {
  "use server";
  const session = await requireAdmin();
  const id = str(formData, "id");
  const shop = await db.shop.findUnique({ where: { id } });
  if (!shop) redirect("/admin");

  session.shopId = shop.id;
  await session.save();
  redirect("/cabinet");
}

async function setCredentials(formData: FormData) {
  "use server";
  await requireAdmin();
  const shopId = str(formData, "shopId");
  const login = str(formData, "login").toLowerCase().replace(/\s+/g, "");
  const password = String(formData.get("password") ?? "");

  if (!login) redirect("/admin?err=login");
  if (password.length < 6) redirect("/admin?err=pass");

  const shop = await db.shop.findUnique({ where: { id: shopId }, include: { account: true } });
  if (!shop) redirect("/admin");

  const taken = await db.account.findUnique({ where: { login } });
  if (taken && taken.id !== shop.account?.id) redirect("/admin?err=login");

  const passwordHash = bcrypt.hashSync(password, 10);
  if (shop.account) {
    await db.account.update({ where: { id: shop.account.id }, data: { login, passwordHash } });
  } else {
    await db.account.create({ data: { login, passwordHash, role: "tenant", shopId: shop.id } });
  }

  redirect("/admin?ok=1");
}

async function deleteShop(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = str(formData, "id");

  const shop = await db.shop.findUnique({
    where: { id },
    include: { products: true, account: true },
  });
  if (!shop) redirect("/admin");

  for (const p of shop.products) {
    await removeUpload(p.image);
  }
  await removeUpload(shop.cover);
  if (shop.account) {
    await db.account.delete({ where: { id: shop.account.id } });
  }
  await db.shop.delete({ where: { id: shop.id } });

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
  await requireAdmin();
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
  await requireAdmin();
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
  searchParams: { ok?: string; err?: string };
}) {
  await requireAdmin();

  const [shops, categories] = await Promise.all([
    db.shop.findMany({
      include: { category: true, account: true, _count: { select: { products: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.category.findMany({ include: { _count: { select: { shops: true } } }, orderBy: { order: "asc" } }),
  ]);

  const err = searchParams.err;

  return (
    <>
      <Header variant="shop" withSearch={false} />
      <section className="section">
        <div className="wrap cab" style={{ maxWidth: 860 }}>
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
          {err === "login" && <div className="notice notice--err">Такой логин уже занят — выберите другой.</div>}
          {err === "pass" && <div className="notice notice--err">Пароль слишком короткий — минимум 6 символов.</div>}
          {err === "catUsed" && (
            <div className="notice notice--err">В категории есть магазины — сначала перенесите их в другую.</div>
          )}

          <form action={createShop} className="panel form-grid" style={{ marginBottom: 24 }}>
            <h3 style={{ margin: 0 }}>Новый магазин</h3>
            <div className="grid2">
              <div className="field">
                <label htmlFor="c-nameRu">Название (русский)</label>
                <input className="input" id="c-nameRu" name="nameRu" required />
              </div>
              <div className="field">
                <label htmlFor="c-nameKz">Название (қазақша)</label>
                <input className="input" id="c-nameKz" name="nameKz" />
              </div>
            </div>
            <div className="grid2">
              <div className="field">
                <label htmlFor="c-cat">Категория</label>
                <select className="input" id="c-cat" name="categoryId" required defaultValue="">
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
                <label htmlFor="c-slug">Адрес страницы (можно пусто — создастся сам)</label>
                <input className="input" id="c-slug" name="slug" placeholder="naprimer-lavka" />
              </div>
            </div>
            <SubmitButton pendingText="Создаю…" style={{ justifySelf: "start" }}>
              Создать магазин (черновиком)
            </SubmitButton>
          </form>

          <div className="form-grid">
            {shops.map((s) => (
              <div className="panel form-grid" key={s.id}>
                <div className="admin-meta">
                  <strong style={{ fontSize: 18, color: "var(--ink)" }}>{s.nameRu}</strong>
                  <span className={s.status === "published" ? "pill pill--ok" : "pill pill--muted"}>
                    {s.status === "published" ? "опубликован" : "черновик"}
                  </span>
                </div>
                <div className="admin-meta">
                  <span>{s.category.nameRu}</span>
                  <span>· товаров: {s._count.products}</span>
                  <span>· /shop/{s.slug}</span>
                  <span>· {s.account ? `доступ: ${s.account.login}` : "доступа нет"}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <form action={impersonate}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="btn btn--primary" type="submit">
                      Редактировать
                    </button>
                  </form>
                  <Link className="btn btn--ghost" href={`/shop/${s.slug}`}>
                    Открыть
                  </Link>
                  <form action={toggleStatus}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="btn btn--ghost" type="submit">
                      {s.status === "published" ? "Снять с публикации" : "Опубликовать"}
                    </button>
                  </form>
                </div>
                <details className="details-block">
                  <summary>Доступ арендатора и удаление</summary>
                  <div className="form-grid" style={{ marginTop: 14 }}>
                    <form action={setCredentials} className="form-grid">
                      <input type="hidden" name="shopId" value={s.id} />
                      <div className="grid2">
                        <div className="field">
                          <label>Логин</label>
                          <input className="input" name="login" defaultValue={s.account?.login ?? s.slug} required />
                        </div>
                        <div className="field">
                          <label>Новый пароль (придумайте и сообщите арендатору)</label>
                          <input className="input" name="password" required minLength={6} placeholder="минимум 6 символов" />
                        </div>
                      </div>
                      <SubmitButton className="btn btn--ghost" pendingText="Сохраняю…" style={{ justifySelf: "start" }}>
                        {s.account ? "Сменить доступ" : "Создать доступ"}
                      </SubmitButton>
                    </form>
                    <form action={deleteShop} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <input type="hidden" name="id" value={s.id} />
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, color: "var(--muted)" }}>
                        <input type="checkbox" required /> подтверждаю удаление
                      </label>
                      <button className="btn btn--ghost btn--danger" type="submit">
                        Удалить магазин
                      </button>
                    </form>
                  </div>
                </details>
              </div>
            ))}
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
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cached";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { makeSlug } from "@/lib/slug";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CategoryIcon, ICON_KEYS, SHORT_CAT } from "@/components/CategoryIcon";

export const metadata: Metadata = { title: "Категории", robots: { index: false } };

/**
 * Категории каталога.
 *
 * Раньше жили внизу страницы магазинов и грузились вместе с полусотней
 * точек. Отдельная страница и разгружает список, и укладывается в новое
 * боковое меню.
 *
 * Доступ только у админа: переименование меняет надписи по всему сайту,
 * а удаление перестраивает каталог. Оператору хватает возможности
 * назначить магазину одну из существующих категорий.
 */
async function requireAdmin() {
  const session = await getSession();
  if (!session.accountId || session.role !== "admin") redirect("/login");
  return session;
}

function str(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function refresh() {
  revalidatePath("/");
  revalidateTag(CATALOG_TAG);
}

async function uniqueCategorySlug(base: string) {
  let slug = base;
  let n = 2;
  while (await db.category.findUnique({ where: { slug } })) slug = `${base}-${n++}`;
  return slug;
}

async function addCategory(formData: FormData) {
  "use server";
  await requireAdmin();
  const nameRu = str(formData, "nameRu");
  if (!nameRu) redirect("/admin/categories?err=name");

  const last = await db.category.findFirst({ orderBy: { order: "desc" } });
  await db.category.create({
    data: {
      slug: await uniqueCategorySlug(makeSlug(nameRu)),
      nameRu,
      nameKz: str(formData, "nameKz") || nameRu,
      icon: str(formData, "icon") || null,
      order: (last?.order ?? 0) + 1,
    },
  });

  await refresh();
  redirect("/admin/categories?ok=1");
}

async function renameCategory(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = str(formData, "id");
  const nameRu = str(formData, "nameRu");
  if (!nameRu) redirect("/admin/categories?err=name");

  await db.category.update({
    where: { id },
    data: { nameRu, nameKz: str(formData, "nameKz") || nameRu, icon: str(formData, "icon") || null },
  });

  await refresh();
  redirect("/admin/categories?ok=1");
}

async function moveCategory(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = str(formData, "id");
  const dir = str(formData, "dir");

  const list = await db.category.findMany({ orderBy: { order: "asc" } });
  const i = list.findIndex((c) => c.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) redirect("/admin/categories");

  // Меняем местами порядковые номера соседей: так порядок не «плывёт»,
  // даже если в базе он изначально с пропусками.
  await db.$transaction([
    db.category.update({ where: { id: list[i].id }, data: { order: list[j].order } }),
    db.category.update({ where: { id: list[j].id }, data: { order: list[i].order } }),
  ]);

  await refresh();
  redirect("/admin/categories?ok=1");
}

async function deleteCategory(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = str(formData, "id");

  const count = await db.shop.count({ where: { categoryId: id } });
  if (count > 0) redirect("/admin/categories?err=used");

  await db.category.delete({ where: { id } });
  await refresh();
  redirect("/admin/categories?ok=1");
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: { ok?: string; err?: string };
}) {
  await requireAdmin();

  const categories = await db.category.findMany({
    include: { _count: { select: { shops: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <>
      <div className="cab__top">
        <div>
          <div className="eyebrow">Каталог</div>
          <h1 style={{ fontSize: 32, margin: "8px 0 0" }}>Категории ({categories.length})</h1>
        </div>
      </div>

      {searchParams.ok && <div className="notice notice--ok">Готово.</div>}
      {searchParams.err === "name" && <div className="notice notice--err">Заполните название по-русски.</div>}
      {searchParams.err === "used" && (
        <div className="notice notice--err">
          В категории есть магазины — сначала перенесите их в другую, потом удаляйте.
        </div>
      )}

      <p style={{ color: "var(--muted)", maxWidth: 640, margin: "0 0 20px" }}>
        Порядок здесь задаёт порядок плиток на главной. Название видно покупателям в каталоге
        и на странице каждого магазина.
      </p>

      <details className="panel" style={{ marginBottom: 20 }}>
        <summary className="admin-add">Добавить категорию</summary>
        <form action={addCategory} className="form-grid" style={{ marginTop: 16 }}>
          <div className="grid2">
            <div className="field">
              <label htmlFor="n-ru">Название (русский)</label>
              <input className="input" id="n-ru" name="nameRu" maxLength={40} required />
            </div>
            <div className="field">
              <label htmlFor="n-kz">Название (қазақша)</label>
              <input className="input" id="n-kz" name="nameKz" maxLength={40} />
            </div>
          </div>
            <div className="field">
              <label htmlFor="n-icon">Иконка</label>
              <select className="select" id="n-icon" name="icon" defaultValue={""}>
                <option value="">По названию раздела</option>
                {ICON_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {SHORT_CAT[k]?.ru ?? k}
                  </option>
                ))}
              </select>
            </div>
          <SubmitButton pendingText="Создаю…" style={{ justifySelf: "start" }}>
            Создать
          </SubmitButton>
        </form>
      </details>

      <div className="cat-rows">
        {categories.map((c, i) => (
          <form action={renameCategory} className="cat-row" key={c.id}>
            <input type="hidden" name="id" value={c.id} />

            <div className="cat-row__icon" aria-hidden="true">
              <CategoryIcon slug={c.icon ?? c.slug} />
            </div>

            <div className="cat-row__fields">
              <div className="field">
                <label>Название (русский)</label>
                <input className="input" name="nameRu" defaultValue={c.nameRu} maxLength={40} required />
              </div>
              <div className="field">
                <label>Название (қазақша)</label>
                <input className="input" name="nameKz" defaultValue={c.nameKz ?? ""} maxLength={40} />
              </div>
              <div className="field">
                <label>Иконка</label>
                <select className="select" name="icon" defaultValue={c.icon ?? ""}>
                  <option value="">По названию раздела</option>
                  {ICON_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {SHORT_CAT[k]?.ru ?? k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="cat-row__meta">
              магазинов: {c._count.shops} · /{c.slug}
            </div>

            <div className="cat-row__acts">
              <SubmitButton pendingText="Сохраняю…">Сохранить</SubmitButton>
              <button
                className="btn btn--ghost btn--sm"
                formAction={moveCategory}
                name="dir"
                value="up"
                formNoValidate
                disabled={i === 0}
                aria-label="Выше"
              >
                ↑
              </button>
              <button
                className="btn btn--ghost btn--sm"
                formAction={moveCategory}
                name="dir"
                value="down"
                formNoValidate
                disabled={i === categories.length - 1}
                aria-label="Ниже"
              >
                ↓
              </button>
              {c._count.shops === 0 && (
                <ConfirmButton
                  formAction={deleteCategory}
                  formNoValidate
                  message="Удалить категорию? Восстановить не получится."
                >
                  Удалить
                </ConfirmButton>
              )}
            </div>
          </form>
        ))}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cached";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can, canDeleteCategory } from "@/lib/roles";
import { makeSlug } from "@/lib/slug";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CategoryIcon, ICON_KEYS, SHORT_CAT, tileKey } from "@/components/CategoryIcon";

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
// Раздел открыт админу и оператору: оператор заводит магазины и первым
// видит, что нужного раздела нет.
async function requireCategories() {
  const session = await getSession();
  if (!session.accountId || !can(session.role, "categories")) redirect("/login");
  return session;
}

// Удаление перестраивает каталог — только админ.
async function requireAdmin() {
  const session = await getSession();
  if (!session.accountId || session.role !== "admin") redirect("/login");
  return session;
}

function str(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function refresh() {
  // revalidatePath("/") убран: главная читает категории через
  // getCategoriesCached, а он помечен тегом catalog. Один вызов вместо двух,
  // на Neon это заметный лишний круг при каждом нажатии стрелки.
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
  await requireCategories();
  const nameRu = str(formData, "nameRu");
  if (!nameRu) redirect("/admin/categories?err=name");

  // Считаем не по последнему номеру, а по количеству: если в базе есть
  // совпадающие номера, максимум может оказаться меньше числа категорий,
  // и новая встанет в середину.
  const [last, total] = await Promise.all([
    db.category.findFirst({ orderBy: { order: "desc" } }),
    db.category.count(),
  ]);
  await db.category.create({
    data: {
      slug: await uniqueCategorySlug(makeSlug(nameRu)),
      nameRu,
      nameKz: str(formData, "nameKz") || nameRu,
      icon: str(formData, "icon") || null,
      order: Math.max(last?.order ?? 0, total) + 1,
    },
  });

  await refresh();
  redirect("/admin/categories?ok=1");
}

async function renameCategory(formData: FormData) {
  "use server";
  await requireCategories();
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
  await requireCategories();
  const id = str(formData, "id");
  const dir = str(formData, "dir");

  // Второй ключ сортировки обязателен: если у двух категорий совпал
  // порядковый номер, без него список каждый раз выстраивается по-разному,
  // и стрелки внешне не работают — именно так вело себя с новыми
  // категориями, у которых номер совпал с существующей.
  const list = await db.category.findMany({ orderBy: [{ order: "asc" }, { nameRu: "asc" }] });
  const i = list.findIndex((c) => c.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) redirect("/admin/categories");

  // Если номера уже чистые 1..N, хватает обмена двух значений — две
  // операции вместо семнадцати. Полную перенумерацию делаем только когда
  // в номерах есть совпадения или пропуски: при совпадающих номерах обмен
  // ничего не даёт, у обеих остаётся то же число.
  const clean = list.every((c, idx) => c.order === idx + 1);

  if (clean) {
    await db.$transaction([
      db.category.update({ where: { id: list[i].id }, data: { order: j + 1 } }),
      db.category.update({ where: { id: list[j].id }, data: { order: i + 1 } }),
    ]);
  } else {
    [list[i], list[j]] = [list[j], list[i]];
    await db.$transaction(
      list.map((c, idx) => db.category.update({ where: { id: c.id }, data: { order: idx + 1 } })),
    );
  }

  await refresh();
  redirect("/admin/categories?ok=1");
}

// Расстановка номерами: один запрос вместо десятков нажатий стрелками.
// Каждое нажатие стрелки — круг к базе плюс перезагрузка страницы, и на
// семнадцати категориях это выходило минутой ожидания.
async function saveOrder(formData: FormData) {
  "use server";
  await requireCategories();

  const list = await db.category.findMany({
    select: { id: true },
    orderBy: [{ order: "asc" }, { nameRu: "asc" }],
  });

  // Пустое или нечисловое поле оставляет категорию на её текущем месте,
  // а не сбрасывает в начало.
  const wanted = list.map((c, idx) => {
    const raw = String(formData.get(`pos_${c.id}`) ?? "").replace(/\D/g, "");
    const n = Number(raw);
    return { id: c.id, pos: raw && n > 0 ? n : idx + 1, was: idx };
  });

  // При одинаковых номерах взаимный порядок сохраняется прежний.
  wanted.sort((a, b) => a.pos - b.pos || a.was - b.was);

  await db.$transaction(
    wanted.map((c, idx) => db.category.update({ where: { id: c.id }, data: { order: idx + 1 } })),
  );

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
  const session = await requireCategories();
  const canDelete = canDeleteCategory(session.role);

  const categories = await db.category.findMany({
    include: { _count: { select: { shops: true } } },
    orderBy: [{ order: "asc" }, { nameRu: "asc" }],
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
              <label>Иконка</label>
              {/* Плитками, а не списком: в списке видно только название,
                  а выбирают тут именно рисунок. */}
              <div className="icon-pick">
                <label className="icon-pick__item" title="По названию раздела">
                  <input type="radio" name="icon" value="" defaultChecked />
                  <span className="icon-pick__box icon-pick__box--auto">авто</span>
                </label>
                {ICON_KEYS.map((k) => (
                  <label className="icon-pick__item" key={k} title={SHORT_CAT[k]?.ru ?? k}>
                    <input type="radio" name="icon" value={k} />
                    <span className={`icon-pick__box tile--${k}`}>
                      <CategoryIcon slug={k} />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          <SubmitButton pendingText="Создаю…" style={{ justifySelf: "start" }}>
            Создать
          </SubmitButton>
        </form>
      </details>

      {/* Строка на категорию, редактирование раскрывается по «Изменить».
          Раньше все поля были открыты сразу, и двадцать категорий давали
          страницу на несколько экранов, по которой невозможно было понять
          порядок — а порядок здесь главное, он задаёт плитки на главной. */}
      {/* Форма-приёмник пустая и стоит отдельно. Поля номеров и кнопка
          сохранения привязаны к ней атрибутом form по идентификатору —
          так они лежат внутри строк, но принадлежат этой форме. Обернуть
          список в форму нельзя: внутри строк уже есть свои формы, а
          вложенных форм в HTML не существует, браузер их молча ломает. */}
      <form action={saveOrder} id="cat-order" />

      <div className="cat-list">
        {categories.map((c, i) => (
          <div className="cat-item" key={c.id}>
            <div className="cat-item__head">
              <input
                className="cat-item__num"
                form="cat-order"
                name={`pos_${c.id}`}
                defaultValue={i + 1}
                inputMode="numeric"
                maxLength={3}
                aria-label={`Позиция категории ${c.nameRu}`}
              />

              {/* В том же цвете, что на главной: выбор иконки заодно
                  задаёт цвет плитки, и это должно быть видно здесь. */}
              <span className={`cat-item__icon tile--${tileKey(c.icon, c.slug)}`} aria-hidden="true">
                <CategoryIcon slug={c.icon ?? c.slug} />
              </span>

              <span className="cat-item__name">
                <b>{c.nameRu}</b>
                <i>
                  {c.nameKz && c.nameKz !== c.nameRu ? `${c.nameKz} · ` : ""}
                  {c._count.shops === 0 ? "нет магазинов" : `магазинов: ${c._count.shops}`}
                </i>
              </span>

              <span className="cat-item__move">
                <form action={moveCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="btn btn--ghost btn--sm" name="dir" value="up" disabled={i === 0} aria-label="Выше">
                    ↑
                  </button>
                </form>
                <form action={moveCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    className="btn btn--ghost btn--sm"
                    name="dir"
                    value="down"
                    disabled={i === categories.length - 1}
                    aria-label="Ниже"
                  >
                    ↓
                  </button>
                </form>
              </span>
            </div>

            <details className="cat-item__edit">
              <summary>Изменить название и иконку</summary>

              <form action={renameCategory} className="form-grid" style={{ marginTop: 14 }}>
                <input type="hidden" name="id" value={c.id} />

                <div className="grid2">
                  <div className="field">
                    <label htmlFor={`c${i}-ru`}>Название (русский)</label>
                    <input className="input" id={`c${i}-ru`} name="nameRu" defaultValue={c.nameRu} maxLength={40} required />
                  </div>
                  <div className="field">
                    <label htmlFor={`c${i}-kz`}>Название (қазақша)</label>
                    <input className="input" id={`c${i}-kz`} name="nameKz" defaultValue={c.nameKz ?? ""} maxLength={40} />
                  </div>
                </div>

                <div className="field">
                  <label>Иконка</label>
                  <div className="icon-pick">
                    <label className="icon-pick__item" title="По названию раздела">
                      <input type="radio" name="icon" value="" defaultChecked={!c.icon} />
                      <span className="icon-pick__box icon-pick__box--auto">авто</span>
                    </label>
                    {ICON_KEYS.map((k) => (
                      <label className="icon-pick__item" key={k} title={SHORT_CAT[k]?.ru ?? k}>
                        <input type="radio" name="icon" value={k} defaultChecked={c.icon === k} />
                        <span className={`icon-pick__box tile--${k}`}>
                          <CategoryIcon slug={k} />
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="cat-item__acts">
                  <SubmitButton pendingText="Сохраняю…">Сохранить</SubmitButton>
                  <span className="cat-item__slug">адрес: /{c.slug}</span>
                </div>
              </form>

              {canDelete && c._count.shops === 0 && (
                <form action={deleteCategory} style={{ marginTop: 12 }}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmButton formNoValidate message={`Удалить категорию «${c.nameRu}»? Восстановить не получится.`}>
                    Удалить категорию
                  </ConfirmButton>
                </form>
              )}
              {canDelete && c._count.shops > 0 && (
                <p className="cat-item__note">
                  Чтобы удалить, сначала перенесите магазины в другую категорию.
                </p>
              )}
            </details>
          </div>
        ))}
      </div>

      {/* Одна кнопка вместо двух, и она липнет к низу окна. Две сбивали
          с толку: у них разный смысл — эта меняет порядок всего списка,
          а «Сохранить» внутри раскрытой строки правит только её название
          и иконку. */}
      <div className="save-bar">
        <button className="btn btn--primary btn--lg" type="submit" form="cat-order">
          Сохранить порядок
        </button>
        <span className="save-bar__hint">
          Порядок задаётся номерами в строках. Название и иконку каждой категории
          сохраняет своя кнопка внутри «Изменить».
        </span>
      </div>

    </>
  );
}

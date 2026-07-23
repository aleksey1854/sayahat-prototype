import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cached";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { saveUpload, removeUpload } from "@/lib/img";
import { photoUrl, srcSetFor } from "@/lib/format";
import { normalizePhone, normalizeWhatsapp, cleanUrl } from "@/lib/normalize";
import { Header } from "@/components/Header";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PhotoInput } from "@/components/PhotoInput";

const PHOTO_ERRORS: Record<string, string> = {
  big: "Файл больше 8 МБ — выберите фото полегче или сожмите это.",
  heic: "Это HEIC — формат камеры iPhone. Отправьте фото себе в WhatsApp и сохраните оттуда (станет JPG), либо в настройках камеры включите «Наиболее совместимые».",
  small: "Фото меньше 200 пикселей по стороне — слишком маленькое, выберите крупнее.",
  bad: "Не получилось прочитать файл. Нужен JPG, PNG или WebP до 8 МБ.",
};

export const metadata: Metadata = {
  title: "Кабинет арендатора",
  robots: { index: false },
};

type ShopLayout = {
  tagline?: string;
  about?: { title?: string; image?: string; paragraphs?: string[] };
  [key: string]: unknown;
};

function parseLayout(raw: string | null): ShopLayout {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ShopLayout;
  } catch {
    return {};
  }
}

async function requireShopSession() {
  const session = await getSession();
  if (!session.accountId) redirect("/login");
  if (!session.shopId) redirect(session.role === "admin" ? "/admin" : "/login");
  return session;
}

function str(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function num(formData: FormData, name: string): number | null {
  const raw = str(formData, name).replace(/\D/g, "");
  return raw ? parseInt(raw, 10) : null;
}

function pickFile(formData: FormData, name: string): File | null {
  const f = formData.get(name);
  return f instanceof File && f.size > 0 ? f : null;
}

async function refresh(slug: string, flag: string, kb?: number) {
  revalidatePath(`/shop/${slug}`);
  revalidatePath("/");
  revalidateTag(CATALOG_TAG); // сбрасываем кеш чтений каталога
  redirect(`/cabinet?${flag}=1${kb ? `&kb=${kb}` : ""}`);
}

async function saveShop(formData: FormData) {
  "use server";
  const session = await requireShopSession();

  const nameRu = str(formData, "nameRu");
  if (!nameRu) redirect("/cabinet?err=1");

  const shop = await db.shop.findUnique({ where: { id: session.shopId! } });
  if (!shop) redirect("/login");

  const layout = parseLayout(shop.layout);
  const tagline = str(formData, "tagline");
  const aboutTitle = str(formData, "aboutTitle");
  const aboutText = str(formData, "aboutText");

  if (tagline) layout.tagline = tagline;
  else delete layout.tagline;

  if (aboutTitle || aboutText) {
    layout.about = {
      ...(layout.about ?? {}),
      title: aboutTitle || undefined,
      paragraphs: aboutText
        ? aboutText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
        : [],
    };
  } else {
    delete layout.about;
  }

  const opt = (name: string) => str(formData, name) || null;
  // SEO-поля режем на сервере: maxLength в браузере обходится,
  // а слишком длинные заголовок и описание поисковик всё равно обрежет.
  const optCut = (name: string, max: number) => {
    const v = str(formData, name);
    return v ? v.slice(0, max).trim() : null;
  };

  await db.shop.update({
    where: { id: shop.id },
    data: {
      nameRu,
      nameKz: str(formData, "nameKz") || nameRu,
      descRu: opt("descRu"),
      phone: normalizePhone(str(formData, "phone")),
      whatsapp: normalizeWhatsapp(str(formData, "whatsapp")),
      instagram: str(formData, "instagram").replace(/^@/, "").trim() || null,
      kaspiUrl: cleanUrl(str(formData, "kaspiUrl")),
      row: opt("row"), // номер бутика
      pavilion: opt("pavilion"), // павильон
      landmark: opt("landmark"),
      hours: opt("hours"),
      metaTitle: optCut("metaTitle", 70),
      metaDesc: optCut("metaDesc", 200),
      layout: JSON.stringify(layout),
    },
  });

  await refresh(shop.slug, "saved");
}

async function uploadCover(formData: FormData) {
  "use server";
  const session = await requireShopSession();
  const file = pickFile(formData, "cover");
  if (!file) redirect("/cabinet?perr=1");

  const shop = await db.shop.findUnique({ where: { id: session.shopId! } });
  if (!shop) redirect("/login");

  let up: Awaited<ReturnType<typeof saveUpload>> | null = null;
  let code = "bad";
  try {
    up = await saveUpload(file);
  } catch (e) {
    code = e instanceof Error ? e.message : "bad";
  }
  if (!up) redirect(`/cabinet?perr=${code}`);

  await removeUpload(shop.cover);
  await db.shop.update({ where: { id: shop.id }, data: { cover: up.url } });
  await refresh(shop.slug, "saved", Math.round(up.bytes / 1024));
}

async function addProduct(formData: FormData) {
  "use server";
  const session = await requireShopSession();
  const nameRu = str(formData, "nameRu");
  if (!nameRu) redirect("/cabinet?err=1");

  const shop = await db.shop.findUnique({ where: { id: session.shopId! } });
  if (!shop) redirect("/login");

  let image: string | null = null;
  let kb: number | undefined;
  const file = pickFile(formData, "image");
  if (file) {
    let up: Awaited<ReturnType<typeof saveUpload>> | null = null;
    let code = "bad";
    try {
      up = await saveUpload(file);
    } catch (e) {
      code = e instanceof Error ? e.message : "bad";
    }
    if (!up) redirect(`/cabinet?perr=${code}`);
    image = up.url;
    kb = Math.round(up.bytes / 1024);
  }

  const max = await db.product.aggregate({ where: { shopId: shop.id }, _max: { order: true } });
  await db.product.create({
    data: {
      shopId: shop.id,
      nameRu,
      nameKz: str(formData, "nameKz") || null,
      price: num(formData, "price"),
      unit: str(formData, "unit") || null,
      image,
      order: (max._max.order ?? -1) + 1,
    },
  });

  await refresh(shop.slug, "saved", kb);
}

async function saveProduct(formData: FormData) {
  "use server";
  const session = await requireShopSession();
  const id = str(formData, "id");
  const nameRu = str(formData, "nameRu");
  if (!nameRu) redirect("/cabinet?err=1");

  const product = await db.product.findFirst({
    where: { id, shopId: session.shopId! },
    include: { shop: { select: { slug: true } } },
  });
  if (!product) redirect("/cabinet");

  let image = product.image;
  let kb: number | undefined;
  const file = pickFile(formData, "image");
  if (file) {
    let up: Awaited<ReturnType<typeof saveUpload>> | null = null;
    let code = "bad";
    try {
      up = await saveUpload(file);
    } catch (e) {
      code = e instanceof Error ? e.message : "bad";
    }
    if (!up) redirect(`/cabinet?perr=${code}`);
    await removeUpload(product.image);
    image = up.url;
    kb = Math.round(up.bytes / 1024);
  }

  await db.product.update({
    where: { id: product.id },
    data: {
      nameRu,
      nameKz: str(formData, "nameKz") || null,
      descRu: str(formData, "descRu") || null,
      price: num(formData, "price"),
      oldPrice: num(formData, "oldPrice"),
      unit: str(formData, "unit") || null,
      image,
    },
  });

  await refresh(product.shop.slug, "saved", kb);
}

async function deleteProduct(formData: FormData) {
  "use server";
  const session = await requireShopSession();
  const id = str(formData, "id");

  const product = await db.product.findFirst({
    where: { id, shopId: session.shopId! },
    include: { shop: { select: { slug: true } } },
  });
  if (!product) redirect("/cabinet");

  await removeUpload(product.image);
  await db.product.delete({ where: { id: product.id } });
  await refresh(product.shop.slug, "saved");
}

async function moveProduct(formData: FormData) {
  "use server";
  const session = await requireShopSession();
  const id = str(formData, "id");
  const dir = str(formData, "dir");

  const products = await db.product.findMany({
    where: { shopId: session.shopId! },
    orderBy: { order: "asc" },
    include: { shop: { select: { slug: true } } },
  });
  const idx = products.findIndex((p) => p.id === id);
  const j = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || j < 0 || j >= products.length) redirect("/cabinet");

  const a = products[idx];
  const b = products[j];
  await db.$transaction([
    db.product.update({ where: { id: a.id }, data: { order: b.order } }),
    db.product.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);

  await refresh(a.shop.slug, "saved");
}

async function logout() {
  "use server";
  const session = await getSession();
  session.destroy();
  redirect("/");
}

export default async function CabinetPage({
  searchParams,
}: {
  searchParams: { saved?: string; err?: string; perr?: string; kb?: string };
}) {
  const session = await requireShopSession();
  const shop = await db.shop.findUnique({
    where: { id: session.shopId! },
    include: { products: { orderBy: { order: "asc" } } },
  });
  if (!shop) redirect("/login");

  const layout = parseLayout(shop.layout);
  const aboutText = (layout.about?.paragraphs ?? []).join("\n\n");
  const cover = photoUrl(shop.cover);

  return (
    <>
      <Header variant="shop" withSearch={false} />
      <section className="section">
        <div className="wrap cab">
          <div className="cab__top">
            <div>
              <div className="eyebrow">Кабинет арендатора</div>
              <h1 style={{ fontSize: 34, margin: "8px 0 0" }}>{shop.nameRu}</h1>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {session.role === "admin" && (
                <Link className="btn btn--ghost" href="/admin">
                  ← Админка
                </Link>
              )}
              <Link className="btn btn--ghost" href={`/shop/${shop.slug}`}>
                Открыть мою страницу
              </Link>
              <form action={logout}>
                <button className="btn btn--ghost" type="submit">
                  Выйти
                </button>
              </form>
            </div>
          </div>

          {searchParams.saved && (
            <div className="notice notice--ok">
              Сохранено.{searchParams.kb ? ` Фото сжато до ${searchParams.kb} КБ.` : ""} Изменения уже на вашей
              странице.
            </div>
          )}
          {searchParams.err && <div className="notice notice--err">Название не может быть пустым.</div>}
          {searchParams.perr && (
            <div className="notice notice--err">{PHOTO_ERRORS[searchParams.perr] ?? PHOTO_ERRORS.bad}</div>
          )}

          <form action={uploadCover} className="panel form-grid" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Обложка магазина</h3>
            {cover && (
              <div className="cover-preview" style={{ background: `url('${srcSetFor(cover)?.src}') center/cover` }} />
            )}
            <PhotoInput name="cover" kind="cover" label="Новое фото" required />
            <SubmitButton pendingText="Загружаю фото…" style={{ justifySelf: "start" }}>
              Загрузить обложку
            </SubmitButton>
          </form>

          <form action={saveShop} className="form-grid">
            <div className="panel form-grid">
              <h3 style={{ margin: 0 }}>Название и описание</h3>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="nameRu">Название (русский)</label>
                  <input className="input" id="nameRu" name="nameRu" defaultValue={shop.nameRu} required />
                </div>
                <div className="field">
                  <label htmlFor="nameKz">Название (қазақша)</label>
                  <input className="input" id="nameKz" name="nameKz" defaultValue={shop.nameKz} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="descRu">Короткое описание (видно в каталоге)</label>
                <input className="input" id="descRu" name="descRu" defaultValue={shop.descRu ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="tagline">Подзаголовок на странице (под названием)</label>
                <input className="input" id="tagline" name="tagline" defaultValue={layout.tagline ?? ""} />
              </div>
            </div>

            <div className="panel form-grid">
              <h3 style={{ margin: 0 }}>О магазине</h3>
              <div className="field">
                <label htmlFor="aboutTitle">Заголовок</label>
                <input className="input" id="aboutTitle" name="aboutTitle" defaultValue={layout.about?.title ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="aboutText">Текст (пустая строка — новый абзац)</label>
                <textarea className="textarea" id="aboutText" name="aboutText" defaultValue={aboutText} />
              </div>
            </div>

            <div className="panel form-grid">
              <h3 style={{ margin: 0 }}>Контакты</h3>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="phone">Телефон</label>
                  <input className="input" id="phone" name="phone" defaultValue={shop.phone ?? ""} placeholder="+7 705 123 45 67" />
                </div>
                <div className="field">
                  <label htmlFor="whatsapp">WhatsApp (только цифры)</label>
                  <input className="input" id="whatsapp" name="whatsapp" defaultValue={shop.whatsapp ?? ""} placeholder="77051234567" />
                </div>
                <div className="field">
                  <label htmlFor="instagram">Instagram (без @)</label>
                  <input className="input" id="instagram" name="instagram" defaultValue={shop.instagram ?? ""} />
                </div>
                <div className="field">
                  <label htmlFor="kaspiUrl">Ссылка на Kaspi-магазин</label>
                  <input className="input" id="kaspiUrl" name="kaspiUrl" defaultValue={shop.kaspiUrl ?? ""} placeholder="https://kaspi.kz/..." />
                </div>
              </div>
            </div>

            <div className="panel form-grid">
              <h3 style={{ margin: 0 }}>Место и часы</h3>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="pavilion">Павильон</label>
                  <select className="input" id="pavilion" name="pavilion" defaultValue={shop.pavilion ?? ""}>
                    <option value="">— не выбрано —</option>
                    <option value="Продуктовый">Продуктовый</option>
                    <option value="Вещевой №1">Вещевой павильон №1</option>
                    <option value="Вещевой №2">Вещевой павильон №2</option>
                    <option value="Ярмарка Art Bazar">Ярмарка Art Bazar</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="row">Бутик №</label>
                  <input className="input" id="row" name="row" defaultValue={shop.row ?? ""} placeholder="37" />
                </div>
                <div className="field">
                  <label htmlFor="landmark">Ориентир</label>
                  <input className="input" id="landmark" name="landmark" defaultValue={shop.landmark ?? ""} placeholder="напротив входа" />
                </div>
                <div className="field">
                  <label htmlFor="hours">Часы работы</label>
                  <input className="input" id="hours" name="hours" defaultValue={shop.hours ?? ""} placeholder="Вт–Вс, 10:00–19:00" />
                </div>
              </div>
            </div>

            <div className="panel">
              <details>
                <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 18 }}>
                  SEO — как страница выглядит в поиске
                </summary>
                <div className="form-grid" style={{ marginTop: 16 }}>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
                    Можно не заполнять: тогда заголовок и описание соберутся сами — из названия,
                    описания, товаров и номера бутика. Заполняйте, только если хотите задать текст вручную.
                  </p>
                  <div className="field">
                    <label htmlFor="metaTitle">Заголовок в поиске · оптимально до 60 знаков</label>
                    <input
                      className="input"
                      id="metaTitle"
                      name="metaTitle"
                      maxLength={70}
                      defaultValue={shop.metaTitle ?? ""}
                      placeholder={`${shop.nameRu} · базар Саяхат, Костанай`}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="metaDesc">Описание в поиске · оптимально до 160 знаков</label>
                    <textarea
                      className="textarea"
                      id="metaDesc"
                      name="metaDesc"
                      maxLength={200}
                      defaultValue={shop.metaDesc ?? ""}
                      style={{ minHeight: 80 }}
                      placeholder="Одно-два предложения: что продаёте и где вас найти на рынке."
                    />
                  </div>
                </div>
              </details>
            </div>

            <SubmitButton className="btn btn--primary btn--lg" style={{ justifySelf: "start" }}>
              Сохранить изменения
            </SubmitButton>
          </form>

          <div className="cab__top" style={{ marginTop: 40 }}>
            <div>
              <h2 style={{ fontSize: 28, margin: "8px 0 0" }}>Товары ({shop.products.length})</h2>
            </div>
          </div>

          <div className="form-grid">
            {shop.products.map((p, i) => {
              const img = photoUrl(p.image);
              return (
                <form action={saveProduct} className="panel form-grid" key={p.id}>
                  <input type="hidden" name="id" value={p.id} />
                  <div className="prod-head">
                    {img ? (
                      <div className="prod-thumb" style={{ background: `url('${srcSetFor(img)?.src}') center/cover` }} />
                    ) : (
                      <div className="prod-thumb prod-thumb--empty">{p.nameRu.trim().charAt(0).toUpperCase()}</div>
                    )}
                    <strong style={{ fontSize: 17 }}>
                      {i + 1}. {p.nameRu}
                    </strong>
                  </div>
                  <div className="grid2">
                    <div className="field">
                      <label>Название (русский)</label>
                      <input className="input" name="nameRu" defaultValue={p.nameRu} required />
                    </div>
                    <div className="field">
                      <label>Название (қазақша)</label>
                      <input className="input" name="nameKz" defaultValue={p.nameKz ?? ""} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Описание (одна-две строки)</label>
                    <input className="input" name="descRu" defaultValue={p.descRu ?? ""} />
                  </div>
                  <div className="grid3">
                    <div className="field">
                      <label>Цена, ₸</label>
                      <input className="input" name="price" inputMode="numeric" defaultValue={p.price ?? ""} />
                    </div>
                    <div className="field">
                      <label>Старая цена (для скидки)</label>
                      <input className="input" name="oldPrice" inputMode="numeric" defaultValue={p.oldPrice ?? ""} />
                    </div>
                    <div className="field">
                      <label>Единица</label>
                      <input className="input" name="unit" defaultValue={p.unit ?? ""} placeholder="кг / шт / пучок" />
                    </div>
                  </div>
                  <PhotoInput name="image" kind="product" label="Заменить фото" />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <SubmitButton pendingText="Сохраняю…">Сохранить</SubmitButton>
                    <button className="btn btn--ghost" formAction={moveProduct} name="dir" value="up" aria-label="Выше">
                      ↑
                    </button>
                    <button className="btn btn--ghost" formAction={moveProduct} name="dir" value="down" aria-label="Ниже">
                      ↓
                    </button>
                    <ConfirmButton formAction={deleteProduct} message="Удалить этот товар? Восстановить не получится.">
                      Удалить
                    </ConfirmButton>
                  </div>
                </form>
              );
            })}

            <form action={addProduct} className="panel form-grid">
              <h3 style={{ margin: 0 }}>Добавить товар</h3>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="new-nameRu">Название (русский)</label>
                  <input className="input" id="new-nameRu" name="nameRu" required />
                </div>
                <div className="field">
                  <label htmlFor="new-nameKz">Название (қазақша)</label>
                  <input className="input" id="new-nameKz" name="nameKz" />
                </div>
              </div>
              <div className="grid3">
                <div className="field">
                  <label htmlFor="new-price">Цена, ₸</label>
                  <input className="input" id="new-price" name="price" inputMode="numeric" />
                </div>
                <div className="field">
                  <label htmlFor="new-unit">Единица</label>
                  <input className="input" id="new-unit" name="unit" placeholder="кг / шт / пучок" />
                </div>
                <PhotoInput name="image" kind="product" label="Фото" />
              </div>
              <SubmitButton className="btn btn--accent" pendingText="Добавляю…" style={{ justifySelf: "start" }}>
                Добавить товар
              </SubmitButton>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

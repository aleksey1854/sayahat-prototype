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
import { SHOW_PRODUCTS } from "@/lib/features";
import { ScrollTopOnMount } from "@/components/ScrollTopOnMount";
import { can } from "@/lib/roles";

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
  taglineKz?: string;
  about?: {
    title?: string;
    titleKz?: string;
    image?: string;
    paragraphs?: string[];
    paragraphsKz?: string[];
  };
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
  if (!session.shopId) redirect(can(session.role, "shops") ? "/admin" : "/login");
  return session;
}

// Лимиты длины. В одном месте, потому что те же числа идут в maxLength
// полей и в подписи под ними. Взяты по месту вывода: имя стоит в заголовке
// и в карточке каталога, описание уходит ещё и в подвал, слоган в одну
// строку под названием. Более длинный текст не переносится, а ломает вёрстку.
const LIMITS = {
  nameRu: 40,
  nameKz: 40,
  descRu: 200,
  keywords: 300,
  tagline: 80,
  aboutTitle: 60,
  aboutText: 600,
  phone: 20,
  whatsapp: 16,
  instagram: 30,
  kaspiUrl: 200,
  row: 20,
  landmark: 60,
  hours: 40,
  metaTitle: 70,
  metaDesc: 200,
  pName: 60,
  pDesc: 160,
  pUnit: 12,
} as const;

function str(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

// Режем на сервере: maxLength в браузере обходится вставкой из буфера,
// а в базу должно попадать только то, что влезает в вёрстку.
function cut(value: string, max: number) {
  return value.length > max ? value.slice(0, max).trim() : value;
}

// Instagram выводится на странице как @ник. Оператор почти наверняка
// вставит целую ссылку из адресной строки, и тогда получится
// «@https://www.instagram.com/…». Вырезаем из ссылки ник.
function normInstagram(raw: string): string | null {
  const v = raw
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "")
    .trim();
  return v ? cut(v, LIMITS.instagram) : null;
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

  const nameRu = cut(str(formData, "nameRu"), LIMITS.nameRu);
  if (!nameRu) redirect("/cabinet?err=1");

  const shop = await db.shop.findUnique({ where: { id: session.shopId! } });
  if (!shop) redirect("/login");

  const layout = parseLayout(shop.layout);
  const tagline = cut(str(formData, "tagline"), LIMITS.tagline);
  const aboutTitle = cut(str(formData, "aboutTitle"), LIMITS.aboutTitle);
  const aboutText = cut(str(formData, "aboutText"), LIMITS.aboutText);
  const taglineKz = cut(str(formData, "taglineKz"), LIMITS.tagline);
  const aboutTitleKz = cut(str(formData, "aboutTitleKz"), LIMITS.aboutTitle);
  const aboutTextKz = cut(str(formData, "aboutTextKz"), LIMITS.aboutText);

  if (tagline) layout.tagline = tagline;
  else delete layout.tagline;

  if (taglineKz) layout.taglineKz = taglineKz;
  else delete layout.taglineKz;

  // Абзацы разделяются пустой строкой — так же, как в русском поле.
  const paras = (v: string) =>
    v ? v.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [];

  if (aboutTitle || aboutText || aboutTitleKz || aboutTextKz) {
    layout.about = {
      ...(layout.about ?? {}),
      title: aboutTitle || undefined,
      titleKz: aboutTitleKz || undefined,
      paragraphs: paras(aboutText),
      // Пустой массив вместо undefined ломает фолбэк на русский:
      // страница проверяет длину и решила бы, что перевод есть.
      paragraphsKz: aboutTextKz ? paras(aboutTextKz) : undefined,
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
      nameKz: cut(str(formData, "nameKz"), LIMITS.nameKz) || nameRu,
      descRu: optCut("descRu", LIMITS.descRu),
      descKz: optCut("descKz", LIMITS.descRu),
      keywords: optCut("keywords", LIMITS.keywords),
      phone: normalizePhone(str(formData, "phone")),
      whatsapp: normalizeWhatsapp(str(formData, "whatsapp")),
      instagram: normInstagram(str(formData, "instagram")),
      kaspiUrl: cleanUrl(str(formData, "kaspiUrl")),
      row: optCut("row", LIMITS.row), // номер бутика
      pavilion: opt("pavilion"), // павильон
      landmark: optCut("landmark", LIMITS.landmark),
      hours: optCut("hours", LIMITS.hours),
      metaTitle: optCut("metaTitle", LIMITS.metaTitle),
      metaDesc: optCut("metaDesc", LIMITS.metaDesc),
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

// Логотип точки. Тот же путь, что у обложки: сжатие в webp, поворот по EXIF,
// чистка метаданных. Показывается квадратом в шапке страницы магазина.
async function uploadLogo(formData: FormData) {
  "use server";
  const session = await requireShopSession();
  const file = pickFile(formData, "logo");
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

  await removeUpload(shop.logo);
  await db.shop.update({ where: { id: shop.id }, data: { logo: up.url } });
  await refresh(shop.slug, "saved", Math.round(up.bytes / 1024));
}

async function removeLogo() {
  "use server";
  const session = await requireShopSession();
  const shop = await db.shop.findUnique({ where: { id: session.shopId! } });
  if (!shop) redirect("/login");

  await removeUpload(shop.logo);
  await db.shop.update({ where: { id: shop.id }, data: { logo: null } });
  await refresh(shop.slug, "saved");
}

async function addProduct(formData: FormData) {
  "use server";
  const session = await requireShopSession();
  const nameRu = cut(str(formData, "nameRu"), LIMITS.pName);
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
      nameKz: cut(str(formData, "nameKz"), LIMITS.pName) || null,
      price: num(formData, "price"),
      unit: cut(str(formData, "unit"), LIMITS.pUnit) || null,
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
  const nameRu = cut(str(formData, "nameRu"), LIMITS.pName);
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
      nameKz: cut(str(formData, "nameKz"), LIMITS.pName) || null,
      descRu: cut(str(formData, "descRu"), LIMITS.pDesc) || null,
      price: num(formData, "price"),
      oldPrice: num(formData, "oldPrice"),
      unit: cut(str(formData, "unit"), LIMITS.pUnit) || null,
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
  // На страницу входа, а не на главную: из кабинета выходят, чтобы зайти
  // под другим, а не чтобы попасть на витрину рынка.
  redirect("/login");
}

export default async function CabinetPage({
  searchParams,
}: {
  searchParams: { saved?: string; err?: string; perr?: string; kb?: string; from?: string };
}) {
  const session = await requireShopSession();
  const shop = await db.shop.findUnique({
    where: { id: session.shopId! },
    include: { products: { orderBy: { order: "asc" } } },
  });
  if (!shop) redirect("/login");

  const layout = parseLayout(shop.layout);
  const aboutText = (layout.about?.paragraphs ?? []).join("\n\n");
  const aboutTextKz = (layout.about?.paragraphsKz ?? []).join("\n\n");
  const cover = photoUrl(shop.cover);
  const logo = photoUrl(shop.logo);

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
              {/* Возврат нужен всем, кто пришёл сюда из админки, а не только
                  админу. У оператора раньше выхода отсюда не было вовсе:
                  оставалась кнопка «Выйти», то есть выход из системы целиком
                  посреди заполнения полусотни точек. */}
              {can(session.role, "shops") && (
                <Link className="btn btn--primary" href="/admin">
                  ← К магазинам
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

          {searchParams.from === "admin" && <ScrollTopOnMount />}

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

          <form action={uploadLogo} className="panel form-grid" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Логотип</h3>
            {logo && (
              <img
                src={srcSetFor(logo)?.src}
                alt=""
                width={72}
                height={72}
                style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 18, display: "block" }}
              />
            )}
            <PhotoInput name="logo" kind="logo" label={logo ? "Заменить логотип" : "Файл логотипа"} required />
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <SubmitButton pendingText="Загружаю логотип…">
                {logo ? "Заменить логотип" : "Загрузить логотип"}
              </SubmitButton>
              {logo && (
                <ConfirmButton
                  formAction={removeLogo}
                  formNoValidate
                  message="Убрать логотип? В шапке снова будет буква."
                >
                  Убрать
                </ConfirmButton>
              )}
            </div>
          </form>

          <form action={saveShop} className="form-grid">
            <div className="panel form-grid">
              <h3 style={{ margin: 0 }}>Название и описание</h3>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="nameRu">Название (русский)</label>
                  <input className="input" id="nameRu" name="nameRu" defaultValue={shop.nameRu} maxLength={LIMITS.nameRu} required />
                </div>
                <div className="field">
                  <label htmlFor="nameKz">Название (қазақша)</label>
                  <input className="input" id="nameKz" name="nameKz" defaultValue={shop.nameKz} maxLength={LIMITS.nameKz} />
                </div>
              </div>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="descRu">Короткое описание (видно в каталоге)</label>
                  <input className="input" id="descRu" name="descRu" defaultValue={shop.descRu ?? ""} maxLength={LIMITS.descRu} />
                </div>
                <div className="field">
                  <label htmlFor="descKz">Короткое описание (қазақша)</label>
                  <input className="input" id="descKz" name="descKz" defaultValue={shop.descKz ?? ""} maxLength={LIMITS.descRu} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="keywords">Что вы продаёте (для поиска, на странице не видно)</label>
                <input
                  className="input"
                  id="keywords"
                  name="keywords"
                  defaultValue={shop.keywords ?? ""}
                  maxLength={LIMITS.keywords}
                  placeholder="казы, шужык, конина, говядина, фарш, бешбармак"
                />
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: 13 }}>
                  Перечислите через запятую, что у вас можно купить. По этим словам вас найдут
                  через поиск на сайте. Пишите так, как спрашивают покупатели.
                </p>
              </div>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="tagline">Подзаголовок на странице (под названием)</label>
                  <input className="input" id="tagline" name="tagline" defaultValue={layout.tagline ?? ""} maxLength={LIMITS.tagline} />
                </div>
                <div className="field">
                  <label htmlFor="taglineKz">Подзаголовок (қазақша)</label>
                  <input className="input" id="taglineKz" name="taglineKz" defaultValue={layout.taglineKz ?? ""} maxLength={LIMITS.tagline} />
                </div>
              </div>
            </div>

            <div className="panel form-grid">
              <h3 style={{ margin: 0 }}>О магазине</h3>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="aboutTitle">Заголовок</label>
                  <input className="input" id="aboutTitle" name="aboutTitle" defaultValue={layout.about?.title ?? ""} maxLength={LIMITS.aboutTitle} />
                </div>
                <div className="field">
                  <label htmlFor="aboutTitleKz">Заголовок (қазақша)</label>
                  <input className="input" id="aboutTitleKz" name="aboutTitleKz" defaultValue={layout.about?.titleKz ?? ""} maxLength={LIMITS.aboutTitle} />
                </div>
              </div>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="aboutText">Текст (пустая строка — новый абзац)</label>
                  <textarea className="textarea" id="aboutText" name="aboutText" defaultValue={aboutText} maxLength={LIMITS.aboutText} />
                </div>
                <div className="field">
                  <label htmlFor="aboutTextKz">Текст (қазақша)</label>
                  <textarea className="textarea" id="aboutTextKz" name="aboutTextKz" defaultValue={aboutTextKz} maxLength={LIMITS.aboutText} />
                </div>
              </div>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                Казахские поля можно оставить пустыми: тогда на казахской версии сайта
                покажется русский текст. Заполните, когда будет перевод.
              </p>
            </div>

            <div className="panel form-grid">
              <h3 style={{ margin: 0 }}>Контакты</h3>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="phone">Телефон</label>
                  <input className="input" id="phone" name="phone" type="tel" inputMode="tel" defaultValue={shop.phone ?? ""} maxLength={LIMITS.phone} placeholder="+7 705 123 45 67" />
                </div>
                <div className="field">
                  <label htmlFor="whatsapp">WhatsApp (только цифры)</label>
                  <input className="input" id="whatsapp" name="whatsapp" type="tel" inputMode="numeric" defaultValue={shop.whatsapp ?? ""} maxLength={LIMITS.whatsapp} placeholder="77051234567" />
                </div>
                <div className="field">
                  <label htmlFor="instagram">Instagram (без @)</label>
                  <input className="input" id="instagram" name="instagram" defaultValue={shop.instagram ?? ""} maxLength={LIMITS.instagram} placeholder="ayan.et_karatal" />
                </div>
                <div className="field">
                  <label htmlFor="kaspiUrl">Ссылка на Kaspi-магазин</label>
                  <input className="input" id="kaspiUrl" name="kaspiUrl" type="url" defaultValue={shop.kaspiUrl ?? ""} maxLength={LIMITS.kaspiUrl} placeholder="https://kaspi.kz/..." />
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
                  <input className="input" id="row" name="row" defaultValue={shop.row ?? ""} maxLength={LIMITS.row} placeholder="37" />
                </div>
                <div className="field">
                  <label htmlFor="landmark">Ориентир</label>
                  <input className="input" id="landmark" name="landmark" defaultValue={shop.landmark ?? ""} maxLength={LIMITS.landmark} placeholder="напротив входа" />
                </div>
                <div className="field">
                  <label htmlFor="hours">Часы работы</label>
                  <input className="input" id="hours" name="hours" defaultValue={shop.hours ?? ""} maxLength={LIMITS.hours} placeholder="Вт–Вс, 10:00–19:00" />
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
                      maxLength={LIMITS.metaTitle}
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
                      maxLength={LIMITS.metaDesc}
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

          {/* Блок товаров скрыт целиком, пока ассортимент не выводится на
              сайте. Раньше он был виден с подписью «пока не показывается» —
              оператор всё равно тратил на него время. Данные не тронуты:
              заведённые товары лежат в базе, при SHOW_PRODUCTS = true блок
              возвращается как был. */}
          {SHOW_PRODUCTS && (
            <>
            <div className="cab__top" style={{ marginTop: 40 }}>
              <div>
                <h2 style={{ fontSize: 28, margin: "8px 0 0" }}>Товары ({shop.products.length})</h2>
                {/* Без этой строки первый вопрос на обучении администрации будет
                    «а почему я завёл товары, а на сайте их нет». */}
                <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 14, maxWidth: 620 }}>
                  Ассортимент и цены пока не показываются на сайте — блок включим на втором этапе.
                  Заводите товары сейчас: они сохраняются и появятся на витрине сразу после включения.
                </p>
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
                        <input className="input" name="nameRu" defaultValue={p.nameRu} maxLength={LIMITS.pName} required />
                      </div>
                      <div className="field">
                        <label>Название (қазақша)</label>
                        <input className="input" name="nameKz" defaultValue={p.nameKz ?? ""} maxLength={LIMITS.pName} />
                      </div>
                    </div>
                    <div className="field">
                      <label>Описание (одна-две строки)</label>
                      <input className="input" name="descRu" defaultValue={p.descRu ?? ""} maxLength={LIMITS.pDesc} />
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
                        <input className="input" name="unit" maxLength={LIMITS.pUnit} defaultValue={p.unit ?? ""} placeholder="кг / шт / пучок" />
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
                    <input className="input" id="new-nameRu" name="nameRu" maxLength={LIMITS.pName} required />
                  </div>
                  <div className="field">
                    <label htmlFor="new-nameKz">Название (қазақша)</label>
                    <input className="input" id="new-nameKz" name="nameKz" maxLength={LIMITS.pName} />
                  </div>
                </div>
                <div className="grid3">
                  <div className="field">
                    <label htmlFor="new-price">Цена, ₸</label>
                    <input className="input" id="new-price" name="price" inputMode="numeric" />
                  </div>
                  <div className="field">
                    <label htmlFor="new-unit">Единица</label>
                    <input className="input" id="new-unit" name="unit" maxLength={LIMITS.pUnit} placeholder="кг / шт / пучок" />
                  </div>
                  <PhotoInput name="image" kind="product" label="Фото" />
                </div>
                <SubmitButton className="btn btn--accent" pendingText="Добавляю…" style={{ justifySelf: "start" }}>
                  Добавить товар
                </SubmitButton>
              </form>
            </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getLang, pick, type Lang } from "@/lib/i18n";
import { site, waLink, igUrl, pavilionKey, boothLabel } from "@/lib/site";
import { price, discountPercent, photoUrl, srcSetFor } from "@/lib/format";
import { absUrl } from "@/lib/seo";
import { Header } from "@/components/Header";
import { CatalogProvider } from "@/components/CatalogProvider";
import { loadCatalogCards } from "@/lib/catalog";
import { CallBar } from "@/components/CallBar";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { BazaarMap } from "@/components/BazaarMap";
import { PhotoFallback, SafeImg } from "@/components/PhotoFallback";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { GoalTracker } from "@/components/GoalTracker";
import { DEMO_POOL } from "@/../prisma/demo-photos";

type ShopLayout = {
  tagline?: string; taglineKz?: string;
  about?: { title?: string; titleKz?: string; image?: string; paragraphs?: string[]; paragraphsKz?: string[] };
  trust?: { title: string; titleKz?: string; sub: string; subKz?: string }[];
  promo?: { eyebrow?: string; title?: string; text?: string };
  gallery?: string[];
};

function parseLayout(raw: string | null): ShopLayout {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ShopLayout;
  } catch {
    return {};
  }
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

// Адрес точки: pavilion = павильон, row = номер бутика.
function shopLoc(lang: Lang, pavilion?: string | null, booth?: string | null): string {
  if (!pavilion) return "";
  const b = boothLabel(lang, booth);
  return `${pavilion}${b}`;
}

// Ключ павильона для подсветки на схеме.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const shop = await db.shop.findUnique({
    where: { slug: params.slug },
    include: { products: { orderBy: { order: "asc" }, take: 4, select: { nameRu: true } } },
  });
  if (!shop) return { title: "Магазин не найден" };
  const title = shop.metaTitle ?? `${shop.nameRu} · базар Саяхат, Костанай`;

  // Описание для поисковой выдачи: если не задано вручную (metaDesc),
  // собирается из живых данных — товары дают ключевые слова в сниппете.
  const goods = shop.products.map((p) => p.nameRu.toLowerCase()).join(", ");
  const bits: string[] = [];
  if (shop.descRu) bits.push(shop.descRu.replace(/\.\s*$/, ""));
  if (goods) bits.push(`В наличии: ${goods}`);
  if (shop.pavilion) bits.push(shop.row ? `${shop.pavilion}${boothLabel("ru", shop.row)}` : shop.pavilion);
  const description =
    shop.metaDesc ??
    (bits.length > 0
      ? `${shop.nameRu} на рынке Саяхат (Костанай). ${bits.join(". ")}.`
      : `${shop.nameRu} на рынке Саяхат в Костанае.`);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/shop/${shop.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: shop.cover ? [photoUrl(shop.cover)!] : undefined,
    },
  };
}

export default async function ShopPage({ params }: { params: { slug: string } }) {
  const shop = await db.shop.findUnique({
    where: { slug: params.slug },
    include: { category: true, products: { orderBy: { order: "asc" } } },
  });

  if (!shop) notFound();

  let draftPreview = false;
  if (shop.status !== "published") {
    const session = await getSession();
    if (session.role === "admin" || session.shopId === shop.id) draftPreview = true;
    else notFound();
  }

  const lang: Lang = getLang();
  const layout = parseLayout(shop.layout);
  const name = pick(lang, shop.nameRu, shop.nameKz);
  const mono = shop.nameRu.trim().charAt(0).toUpperCase();
  // У блока «о магазине» своё фото; если его нет — берём обложку.
  // Раньше при отсутствии обоих показывалась заглушка на пол-экрана.
  // В блоке «о магазине» показываем другой кадр из пула категории, а не
  // повтор обложки — иначе одна и та же сцена висит дважды на странице.
  const poolPics = DEMO_POOL[shop.category?.slug ?? ""] ?? [];
  const altPic = poolPics.find((f) => f !== shop.cover) ?? poolPics[0];
  const aboutPic = photoUrl(layout.about?.image ?? altPic ?? shop.cover);
  // Витрина хранит обе версии. Если казахской нет — показываем русскую,
  // чтобы страница не осталась с пустым местом.
  const L = (ru?: string, kz?: string) => (lang === "kz" ? kz || ru || "" : ru || "");
  const wa = shop.whatsapp ? waLink(shop.whatsapp) : undefined;

  const mapHighlight = pavilionKey(shop.pavilion);
  // данные для поиска в шапке — те же, что у каталога на главной
  const searchCards = await loadCatalogCards(lang);

  // Соседи по павильону: перелинковка каталога и подсказка «кто рядом».
  const neighbors = shop.pavilion
    ? await db.shop.findMany({
        where: { pavilion: shop.pavilion, status: "published", NOT: { id: shop.id } },
        select: { slug: true, nameRu: true, nameKz: true, row: true, category: { select: { nameRu: true, nameKz: true } } },
        orderBy: { nameRu: "asc" },
        take: 6,
      })
    : [];

  const shopUrl = absUrl(`/shop/${shop.slug}`);

  const priceValues = shop.products.map((p) => p.price).filter((v): v is number => v != null);
  const priceRange =
    priceValues.length > 0
      ? Math.min(...priceValues) === Math.max(...priceValues)
        ? price(Math.min(...priceValues))
        : `${price(Math.min(...priceValues))} – ${price(Math.max(...priceValues))}`
      : undefined;

  const storeLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${shopUrl}#store`,
    name: shop.nameRu,
    url: shopUrl,
    image: absUrl(photoUrl(shop.cover)),
    description: shop.descRu ?? undefined,
    telephone: shop.phone ?? undefined,
    priceRange,
    sameAs: shop.instagram ? [`https://instagram.com/${shop.instagram}`] : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressLocality: site.city,
      addressCountry: "KZ",
    },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    openingHours: site.openingHoursSchema,
    parentOrganization: { "@type": "ShoppingCenter", name: "Рынок Саяхат", url: absUrl("/") },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Рынок Саяхат", item: absUrl("/") },
      { "@type": "ListItem", position: 2, name: shop.nameRu },
    ],
  };

  const productsLd =
    shop.products.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: shop.products.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              name: p.nameRu,
              image: absUrl(photoUrl(p.image)),
              description: p.descRu ?? undefined,
              offers:
                p.price != null
                  ? {
                      "@type": "Offer",
                      price: p.price,
                      priceCurrency: "KZT",
                      availability: "https://schema.org/InStock",
                      url: shopUrl,
                    }
                  : undefined,
            },
          })),
        }
      : null;

  const jsonLd = [storeLd, breadcrumbLd, ...(productsLd ? [productsLd] : [])];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GoalTracker shop={shop.slug} />
      <CatalogProvider shops={searchCards}>
        <Header variant="shop" />
      </CatalogProvider>

      {draftPreview && (
        <div className="wrap" style={{ paddingTop: 14 }}>
          <div className="notice notice--warn" style={{ marginBottom: 0 }}>
            Черновик — страницу видите только вы. Опубликовать можно в админке.
          </div>
        </div>
      )}

      <section className="hero">
        <div className="wrap hero__inner">
          <div>
            <div className="hero__mono">{mono}</div>
            <div className="eyebrow">
              {shopLoc(lang, shop.pavilion, shop.row) || pick(lang, shop.category.nameRu, shop.category.nameKz)}
            </div>
            <h1>{name}</h1>
            {layout.tagline && <p className="hero__tag">{L(layout.tagline, layout.taglineKz)}</p>}
            <div className="hero__cta">
              {shop.phone && (
                <a className="btn btn--primary btn--lg" href={telHref(shop.phone)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
                  </svg>
                  {pick(lang, "Позвонить", "Қоңырау шалу")}
                </a>
              )}
              {wa && (
                <a className="btn btn--ghost btn--lg" href={wa}>
                  <WhatsAppIcon />
                  WhatsApp
                </a>
              )}
              {shop.kaspiUrl ? (
                <a className="btn btn--accent btn--lg" href={shop.kaspiUrl} data-goal="kaspi_click" target="_blank" rel="noopener">
                  {pick(lang, "Перейти в магазин", "Дүкенге өту")}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </a>
              ) : (
                shop.products.length > 0 && (
                  <a className="btn btn--accent btn--lg" href="#tovary">
                    {pick(lang, "Смотреть товары", "Тауарларды көру")}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                )
              )}
            </div>
          </div>
          <div
            className="hero__art"
            style={shop.cover ? { background: `url('${photoUrl(shop.cover)}') center/cover` } : undefined}
          >
            {!shop.cover && <PhotoFallback category={shop.category?.slug ?? ""} />}
          </div>
        </div>
      </section>

      {layout.trust && layout.trust.length > 0 && (
        <section className="trust reveal">
          <div className="wrap trust__inner">
            {layout.trust.slice(0, 4).map((t, i) => (
              <div className="trust__item" key={i}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12l5 5L20 7" />
                </svg>
                <div>
                  <b>{L(t.title, t.titleKz)}</b>
                  <span>{L(t.sub, t.subKz)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {layout.about && (
        <section className="section reveal">
          <div className="wrap about__inner">
            <div className="about__text">
              {layout.about.title && (
                <h2 style={{ fontSize: 36, color: "var(--ink)", margin: "10px 0 18px" }}>{L(layout.about.title, layout.about.titleKz)}</h2>
              )}
              {((lang === "kz" && layout.about.paragraphsKz?.length
                ? layout.about.paragraphsKz
                : layout.about.paragraphs) ?? []).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {aboutPic && (
              <div
                className="about__pic"
                style={{ background: `url('${aboutPic}') center/cover` }}
              />
            )}
          </div>
        </section>
      )}

      {shop.products.length > 0 && (
        <section className="section section--tight reveal" id="tovary" style={{ background: "var(--surface-2)" }}>
          <div className="wrap">
            <div className="section-head">
              <h2>{pick(lang, "Что есть на прилавке", "Сөреде не бар")}</h2>
            </div>
            <div className="grid-cards">
              {shop.products.map((p, i) => {
                const disc = p.oldPrice && p.price ? discountPercent(p.price, p.oldPrice) : 0;
                const emptyClass = "card__pic card__pic--empty" + (i % 4 ? ` tile-g${i % 4}` : "");
                return (
                  <article className="card" key={p.id}>
                    <div className={emptyClass}>
                      <PhotoFallback category={shop.category?.slug ?? ""} />
                      {p.image && (
                        <SafeImg
                          className="card__img"
                          src={srcSetFor(photoUrl(p.image))!.src}
                          srcSet={srcSetFor(photoUrl(p.image))!.srcSet}
                          sizes="(max-width: 640px) 92vw, 300px"
                          alt={p.nameRu}
                        />
                      )}
                      {disc > 0 ? (
                        <span className="badge badge--hot">−{disc}%</span>
                      ) : (
                        <span className="badge badge--stock">{pick(lang, "в наличии", "сатылымда")}</span>
                      )}
                    </div>
                    <div className="card__body">
                      <h3>{pick(lang, p.nameRu, p.nameKz)}</h3>
                      {p.descRu && <p>{p.descRu}</p>}
                      <div className="card__foot">
                        {p.price != null && (
                          <span className="price">
                            {price(p.price)} {p.unit && <small>/ {p.unit}</small>}
                          </span>
                        )}
                        {wa && (
                          <a className="btn btn--ghost" href={wa}>
                            {pick(lang, "Заказать", "Тапсырыс")}
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {layout.promo && (
        <section className="section section--tight reveal">
          <div className="wrap">
            <div className="promo">
              <div className="promo__txt">
                {layout.promo.eyebrow && <div className="eyebrow">{layout.promo.eyebrow}</div>}
                {layout.promo.title && <h3>{layout.promo.title}</h3>}
                {layout.promo.text && <p>{layout.promo.text}</p>}
              </div>
              {wa && (
                <a className="btn btn--accent btn--lg" href={wa}>
                  {pick(lang, "Заказать со скидкой", "Жеңілдікпен тапсырыс")}
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {layout.gallery && layout.gallery.length > 0 && (
        <section className="section section--tight reveal">
          <div className="wrap">
            <div className="section-head">
              <h2>{pick(lang, "Прилавок и товар", "Сөре мен тауар")}</h2>
            </div>
            <div className="gallery">
              {layout.gallery.map((img, i) => (
                <div
                  key={i}
                  className={i === 0 ? "span2" : undefined}
                  style={{ background: `url('${photoUrl(img)}') center/cover` }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {shop.products.length > 0 && (
        <section className="section reveal">
          <div className="wrap">
            <div className="section-head">
              <h2>{pick(lang, "Цены", "Бағалар тізімі")}</h2>
            </div>
            <div className="pricelist">
              <table>
                <thead>
                  <tr>
                    <th>{pick(lang, "Позиция", "Атауы")}</th>
                    <th>{pick(lang, "Цена", "Бағасы")}</th>
                  </tr>
                </thead>
                <tbody>
                  {shop.products.map((p) => (
                    <tr key={p.id}>
                      <td className="name">{pick(lang, p.nameRu, p.nameKz)}</td>
                      <td className="cost">
                        {p.price != null ? price(p.price) : "—"}
                        {p.price != null && p.unit ? ` / ${p.unit}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section className="section section--tight reveal" id="contacts" style={{ background: "var(--surface-2)" }}>
        <div className="wrap">
          <div className="section-head">
            <h2>{pick(lang, "Как нас найти", "Бізді қалай табуға болады")}</h2>
          </div>
          <div className="contact__inner">
            <div className="panel">
              <h3>{pick(lang, "Связаться", "Байланысу")}</h3>
              {shop.phone && (
                <div className="contact-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
                  </svg>
                  <div>
                    <a className="contact-link" href={telHref(shop.phone)}>
                      {shop.phone}
                    </a>
                    <span>{pick(lang, "звонок и WhatsApp", "қоңырау және WhatsApp")}</span>
                  </div>
                </div>
              )}
              {shop.instagram && (
                <div className="contact-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" />
                  </svg>
                  <div>
                    <a className="contact-link" href={igUrl(shop.instagram)} target="_blank" rel="noopener">
                      @{shop.instagram}
                    </a>
                    <span>Instagram</span>
                  </div>
                </div>
              )}
              <div className="contact-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <div>
                  <b>{shop.hours}</b>
                  <span>{pick(lang, "часы работы", "жұмыс уақыты")}</span>
                </div>
              </div>
              {shop.kaspiUrl ? (
                <a className="btn btn--accent btn--block btn--lg" style={{ marginTop: 22 }} href={shop.kaspiUrl} data-goal="kaspi_click" target="_blank" rel="noopener">
                  {pick(lang, "Перейти в магазин на Kaspi", "Kaspi-де дүкенге өту")}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </a>
              ) : (
                wa && (
                  <a className="btn btn--accent btn--block btn--lg" style={{ marginTop: 22 }} href={wa}>
                    {pick(lang, "Написать в WhatsApp", "WhatsApp-қа жазу")}
                    <WhatsAppIcon />
                  </a>
                )
              )}
            </div>

            <div className="panel">
              <h3>{pick(lang, "Где мы на рынке", "Базарда қайдамыз")}</h3>
              <div className="locrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {shopLoc(lang, shop.pavilion, shop.row) || pick(lang, "Уточняется", "Нақтылануда")}
                {shop.landmark ? ` — ${shop.landmark}` : ""}
              </div>
              {mapHighlight && (
                <p style={{ color: "var(--muted)", fontSize: 14.5, margin: "12px 0 0" }}>
                  {pick(lang, "Павильон подсвечен на схеме ниже.", "Павильон төмендегі сызбада белгіленген.")}
                </p>
              )}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <BazaarMap lang={lang} highlight={mapHighlight} />
          </div>

          {neighbors.length > 0 && (
            <div className="neighbors">
              <h3>
                {pick(lang, `Рядом в этом павильоне — ${shop.pavilion}`, `Осы павильонда қатарда — ${shop.pavilion}`)}
              </h3>
              <div className="neighbors__list">
                {neighbors.map((n) => (
                  <a className="neighbor" href={`/shop/${n.slug}`} key={n.slug}>
                    <b>{pick(lang, n.nameRu, n.nameKz)}</b>
                    <span>
                      {pick(lang, n.category.nameRu, n.category.nameKz)}
                      {boothLabel(lang, n.row)}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          <div className="foot-cols">
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
                {name}
              </div>
              {shop.descRu && (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, maxWidth: "36ch" }}>{shop.descRu}</p>
              )}
            </div>
            <div>
              <div style={{ fontSize: 12.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: 12 }}>
                {pick(lang, "Связь", "Байланыс")}
              </div>
              {shop.phone && (
                <a href={telHref(shop.phone)} style={{ display: "block", color: "var(--ink-soft)", fontSize: 14.5, marginBottom: 8 }}>
                  {shop.phone}
                </a>
              )}
              {wa && (
                <a href={wa} style={{ display: "block", color: "var(--ink-soft)", fontSize: 14.5, marginBottom: 8 }}>
                  WhatsApp
                </a>
              )}
              {shop.instagram && (
                <span style={{ display: "block", color: "var(--ink-soft)", fontSize: 14.5 }}>@{shop.instagram}</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 12.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: 12 }}>
                {pick(lang, "Адрес и часы", "Мекенжай және уақыт")}
              </div>
              <div style={{ color: "var(--ink-soft)", fontSize: 14.5, marginBottom: 8 }}>
                {pick(lang, "Рынок «Саяхат», ", "«Саяхат» базары, ")}
                {shopLoc(lang, shop.pavilion, shop.row) || site.address}
              </div>
              <div style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>{shop.hours ?? site.hours}</div>
            </div>
          </div>
        </div>
      </footer>

      <RevealOnScroll />
      <CallBar phone={shop.phone} whatsapp={shop.whatsapp} lang={lang} />
    </>
  );
}

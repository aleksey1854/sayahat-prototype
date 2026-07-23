import { db } from "@/lib/db";
import { getLang, pick } from "@/lib/i18n";
import { newsDateParts, photoUrl } from "@/lib/format";
import { absUrl } from "@/lib/seo";
import { site, pavilionKey, boothLabel } from "@/lib/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FreeSpaces } from "@/components/FreeSpaces";
import { GettingThere } from "@/components/GettingThere";
import { Reveal } from "@/components/Reveal";
import { CatalogSection } from "@/components/CatalogSection";
import { CatalogProvider, type CardShop } from "@/components/CatalogProvider";

// Адрес точки: «Павильон · бутик №N». pavilion = павильон, row = номер бутика.
function shopLocation(lang: "ru" | "kz", pavilion?: string | null, booth?: string | null): string {
  if (!pavilion) return "";
  const boothPart = boothLabel(lang, booth);
  return `${pavilion}${boothPart}`;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const initialQuery = typeof sp.q === "string" ? sp.q : "";
  const lang = getLang();

  const [categories, shops, news] = await Promise.all([
    db.category.findMany({ orderBy: { order: "asc" } }),
    db.shop.findMany({
      where: { status: "published" },
      include: {
        category: true,
        products: { select: { nameRu: true, nameKz: true, price: true, unit: true }, orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.newsPost.findMany({
      orderBy: [{ pinned: "desc" }, { sortOrder: "desc" }, { publishedAt: "desc" }],
      take: 3,
    }),
  ]);

  const cards: CardShop[] = shops.map((s) => {
    const fields: CardShop["fields"] = [
      { text: `${s.nameRu} ${s.nameKz}`, weight: 10, kind: "name" },
      { text: `${s.category.nameRu} ${s.category.nameKz}`, weight: 6, kind: "other" },
      ...s.products.map((p, i) => ({
        text: `${p.nameRu} ${p.nameKz ?? ""}`,
        weight: 5,
        kind: "product" as const,
        productIdx: i,
      })),
      { text: s.slug, weight: 2, kind: "other" as const },
    ];
    if (s.descRu) fields.push({ text: s.descRu, weight: 3, kind: "other" });
    if (s.pavilion) {
      fields.push({ text: `павильон бутик ${s.pavilion} ${s.row ?? ""}`, weight: 1, kind: "other" });
    }

    return {
      slug: s.slug,
      name: pick(lang, s.nameRu, s.nameKz),
      categorySlug: s.category.slug,
      categoryName: pick(lang, s.category.nameRu, s.category.nameKz),
      cover: photoUrl(s.cover),
      location: shopLocation(lang, s.pavilion, s.row),
      pavKey: pavilionKey(s.pavilion),
      fields,
      products: s.products.map((p) => ({
        name: pick(lang, p.nameRu, p.nameKz),
        price: p.price,
        unit: p.unit,
      })),
    };
  });

  const catList = categories.map((c) => ({ slug: c.slug, name: pick(lang, c.nameRu, c.nameKz) }));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ShoppingCenter",
      name: "Рынок Саяхат",
      url: absUrl("/"),
      image: absUrl("/logo-full.webp"),
      description: "Рынок «Саяхат» в Костанае: каталог магазинов и товаров, навигация по павильонам.",
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address,
        addressLocality: site.city,
        addressCountry: "KZ",
      },
      geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
      hasMap: site.gis2Url,
      telephone: site.phones[0],
      openingHours: site.openingHoursSchema,
      sameAs: [site.instagramUrl, site.gis2Url],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: site.rating,
        reviewCount: site.ratingCount,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: shops.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: s.nameRu,
        url: absUrl(`/shop/${s.slug}`),
      })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CatalogProvider shops={cards} initialQuery={initialQuery}>
      <Header variant="catalog" />

      {news.length > 0 && (
        <Reveal>
          <section className="section section--tight news-section" id="news">
            <div className="wrap">
              <div className="section-head">
                <h2>{pick(lang, "Новости рынка", "Базар жаңалықтары")}</h2>
              </div>
              {/* Новости — модульные блоки одного шаблона: одинаковая ширина
                  и высота. Так вёрстка не ломается при любом их количестве. */}
              <div className="news-grid">
                {news.map((n) => {
                  const d = newsDateParts(n.publishedAt, lang);
                  const inner = (
                    <>
                      <div className="news-card__head">
                        {/* Дата работает визуальным якорем вместо картинки:
                            без неё карточка выглядела пустым текстовым блоком. */}
                        <time className="news-date" dateTime={n.publishedAt.toISOString()}>
                          <b>{d.day}</b>
                          <span>{d.month}</span>
                        </time>
                        <h3>{pick(lang, n.titleRu, n.titleKz)}</h3>
                        {n.pinned && (
                          <span className="news-pin" title={pick(lang, "Закреплено", "Бекітілген")}>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <line x1="12" y1="17" x2="12" y2="22" />
                              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      {n.bodyRu && <p>{pick(lang, n.bodyRu, n.bodyKz)}</p>}
                      {n.link && (
                        <a
                          className="news-card__more"
                          href={n.link}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                        >
                          {pick(lang, "Подробнее в Instagram", "Instagram-да толығырақ")}
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="7" y1="17" x2="17" y2="7" />
                            <polyline points="7 7 17 7 17 17" />
                          </svg>
                        </a>
                      )}
                    </>
                  );
                  // Кликабельна только подписанная ссылка, не вся плашка:
                  // в свайп-ленте на телефоне полная кликабельность превращала
                  // каждое неточное листание в вылет в Instagram, а карточки
                  // без ссылки выглядели так же, но не реагировали.
                  return (
                    <article className="news-card" key={n.id}>
                      {inner}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      <CatalogSection
        catalogTitle={pick(lang, "Все магазины рынка «Саяхат» — Костанай", "«Саяхат» базарының барлық дүкендері — Қостанай")}
        categories={catList}
        lang={lang}
        ui={{
          all: pick(lang, "Все", "Барлығы"),
          empty: pick(
            lang,
            "По вашему запросу магазинов не нашлось — попробуйте другую категорию.",
            "Сұрауыңыз бойынша дүкен табылмады — басқа санатты байқап көріңіз.",
          ),
          open: pick(lang, "Открыть", "Ашу"),
          foundPrefix: pick(lang, "Есть: ", "Бар: "),
          looseNote: pick(
            lang,
            "Точных совпадений нет — показываем похожие.",
            "Дәл сәйкестік жоқ — ұқсастарын көрсетеміз.",
          ),
          showAllFound: pick(lang, "Показать все найденные", "Барлық табылғанды көрсету"),
          resetSearch: pick(lang, "Сбросить поиск", "Іздеуді тазалау"),
        }}
      />
      </CatalogProvider>

      <Reveal>
        <GettingThere lang={lang} />
      </Reveal>

      <Reveal>
        <FreeSpaces lang={lang} />
      </Reveal>

      <Footer />
    </>
  );
}

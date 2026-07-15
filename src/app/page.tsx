import { db } from "@/lib/db";
import { getLang, pick } from "@/lib/i18n";
import { newsDate, photoUrl, ruPlural } from "@/lib/format";
import { absUrl } from "@/lib/seo";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BazaarMap } from "@/components/BazaarMap";
import { CatalogSection } from "@/components/CatalogSection";
import { CatalogProvider, type CardShop } from "@/components/CatalogProvider";

export default async function HomePage() {
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
    db.newsPost.findMany({ orderBy: { publishedAt: "desc" }, take: 3 }),
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
    if (s.row && s.pavilion) {
      fields.push({ text: `ряд қатар ${s.row} павильон ${s.pavilion}`, weight: 1, kind: "other" });
    }

    return {
      slug: s.slug,
      name: pick(lang, s.nameRu, s.nameKz),
      categorySlug: s.category.slug,
      categoryName: pick(lang, s.category.nameRu, s.category.nameKz),
      cover: photoUrl(s.cover),
      location:
        s.row && s.pavilion
          ? pick(lang, `Ряд ${s.row} · павильон ${s.pavilion}`, `${s.row} қатар · ${s.pavilion} павильон`)
          : "",
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
      name: "Базар Саяхат",
      url: absUrl("/"),
      image: absUrl("/logo.png"),
      description: "Рынок Саяхат в Костанае: каталог магазинов, товары и цены онлайн.",
      address: { "@type": "PostalAddress", addressLocality: "Костанай", addressCountry: "KZ" },
      openingHours: "Mo-Su 08:00-19:00",
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
      <CatalogProvider shops={cards}>
      <Header variant="catalog" />

      <CatalogSection
        heroTitle={pick(lang, "Базар «Саяхат» — весь базар онлайн", "«Саяхат» базары — бүкіл базар онлайн")}
        catalogEyebrow={pick(lang, "Каталог", "Каталог")}
        catalogTitle={pick(lang, "Магазины базара", "Базар дүкендері")}
        categories={catList}
        lang={lang}
        ui={{
          searchPlaceholder: pick(
            lang,
            "Что ищете? Орехи, платок, обувь, специи…",
            "Не іздейсіз? Жаңғақ, орамал, аяқ киім, дәмдеуіш…",
          ),
          all: pick(lang, "Все", "Барлығы"),
          empty: pick(
            lang,
            "По вашему запросу магазинов не нашлось — попробуйте другую категорию.",
            "Сұрауыңыз бойынша дүкен табылмады — басқа санатты байқап көріңіз.",
          ),
          open: pick(lang, "Открыть", "Ашу"),
          clear: pick(lang, "Очистить", "Тазалау"),
          foundPrefix: pick(lang, "Есть: ", "Бар: "),
          looseNote: pick(
            lang,
            "Точных совпадений нет — показываем похожие.",
            "Дәл сәйкестік жоқ — ұқсастарын көрсетеміз.",
          ),
          showAllFound: pick(lang, "Показать все найденные", "Барлық табылғанды көрсету"),
          resetSearch: pick(lang, "Сбросить поиск", "Іздеуді тазалау"),
          nothing: pick(lang, "Ничего не нашлось", "Ештеңе табылмады"),
        }}
      />
      </CatalogProvider>

      {news.length > 0 && (
        <section className="section section--tight" style={{ background: "var(--surface-2)" }}>
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow">{pick(lang, "Что нового", "Не жаңалық")}</div>
              <h2>{pick(lang, "Новости базара", "Базар жаңалықтары")}</h2>
            </div>
            <div className="news-grid">
              {news.map((n) => (
                <article className="news-card" key={n.id}>
                  <time>{newsDate(n.publishedAt)}</time>
                  <h3>{pick(lang, n.titleRu, n.titleKz)}</h3>
                  {n.bodyRu && <p>{pick(lang, n.bodyRu, n.bodyKz)}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">{pick(lang, "Навигация", "Навигация")}</div>
            <h2>{pick(lang, "Карта базара", "Базар картасы")}</h2>
            <p>
              {pick(
                lang,
                "6 торговых рядов. Найдите нужный ряд заранее — и приезжайте сразу к павильону.",
                "6 сауда қатары. Қажет қатарды алдын ала табыңыз — павильонға бірден келіңіз.",
              )}
            </p>
          </div>
          <BazaarMap lang={lang} />
        </div>
      </section>

      <Footer />
    </>
  );
}

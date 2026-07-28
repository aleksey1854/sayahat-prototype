import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

// Кеш тяжёлых чтений между запросами. Без него каждый визит платил за
// поход в Neon (3–5 запросов на страницу), и время до первого байта
// зависело от задержки базы. Кеш сбрасывается тегом при любом изменении
// в админке или кабинете — публикация остаётся мгновенной.
export const CATALOG_TAG = "catalog";
export const NEWS_TAG = "news";

export const getCategoriesCached = unstable_cache(
  () => db.category.findMany({ orderBy: { order: "asc" } }),
  ["categories"],
  { tags: [CATALOG_TAG] },
);

// Один и тот же набор нужен главной (сетка) и catalog.ts (поиск в шапке) —
// запрос у них идентичен, поэтому кеш общий.
export const getCatalogShopsCached = unstable_cache(
  () =>
    db.shop.findMany({
      where: { status: "published" },
      include: {
        category: true,
        products: { select: { nameRu: true, nameKz: true, price: true, unit: true }, orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ["catalog-shops"],
  { tags: [CATALOG_TAG] },
);

const newsRaw = unstable_cache(
  () =>
    db.newsPost.findMany({
      orderBy: [{ pinned: "desc" }, { sortOrder: "desc" }, { publishedAt: "desc" }],
      take: 3,
    }),
  ["home-news"],
  { tags: [NEWS_TAG] },
);

// Кеш сериализует в JSON, и Date приезжает строкой — оживляем,
// иначе publishedAt.toISOString() на странице упадёт.
export async function getNewsCached() {
  const list = await newsRaw();
  return list.map((n) => ({ ...n, publishedAt: new Date(n.publishedAt) }));
}

const shopFullRaw = unstable_cache(
  (slug: string) =>
    db.shop.findUnique({
      where: { slug },
      include: { category: true, products: { orderBy: { order: "asc" } } },
    }),
  ["shop-full"],
  { tags: [CATALOG_TAG] },
);

// cache() поверх — дедупликация в рамках одного запроса:
// generateMetadata и страница читают магазин один раз, а не дважды.
export const getShopFullCached = cache(shopFullRaw);

const neighborsRaw = unstable_cache(
  (pavilion: string, excludeId: string) =>
    db.shop.findMany({
      where: { pavilion, status: "published", NOT: { id: excludeId } },
      select: { slug: true, nameRu: true, nameKz: true, row: true, category: { select: { nameRu: true, nameKz: true } } },
      orderBy: { nameRu: "asc" },
      take: 6,
    }),
  ["neighbors"],
  { tags: [CATALOG_TAG] },
);

export const getNeighborsCached = cache(neighborsRaw);

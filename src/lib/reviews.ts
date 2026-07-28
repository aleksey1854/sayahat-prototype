import { unstable_cache } from "next/cache";
import { CATALOG_TAG } from "@/lib/cached";
import { db } from "@/lib/db";

export type ShopReview = {
  id: string;
  author: string;
  text: string;
  createdAt: Date;
};

const reviewsRaw = unstable_cache(
  (shopId: string) =>
    db.review.findMany({
      where: { shopId, status: "published" },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: { id: true, author: true, text: true, createdAt: true },
    }),
  ["shop-reviews"],
  { tags: [CATALOG_TAG] },
);

/**
 * Отзывы магазина.
 *
 * Отдельный запрос, а не include внутри запроса магазина — намеренно.
 * Когда отзывы ехали в общем include, отсутствие таблицы в базе роняло
 * весь запрос, и страница магазина отдавала «Что-то пошло не так».
 * Страница-визитка не должна падать из-за необязательного блока.
 *
 * Возвращает:
 *   массив — таблица есть, отзывы прочитаны (может быть пустым)
 *   null   — таблица недоступна, блок отзывов просто не показываем
 *
 * Ошибку не кешируем: unstable_cache сохраняет только успешный результат,
 * поэтому сразу после `npm run db:push` отзывы заработают без редеплоя.
 */
export async function getShopReviews(shopId: string): Promise<ShopReview[] | null> {
  try {
    const list = await reviewsRaw(shopId);
    // Кеш сериализует в JSON, Date возвращается строкой — оживляем.
    return list.map((r) => ({ ...r, createdAt: new Date(r.createdAt) }));
  } catch (e) {
    console.error(
      "[reviews] Не удалось прочитать отзывы — блок скрыт. " +
        "Обычно это значит, что таблица Review не создана: выполните `npm run db:push`.",
      e,
    );
    return null;
  }
}

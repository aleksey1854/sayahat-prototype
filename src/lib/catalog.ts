import { getCatalogShopsCached } from "@/lib/cached";
import { SHOW_PRODUCTS } from "@/lib/features";
import { pick, type Lang } from "@/lib/lang";
import { photoUrl } from "@/lib/format";
import { pavilionKey, boothLabel, pavilionLabel } from "@/lib/site";
import type { CardShop } from "@/components/CatalogProvider";

// Один и тот же набор нужен главной (каталог) и странице магазина (поиск в шапке).
// Держим сборку в одном месте, чтобы поиск везде работал одинаково.
export async function loadCatalogCards(lang: Lang): Promise<CardShop[]> {
  const shops = await getCatalogShopsCached();

  return shops.map((s) => {
    const fields: CardShop["fields"] = [
      { text: `${s.nameRu} ${s.nameKz}`, weight: 10, kind: "name" },
      { text: `${s.category.nameRu} ${s.category.nameKz}`, weight: 6, kind: "other" },
      // Товары остаются в индексе: «кто продаёт казы» — главный сценарий
      // каталога. Но пока ассортимент на сайте скрыт, помечаем их как
      // обычный текст: kind "product" заставляет подсказку показать
      // название товара и цену, а человек, перейдя, их на странице не найдёт.
      ...s.products.map((p, i) => ({
        text: `${p.nameRu} ${p.nameKz ?? ""}`,
        weight: 5,
        kind: (SHOW_PRODUCTS ? "product" : "other") as "product" | "other",
        productIdx: SHOW_PRODUCTS ? i : undefined,
      })),
      { text: s.slug, weight: 2, kind: "other" as const },
    ];
    // Оба описания в индекс: по-казахски ищут теми же словами, что написаны
    // в казахской версии, и без этого поиск на «ҚАЗ» находил бы меньше.
    if (s.descRu) fields.push({ text: s.descRu, weight: 3, kind: "other" });
    if (s.descKz) fields.push({ text: s.descKz, weight: 3, kind: "other" });
    // Ключевые слова — то, что точка продаёт, своими словами. Вес как
    // у товаров: это ровно та же роль, только заполняется вручную.
    if (s.keywords) fields.push({ text: s.keywords, weight: 5, kind: "other" });
    if (s.pavilion) {
      fields.push({ text: `павильон бутик ${s.pavilion} ${s.row ?? ""}`, weight: 1, kind: "other" });
    }

    const loc = s.pavilion ? `${pavilionLabel(lang, s.pavilion)}${boothLabel(lang, s.row)}` : "";

    return {
      slug: s.slug,
      name: pick(lang, s.nameRu, s.nameKz),
      categorySlug: s.category.slug,
      categoryName: pick(lang, s.category.nameRu, s.category.nameKz),
      cover: photoUrl(s.cover),
      location: loc,
      pavKey: pavilionKey(s.pavilion),
      fields,
      products: s.products.map((p) => ({
        name: pick(lang, p.nameRu, p.nameKz),
        price: p.price,
        unit: p.unit,
      })),
    };
  });
}

import { db } from "@/lib/db";
import { pick, type Lang } from "@/lib/lang";
import { photoUrl } from "@/lib/format";
import { pavilionKey, boothLabel, pavilionLabel } from "@/lib/site";
import type { CardShop } from "@/components/CatalogProvider";

// Один и тот же набор нужен главной (каталог) и странице магазина (поиск в шапке).
// Держим сборку в одном месте, чтобы поиск везде работал одинаково.
export async function loadCatalogCards(lang: Lang): Promise<CardShop[]> {
  const shops = await db.shop.findMany({
    where: { status: "published" },
    include: {
      category: true,
      products: { select: { nameRu: true, nameKz: true, price: true, unit: true }, orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  return shops.map((s) => {
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

/**
 * Удалить из базы все магазины, кроме настоящих.
 *
 *   npx tsx scripts/keep-only.ts --dry     показать, что удалится
 *   npx tsx scripts/keep-only.ts --yes     удалить
 *
 * ЭТО НЕОБРАТИМО. Перед запуском обязательно:
 *   npx tsx scripts/backup.ts
 *
 * Вместе с магазином уходят его товары и отзывы (каскадом по схеме),
 * а аккаунт арендатора остаётся, но отвязывается от магазина —
 * в схеме у него onDelete: SetNull. Такие аккаунты скрипт находит
 * и удаляет отдельно, иначе в разделе «Сотрудники» останутся входы
 * в никуда.
 *
 * Загруженные через кабинет фотографии удаляются с диска. Файлы из
 * public/photos не трогаются: они лежат в репозитории и относятся
 * к остающимся точкам.
 */
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();
const DRY = !process.argv.includes("--yes");

// Точки, которые остаются. Всё остальное будет удалено.
const KEEP = ["ayan-et", "svoy-style", "tashkent"];

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

// Удаляем только то, что лежит в uploads. Пути вида "demo/meat-1.jpg"
// и "ayan-et/cover.webp" — это public/photos, они в репозитории.
async function dropUpload(url?: string | null) {
  if (!url || !url.startsWith("/uploads/")) return;
  const name = url.replace("/uploads/", "");
  for (const f of [name, name.replace(/\.webp$/, "-sm.webp")]) {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, f));
    } catch {
      /* файла может не быть — это не ошибка */
    }
  }
}

async function main() {
  const shops = await prisma.shop.findMany({
    select: { id: true, slug: true, nameRu: true, cover: true, logo: true, layout: true },
    orderBy: { nameRu: "asc" },
  });

  const missing = KEEP.filter((slug) => !shops.some((s) => s.slug === slug));
  if (missing.length) {
    console.error(`ОСТАНОВКА: в базе нет магазинов ${missing.join(", ")}.`);
    console.error("Проверьте слаги в списке KEEP — иначе удалите не то.");
    process.exit(1);
  }

  const doomed = shops.filter((s) => !KEEP.includes(s.slug));

  console.log(`Остаются (${KEEP.length}):`);
  for (const s of shops.filter((x) => KEEP.includes(x.slug))) console.log(`  ${s.nameRu} (${s.slug})`);

  console.log(`\nБудут удалены безвозвратно: ${doomed.length}`);
  for (const s of doomed.slice(0, 12)) console.log(`  ${s.nameRu}`);
  if (doomed.length > 12) console.log(`  ... и ещё ${doomed.length - 12}`);

  const ids = doomed.map((s) => s.id);
  const [products, reviews, accounts] = await Promise.all([
    prisma.product.count({ where: { shopId: { in: ids } } }),
    prisma.review.count({ where: { shopId: { in: ids } } }).catch(() => 0),
    prisma.account.count({ where: { shopId: { in: ids } } }),
  ]);
  console.log(`\nВместе с ними: товаров ${products}, отзывов ${reviews}, аккаунтов арендаторов ${accounts}`);

  if (DRY) {
    console.log("\nНичего не удалено. Для удаления запустите с флагом --yes");
    console.log("И сначала сделайте копию: npx tsx scripts/backup.ts");
    return;
  }

  // Аккаунты — первыми: при удалении магазина связь обнулится,
  // и найти их будет уже нечем.
  const del = await prisma.account.deleteMany({ where: { shopId: { in: ids } } });

  for (const s of doomed) {
    await dropUpload(s.cover);
    await dropUpload(s.logo);
    try {
      const layout = s.layout ? (JSON.parse(s.layout) as Record<string, unknown>) : {};
      const about = layout.about as { image?: string } | undefined;
      await dropUpload(about?.image);
      for (const g of (layout.gallery as string[] | undefined) ?? []) await dropUpload(g);
    } catch {
      /* повреждённый layout не должен ронять удаление */
    }
  }

  const res = await prisma.shop.deleteMany({ where: { slug: { notIn: KEEP } } });

  const left = await prisma.shop.count();
  console.log(`\nУдалено магазинов: ${res.count}, аккаунтов: ${del.count}. В базе осталось: ${left}.`);
  console.log("\nОткройте /admin и нажмите «Сохранить» у любого магазина — кеш каталога");
  console.log("скрипт не сбрасывает.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

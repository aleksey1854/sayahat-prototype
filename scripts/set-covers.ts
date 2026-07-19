import { PrismaClient } from "@prisma/client";
import { coverFor } from "../prisma/demo-photos";

const prisma = new PrismaClient();

// Проставляет демо-обложки существующим магазинам, НИЧЕГО не удаляя —
// в отличие от db:seed, который сначала чистит все таблицы.
//
//   npm run covers          — только магазинам без обложки
//   npm run covers -- --all — перезаписать у всех (затрёт и загруженные фото)
async function main() {
  const all = process.argv.includes("--all");

  const shops = await prisma.shop.findMany({
    select: { id: true, slug: true, nameRu: true, cover: true, category: { select: { slug: true } } },
    orderBy: { nameRu: "asc" },
  });

  if (shops.length === 0) {
    console.log("В базе нет магазинов. Сначала залей данные: npm run db:seed");
    return;
  }

  let set = 0;
  let skipped = 0;

  for (const s of shops) {
    if (s.cover && !all) {
      skipped++;
      continue;
    }
    await prisma.shop.update({
      where: { id: s.id },
      data: { cover: coverFor(s.slug, s.category?.slug ?? "") },
    });
    set++;
  }

  console.log(`Обложки проставлены: ${set}` + (skipped ? `, пропущено (уже были): ${skipped}` : ""));
  if (!all && skipped) console.log("Перезаписать все: npm run covers -- --all");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

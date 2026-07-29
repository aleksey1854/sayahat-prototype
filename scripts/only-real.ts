/**
 * Оставить на сайте только реально заполненные точки, остальные скрыть.
 *
 *   npx tsx scripts/only-real.ts --dry    показать, что изменится
 *   npx tsx scripts/only-real.ts          применить
 *   npx tsx scripts/only-real.ts --undo   вернуть всех обратно на сайт
 *
 * Ничего не удаляет. Меняет только поле status, поэтому любой магазин
 * можно вернуть кнопкой «Показать на сайте» в админке.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");
const UNDO = process.argv.includes("--undo");

// Точки, которые заполнены по-настоящему: телефон, фото, описание, адрес.
// Их статус скрипт не трогает вообще. Добавили новую руками — впишите сюда.
const REAL = ["ayan-et", "svoy-style", "tashkent", "sladkoejka"];

async function main() {
  const shops = await prisma.shop.findMany({
    select: { id: true, slug: true, nameRu: true, status: true },
    orderBy: { nameRu: "asc" },
  });

  const real = shops.filter((s) => REAL.includes(s.slug));
  const rest = shops.filter((s) => !REAL.includes(s.slug));

  const missing = REAL.filter((slug) => !shops.some((s) => s.slug === slug));
  if (missing.length) {
    console.log(`ВНИМАНИЕ: в базе нет магазинов: ${missing.join(", ")}`);
    console.log("Проверьте слаги в списке REAL, иначе скроете не то.\n");
  }

  if (UNDO) {
    console.log(`Вернуть на сайт: ${rest.length} магазинов.`);
    if (DRY) return;
    await prisma.shop.updateMany({
      where: { slug: { notIn: REAL } },
      data: { status: "published" },
    });
    console.log("Готово. Все магазины снова на сайте.");
    return;
  }

  console.log("Остаются как есть:");
  for (const s of real) {
    console.log(`  ${s.nameRu} (${s.slug}) — сейчас ${s.status === "published" ? "на сайте" : "скрыт"}`);
  }

  const toHide = rest.filter((s) => s.status === "published");
  console.log(`\nБудут скрыты: ${toHide.length} из ${rest.length}`);
  for (const s of toHide.slice(0, 10)) console.log(`  ${s.nameRu}`);
  if (toHide.length > 10) console.log(`  ... и ещё ${toHide.length - 10}`);

  if (DRY) {
    console.log("\n--dry: ничего не записано.");
    return;
  }

  await prisma.shop.updateMany({
    where: { slug: { notIn: REAL } },
    data: { status: "draft" },
  });

  const live = await prisma.shop.count({ where: { status: "published" } });
  console.log(`\nГотово. На сайте осталось магазинов: ${live}.`);
  console.log(
    "\nОткройте /admin и нажмите «Сохранить» у любого магазина — скрипт пишет\n" +
      "мимо Next и кеш каталога сам не сбрасывает.",
  );
  console.log("Вернуть всех обратно: npx tsx scripts/only-real.ts --undo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

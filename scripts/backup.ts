/**
 * Резервная копия всей базы в один JSON-файл.
 *
 *   npx tsx scripts/backup.ts
 *
 * Кладёт файл backups/sayahat-ГГГГ-ММ-ДД-ЧЧММ.json рядом с проектом.
 * Запускать перед каждым переездом и перед любой командой, которая
 * трогает схему.
 *
 * Что попадает: категории, магазины со всей вёрсткой витрин, товары,
 * отзывы, новости, аккаунты.
 *
 * ВАЖНО: в файле есть хеши паролей. Это не открытые пароли, но файл
 * всё равно не место в git — папка backups добавляется в .gitignore.
 *
 * Чего файл НЕ содержит: загруженные через кабинет фотографии. Они лежат
 * файлами в папке uploads (или в Vercel Blob) и копируются отдельно.
 */
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

async function main() {
  const dir = path.join(process.cwd(), "backups");
  await fs.mkdir(dir, { recursive: true });

  const data: Record<string, unknown> = {
    takenAt: new Date().toISOString(),
    categories: await prisma.category.findMany({ orderBy: { order: "asc" } }),
    shops: await prisma.shop.findMany({ orderBy: { createdAt: "asc" } }),
    products: await prisma.product.findMany({ orderBy: { order: "asc" } }),
    accounts: await prisma.account.findMany(),
  };

  // Отзывы и новости могли ещё не появиться в базе — не роняем копию из-за них.
  try {
    data.reviews = await prisma.review.findMany();
  } catch {
    data.reviews = [];
    console.log("Отзывы пропущены: таблицы Review в базе нет.");
  }
  try {
    data.news = await prisma.newsPost.findMany();
  } catch {
    data.news = [];
    console.log("Новости пропущены: таблицы нет.");
  }

  const file = path.join(dir, `sayahat-${stamp()}.json`);
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");

  const size = (await fs.stat(file)).size;
  const c = (k: string) => (Array.isArray(data[k]) ? (data[k] as unknown[]).length : 0);

  console.log(`\nКопия сохранена: ${file}  (${Math.round(size / 1024)} КБ)`);
  console.log(`  категорий  ${c("categories")}`);
  console.log(`  магазинов  ${c("shops")}`);
  console.log(`  товаров    ${c("products")}`);
  console.log(`  отзывов    ${c("reviews")}`);
  console.log(`  новостей   ${c("news")}`);
  console.log(`  аккаунтов  ${c("accounts")}`);
  console.log("\nФотографии из кабинета сюда не входят: копируйте папку uploads отдельно.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

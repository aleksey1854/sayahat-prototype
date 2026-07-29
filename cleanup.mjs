/**
 * Очистка проекта перед заливкой. Работает на Windows без WSL.
 *
 *   node cleanup.mjs --dry    показать, что удалится
 *   node cleanup.mjs          удалить
 *
 * Удаляются только файлы, на которые нет ссылок в src, prisma и scripts.
 * Рабочий код не трогается.
 *
 * После удаления обязательно закоммитить: файлы отслеживаются git,
 * и без коммита вернутся при следующем git pull на сервере.
 */
import { promises as fs } from "fs";
import path from "path";

const DRY = process.argv.includes("--dry");

const TARGETS = [
  ["Демо-фотографии (на сайте не используются)", ["public/photos/demo"]],
  [
    "Одиночные демо-снимки в корне photos",
    [
      "chernosliv", "cover", "electronics", "finiki", "fistashki",
      "household", "household-a", "household-b", "household-c",
      "kuraga", "lukum", "meat", "meat-a", "meat-b", "oreh",
      "prilavok", "shoes", "spices", "textile", "textile-a",
      "textile-b", "veg", "veg-a",
    ].map((n) => `public/photos/${n}.jpg`),
  ],
  ["Фото удалённого магазина", ["public/photos/sladkoejka"]],
  [
    "Неиспользуемые варианты логотипа",
    ["public/logo.png", "public/logo-square.webp", "public/logo-horizontal.webp", "public/logo-horizontal.png"],
  ],
  [
    "Скрипты, перезаписывающие данные демо-набором",
    ["scripts/import-photos.ts", "scripts/set-covers.ts", "scripts/import-sladkoejka.ts"],
  ],
  ["Артефакты сборки", ["tsconfig.tsbuildinfo"]],
];

async function sizeOf(p) {
  const st = await fs.stat(p);
  if (!st.isDirectory()) return st.size;
  let total = 0;
  for (const e of await fs.readdir(p)) total += await sizeOf(path.join(p, e));
  return total;
}

const kb = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} МБ` : `${Math.round(b / 1024)} КБ`);

let freed = 0;
let count = 0;

for (const [title, list] of TARGETS) {
  const found = [];
  for (const rel of list) {
    try {
      const s = await sizeOf(rel);
      found.push([rel, s]);
    } catch {
      // файла нет — уже удалён или не создавался
    }
  }
  if (!found.length) continue;

  console.log(`\n${title}:`);
  for (const [rel, s] of found) {
    console.log(`  ${rel.padEnd(42)} ${kb(s)}`);
    freed += s;
    count++;
    if (!DRY) await fs.rm(rel, { recursive: true, force: true });
  }
}

console.log(`\nВсего: ${count} объектов, ${kb(freed)}`);

if (DRY) {
  console.log("\nЭто сухой прогон, ничего не удалено.");
  console.log("Запустите без --dry, чтобы удалить.");
} else {
  console.log("\nГотово. Дальше:");
  console.log("  npx tsc --noEmit");
  console.log("  npm run build");
  console.log('  git add -A && git commit -m "чистка" && git push');
}

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

// Импорт своих фото в каталог.
//
// Кладёшь файлы в photos-input/<категория>/ — любые имена, любой размер:
//
//   photos-input/meat/1.jpg
//   photos-input/cloth/svoy-style.png
//   photos-input/veg/bakhsha.webp
//
// Запускаешь:  npm run photos
//
// Скрипт обрежет каждое фото по центру под пропорцию карточки (16:10),
// уменьшит до 1000px, пережмёт в jpg и разложит по магазинам этой категории.
// Маппинг slug → файл перезапишется в prisma/demo-photos.ts.
// Дальше: задеплоить, потом npm run covers -- --all

const IN = "photos-input";
const OUT = "public/photos/demo";
const WIDTH = 1000;

const CATEGORIES = [
  "meat", "sweets", "veg", "cloth", "shoe", "bags", "tea", "tech",
  "home", "kids", "beauty", "optics", "pets", "flowers", "handmade",
];

type Shop = { slug: string; category: string };

function readShops(): Shop[] {
  const seed = fs.readFileSync("prisma/seed.ts", "utf8");
  const block = seed.split("const tenants: Tenant[] = [")[1].split("\n];")[0];
  const out: Shop[] = [];
  const re = /slug:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) out.push({ slug: m[1], category: m[2] });
  return out;
}

async function main() {
  if (!fs.existsSync(IN)) {
    fs.mkdirSync(IN, { recursive: true });
    for (const c of CATEGORIES) fs.mkdirSync(path.join(IN, c), { recursive: true });
    console.log(`Создал ${IN}/ с папками по категориям. Положи туда фото и запусти снова.`);
    return;
  }

  const shops = readShops();
  const need = new Map<string, number>();
  for (const s of shops) need.set(s.category, (need.get(s.category) ?? 0) + 1);

  fs.mkdirSync(OUT, { recursive: true });
  const ready = new Map<string, string[]>();

  for (const cat of CATEGORIES) {
    const dir = path.join(IN, cat);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort();
    if (!files.length) continue;

    const made: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const name = `${cat}-${i + 1}.jpg`;
      await sharp(path.join(dir, files[i]))
        .rotate()
        .resize(WIDTH, Math.round(WIDTH / 1.6), { fit: "cover", position: "attention" })
        .jpeg({ quality: 80, progressive: true, mozjpeg: true })
        .toFile(path.join(OUT, name));
      made.push(`demo/${name}`);
    }
    ready.set(cat, made);

    const want = need.get(cat) ?? 0;
    const mark = made.length >= want ? "OK" : `не хватает ${want - made.length}`;
    console.log(`  ${cat.padEnd(9)} фото: ${String(made.length).padStart(2)} · магазинов: ${String(want).padStart(2)} · ${mark}`);
  }

  if (!ready.size) {
    console.log(`В ${IN}/ нет изображений. Положи файлы в папки по категориям.`);
    return;
  }

  // раздаём: каждому магазину свой файл, при нехватке идём по кругу
  const turn = new Map<string, number>();
  const covers: Record<string, string> = {};
  for (const s of shops) {
    const pool = ready.get(s.category);
    if (!pool?.length) continue;
    const i = turn.get(s.category) ?? 0;
    turn.set(s.category, i + 1);
    covers[s.slug] = pool[i % pool.length];
  }

  const lines = Object.entries(covers).map(([k, v]) => `  "${k}": "${v}"`).join(",\n");
  const src = `// СГЕНЕРИРОВАНО скриптом npm run photos — правки затрутся при следующем запуске.
// Источник: папка photos-input/<категория>/
export const DEMO_COVERS: Record<string, string> = {
${lines},
};

export const DEMO_POOL: Record<string, string[]> = ${JSON.stringify(
    Object.fromEntries(ready), null, 2,
  ).replace(/\n/g, "\n")};

export const FALLBACK_PHOTO = ${JSON.stringify(Object.values(covers)[0] ?? "demo/cover-1.jpg")};

export function coverFor(slug: string, categorySlug: string): string {
  return DEMO_COVERS[slug] ?? DEMO_POOL[categorySlug]?.[0] ?? FALLBACK_PHOTO;
}
`;
  fs.writeFileSync("prisma/demo-photos.ts", src, "utf8");

  const uniq = new Set(Object.values(covers)).size;
  console.log(`\nГотово. Магазинов с обложкой: ${Object.keys(covers).length}, разных файлов: ${uniq}`);
  const without = shops.filter((s) => !covers[s.slug]).map((s) => s.slug);
  if (without.length) console.log(`Без обложки (нет фото в категории): ${without.join(", ")}`);
  console.log("\nДальше: задеплой, потом  npm run covers -- --all");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

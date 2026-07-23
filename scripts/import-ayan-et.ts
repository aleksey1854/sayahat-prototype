/**
 * Импорт реального магазина «AYAN ET» в базу.
 *
 *   npx tsx scripts/import-ayan-et.ts --dry   — показать, что изменится, ничего не писать
 *   npx tsx scripts/import-ayan-et.ts         — записать
 *
 * Что делает: заводит (или обновляет по slug) один магазин ayan-et,
 * его товары и блок витрины. Фото берёт из public/photos/ayan-et/ —
 * они лежат в репозитории, поэтому переживают деплой и не зависят
 * от Blob-токена.
 *
 * Чего НЕ делает: не трогает схему, другие магазины, категории,
 * новости и аккаунты. Запускать можно повторно — результат тот же.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

const SLUG = "ayan-et";
const CATEGORY = "meat";
const PIC = (name: string) => `${SLUG}/${name}`; // photoUrl() допишет /photos/

// Витрина магазина: tagline, блок «о нас», плашки доверия, галерея.
// Казахский текст — черновой, нужна вычитка носителем.
const layout = {
  tagline: "Свежая конина и говядина каждый день.",
  taglineKz: "Күн сайын жаңа сойылған жылқы және сиыр еті.",
  about: {
    title: "Мясо от проверенных фермеров",
    titleKz: "Сенімді фермерлердің еті",
    image: PIC("prilavok.webp"),
    paragraphs: [
      "AYAN ET — мясная точка Нургуль на рынке «Саяхат». Больше десяти лет работы и прямые поставки от фермеров Костанайской области: конина и говядина свежие каждый день, фарш крутим ежедневно.",
      "Своё производство — домашний шұжық и копчёное қазы по-домашнему. Подскажем, что брать на бешбармак, и соберём набор целиком: омыртқа, жамбас, жая, қарта, қазы, шұжық. Витрина 13, продуктовый павильон. Есть доставка по Костанаю.",
    ],
    paragraphsKz: [
      "AYAN ET — «Саяхат» базарындағы Нұргүлдің ет дүкені. Он жылдан астам тәжірибе және Қостанай облысы фермерлерінен тікелей жеткізу: жылқы мен сиыр еті күн сайын жаңа, фарш күнде тартылады.",
      "Өз өндірісіміз — үй шұжығы және үйдегідей ысталған қазы. Бешбармаққа не алу керегін айтып береміз, жиынтықты толық жинаймыз: омыртқа, жамбас, жая, қарта, қазы, шұжық. 13-витрина, азық-түлік павильоны. Қостанай бойынша жеткізу бар.",
    ],
  },
  trust: [
    { title: "10+ лет", titleKz: "10+ жыл", sub: "на рынке «Саяхат»", subKz: "«Саяхат» базарында" },
    { title: "Витрина 13", titleKz: "13-витрина", sub: "продуктовый павильон", subKz: "азық-түлік павильоны" },
    { title: "Честный вес", titleKz: "Әділ салмақ", sub: "без переплат", subKz: "артық төлемсіз" },
    { title: "Доставка", titleKz: "Жеткізу", sub: "по Костанаю", subKz: "Қостанай бойынша" },
  ],
  gallery: [
    PIC("vitrina.webp"),
    PIC("lotok.webp"),
    PIC("shuzhyk-lotok.webp"),
    PIC("kazy-razrez.webp"),
    PIC("kazy-kopchenoe.webp"),
  ],
};

const shopData = {
  nameRu: "AYAN ET",
  nameKz: "AYAN ET",
  // «Аян Ет» первым словом: поиск индексирует descRu с весом 3,
  // транслитерации нет — иначе русский запрос магазин не найдёт.
  descRu:
    "Аян Ет — свежая конина и говядина от фермеров Костанайской области. Домашний шұжық, копчёное қазы, фарш крутим ежедневно; поможем собрать набор на бешбармак.",
  descKz:
    "Аян Ет — Қостанай облысы фермерлерінің жаңа сойылған жылқы және сиыр еті. Үй шұжығы, ысталған қазы, күн сайын тартылған фарш; бешбармаққа жиынтық жинап береміз.",
  cover: PIC("cover.webp"),
  phone: "+7 778 740 44 31",
  whatsapp: "77787404431",
  instagram: "ayan.et_karatal", // только ник, страница выводит его как @ник
  row: "витрина 13",
  pavilion: "Продуктовый",
  hours: "Вт–Вс, 10:00–19:00",
  metaTitle: "AYAN ET — мясо, қазы и шұжық на рынке Саяхат в Костанае",
  metaDesc:
    "Свежая конина и говядина каждый день, домашний шұжық и копчёное қазы, ежедневный фарш. Витрина 13, рынок Саяхат, Костанай. Телефон +7 778 740 44 31, доставка по городу.",
  layout: JSON.stringify(layout),
  status: "published",
};

// Цены не заводим: актуальных нет, придут от Нургуль.
const products = [
  { nameRu: "Конина свежая",     nameKz: "Жылқы еті",           unit: "кг", image: PIC("konina.webp") },
  { nameRu: "Говядина свежая",   nameKz: "Сиыр еті",            unit: "кг", image: PIC("govyadina.webp") },
  { nameRu: "Қазы копчёное",     nameKz: "Ысталған қазы",       unit: "кг", image: PIC("kazy-kopchenoe.webp") },
  { nameRu: "Қазы домашнее",     nameKz: "Қазы",                unit: "кг", image: PIC("kazy.webp") },
  { nameRu: "Шұжық домашний",    nameKz: "Үй шұжығы",           unit: "кг", image: PIC("shuzhyk.webp") },
  { nameRu: "Жая",               nameKz: "Жая",                 unit: "кг", image: PIC("zhaya.webp") },
  { nameRu: "Қарта",             nameKz: "Қарта",               unit: "кг", image: PIC("karta.webp") },
  { nameRu: "Қабырға (рёбра)",   nameKz: "Қабырға",             unit: "кг", image: PIC("kabyrga.webp") },
];

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: CATEGORY } });
  if (!category) {
    throw new Error(
      `В базе нет категории «${CATEGORY}». Похоже, база пустая — сначала подними категории, потом запускай импорт.`
    );
  }

  const existing = await prisma.shop.findUnique({
    where: { slug: SLUG },
    include: { _count: { select: { products: true } } },
  });

  if (existing) {
    console.log(`Магазин «${SLUG}» уже есть: «${existing.nameRu}», товаров ${existing._count.products}.`);
    console.log("Поля и товары будут перезаписаны значениями из этого скрипта.");
  } else {
    console.log(`Магазина «${SLUG}» в базе нет — будет создан.`);
  }

  if (DRY) {
    console.log("\n--dry: ничего не записано. Что встанет:");
    console.log(`  обложка   ${shopData.cover}`);
    console.log(`  телефон   ${shopData.phone}`);
    console.log(`  витрина   ${shopData.row}, ${shopData.pavilion}`);
    console.log(`  товаров   ${products.length}`);
    console.log(`  галерея   ${layout.gallery.length} фото`);
    return;
  }

  const shop = await prisma.shop.upsert({
    where: { slug: SLUG },
    create: { slug: SLUG, categoryId: category.id, ...shopData },
    update: { categoryId: category.id, ...shopData },
  });

  // Товары только этого магазина: старые убираем, свои ставим по порядку.
  await prisma.product.deleteMany({ where: { shopId: shop.id } });
  await prisma.product.createMany({
    data: products.map((p, i) => ({ ...p, shopId: shop.id, order: i })),
  });

  console.log(`\nГотово. Магазин «${shop.nameRu}» записан, товаров ${products.length}.`);
  console.log(`Проверить: /shop/${SLUG}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

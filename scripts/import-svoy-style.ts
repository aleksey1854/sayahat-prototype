/**
 * Импорт магазина «Свой стиль» в базу.
 *
 *   npx tsx scripts/import-svoy-style.ts --dry
 *   npx tsx scripts/import-svoy-style.ts
 *
 * Фото настоящие, из профиля точки: 11 кадров без оверлеев, все от 1050 px.
 * Лежат в public/photos/svoy-style/ — переживают деплой.
 *
 * Схему, другие магазины, категории, новости и аккаунты не трогает.
 * Запускается повторно, результат тот же.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

const SLUG = "svoy-style"; // как в сиде, не меняем — на него уже есть ссылки
const CATEGORY = "cloth";
const PIC = (name: string) => `${SLUG}/${name}`; // photoUrl() допишет /photos/

const layout = {
  tagline: "У каждого свой стиль.",
  taglineKz: "Әркімнің өз стилі бар.",
  about: {
    title: "Одежда, в которой удобно",
    titleKz: "Ыңғайлы киім",
    image: PIC("rack-1.webp"),
    paragraphs: [
      "«Свой стиль» — женская одежда свободного кроя и отдельная линия для будущих мам. Лён, муслин, хлопок: сарафаны, рубашки, платья, базовые футболки с кармашками, лонгсливы и нарядные брючные костюмы.",
      "Беременность — это не про неудобство, а про заботу о себе. Офисные брюки с регулируемой резинкой, леггинсы в рубчик со вставкой для живота, бельё для будущих мам — вещи, которые не давят, растут вместе с животиком и остаются в гардеробе после родов. Бутик 33, вход со стороны вещевого павильона №1. Kaspi RED, доставка по Казахстану.",
    ],
    paragraphsKz: [
      "«Свой стиль» — еркін пішімді әйелдер киімі және болашақ аналарға арналған жеке желі. Зығыр, муслин, мақта: сарафандар, жейделер, көйлектер, қалташалы негізгі футболкалар, лонгсливтер және сәнді шалбар костюмдер.",
      "Жүктілік — қолайсыздық емес, өзіңе қамқорлық. Реттелетін резеңкесі бар кеңсе шалбарлары, іш салмасы бар жолақты легинстер, болашақ аналарға арналған іш киім — қыспайтын, іштің өсуімен бірге өсетін және босанғаннан кейін де киілетін заттар. 33-бутик, №1 киім павильоны жағынан кіру. Kaspi RED, Қазақстан бойынша жеткізу.",
    ],
  },
  trust: [
    { title: "С 1 по 9 месяц", titleKz: "1-ден 9 айға дейін", sub: "и после родов", subKz: "және босанғаннан кейін" },
    { title: "Бутик 33", titleKz: "33-бутик", sub: "вещевой павильон №1", subKz: "№1 киім павильоны" },
    { title: "Kaspi RED", titleKz: "Kaspi RED", sub: "покупка в рассрочку", subKz: "бөліп төлеу" },
    { title: "Доставка", titleKz: "Жеткізу", sub: "по Казахстану", subKz: "Қазақстан бойынша" },
  ],
  gallery: [
    PIC("rack-5.webp"),
    PIC("rack-2.webp"),
    PIC("rack-3.webp"),
    PIC("rack-4.webp"),
    PIC("rack-1.webp"),
  ],
};

const shopData = {
  nameRu: "Свой стиль",
  nameKz: "Свой стиль",
  descRu:
    "Женская одежда свободного кроя и отдельная линия для будущих мам: лён, муслин, хлопок. Вещи, которые не давят, растут вместе с животиком и остаются в гардеробе после родов.",
  descKz:
    "Еркін пішімді әйелдер киімі және болашақ аналарға арналған жеке желі: зығыр, муслин, мақта. Қыспайтын, іштің өсуімен бірге өсетін және босанғаннан кейін де киілетін заттар.",
  cover: PIC("cover.webp"),
  logo: PIC("logo.webp"),
  phone: "+7 705 570 23 25",
  whatsapp: "77055702325",
  instagram: "svoy_style_kst",
  // Цифрами: boothLabel() сам подставит «бутик №33» и «№33 бутик» по языку.
  row: "33",
  pavilion: "Вещевой №1",
  landmark: null, // павильон и бутик уже дают адрес, дублировать нечем
  hours: "Вт–Вс, 10:00–17:00", // понедельник выходной
  metaTitle: "Свой стиль — одежда для беременных и базовый гардероб, Костанай",
  metaDesc:
    "Женская одежда свободного кроя и линия для будущих мам: лён, муслин, хлопок. Брюки с регулируемой резинкой, леггинсы со вставкой для живота. Рынок Саяхат, бутик 33. +7 705 570 23 25.",
  layout: JSON.stringify(layout),
  status: "published",
};

// Цен нет — не присылали. Фото стоят только там, где вещь на кадре читается
// однозначно; что из брюк на стойках — модели для беременных, по снимкам не видно.
const products = [
  { nameRu: "Платье свободного кроя",        nameKz: "Еркін пішімді көйлек",              unit: "шт", image: PIC("plate.webp") },
  { nameRu: "Рубашка, муслин и лён",         nameKz: "Муслин және зығыр жейде",           unit: "шт", image: PIC("rubashka-len.webp") },
  { nameRu: "Рубашка с принтом",             nameKz: "Баспалы жейде",                     unit: "шт", image: PIC("rubashka-print.webp") },
  { nameRu: "Брюки-шаровары летние",         nameKz: "Жеңіл жазғы шалбар",                unit: "шт", image: PIC("shalvary.webp") },
  { nameRu: "Брюки свободного кроя",         nameKz: "Еркін пішімді шалбар",              unit: "шт", image: PIC("bryuki.webp") },
  { nameRu: "Сарафан льняной",               nameKz: "Зығыр сарафан",                     unit: "шт" },
  { nameRu: "Футболка oversize с кармашком", nameKz: "Қалташалы oversize футболка",       unit: "шт" },
  { nameRu: "Лонгслив",                      nameKz: "Лонгслив",                          unit: "шт" },
  { nameRu: "Брюки офисные для беременных",  nameKz: "Жүктілерге арналған кеңсе шалбары", unit: "шт" },
  { nameRu: "Леггинсы со вставкой для живота", nameKz: "Іш салмасы бар легинс",           unit: "шт" },
  { nameRu: "Бельё для будущих мам",         nameKz: "Болашақ аналарға арналған іш киім", unit: "шт" },
];

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: CATEGORY } });
  if (!category) {
    throw new Error(`В базе нет категории «${CATEGORY}». Похоже, база пустая.`);
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
    console.log(`  логотип   ${shopData.logo}`);
    console.log(`  телефон   ${shopData.phone}`);
    console.log(`  адрес     ${shopData.pavilion}, бутик ${shopData.row}`);
    console.log(`  товаров   ${products.length}, из них с фото ${products.filter((p) => "image" in p).length}`);
    console.log(`  галерея   ${layout.gallery.length} фото`);
    console.log(`  статус    ${shopData.status}`);
    return;
  }

  const shop = await prisma.shop.upsert({
    where: { slug: SLUG },
    create: { slug: SLUG, categoryId: category.id, ...shopData },
    update: { categoryId: category.id, ...shopData },
  });

  await prisma.product.deleteMany({ where: { shopId: shop.id } });
  await prisma.product.createMany({
    data: products.map((p, i) => ({ ...p, shopId: shop.id, order: i })),
  });

  console.log(`\nГотово. Магазин «${shop.nameRu}» записан, товаров ${products.length}.`);
  console.log(`Проверить: /shop/${SLUG}`);
  console.log(
    "\nВАЖНО: скрипт пишет в базу мимо Next и кеш чтений не сбрасывает.\n" +
      "Открой /admin, зайди в любой магазин и нажми «Сохранить» — тег catalog\n" +
      "один на весь каталог, одного сохранения хватит на все импортированные точки.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

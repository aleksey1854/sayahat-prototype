/**
 * Импорт магазина «Ташкент» в базу.
 *
 *   npx tsx scripts/import-tashkent.ts --dry
 *   npx tsx scripts/import-tashkent.ts
 *
 * ВНИМАНИЕ, два отличия от предыдущих магазинов:
 *
 * 1. Категория меняется с `veg` на `meat`. В сиде точка записана как
 *    «Овощи и фрукты», но она провела реорганизацию: от овощей и фруктов
 *    отказались полностью, теперь мясо птицы, полуфабрикаты, яйца и
 *    восточные сладости. В прежней категории её ищут не там.
 *
 * 2. Цены проставлены. Считаны с ценников, вшитых в фотографии профиля,
 *    и не подтверждены магазином. Подтвердить у Розы одним звонком,
 *    после чего либо оставить, либо поправить массив products ниже.
 *
 * Схему, другие магазины, категории, новости и аккаунты не трогает.
 * Запускается повторно, результат тот же.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

const SLUG = "tashkent";
const CATEGORY = "meat"; // было veg — точка сменила профиль
const PIC = (name: string) => `${SLUG}/${name}`; // photoUrl() допишет /photos/

const layout = {
  tagline: "Всё лучшее для вас.",
  taglineKz: "Сіз үшін ең жақсысы.",
  about: {
    title: "Птица, полуфабрикаты и восточные сладости",
    titleKz: "Құс еті, жартылай фабрикаттар және шығыс тәттілері",
    image: PIC("chay.webp"),
    paragraphs: [
      "Отдел сменил профиль: от овощей и фруктов отказались, теперь весь упор на мясо птицы и полуфабрикаты. Охлаждённое и замороженное с птицефабрик «Жас Канат» и «Ко-Ко»: филе, бёдра, крылья, сердца, печень, желудочки. Наггетсы и купаты — пикантные, гуцульские, охотничьи, шашлычные, рейнские.",
      "Рядом — расширенная витрина восточных сладостей, орехов и сухофруктов и фирменный ташкентский чай с имбирём. Свежие яйца: перепелиные и куриные С0, С1, С2. Заказ и консультация — Роза. Доставка по городу до двери бесплатно от 8 000 ₸, подписчикам в Instagram постоянная скидка 10%.",
    ],
    paragraphsKz: [
      "Бөлім бағытын өзгертті: көкөніс пен жемістен бас тартып, енді бар күш құс еті мен жартылай фабрикаттарға бағытталған. «Жас Канат» және «Ко-Ко» құс фабрикаларының салқындатылған және мұздатылған өнімі: филе, сан еті, қанат, жүрек, бауыр, қарынша. Наггетс және купаты — пикантты, гуцул, аңшы, шашлық, рейн.",
      "Қатарында — шығыс тәттілері, жаңғақтар мен кептірілген жемістердің кең сөресі және зімбірлі фирмалық Ташкент шайы. Жаңа жұмыртқа: бөдене және тауық С0, С1, С2. Тапсырыс пен кеңес — Роза. Қала бойынша есікке дейін жеткізу 8 000 ₸-ден тегін, Instagram жазылушыларына тұрақты 10% жеңілдік.",
    ],
  },
  trust: [
    { title: "Доставка от 8 000 ₸", titleKz: "8 000 ₸-ден жеткізу", sub: "по городу бесплатно", subKz: "қала бойынша тегін" },
    { title: "−10%", titleKz: "−10%", sub: "подписчикам в Instagram", subKz: "Instagram жазылушыларына" },
    { title: "Жас Канат, Ко-Ко", titleKz: "Жас Қанат, Ко-Ко", sub: "охлаждённое и мороженое", subKz: "салқындатылған және мұздатылған" },
    { title: "1 этаж", titleKz: "1-қабат", sub: "продуктовый павильон", subKz: "азық-түлік павильоны" },
  ],
  gallery: [
    PIC("kuraga.webp"),
    PIC("ezhiki.webp"),
    PIC("ezhiki-karamel.webp"),
    PIC("kedrovye-orehi.webp"),
    PIC("kunzhut.webp"),
  ],
};

const shopData = {
  nameRu: "Ташкент",
  nameKz: "Ташкент",
  // «Tashkent_kst» в описании — поиск индексирует descRu, а транслита нет.
  descRu:
    "Tashkent_kst — мясо птицы и полуфабрикаты с «Жас Канат» и «Ко-Ко», яйца, восточные сладости, орехи и сухофрукты. Ташкентский чай с имбирём. Доставка по городу бесплатно от 8 000 ₸.",
  descKz:
    "Tashkent_kst — «Жас Қанат» және «Ко-Ко» құс еті мен жартылай фабрикаттар, жұмыртқа, шығыс тәттілері, жаңғақтар мен кептірілген жемістер. Зімбірлі Ташкент шайы. Қала бойынша 8 000 ₸-ден тегін жеткізу.",
  cover: PIC("krylya.webp"),
  logo: PIC("logo.webp"),
  phone: "+7 701 472 69 38",
  whatsapp: "77014726938",
  instagram: "tashkent_kst",
  row: null, // номера бутика в данных нет, только этаж
  pavilion: "Продуктовый",
  landmark: "1 этаж",
  hours: "Вт–Вс, 10:00–19:00", // понедельник выходной
  metaTitle: "Ташкент — мясо птицы, яйца и восточные сладости в Костанае",
  metaDesc:
    "Охлаждённая и замороженная птица «Жас Канат» и «Ко-Ко», купаты, наггетсы, перепелиные и куриные яйца, восточные сладости и орехи. Рынок Саяхат, 1 этаж. Доставка от 8 000 ₸. +7 701 472 69 38.",
  layout: JSON.stringify(layout),
  status: "published",
};

// Цены считаны с ценников на фото профиля — подтвердить у Розы.
// Позиции без цены магазин не подписывал.
const products = [
  { nameRu: "Крылья бройлера охлаждённые",  nameKz: "Салқындатылған бройлер қанаты",  unit: "кг",     price: 1700, image: PIC("krylya.webp") },
  { nameRu: "Четвертинка цыплёнка бройлера",nameKz: "Бройлер балапанының ширегі",     unit: "кг",     price: 1350, image: PIC("chetvertinka.webp") },
  { nameRu: "Желудочки цыплёнка бройлера",  nameKz: "Бройлер балапанының қарыншасы",  unit: "кг",     price: 540,  image: PIC("zheludochki.webp") },
  { nameRu: "Куриные шейки",                nameKz: "Тауық мойны",                    unit: "кг",     price: 480,  image: PIC("sheyki.webp") },
  { nameRu: "Яйца перепелиные",             nameKz: "Бөдене жұмыртқасы",              unit: "уп.",    price: 820,  image: PIC("yaytsa-perepelinye.webp") },
  { nameRu: "Курага",                       nameKz: "Кептірілген өрік",               unit: "кг",     price: 2700, image: PIC("kuraga.webp") },
  { nameRu: "Кедровые орехи",               nameKz: "Балқарағай жаңғағы",             unit: "100 г",  price: 400,  image: PIC("kedrovye-orehi.webp") },
  { nameRu: "Конфеты «Ёжики»",              nameKz: "«Ёжики» кәмпиті",                unit: "кг",     price: 2500, image: PIC("ezhiki.webp") },
  { nameRu: "Конфеты «Ёжики» карамель",     nameKz: "«Ёжики» карамель кәмпиті",       unit: "кг",     price: 2500, image: PIC("ezhiki-karamel.webp") },
  { nameRu: "Ташкентский чай с имбирём",    nameKz: "Зімбірлі Ташкент шайы",          unit: "шт",     price: 1000, image: PIC("chay.webp") },
  { nameRu: "Куриное филе",                 nameKz: "Тауық филесі",                   unit: "кг" },
  { nameRu: "Купаты из мяса птицы",         nameKz: "Құс етінен купаты",              unit: "кг" },
  { nameRu: "Наггетсы",                     nameKz: "Наггетс",                        unit: "уп." },
  { nameRu: "Яйца куриные С0, С1, С2",      nameKz: "Тауық жұмыртқасы С0, С1, С2",    unit: "десяток" },
];

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: CATEGORY } });
  if (!category) {
    throw new Error(`В базе нет категории «${CATEGORY}». Похоже, база пустая.`);
  }

  const existing = await prisma.shop.findUnique({
    where: { slug: SLUG },
    include: { category: true, _count: { select: { products: true } } },
  });

  if (existing) {
    console.log(`Магазин «${SLUG}» уже есть: «${existing.nameRu}», товаров ${existing._count.products}.`);
    if (existing.category.slug !== CATEGORY) {
      console.log(`Категория меняется: ${existing.category.slug} → ${CATEGORY}.`);
    }
  } else {
    console.log(`Магазина «${SLUG}» в базе нет — будет создан.`);
  }

  if (DRY) {
    const withPrice = products.filter((p) => "price" in p).length;
    console.log("\n--dry: ничего не записано. Что встанет:");
    console.log(`  категория ${CATEGORY}`);
    console.log(`  обложка   ${shopData.cover}`);
    console.log(`  логотип   ${shopData.logo}`);
    console.log(`  телефон   ${shopData.phone}`);
    console.log(`  товаров   ${products.length}, из них с ценой ${withPrice}`);
    console.log(`  галерея   ${layout.gallery.length} фото`);
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

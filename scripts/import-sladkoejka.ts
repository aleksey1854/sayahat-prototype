/**
 * Импорт магазина «Сладкоежка» в базу.
 *
 *   npx tsx scripts/import-sladkoejka.ts --dry
 *   npx tsx scripts/import-sladkoejka.ts
 *
 * Фото почти нет: все 22 присланных кадра — рекламные креативы с вшитым
 * текстом и ценами. Три полосы удалось вырезать чисто, они и стоят
 * обложкой и на двух товарах. Магазин остаётся в draft до нормальных снимков.
 *
 * Схему, другие магазины, категории, новости и аккаунты не трогает.
 * Запускается повторно, результат тот же.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

const SLUG = "sladkoejka";
const CATEGORY = "sweets";
const PIC = (name: string) => `${SLUG}/${name}`; // photoUrl() допишет /photos/

const layout = {
  tagline: "Европейские сладости и подарочные наборы на развес.",
  taglineKz: "Еуропалық тәттілер мен сыйлық жиынтықтары.",
  about: {
    title: "Уголок Европы на «Саяхат»",
    titleKz: "«Саяхаттағы» Еуропа бұрышы",
    paragraphs: [
      "«Сладкоежка» — развесные конфеты премиум-класса из Германии, Швейцарии и Италии: Moser Roth, Milka, Kinder, Raffaello. Рядом — Mars, Snickers, Bounty, «Баян Сулу» и российские марки, натуральный молочный шоколад с маршмеллоу и конфеты в коробках.",
      "Собираем сладкие подарки и корпоративные корзины под любой бюджет — от небольшого кулька до большой корзины, по оптовым ценам. Есть наполнение для тойбастара и чай. Первый этаж, рядом с «Белорусскими продуктами». Доставка по Костанаю.",
    ],
    paragraphsKz: [
      "«Сладкоежка» — Германия, Швейцария және Италиядан келген премиум-класты салмақпен сатылатын кәмпиттер: Moser Roth, Milka, Kinder, Raffaello. Қатарында — Mars, Snickers, Bounty, «Баян Сұлу» және ресейлік маркалар, маршмеллоулы табиғи сүтті шоколад пен қораптағы кәмпиттер.",
      "Кез келген бюджетке тәтті сыйлықтар мен корпоративтік себеттер жинаймыз — шағын қалтадан үлкен себетке дейін, көтерме бағамен. Тойбастарға толтыру және шай бар. Бірінші қабат, «Беларусь өнімдері» дүкенінің қасында. Қостанай бойынша жеткізу.",
    ],
  },
  trust: [
    { title: "Европа", titleKz: "Еуропа", sub: "Германия, Швейцария, Италия", subKz: "Германия, Швейцария, Италия" },
    { title: "На развес", titleKz: "Салмақпен", sub: "премиум-качество", subKz: "премиум сапа" },
    { title: "Подарки", titleKz: "Сыйлықтар", sub: "корзины и кульки под бюджет", subKz: "бюджетке қарай себет пен қалта" },
    { title: "Доставка", titleKz: "Жеткізу", sub: "по Костанаю", subKz: "Қостанай бойынша" },
  ],
};

const shopData = {
  nameRu: "Сладкоежка",
  nameKz: "Сладкоежка",
  descRu:
    "Развесные конфеты премиум-класса из Германии, Швейцарии и Италии: Moser Roth, Milka, Kinder, Raffaello. Собираем сладкие подарки и корпоративные корзины под любой бюджет.",
  descKz:
    "Германия, Швейцария және Италиядан келген премиум-класты салмақпен сатылатын кәмпиттер: Moser Roth, Milka, Kinder, Raffaello. Кез келген бюджетке тәтті сыйлықтар мен корпоративтік себеттер жинаймыз.",
  // Кадр вырезан из рекламного креатива: 640×394, для обложки мелковато,
  // но это настоящий товар точки, а не демо-чернослив из сида.
  cover: PIC("cover.webp"),
  logo: PIC("logo.webp"),
  phone: "+7 747 518 65 46",
  whatsapp: "77475186546",
  instagram: "sladkoejka.kostanay",
  row: null, // номера бутика в данных нет
  pavilion: "Продуктовый",
  landmark: "1 этаж, рядом с магазином «Белорусские продукты»",
  hours: "Вт–Вс, 10:00–19:00",
  metaTitle: "Сладкоежка — европейские конфеты и сладкие подарки в Костанае",
  metaDesc:
    "Развесные конфеты из Германии, Швейцарии и Италии: Moser Roth, Milka, Kinder, Raffaello. Подарочные корзины и кульки под любой бюджет. Рынок Саяхат, Костанай. Телефон +7 747 518 65 46.",
  layout: JSON.stringify(layout),
  // Публиковать после того, как появятся фото.
  status: "draft",
};

// Цены не заводим: вшитые в креативы (7500, 9350, 7000, 3160 ₸) неактуальны.
const products = [
  { nameRu: "Конфеты Moser Roth",           nameKz: "Moser Roth кәмпиттері",        unit: "кг", image: PIC("moser-roth.webp") },
  { nameRu: "Конфеты Milka",                nameKz: "Milka кәмпиттері",             unit: "кг" },
  { nameRu: "Конфеты Kinder",               nameKz: "Kinder кәмпиттері",            unit: "кг" },
  { nameRu: "Raffaello",                    nameKz: "Raffaello",                    unit: "кг" },
  { nameRu: "Конфеты Германия, ассорти",    nameKz: "Германия кәмпиттері, ассорти", unit: "кг" },
  { nameRu: "Молочный шоколад с маршмеллоу",nameKz: "Маршмеллоулы сүтті шоколад",   unit: "шт", image: PIC("marshmallow.webp") },
  { nameRu: "Конфеты в коробках",           nameKz: "Қораптағы кәмпиттер",          unit: "шт" },
  { nameRu: "Подарочная корзина",           nameKz: "Сыйлық себеті",                unit: "шт" },
  { nameRu: "Сладкий кулёк",                nameKz: "Тәтті сый қалта",              unit: "шт" },
  { nameRu: "Наполнение для тойбастара",    nameKz: "Тойбастарға толтыру",          unit: "шт" },
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
    console.log(`Обложка была: ${existing.cover ?? "нет"} — будет заменена.`);
  } else {
    console.log(`Магазина «${SLUG}» в базе нет — будет создан.`);
  }

  if (DRY) {
    console.log("\n--dry: ничего не записано. Что встанет:");
    console.log(`  телефон   ${shopData.phone}`);
    console.log(`  ориентир  ${shopData.landmark}`);
    console.log(`  обложка   ${shopData.cover}`);
    console.log(`  логотип   ${shopData.logo}`);
    console.log(`  товаров   ${products.length} (без цен и фото)`);
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

  console.log(`\nГотово. «${shop.nameRu}» записан в статусе ${shopData.status}, товаров ${products.length}.`);
  console.log(`Проверить: /shop/${SLUG} — на сайте пока не виден, статус draft.`);
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

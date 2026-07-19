import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const HOURS = "Вт–Вс, 10:00–19:00";

// Реальные категории рынка (порядок ~ по объёму контента).
const categories = [
  { slug: "meat", nameRu: "Мясо и колбасы", nameKz: "Ет және шұжық", order: 1 },
  { slug: "sweets", nameRu: "Сладости, хлеб, бакалея", nameKz: "Тәттілер, нан, азық-түлік", order: 2 },
  { slug: "cloth", nameRu: "Одежда", nameKz: "Киім", order: 3 },
  { slug: "veg", nameRu: "Овощи и фрукты", nameKz: "Көкөніс пен жеміс", order: 4 },
  { slug: "shoe", nameRu: "Обувь", nameKz: "Аяқ киім", order: 5 },
  { slug: "kids", nameRu: "Детские товары", nameKz: "Балалар тауарлары", order: 6 },
  { slug: "home", nameRu: "Дом, текстиль, мебель", nameKz: "Үй, тоқыма, жиһаз", order: 7 },
  { slug: "beauty", nameRu: "Косметика и здоровье", nameKz: "Косметика және денсаулық", order: 8 },
  { slug: "bags", nameRu: "Сумки", nameKz: "Сөмкелер", order: 9 },
  { slug: "flowers", nameRu: "Цветы", nameKz: "Гүлдер", order: 10 },
  { slug: "optics", nameRu: "Оптика", nameKz: "Оптика", order: 11 },
  { slug: "tech", nameRu: "Электроника", nameKz: "Электроника", order: 12 },
  { slug: "tea", nameRu: "Чай и масла", nameKz: "Шай және май", order: 13 },
  { slug: "pets", nameRu: "Зоотовары", nameKz: "Жануарларға арналған тауарлар", order: 14 },
  { slug: "handmade", nameRu: "Handmade и подарки", nameKz: "Қолдан жасалған, сыйлықтар", order: 15 },
];

type Tenant = {
  slug: string;
  nameRu: string;
  category: string;
  ig: string;
  phone?: string;
  pav?: string;   // павильон
  booth?: string; // номер бутика (в БД — поле row)
  desc: string;
  layout?: Record<string, unknown>;
};

const P_PROD = "Продуктовый";
const P_V1 = "Вещевой №1";
const P_V2 = "Вещевой №2";

// Реальные арендаторы из КОНТЕКСТ-РЫНКА.md. Цены не заводим — их дают сами
// точки через /cabinet. Телефоны — только где известны.
const tenants: Tenant[] = [
  // МЯСО
  {
    slug: "ayan-et", nameRu: "AYAN ET", category: "meat", ig: "ayan.et_karatal",
    pav: P_PROD, booth: "витрина 13",
    desc: "Мясо высокого качества: конина, говядина, баранина, курица. На рынке больше 10 лет.",
    layout: {
      tagline: "Мясо высокого качества — конина, говядина, баранина, курица.",
      about: {
        title: "Мясо, которому доверяют",
        paragraphs: [
          "AYAN ET работает на «Саяхат» больше десяти лет. Сотрудничаем только с проверенными производителями области — конина, говядина, баранина и курица всегда свежие.",
          "Найти нас просто: продуктовый павильон, витрина 13. Рубим при вас, поможем выбрать под плов, бешбармак или на праздник.",
        ],
      },
      trust: [
        { title: "10+ лет", sub: "на рынке «Саяхат»" },
        { title: "Витрина 13", sub: "продуктовый павильон" },
        { title: "Конина · говядина", sub: "баранина · курица" },
      ],
    },
  },
  { slug: "tvoy-myasnoy", nameRu: "Твой Мясной", category: "meat", ig: "tvoi_myasnoi_kst", phone: "+7 701 028 49 49", pav: P_PROD, desc: "Свежее мясо каждый день. Работаем с проверенными производителями." },
  { slug: "et-market", nameRu: "Ет Маркет", category: "meat", ig: "et_market.kst", pav: P_PROD, booth: "витрина 18", desc: "Конина и мясные деликатесы." },
  { slug: "et-kostanay", nameRu: "Ет Kostanay", category: "meat", ig: "et_kostanay_10", pav: P_PROD, desc: "Шужык, казы и домашние колбасы." },
  { slug: "assalim", nameRu: "Assalim", category: "meat", ig: "assalim.kst", pav: P_PROD, desc: "Халяль-колбасы и мясные изделия." },
  { slug: "bravo", nameRu: "Bravo", category: "meat", ig: "bravo_company.kz", phone: "+7 707 773 06 55", pav: P_PROD, desc: "Мясные деликатесы и колбасы." },
  { slug: "chicken-kostanay", nameRu: "Chicken Kostanay", category: "meat", ig: "chicken.kostanay", pav: P_PROD, desc: "Курица и яйца от местных производителей." },

  { slug: "adal-et", nameRu: "Адал Ет", category: "meat", ig: "_adal_et_10", pav: P_PROD, desc: "Мясо и мясные изделия." },
  { slug: "keremet-et", nameRu: "Керемет Ет", category: "meat", ig: "keremet_et_10kst", pav: P_PROD, desc: "Мясная точка в продуктовом павильоне." },
  { slug: "tarana", nameRu: "Тарана", category: "meat", ig: "tarana.abdullaeva81", pav: P_PROD, booth: "витрина 3", desc: "Свинина." },
  // ОВОЩИ И ФРУКТЫ
  { slug: "fruktovyy-ray", nameRu: "Фруктовый рай", category: "veg", ig: "fruktovyy_ray_kst", pav: P_PROD, desc: "Свежие фрукты и овощи каждый день." },
  { slug: "vitaminka", nameRu: "Витаминка", category: "veg", ig: "vitaminka.kst", pav: P_PROD, desc: "Овощи, фрукты и зелень от проверенных хозяйств." },
  { slug: "frutto", nameRu: "Frutto", category: "veg", ig: "frutto.kz", pav: P_PROD, desc: "Фрукты и овощи, свежий завоз." },

  { slug: "tashkent", nameRu: "Ташкент", category: "veg", ig: "tashkent_kst", pav: P_PROD, desc: "Овощи и фрукты." },
  // СЛАДОСТИ, ХЛЕБ, БАКАЛЕЯ
  { slug: "pekarnya-rudny", nameRu: "Пекарня Рудный", category: "sweets", ig: "pekarnya.rud", pav: P_PROD, desc: "Свежий хлеб и выпечка из Рудного." },
  { slug: "sladkoejka", nameRu: "Сладкоежка", category: "sweets", ig: "sladkoejka.kostanay", pav: P_PROD, desc: "Сладости, конфеты и десерты на развес." },
  { slug: "candyshop", nameRu: "CandyShop", category: "sweets", ig: "candyshop_kst", pav: P_PROD, desc: "Всё для кондитеров: посыпки, начинки, декор." },
  { slug: "belorussprodukt", nameRu: "Белорусские продукты", category: "sweets", ig: "kst_belorussprodukt", pav: P_PROD, desc: "Бакалея и продукты из Беларуси." },

  { slug: "armangul", nameRu: "Армангуль", category: "sweets", ig: "armangul_1980", pav: P_PROD, desc: "Сладости, хлеб и бакалея." },
  // ЧАЙ И МАСЛА
  { slug: "mindalka", nameRu: "Миндалка", category: "tea", ig: "mindalka_kostanay", pav: P_PROD, desc: "Чай, кофе и орехи на развес." },
  { slug: "amber-oil", nameRu: "Amber Oil", category: "tea", ig: "amber.oil", pav: P_PROD, desc: "Натуральные масла холодного отжима." },

  // ОДЕЖДА
  { slug: "sportswear", nameRu: "Sportswear", category: "cloth", ig: "sportswear.kst", pav: P_V1, booth: "37", desc: "Спортивная одежда и экипировка." },
  { slug: "nata-li", nameRu: "Nata Li", category: "cloth", ig: "nata.liclothes", pav: P_V1, booth: "82", desc: "Женская одежда." },
  { slug: "svoy-style", nameRu: "Свой стиль", category: "cloth", ig: "svoy_style_kst", pav: P_V1, booth: "33", desc: "Одежда для беременных." },
  { slug: "menhouse", nameRu: "MenHouse", category: "cloth", ig: "menhouse_kst", pav: P_V1, desc: "Мужская одежда." },
  { slug: "miamoda", nameRu: "MiaModa", category: "cloth", ig: "miamoda_kst", pav: P_V1, desc: "Женская одежда и аксессуары." },
  { slug: "anzhelika24", nameRu: "Anzhelika24", category: "cloth", ig: "anzhelika24.kst", pav: P_V2, booth: "2", desc: "Женская одежда." },
  { slug: "batniki-gempera", nameRu: "Батники Gempera", category: "cloth", ig: "batniki_gempera_kst", pav: P_V2, booth: "17", desc: "Батники, кофты, трикотаж." },
  { slug: "oksana-kurtki", nameRu: "Оксана · куртки", category: "cloth", ig: "oksana.kurtki.kst", pav: P_V1, desc: "Куртки и верхняя одежда." },
  { slug: "kupalniki-tanja", nameRu: "Купальники (Таня)", category: "cloth", ig: "kupalniki_kostanai_tanja", pav: P_V1, booth: "79", desc: "Купальники и пляжная одежда." },
  { slug: "shock-price", nameRu: "Shock Price", category: "cloth", ig: "shock_price_kst", pav: P_V2, desc: "Одежда и товары по фиксированной цене — от 500 ₸." },

  { slug: "ema-fashion", nameRu: "Ema Fashion", category: "cloth", ig: "ema_fashion.kz", desc: "Женская одежда, размеры 36–60." },
  { slug: "palto-kostanay", nameRu: "Пальто Костанай", category: "cloth", ig: "palto_kostanay", desc: "Пальто и верхняя одежда." },
  { slug: "rudny-kst", nameRu: "Rudny KST", category: "cloth", ig: "rudny_kst", pav: P_V1, booth: "47", desc: "Одежда." },
  { slug: "zimnyaya-skazka", nameRu: "Зимняя сказка", category: "cloth", ig: "zimnyya_skazka", desc: "Эко-шубы и верхняя одежда." },
  // ОБУВЬ
  { slug: "obuv-oleg", nameRu: "Обувь от Олега", category: "shoe", ig: "obuv_by_oleg", desc: "Обувь для всей семьи." },
  { slug: "obuv-muslim", nameRu: "Обувь Muslim", category: "shoe", ig: "obuv_kostanay.muslim", pav: P_V2, desc: "Мужская и женская обувь." },

  // ДЕТСКОЕ
  { slug: "nomi-kids", nameRu: "Nomi Kids", category: "kids", ig: "nomi_kids_kostanay", pav: P_V2, booth: "39", desc: "Детская одежда." },
  { slug: "topkids", nameRu: "TopKids", category: "kids", ig: "topkids_kst", desc: "Детская обувь и одежда." },

  // СУМКИ
  { slug: "novaya-sumka", nameRu: "Новая сумка", category: "bags", ig: "novaya_sumka_kostanay", pav: P_V2, booth: "54", desc: "Сумки, рюкзаки и аксессуары." },

  // ЦВЕТЫ
  { slug: "cvetok", nameRu: "Цветок", category: "flowers", ig: "cvetok.kst", desc: "Цветы и букеты к любому поводу." },

  // ОПТИКА
  { slug: "best-sunglasses", nameRu: "Best Sunglasses", category: "optics", ig: "best_sunglasses2025", pav: P_V1, booth: "2", desc: "Солнцезащитные очки и оптика." },

  // КОСМЕТИКА И ЗДОРОВЬЕ
  { slug: "atomy", nameRu: "Atomy", category: "beauty", ig: "atomy_perfect_cosmetics", pav: P_V1, booth: "78", desc: "Корейская косметика Atomy." },
  { slug: "tibet-shop", nameRu: "Тибет-Шоп", category: "beauty", ig: "tibet_shop_kst", desc: "Товары для здоровья и красоты." },

  // ДОМ, ТЕКСТИЛЬ, МЕБЕЛЬ
  { slug: "tekstil-kst", nameRu: "Текстиль KST", category: "home", ig: "tekstilkst10", pav: P_V1, desc: "Домашний текстиль: постельное, полотенца, шторы." },
  { slug: "zeta", nameRu: "ZETA", category: "home", ig: "zeta.kostanay", desc: "Мебель для дома." },

  // HANDMADE
  { slug: "valentina-handmade", nameRu: "Valentina Handmade", category: "handmade", ig: "valentina_handmade_kostanai", desc: "Изделия ручной работы." },
  {
    slug: "ostrovok-tvorchestva", nameRu: "Островок Творчества", category: "handmade", ig: "ostrovoktvorchestva6",
    desc: "Свечи, мыло и декор ручной работы.",
    layout: {
      tagline: "Свечи, мыло и декор ручной работы — с душой.",
      about: {
        title: "Ручная работа на «Саяхат»",
        paragraphs: [
          "Делаем ароматные свечи, натуральное мыло и декор для дома. Отличный подарок ручной работы на праздник или просто так.",
          "Покупатели в отзывах отмечают качество и внимание к деталям — заходите, поможем выбрать.",
        ],
      },
      trust: [
        { title: "Ручная работа", sub: "свечи · мыло · декор" },
        { title: "Подарки", sub: "к любому поводу" },
        { title: "Хвалят в отзывах", sub: "2ГИС" },
      ],
    },
  },

  // ЭЛЕКТРОНИКА
  { slug: "aks-shop", nameRu: "AKS Shop", category: "tech", ig: "aksshop.kst", desc: "Чехлы и аксессуары для телефонов." },

  // ЗООТОВАРЫ
  { slug: "nyusha", nameRu: "Нюша", category: "pets", ig: "nyushakst", phone: "+7 777 763 64 38", desc: "Зоотовары и корма для животных." },
];

// Казахские версии — рабочий перевод, нужна вычитка носителем.
const news = [
  {
    titleRu: "Рынок «Саяхат» теперь онлайн",
    titleKz: "«Саяхат» базары енді онлайн",
    bodyRu: "Каталог магазинов и навигация по павильонам. Ищите товары и точки, не приезжая на рынок.",
    bodyKz: "Дүкендер каталогы және павильондар бойынша навигация. Базарға бармай-ақ тауар мен нүктені табыңыз.",
    publishedAt: new Date("2026-07-10"),
  },
  {
    titleRu: "Скидочный день на мясо — каждую среду",
    titleKz: "Етке жеңілдік күні — әр сәрсенбіде",
    bodyRu: "По средам мясные точки продают со скидкой. Следите за скидочными днями по категориям.",
    bodyKz: "Сәрсенбі күндері ет нүктелері жеңілдікпен сатады. Санаттар бойынша жеңілдік күндерін қадағалаңыз.",
    publishedAt: new Date("2026-07-08"),
  },
  {
    titleRu: "В каталоге 50 магазинов",
    titleKz: "Каталогта 50 дүкен",
    bodyRu: "Продуктовый и два вещевых павильона: мясо, овощи, сладости, одежда, обувь, детское и не только.",
    bodyKz: "Азық-түлік және екі киім павильоны: ет, көкөніс, тәттілер, киім, аяқ киім, балалар тауарлары және басқасы.",
    publishedAt: new Date("2026-07-05"),
  },
];

async function main() {
  await prisma.account.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.category.deleteMany();
  await prisma.newsPost.deleteMany();

  const catId: Record<string, string> = {};
  for (const c of categories) {
    const created = await prisma.category.create({ data: c });
    catId[c.slug] = created.id;
  }

  for (const t of tenants) {
    if (!catId[t.category]) throw new Error(`Нет категории ${t.category} для ${t.slug}`);
    await prisma.shop.create({
      data: {
        slug: t.slug,
        nameRu: t.nameRu,
        nameKz: t.nameRu, // KZ-названия брендов = как есть; вычитать носителю
        descRu: t.desc,
        categoryId: catId[t.category],
        phone: t.phone ?? null,
        whatsapp: t.phone ? t.phone.replace(/[^\d]/g, "") : null,
        instagram: t.ig,
        pavilion: t.pav ?? null,
        row: t.booth ?? null,
        hours: HOURS,
        layout: t.layout ? JSON.stringify(t.layout) : null,
        status: "published",
      },
    });
  }

  for (const n of news) {
    await prisma.newsPost.create({ data: n });
  }

  // Демо-доступ арендатора — привязан к AYAN ET (Виктор может переназначить).
  const ayan = await prisma.shop.findUnique({ where: { slug: "ayan-et" } });
  if (ayan) {
    await prisma.account.create({
      data: {
        login: "ayanet",
        passwordHash: bcrypt.hashSync("demo2026", 10),
        role: "tenant",
        shopId: ayan.id,
      },
    });
  }

  await prisma.account.create({
    data: {
      login: "admin",
      passwordHash: bcrypt.hashSync("admin2026", 10),
      role: "admin",
    },
  });

  const counts = {
    categories: await prisma.category.count(),
    shops: await prisma.shop.count(),
    news: await prisma.newsPost.count(),
    accounts: await prisma.account.count(),
  };
  console.log("Seeded:", counts);
  console.log("Демо-кабинет: логин ayanet · пароль demo2026 (магазин AYAN ET)");
  console.log("Админ:        логин admin · пароль admin2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

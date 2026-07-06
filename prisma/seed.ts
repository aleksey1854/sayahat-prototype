import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { slug: "prod", nameRu: "Продукты", nameKz: "Азық-түлік", order: 1 },
  { slug: "sweets", nameRu: "Сладости и орехи", nameKz: "Тәттілер мен жаңғақтар", order: 2 },
  { slug: "cloth", nameRu: "Одежда", nameKz: "Киім", order: 3 },
  { slug: "shoe", nameRu: "Обувь", nameKz: "Аяқ киім", order: 4 },
  { slug: "home", nameRu: "Дом", nameKz: "Үй тауарлары", order: 5 },
  { slug: "tech", nameRu: "Электроника", nameKz: "Электроника", order: 6 },
];

type SeedProduct = {
  nameRu: string;
  descRu?: string;
  price: number;
  oldPrice?: number;
  unit?: string;
  image?: string;
};

type SeedShop = {
  slug: string;
  nameRu: string;
  nameKz: string;
  category: string;
  descRu: string;
  cover: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  row: string;
  pavilion: string;
  landmark?: string;
  rating: number;
  metaTitle?: string;
  metaDesc?: string;
  layout: Record<string, unknown>;
  products: SeedProduct[];
};

const shops: SeedShop[] = [
  {
    slug: "dastarkhan",
    nameRu: "Дастархан",
    nameKz: "Дастархан",
    category: "sweets",
    descRu: "Восточные сладости, орехи и сухофрукты. Своя обжарка, опт и розница.",
    cover: "prilavok.jpg",
    phone: "+7 705 123 45 67",
    whatsapp: "77051234567",
    instagram: "dastarkhan_ksn",
    row: "Б",
    pavilion: "14",
    landmark: "напротив главного входа",
    rating: 4.9,
    metaTitle: "Дастархан — восточные сладости, орехи и сухофрукты · базар Саяхат",
    metaDesc:
      "Дастархан — лавка восточных сладостей, орехов и сухофруктов на рынке Саяхат в Костанае. Своя обжарка, доставка по городу, опт и розница.",
    layout: {
      tagline: "Восточные сладости, орехи и сухофрукты на базаре Саяхат — с 2009 года.",
      about: {
        title: "Вкус, к которому возвращаются",
        image: "cover.jpg",
        paragraphs: [
          "«Дастархан» держит семья Сапаровых — на Саяхат мы с 2009 года, начинали с одного прилавка. Привозим сухофрукты и орехи из Узбекистана, Ирана и Таджикистана и обжариваем сами, в тот же день, поэтому всё свежее и ароматное.",
          "Курага, чернослив, грецкий орех, фисташки, финики, домашний рахат-лукум и пахлава. Берите килограммами на дастархан или коробками — оптом для кафе и магазинов.",
        ],
      },
      trust: [
        { title: "15 лет", sub: "работаем на Саяхат" },
        { title: "Свежее", sub: "обжарка каждый день" },
        { title: "Доставка", sub: "по городу от 1 кг" },
        { title: "Опт и розница", sub: "цены от объёма" },
      ],
      promo: {
        eyebrow: "Акция недели",
        title: "−15% на все орехи",
        text: "До конца недели грецкий орех и фисташки дешевле. Успейте на дастархан к выходным.",
      },
      gallery: ["cover.jpg", "kuraga.jpg", "fistashki.jpg", "lukum.jpg", "finiki.jpg"],
    },
    products: [
      { nameRu: "Курага узбекская", descRu: "Крупная, мясистая, без обработки сахаром.", price: 2400, unit: "кг", image: "kuraga.jpg" },
      { nameRu: "Чернослив вяленый", descRu: "Мягкий, с косточкой и без. Идеален для компота.", price: 1900, unit: "кг", image: "chernosliv.jpg" },
      { nameRu: "Грецкий орех очищенный", descRu: "Свежий урожай, светлая половинка, своя чистка.", price: 3200, oldPrice: 3765, unit: "кг", image: "oreh.jpg" },
      { nameRu: "Фисташки солёные", descRu: "Иранские, крупные, обжарка с морской солью.", price: 4600, oldPrice: 5412, unit: "кг", image: "fistashki.jpg" },
      { nameRu: "Финики «Меджул»", descRu: "Королевские, крупные, мягкие и сочные.", price: 3800, unit: "кг", image: "finiki.jpg" },
      { nameRu: "Рахат-лукум домашний", descRu: "С орехом, розой и фисташкой. Делаем сами.", price: 2700, unit: "кг", image: "lukum.jpg" },
      { nameRu: "Пахлава медовая", descRu: "Слоёная, на меду и грецком орехе.", price: 3400, unit: "кг" },
    ],
  },
  {
    slug: "beket",
    nameRu: "Мясная лавка «Бекет»",
    nameKz: "«Бекет» ет дүкені",
    category: "prod",
    descRu: "Свежее мясо каждый день: говядина, баранина, конина и домашняя казы.",
    cover: "meat.jpg",
    phone: "+7 705 204 11 03",
    whatsapp: "77052041103",
    instagram: "beket_meat_ksn",
    row: "А",
    pavilion: "3",
    rating: 4.8,
    layout: {
      tagline: "Свежее мясо каждый день: говядина, баранина, конина и домашняя казы.",
      about: {
        title: "Мясо с рынка — без посредников",
        paragraphs: [
          "Работаем на Саяхат не первый год. Привозим мясо с проверенных хозяйств области, рубим при вас. Говядина, баранина, конина, субпродукты и домашняя казы к празднику.",
        ],
      },
    },
    products: [
      { nameRu: "Говядина (мякоть)", price: 2900, unit: "кг" },
      { nameRu: "Баранина", price: 3200, unit: "кг" },
      { nameRu: "Конина", price: 3400, unit: "кг" },
      { nameRu: "Казы домашняя", price: 4500, unit: "кг" },
    ],
  },
  {
    slug: "spetsii-vostoka",
    nameRu: "Специи Востока",
    nameKz: "Шығыс дәмдеуіштері",
    category: "prod",
    descRu: "Специи, приправы и сухие травы на развес — для плова, мяса и выпечки.",
    cover: "spices.jpg",
    phone: "+7 707 318 22 14",
    whatsapp: "77073182214",
    instagram: "vostok_spice_ksn",
    row: "А",
    pavilion: "11",
    rating: 4.7,
    layout: {
      tagline: "Специи, приправы и сухие травы на развес — для плова, мяса и выпечки.",
      about: {
        title: "Аромат настоящего Востока",
        paragraphs: [
          "Зира, куркума, паприка, готовые смеси для плова и шашлыка, чай и сухие травы. Берите сколько нужно — взвесим на месте.",
        ],
      },
    },
    products: [
      { nameRu: "Зира", price: 600, unit: "100 г" },
      { nameRu: "Куркума молотая", price: 450, unit: "100 г" },
      { nameRu: "Смесь для плова", price: 700, unit: "100 г" },
      { nameRu: "Перец чёрный горошком", price: 550, unit: "100 г" },
    ],
  },
  {
    slug: "baksha",
    nameRu: "Овощи и зелень «Бақша»",
    nameKz: "«Бақша» көкөністері",
    category: "prod",
    descRu: "Овощи, зелень и фрукты от хозяйств области — свежий завоз каждый день.",
    cover: "veg.jpg",
    phone: "+7 705 442 70 09",
    whatsapp: "77054427009",
    instagram: "baksha_ovoshi",
    row: "А",
    pavilion: "7",
    rating: 4.6,
    layout: {
      tagline: "Овощи, зелень и фрукты от хозяйств области — свежий завоз каждый день.",
      about: {
        title: "С грядки — на ваш стол",
        paragraphs: [
          "Помидоры, огурцы, картофель, зелень и сезонные фрукты. Завозим утром, поэтому всё свежее. Оптом для кафе — дешевле.",
        ],
      },
    },
    products: [
      { nameRu: "Помидоры", price: 600, unit: "кг" },
      { nameRu: "Огурцы", price: 500, unit: "кг" },
      { nameRu: "Зелень", price: 150, unit: "пучок" },
      { nameRu: "Картофель", price: 250, unit: "кг" },
    ],
  },
  {
    slug: "aruna",
    nameRu: "Текстиль «Аруна»",
    nameKz: "«Аруна» тоқыма",
    category: "cloth",
    descRu: "Платки, ткани и домашний текстиль. Большой выбор расцветок.",
    cover: "textile.jpg",
    phone: "+7 747 511 22 30",
    whatsapp: "77475112230",
    instagram: "aruna_textile",
    row: "В",
    pavilion: "22",
    rating: 4.8,
    layout: {
      tagline: "Платки, ткани и домашний текстиль. Большой выбор расцветок.",
      about: {
        title: "Ткани для дома и праздника",
        paragraphs: [
          "Павлопосадские платки, отрезы хлопка и шёлка, постельное бельё и полотенца. Поможем подобрать и отмерим нужный метраж.",
        ],
      },
    },
    products: [
      { nameRu: "Платок павлопосадский", price: 4500, unit: "шт" },
      { nameRu: "Отрез ткани, хлопок", price: 1800, unit: "метр" },
      { nameRu: "Постельное бельё", price: 9000, unit: "комплект" },
    ],
  },
  {
    slug: "kadam",
    nameRu: "Обувь «Қадам»",
    nameKz: "«Қадам» аяқ киім",
    category: "shoe",
    descRu: "Обувь для всей семьи: повседневная, зимняя и рабочая.",
    cover: "shoes.jpg",
    phone: "+7 708 633 30 12",
    whatsapp: "77086333012",
    instagram: "kadam_shoes",
    row: "В",
    pavilion: "30",
    rating: 4.5,
    layout: {
      tagline: "Обувь для всей семьи: повседневная, зимняя и рабочая.",
      about: {
        title: "Обувь на каждый день и сезон",
        paragraphs: [
          "Кроссовки, ботинки, зимние сапоги и домашние тапочки для взрослых и детей. Размеры в наличии, меняем если не подошло.",
        ],
      },
    },
    products: [
      { nameRu: "Кроссовки", price: 9900, unit: "пара" },
      { nameRu: "Зимние сапоги", price: 18000, unit: "пара" },
      { nameRu: "Тапочки домашние", price: 2500, unit: "пара" },
    ],
  },
  {
    slug: "sheker",
    nameRu: "Сладости «Шекер»",
    nameKz: "«Шекер» тәттілері",
    category: "sweets",
    descRu: "Торты на заказ, восточные сладости и конфеты на развес.",
    cover: "lukum.jpg",
    phone: "+7 705 718 18 44",
    whatsapp: "77057181844",
    instagram: "sheker_sweets",
    row: "Б",
    pavilion: "18",
    rating: 4.7,
    layout: {
      tagline: "Торты на заказ, восточные сладости и конфеты на развес.",
      about: {
        title: "Сладко по любому поводу",
        paragraphs: [
          "Печём торты на заказ к празднику, держим чак-чак, пахлаву и конфеты ассорти на развес. Скажите дату — успеем к сроку.",
        ],
      },
    },
    products: [
      { nameRu: "Торт на заказ", price: 6500, unit: "кг" },
      { nameRu: "Чак-чак", price: 2200, unit: "кг" },
      { nameRu: "Конфеты ассорти", price: 2800, unit: "кг" },
      { nameRu: "Пахлава", price: 3400, unit: "кг" },
    ],
  },
  {
    slug: "uy",
    nameRu: "Хозтовары «Үй»",
    nameKz: "«Үй» тұрмыстық тауарлары",
    category: "home",
    descRu: "Посуда, бытовая химия и всё для дома — по ценам базара.",
    cover: "household.jpg",
    phone: "+7 700 841 41 05",
    whatsapp: "77008414105",
    instagram: "uy_home_ksn",
    row: "Г",
    pavilion: "41",
    rating: 4.6,
    layout: {
      tagline: "Посуда, бытовая химия и всё для дома — по ценам базара.",
      about: {
        title: "Всё для дома в одном месте",
        paragraphs: [
          "Кастрюли и сковороды, посуда, хозяйственные мелочи и бытовая химия. То, что нужно каждый день, без переплаты.",
        ],
      },
    },
    products: [
      { nameRu: "Набор кастрюль", price: 12000, unit: "набор" },
      { nameRu: "Сковорода", price: 4500, unit: "шт" },
      { nameRu: "Бытовая химия, набор", price: 3500, unit: "набор" },
    ],
  },
  {
    slug: "volt",
    nameRu: "Электроника «Volt»",
    nameKz: "«Volt» электроника",
    category: "tech",
    descRu: "Зарядки, наушники, кабели и мелкая электроника. С гарантией.",
    cover: "electronics.jpg",
    phone: "+7 747 945 45 19",
    whatsapp: "77479454519",
    instagram: "volt_electro",
    row: "Г",
    pavilion: "45",
    rating: 4.4,
    layout: {
      tagline: "Зарядки, наушники, кабели и мелкая электроника. С гарантией.",
      about: {
        title: "Мелкая электроника рядом",
        paragraphs: [
          "Наушники, кабели, зарядные устройства, повербанки и аксессуары для телефонов. На технику даём гарантию и поможем выбрать.",
        ],
      },
    },
    products: [
      { nameRu: "Беспроводные наушники", price: 8900, unit: "шт" },
      { nameRu: "Кабель USB-C", price: 1200, unit: "шт" },
      { nameRu: "Powerbank 10000 мА·ч", price: 6500, unit: "шт" },
      { nameRu: "Зарядное устройство", price: 2500, unit: "шт" },
    ],
  },
];

const news = [
  {
    titleRu: "Базар Саяхат теперь онлайн",
    bodyRu: "У каждого магазина появился свой сайт-лендинг. Находите товары и цены, не приезжая на рынок.",
    publishedAt: new Date("2026-06-22"),
  },
  {
    titleRu: "Режим работы на Курбан айт",
    bodyRu: "В праздничные дни базар работает с 7:00 до 20:00. Мясные ряды — без перерыва.",
    publishedAt: new Date("2026-06-18"),
  },
  {
    titleRu: "Открылся ряд фермерских продуктов",
    bodyRu: "Новый ряд Д: мёд, молочка и зелень напрямую от хозяйств области.",
    publishedAt: new Date("2026-06-10"),
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

  for (const s of shops) {
    await prisma.shop.create({
      data: {
        slug: s.slug,
        nameRu: s.nameRu,
        nameKz: s.nameKz,
        descRu: s.descRu,
        categoryId: catId[s.category],
        cover: s.cover,
        phone: s.phone,
        whatsapp: s.whatsapp,
        instagram: s.instagram,
        row: s.row,
        pavilion: s.pavilion,
        landmark: s.landmark,
        rating: s.rating,
        metaTitle: s.metaTitle,
        metaDesc: s.metaDesc,
        layout: JSON.stringify(s.layout),
        status: "published",
        products: {
          create: s.products.map((p, i) => ({
            nameRu: p.nameRu,
            descRu: p.descRu,
            price: p.price,
            oldPrice: p.oldPrice,
            unit: p.unit,
            image: p.image,
            order: i,
          })),
        },
      },
    });
  }

  for (const n of news) {
    await prisma.newsPost.create({ data: n });
  }

  const dastarkhan = await prisma.shop.findUnique({ where: { slug: "dastarkhan" } });
  if (dastarkhan) {
    await prisma.account.create({
      data: {
        login: "dastarkhan",
        passwordHash: bcrypt.hashSync("demo2026", 10),
        role: "tenant",
        shopId: dastarkhan.id,
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
    products: await prisma.product.count(),
    news: await prisma.newsPost.count(),
    accounts: await prisma.account.count(),
  };
  console.log("Seeded:", counts);
  console.log("Тестовый кабинет: логин dastarkhan · пароль demo2026");
  console.log("Тестовый админ:   логин admin · пароль admin2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

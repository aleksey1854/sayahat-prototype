// Реальные данные рынка «Саяхат» (Карбышева 131, Костанай).
// Источник фактов — КОНТЕКСТ-РЫНКА.md. Спорное (аренда, бутики) уточнять у Виктора.
export const site = {
  name: "Саяхат",
  sub: "рынок · Костанай",
  slogan: "Продукты и вещи в одном месте",
  sloganKz: "Азық-түлік пен киім — бір жерде",

  city: "Костанай",
  cityKz: "Қостанай",
  address: "ул. Карбышева, 131",
  addressKz: "Карбышев к-сі, 131",
  addressFull: "ул. Карбышева, 131, Костанай",

  // Вт–Вс 10:00–19:00, понедельник — выходной
  hours: "Вт–Вс, 10:00–19:00",
  hoursKz: "Сс–Жс, 10:00–19:00",
  dayOff: "понедельник — выходной",
  dayOffKz: "дүйсенбі — демалыс",
  hoursNote: "Часы у отдельных точек могут отличаться",
  hoursNoteKz: "Жекелеген нүктелердің уақыты өзгеше болуы мүмкін",
  openingHoursSchema: "Tu-Su 10:00-19:00", // для микроразметки

  rating: 4.8,
  ratingCount: 151,
  geo: { lat: 53.170639, lng: 63.592403 },

  // Администрация рынка
  phones: ["+7 771 089 44 17", "+7 771 089 44 18"],
  whatsapp: "77710894417",

  // Аренда мест — отдельный номер
  rentPhone: "+7 775 847 8819",
  rentWhatsapp: "77758478819",
  rentFrom: "от 7 000 ₸/м²",
  rentFromKz: "7 000 ₸/м²-ден",

  instagram: "sayahat_kst",
  instagramUrl: "https://instagram.com/sayahat_kst",
  gis2Url: "https://2gis.kz/kostanaj/firm/70000001080302335",

  // Автовокзал — отдельная организация, сосед по зданию (не наш проект)
  station: {
    name: "Автовокзал «Саяхат»",
    nameKz: "«Саяхат» автовокзалы",
    hours: "ежедневно 6:00–24:00",
    hoursKz: "күн сайын 6:00–24:00",
    site: "https://sayahat-kst.kz",
  },
};

export function waLink(number: string, text?: string) {
  const base = `https://wa.me/${number}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

// Ссылки на карточку организации, а не просто пин по координатам:
// так у человека сразу отзывы, часы работы и кнопка маршрута.
export const YANDEX_ORG_ID = "46177779635";

export function yandexMapsUrl() {
  return `https://yandex.kz/maps/org/sayakhat/${YANDEX_ORG_ID}/`;
}

export function googleMapsUrl() {
  return "https://maps.app.goo.gl/PSNBhPhFoHmBDKVA9";
}

// Встраиваемый виджет Яндекс.Карт с уже выбранной организацией.
export function yandexWidgetUrl() {
  const { lat, lng } = site.geo;
  return `https://yandex.kz/map-widget/v1/?ll=63.592602%2C53.170786&mode=search&oid=${YANDEX_ORG_ID}&ol=biz&pt=${lng}%2C${lat}&z=16.64`;
}

// ── Павильоны: общий справочник для карты, фильтра каталога и страницы магазина ──
export type PavKey = "prod" | "v1" | "v2";

export const PAVILION_LIST: { key: PavKey; ru: string; kz: string; shortRu: string; shortKz: string }[] = [
  { key: "prod", ru: "Продуктовый павильон", kz: "Азық-түлік павильоны", shortRu: "Продуктовый", shortKz: "Азық-түлік" },
  { key: "v1", ru: "Вещевой павильон №1", kz: "№1 киім павильоны", shortRu: "Вещевой №1", shortKz: "№1 киім" },
  { key: "v2", ru: "Вещевой павильон №2", kz: "№2 киім павильоны", shortRu: "Вещевой №2", shortKz: "№2 киім" },
];

// Из значения поля pavilion в БД («Продуктовый», «Вещевой №1»…) — в ключ.
// Держим в одном месте: раньше эта логика жила отдельно на странице магазина.
export function pavilionKey(pavilion?: string | null): PavKey | undefined {
  if (!pavilion) return undefined;
  const p = pavilion.toLowerCase();
  if (p.includes("продукт") || p.includes("азық")) return "prod";
  if (p.includes("№2") || p.includes("no2")) return "v2";
  if (p.includes("№1") || p.includes("no1")) return "v1";
  return undefined;
}

export function igUrl(handle: string) {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

// В данных бутик хранится и числом («14»), и уже подписанным значением
// («витрина 13»). Во втором случае префикс «бутик №» давал «бутик №витрина 13».
// Локализованное короткое имя павильона по сырому значению из БД.
// В базе лежит русское («Продуктовый», «Вещевой №1»), поэтому на казахской
// версии его нужно подменить, а не показывать как есть.
export function pavilionLabel(lang: "ru" | "kz", pavilion?: string | null): string {
  if (!pavilion) return "";
  const key = pavilionKey(pavilion);
  const item = PAVILION_LIST.find((x) => x.key === key);
  if (!item) return pavilion; // неизвестный павильон — показываем как записано
  return lang === "kz" ? item.shortKz : item.shortRu;
}

export function boothLabel(lang: "ru" | "kz", booth?: string | null): string {
  if (!booth) return "";
  const b = String(booth).trim();
  if (!b) return "";
  const alreadyNamed = /[А-Яа-яЁёA-Za-z]/.test(b);
  if (alreadyNamed) return ` · ${b}`;
  return lang === "kz" ? ` · №${b} бутик` : ` · бутик №${b}`;
}

// Реальные данные рынка «Саяхат» (Карбышева 131, Костанай).
// Источник фактов — КОНТЕКСТ-РЫНКА.md. Спорное (аренда, бутики) уточнять у Виктора.
import { NB } from "@/lib/format";

export const site = {
  name: "Саяхат",
  sub: "рынок · Костанай",
  slogan: "Едем за покупками в «Саяхат»",
  sloganKz: "Сауда жасауға «Саяхатқа» барамыз",

  city: "Костанай",
  cityKz: "Қостанай",
  address: "ул. Карбышева, 131",
  addressKz: "Карбышев к-сі, 131",
  // Город первым: так просил заказчик, и так адрес читается быстрее —
  // человек сначала убеждается, что это его город.
  addressFull: "Костанай, ул. Карбышева, 131",
  addressFullKz: "Қостанай, Карбышев к-сі, 131",

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
  // Без «/м²»: единица площади называется в самой фразе на странице,
  // иначе выходило «от 1 500 ₸/м² за 1 м² в месяц».
  // Пробелы неразрывные — число не должно разъезжаться по строкам.
  rentFrom: `от${NB}1${NB}500${NB}₸`,
  rentFromKz: `1${NB}500${NB}₸-ден`,

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

// ── Ссылки на построение маршрута ───────────────────────────────────────
// Раньше все три кнопки вели на карточку организации, а подписаны были
// вразнобой: «Открыть в 2ГИС», «Маршрут в Яндекс.Картах», «Google Карты».
// Подписи свели к одному виду, значит и вести должны действительно на
// маршрут, иначе кнопка обещает больше, чем делает.
export function yandexRouteUrl() {
  const { lat, lng } = site.geo;
  return `https://yandex.kz/maps/?rtext=~${lat},${lng}&rtt=auto`;
}

export function googleRouteUrl() {
  const { lat, lng } = site.geo;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// У 2ГИС координаты идут долготой вперёд, а ведущая вертикальная черта
// означает «откуда — от моего местоположения».
export function gis2RouteUrl() {
  const { lat, lng } = site.geo;
  return `https://2gis.kz/kostanaj/directions/points/%7C${lng}%2C${lat}`;
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

/**
 * Словарь подписей места. Оператор заполняет поле по-русски, сайт
 * показывает на языке посетителя.
 *
 * В казахском число ставится перед словом через дефис — «13-витрина»,
 * а не «витрина 13». Так пишут и сами арендаторы в своих плашках.
 *
 * Казахские варианты требуют вычитки носителем, как и остальной
 * казахский на сайте. Слово, которого здесь нет, показывается как
 * записано — оператор не обязан знать этот список.
 */
const BOOTH_WORDS: { keys: string[]; ru: (n: string) => string; kz: (n: string) => string }[] = [
  { keys: ["бутик"], ru: (n) => `бутик №${n}`, kz: (n) => `№${n} бутик` },
  { keys: ["витрина"], ru: (n) => `витрина ${n}`, kz: (n) => `${n}-витрина` },
  { keys: ["место", "орын"], ru: (n) => `место ${n}`, kz: (n) => `${n}-орын` },
  { keys: ["отдел", "бөлім", "болим"], ru: (n) => `отдел ${n}`, kz: (n) => `${n}-бөлім` },
  { keys: ["стол", "үстел", "устел"], ru: (n) => `стол ${n}`, kz: (n) => `${n}-үстел` },
  { keys: ["прилавок", "сөре", "соре"], ru: (n) => `прилавок ${n}`, kz: (n) => `${n}-сөре` },
  { keys: ["секция"], ru: (n) => `секция ${n}`, kz: (n) => `${n}-секция` },
  { keys: ["контейнер"], ru: (n) => `контейнер ${n}`, kz: (n) => `${n}-контейнер` },
];

/**
 * Подпись места внутри павильона, без разделителя.
 *
 * Поле заполняет оператор, и пишет он по-разному: числом («14»), словом
 * с числом («витрина 13», «Бутик №5»), иногда свободным текстом
 * («у входа»). Раньше любое значение с буквами отдавалось как есть, и
 * на казахской версии посреди казахского текста оставалась русская
 * «витрина 13».
 *
 * Теперь слово и номер разбираются по отдельности. Знакомое слово
 * переводится в любую сторону — оператор может писать хоть «витрина 13»,
 * хоть «13-витрина», результат на каждом языке одинаковый. Незнакомое
 * возвращается без изменений: испортить ввод хуже, чем не перевести.
 */
export function boothText(lang: "ru" | "kz", booth?: string | null): string {
  if (!booth) return "";
  const b = String(booth).trim();
  if (!b) return "";

  // Только число — подписываем сами. По умолчанию это бутик.
  if (/^\d+$/.test(b)) return lang === "kz" ? `№${b} бутик` : `бутик №${b}`;

  // Номер с необязательной буквой: «13», «13а». Две буквы подряд — уже
  // не номер, тогда значение считаем свободным текстом.
  const num = b.match(/\d+[\u0400-\u04FFA-Za-z]?(?![\u0400-\u04FFA-Za-z])/)?.[0];
  if (!num) return b;

  const word = b
    .replace(num, " ")
    .replace(/[№#\-–—.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const hit = BOOTH_WORDS.find((x) => x.keys.includes(word));
  if (!hit) return b;

  return lang === "kz" ? hit.kz(num) : hit.ru(num);
}

// То же самое, но с ведущим разделителем — для приписки к названию
// павильона. Отдельная функция, чтобы вызывающему коду не приходилось
// потом срезать « · » регуляркой.
export function boothLabel(lang: "ru" | "kz", booth?: string | null): string {
  const s = boothText(lang, booth);
  return s ? ` · ${s}` : "";
}

/**
 * Адрес точки одной строкой: «Продуктовый · витрина 13».
 *
 * Собран здесь, потому что раньше эта склейка была написана трижды —
 * на главной, на странице магазина и в поисковом индексе, — и на
 * главной в ней забыли перевод павильона. Такие расхождения ловятся
 * только сведением в одно место.
 */
export function shopLocation(
  lang: "ru" | "kz",
  pavilion?: string | null,
  booth?: string | null,
): string {
  if (!pavilion) return "";
  return `${pavilionLabel(lang, pavilion)}${boothLabel(lang, booth)}`;
}

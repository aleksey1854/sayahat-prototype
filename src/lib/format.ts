const tenge = new Intl.NumberFormat("ru-RU");

export function price(value: number) {
  return `${tenge.format(value)} \u20B8`;
}

export function discountPercent(price: number, oldPrice: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}

const monthFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

export function newsDate(date: Date) {
  return monthFmt.format(date);
}

// Фото в базе: либо имя файла из public/photos (демо), либо путь /uploads/... (загруженные из кабинета).
export function photoUrl(v?: string | null): string | null {
  if (!v) return null;
  return v.startsWith("/") || v.startsWith("http") ? v : `/photos/${v}`;
}

// У загруженных фото есть лёгкая -sm-версия (640px): на карточках браузер
// возьмёт её через srcset. Работает и для локальных /uploads, и для Blob-URL.
// Демо-фото (public/photos) отдаются как есть.
export function srcSetFor(src: string | null | undefined): { src: string; srcSet?: string } | null {
  if (!src) return null;
  const isUploaded =
    (src.startsWith("/uploads/") || src.includes(".public.blob.vercel-storage.com")) &&
    src.includes(".webp") &&
    !src.includes("-sm.webp");
  if (isUploaded) {
    const sm = src.replace(/\.webp(\?|$)/, "-sm.webp$1");
    return { src: sm, srcSet: `${sm} 640w, ${src} 1600w` };
  }
  return { src };
}

// Русские склонения: ruPlural(5, "магазин", "магазина", "магазинов")
export function ruPlural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

// Дата новости по частям — для блока-якоря в карточке: число крупно, месяц под ним.
// Месяц в родительном падеже, потому что читается как единая дата: «10 июля».
const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const MONTHS_KZ = [
  "қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым",
  "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан",
];

export function newsDateParts(date: Date, lang: "ru" | "kz" = "ru") {
  const d = new Date(date);
  return {
    day: String(d.getDate()),
    month: (lang === "kz" ? MONTHS_KZ : MONTHS_RU)[d.getMonth()],
  };
}

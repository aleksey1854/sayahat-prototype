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
  ratingCount: 150,
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
    hours: "кассы 8:00–20:00, без выходных",
    hoursKz: "кассалар 8:00–20:00, демалыссыз",
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

// Пин на картах по координатам рынка
export function yandexMapsUrl() {
  const { lat, lng } = site.geo;
  return `https://yandex.ru/maps/?pt=${lng},${lat}&z=17&l=map`;
}

export function googleMapsUrl() {
  const { lat, lng } = site.geo;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

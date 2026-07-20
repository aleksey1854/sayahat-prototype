// Демо-обложки каталога: каждому магазину свой кадр, повторов нет.
// Кадры нарезаны из исходников в public/photos — скачать новые в песочнице
// нельзя, внешние фотостоки закрыты. Заменяются скриптом npm run photos.
export const DEMO_COVERS: Record<string, string> = {
  "ayan-et": "demo/meat-1.jpg",
  "tvoy-myasnoy": "demo/meat-2.jpg",
  "et-market": "demo/meat-3.jpg",
  "et-kostanay": "demo/meat-4.jpg",
  "assalim": "demo/meat-5.jpg",
  "bravo": "demo/meat-6.jpg",
  "chicken-kostanay": "demo/meat-7.jpg",
  "adal-et": "demo/meat-8.jpg",
  "keremet-et": "demo/meat-9.jpg",
  "tarana": "demo/meat-10.jpg",
  "fruktovyy-ray": "demo/veg-1.jpg",
  "vitaminka": "demo/veg-2.jpg",
  "frutto": "demo/veg-3.jpg",
  "tashkent": "demo/veg-4.jpg",
  "pekarnya-rudny": "demo/kuraga-1.jpg",
  "sladkoejka": "demo/chernosliv-1.jpg",
  "candyshop": "demo/finiki-1.jpg",
  "belorussprodukt": "demo/fistashki-1.jpg",
  "armangul": "demo/oreh-1.jpg",
  "mindalka": "demo/spices-1.jpg",
  "amber-oil": "demo/spices-2.jpg",
  "sportswear": "demo/textile-1.jpg",
  "nata-li": "demo/textile-2.jpg",
  "svoy-style": "demo/textile-3.jpg",
  "menhouse": "demo/textile-4.jpg",
  "miamoda": "demo/textile-5.jpg",
  "anzhelika24": "demo/textile-6.jpg",
  "batniki-gempera": "demo/textile-7.jpg",
  "oksana-kurtki": "demo/textile-8.jpg",
  "kupalniki-tanja": "demo/textile-9.jpg",
  "shock-price": "demo/household-1.jpg",
  "ema-fashion": "demo/household-2.jpg",
  "palto-kostanay": "demo/household-3.jpg",
  "rudny-kst": "demo/household-4.jpg",
  "zimnyaya-skazka": "demo/household-5.jpg",
  "obuv-oleg": "demo/shoes-1.jpg",
  "obuv-muslim": "demo/shoes-2.jpg",
  "nomi-kids": "demo/household-7.jpg",
  "topkids": "demo/household-8.jpg",
  "novaya-sumka": "demo/shoes-3.jpg",
  "cvetok": "demo/veg-5.jpg",
  "best-sunglasses": "demo/household-11.jpg",
  "atomy": "demo/household-9.jpg",
  "tibet-shop": "demo/household-10.jpg",
  "tekstil-kst": "demo/household-6.jpg",
  "zeta": "demo/electronics-2.jpg",
  "valentina-handmade": "demo/prilavok-1.jpg",
  "ostrovok-tvorchestva": "demo/cover-1.jpg",
  "aks-shop": "demo/electronics-1.jpg",
  "nyusha": "demo/household-12.jpg",
};

export const DEMO_POOL: Record<string, string[]> = {
  "meat": [
    "demo/meat-1.jpg",
    "demo/meat-2.jpg",
    "demo/meat-3.jpg",
    "demo/meat-4.jpg",
    "demo/meat-5.jpg",
    "demo/meat-6.jpg",
    "demo/meat-7.jpg",
    "demo/meat-8.jpg",
    "demo/meat-9.jpg",
    "demo/meat-10.jpg"
  ],
  "sweets": [
    "demo/kuraga-1.jpg",
    "demo/chernosliv-1.jpg",
    "demo/finiki-1.jpg",
    "demo/fistashki-1.jpg",
    "demo/oreh-1.jpg",
    "demo/lukum-1.jpg"
  ],
  "veg": [
    "demo/veg-1.jpg",
    "demo/veg-2.jpg",
    "demo/veg-3.jpg",
    "demo/veg-4.jpg"
  ],
  "flowers": [
    "demo/veg-5.jpg"
  ],
  "cloth": [
    "demo/textile-1.jpg",
    "demo/textile-2.jpg",
    "demo/textile-3.jpg",
    "demo/textile-4.jpg",
    "demo/textile-5.jpg",
    "demo/textile-6.jpg",
    "demo/textile-7.jpg",
    "demo/textile-8.jpg",
    "demo/textile-9.jpg",
    "demo/household-1.jpg",
    "demo/household-2.jpg",
    "demo/household-3.jpg",
    "demo/household-4.jpg",
    "demo/household-5.jpg"
  ],
  "shoe": [
    "demo/shoes-1.jpg",
    "demo/shoes-2.jpg"
  ],
  "bags": [
    "demo/shoes-3.jpg"
  ],
  "home": [
    "demo/household-6.jpg",
    "demo/electronics-2.jpg"
  ],
  "kids": [
    "demo/household-7.jpg",
    "demo/household-8.jpg"
  ],
  "beauty": [
    "demo/household-9.jpg",
    "demo/household-10.jpg"
  ],
  "optics": [
    "demo/household-11.jpg"
  ],
  "pets": [
    "demo/household-12.jpg"
  ],
  "tech": [
    "demo/electronics-1.jpg"
  ],
  "tea": [
    "demo/spices-1.jpg",
    "demo/spices-2.jpg"
  ],
  "handmade": [
    "demo/prilavok-1.jpg",
    "demo/cover-1.jpg"
  ]
};

export const FALLBACK_PHOTO = "demo/cover-1.jpg";

export function coverFor(slug: string, categorySlug: string): string {
  return DEMO_COVERS[slug] ?? DEMO_POOL[categorySlug]?.[0] ?? FALLBACK_PHOTO;
}

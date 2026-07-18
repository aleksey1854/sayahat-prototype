type MapLang = "ru" | "kz";

// Реальная структура здания: Продуктовый + два Вещевых павильона + зоны.
// highlight — ключ павильона: "prod" | "v1" | "v2".
// Раскладка на CSS Grid, а не SVG: фиксированный viewBox не умеет
// перестраиваться в колонку, и на телефоне карта уезжала вбок.
const PAVILIONS = [
  {
    key: "prod",
    dot: "#C0552F",
    ru: "Продуктовый павильон", kz: "Азық-түлік павильоны",
    subRu: "мясо · овощи · хлеб · молочка · рыба", subKz: "ет · көкөніс · нан · сүт · балық",
    hintRu: "1 этаж", hintKz: "1 қабат",
  },
  {
    key: "v1",
    dot: "#1C5C6B",
    ru: "Вещевой павильон №1", kz: "№1 киім павильоны",
    subRu: "одежда · обувь · оптика · текстиль", subKz: "киім · аяқ киім · оптика · тоқыма",
    hintRu: "бутики 33–82", hintKz: "33–82 бутик",
  },
  {
    key: "v2",
    dot: "#5A6B85",
    ru: "Вещевой павильон №2", kz: "№2 киім павильоны",
    subRu: "одежда · обувь · сумки · детское", subKz: "киім · аяқ киім · сөмке · балалар",
    hintRu: "бутики 2–54", hintKz: "2–54 бутик",
  },
];

const ZONES = [
  { ru: "Ярмарка Art Bazar", kz: "Art Bazar жәрмеңкесі" },
  { ru: "Автостанция", kz: "Автостанция" },
  { ru: "Кафе «Тандыр»", kz: "«Тандыр» кафесі" },
  { ru: "Baby Park", kz: "Baby Park" },
];

export function BazaarMap({ lang = "ru", highlight }: { lang?: MapLang; highlight?: string }) {
  const t = (ru: string, kz: string) => (lang === "kz" ? kz : ru);

  const pav = (p: (typeof PAVILIONS)[number]) => {
    const on = highlight === p.key;
    return (
      <div className={`bmap__pav${on ? " bmap__pav--on" : ""}`} key={p.key}>
        <div className="bmap__head">
          <span className="bmap__dot" style={on ? undefined : { background: p.dot }} />
          <b>{t(p.ru, p.kz)}</b>
          <i className="bmap__hint">{t(p.hintRu, p.hintKz)}</i>
        </div>
        <span className="bmap__sub">{t(p.subRu, p.subKz)}</span>
      </div>
    );
  };

  return (
    <div className="bazaar-map">
      <div className="bmap">
        <div className="bmap__pavs">
          {pav(PAVILIONS[0])}
          <div className="bmap__col">
            {pav(PAVILIONS[1])}
            {pav(PAVILIONS[2])}
          </div>
        </div>

        <div className="bmap__zones">
          {ZONES.map((z) => (
            <span className="bmap__zone" key={z.ru}>
              {t(z.ru, z.kz)}
            </span>
          ))}
        </div>

        <div className="bmap__entry">
          <svg viewBox="0 0 16 18" fill="none" stroke="#BE7B13" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 17 V3" />
            <path d="M2 9 L8 2 L14 9" />
          </svg>
          <span className="bmap__entry-label">{t("Главный вход", "Басты кіреберіс")}</span>
        </div>
      </div>
    </div>
  );
}

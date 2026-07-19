"use client";

import { useCatalogSearch } from "@/components/CatalogProvider";
import type { PavKey } from "@/lib/site";

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

export function BazaarMap({
  lang = "ru",
  highlight,
  interactive = false,
}: {
  lang?: MapLang;
  highlight?: string;
  interactive?: boolean;
}) {
  const t = (ru: string, kz: string) => (lang === "kz" ? kz : ru);
  // На главной карта управляет фильтром каталога. На странице магазина
  // контекста нет — там работает дефолт, и карта остаётся некликабельной.
  const { pav, setPav } = useCatalogSearch();
  const active = interactive ? pav : highlight;

  const pick = (key: string) => {
    const k = key as PavKey;
    setPav(pav === k ? null : k);
    const el = document.getElementById("catalog");
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const card = (p: (typeof PAVILIONS)[number]) => {
    const on = active === p.key;
    const inner = (
      <>
        <div className="bmap__head">
          <span className="bmap__dot" style={on ? undefined : { background: p.dot }} />
          <b>{t(p.ru, p.kz)}</b>
          <i className="bmap__hint">{t(p.hintRu, p.hintKz)}</i>
        </div>
        <span className="bmap__sub">{t(p.subRu, p.subKz)}</span>
      </>
    );
    const cls = `bmap__pav${on ? " bmap__pav--on" : ""}${interactive ? " bmap__pav--btn" : ""}`;
    return interactive ? (
      <button type="button" className={cls} key={p.key} onClick={() => pick(p.key)} aria-pressed={on}>
        {inner}
      </button>
    ) : (
      <div className={cls} key={p.key}>
        {inner}
      </div>
    );
  };

  return (
    <div className="bazaar-map">
      <div className="bmap">
        <div className="bmap__pavs">
          {card(PAVILIONS[0])}
          <div className="bmap__col">
            {card(PAVILIONS[1])}
            {card(PAVILIONS[2])}
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

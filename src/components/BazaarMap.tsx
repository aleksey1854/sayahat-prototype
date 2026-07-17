type MapLang = "ru" | "kz";

// Реальная структура здания: Продуктовый + два Вещевых павильона + зоны.
// highlight — ключ павильона: "prod" | "v1" | "v2".
const PAVILIONS = [
  {
    key: "prod",
    x: 40, y: 44, w: 418, h: 196,
    dot: "#C0552F",
    ru: "Продуктовый павильон", kz: "Азық-түлік павильоны",
    subRu: "мясо · овощи · хлеб · молочка · рыба", subKz: "ет · көкөніс · нан · сүт · балық",
    hintRu: "1 этаж", hintKz: "1 қабат",
  },
  {
    key: "v1",
    x: 478, y: 44, w: 382, h: 92,
    dot: "#1C5C6B",
    ru: "Вещевой павильон №1", kz: "№1 киім павильоны",
    subRu: "одежда · обувь · оптика · текстиль", subKz: "киім · аяқ киім · оптика · тоқыма",
    hintRu: "бутики 33–82", hintKz: "33–82 бутик",
  },
  {
    key: "v2",
    x: 478, y: 148, w: 382, h: 92,
    dot: "#5A6B85",
    ru: "Вещевой павильон №2", kz: "№2 киім павильоны",
    subRu: "одежда · обувь · сумки · детское", subKz: "киім · аяқ киім · сөмке · балалар",
    hintRu: "бутики 2–54", hintKz: "2–54 бутик",
  },
];

const ZONES = [
  { x: 40, w: 200, ru: "Ярмарка Art Bazar", kz: "Art Bazar жәрмеңкесі" },
  { x: 256, w: 196, ru: "Автостанция", kz: "Автостанция" },
  { x: 468, w: 180, ru: "Кафе «Тандыр»", kz: "«Тандыр» кафесі" },
  { x: 664, w: 196, ru: "Baby Park", kz: "Baby Park" },
];

export function BazaarMap({ lang = "ru", highlight }: { lang?: MapLang; highlight?: string }) {
  const t = (ru: string, kz: string) => (lang === "kz" ? kz : ru);

  return (
    <div className="bazaar-map">
      <svg viewBox="0 0 900 400" fill="none" fontFamily="Manrope">
        <rect x="12" y="12" width="876" height="376" rx="18" fill="#FBF7EF" stroke="#DCCFB9" />

        {PAVILIONS.map((p) => {
          const on = highlight === p.key;
          const tx = p.x + 24;
          return (
            <g key={p.key}>
              <rect
                x={p.x} y={p.y} width={p.w} height={p.h} rx={14}
                fill={on ? "#1C6B57" : "#fff"}
                stroke={on ? "#1C6B57" : "#EBE2D3"}
                strokeWidth={on ? 2 : 1}
              />
              <circle cx={tx + 5} cy={p.y + 30} r={6} fill={on ? "#fff" : p.dot} />
              <text x={tx + 20} y={p.y + 35} fill={on ? "#fff" : "#241F1B"} fontSize="17" fontWeight={700}>
                {t(p.ru, p.kz)}
              </text>
              <text x={tx} y={p.y + 60} fill={on ? "rgba(255,255,255,.85)" : "#6E655A"} fontSize="13.5" fontWeight={500}>
                {t(p.subRu, p.subKz)}
              </text>
              <text x={p.x + p.w - 20} y={p.y + 35} textAnchor="end" fill={on ? "#DE9627" : "#AE6E10"} fontSize="12.5" fontWeight={700}>
                {t(p.hintRu, p.hintKz)}
              </text>
              {on && <circle cx={p.x + p.w - 22} cy={p.y + p.h - 22} r={7} fill="#DE9627" stroke="#fff" strokeWidth={2.5} />}
            </g>
          );
        })}

        <g fontSize="13" fontWeight={600}>
          {ZONES.map((z) => (
            <g key={z.ru}>
              <rect x={z.x} y={264} width={z.w} height={58} rx={12} fill="#F4ECDE" stroke="#EBE2D3" />
              <text x={z.x + z.w / 2} y={298} textAnchor="middle" fill="#463E36">
                {t(z.ru, z.kz)}
              </text>
            </g>
          ))}
        </g>

        <path d="M450 356 V342" stroke="#DE9627" strokeWidth={2.5} />
        <path d="M443 349 L450 340 L457 349" stroke="#DE9627" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <rect x="352" y="356" width="196" height="34" rx="11" fill="#FBF1DD" stroke="#EAD9B0" />
        <text x="450" y="378" fill="#B5741A" fontSize="14.5" fontWeight={700} textAnchor="middle">
          {t("Главный вход", "Басты кіреберіс")}
        </text>
      </svg>
    </div>
  );
}

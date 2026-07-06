type MapLang = "ru" | "kz";

const ROWS = [
  { letter: "А", ru: "продукты и мясо", kz: "азық-түлік, ет", dot: "#C0552F" },
  { letter: "Б", ru: "сладости и орехи", kz: "тәттілер, жаңғақ", dot: "#DE9627" },
  { letter: "В", ru: "одежда и обувь", kz: "киім, аяқ киім", dot: "#1C5C6B" },
  { letter: "Г", ru: "дом и техника", kz: "үй, техника", dot: "#5A6B85" },
  { letter: "Д", ru: "фермерские", kz: "фермер өнімдері", dot: "#5E9A6B" },
  { letter: "Е", ru: "кафе и услуги", kz: "кафе, қызметтер", dot: "#C75B7A" },
];

export function BazaarMap({ lang = "ru", highlightRow }: { lang?: MapLang; highlightRow?: string }) {
  return (
    <div className="bazaar-map">
      <svg viewBox="0 0 900 332" fill="none" fontFamily="Manrope">
        <rect x="12" y="12" width="876" height="308" rx="16" fill="#FBF7EF" stroke="#DCCFB9" />
        <rect x="392" y="44" width="116" height="190" rx="8" fill="#F4ECDE" />
        <line x1="450" y1="58" x2="450" y2="222" stroke="#DCCFB9" strokeWidth={2} strokeDasharray="6 7" />
        <g fontSize="14.5">
          {ROWS.map((r, i) => {
            const x = i < 3 ? 44 : 516;
            const y = 48 + (i % 3) * 66;
            const hl = highlightRow === r.letter;
            const label = lang === "kz" ? `${r.letter} қатары · ${r.kz}` : `Ряд ${r.letter} · ${r.ru}`;
            return (
              <g key={r.letter}>
                <rect
                  x={x}
                  y={y}
                  width={336}
                  height={54}
                  rx={12}
                  fill={hl ? "#1C6B57" : "#fff"}
                  stroke={hl ? "#1C6B57" : "#EBE2D3"}
                />
                <circle cx={x + 22} cy={y + 27} r={5} fill={hl ? "#fff" : r.dot} />
                <text x={x + 40} y={y + 32} fill={hl ? "#fff" : "#463E36"} fontWeight={hl ? 700 : 600}>
                  {label}
                </text>
                {hl && <circle cx={x + 310} cy={y + 27} r={7} fill="#DE9627" stroke="#fff" strokeWidth={2.5} />}
              </g>
            );
          })}
        </g>
        <path d="M450 250 V236" stroke="#DE9627" strokeWidth={2.5} />
        <path d="M443 243 L450 234 L457 243" stroke="#DE9627" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <rect x="360" y="252" width="180" height="54" rx="12" fill="#FBF1DD" stroke="#EAD9B0" />
        <text x="450" y="284" fill="#B5741A" fontSize="15" fontWeight={700} textAnchor="middle">
          {lang === "kz" ? "Басты кіреберіс" : "Главный вход"}
        </text>
      </svg>
    </div>
  );
}

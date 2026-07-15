// Тесты поискового движка. Запуск: npm run test:search
import {
  buildIndex,
  searchShops,
  normalize,
  stemWord,
  stemVariants,
  type RawField,
} from "../src/lib/search";

const docs: RawField[][] = [
  [ // 0: Дастархан (сладости)
    { text: "Дастархан Дастархан", weight: 10, kind: "name" },
    { text: "Сладости и орехи Тәттілер мен жаңғақтар", weight: 6, kind: "other" },
    { text: "Курага узбекская", weight: 5, kind: "product", productIdx: 0 },
    { text: "Грецкий орех очищенный", weight: 5, kind: "product", productIdx: 1 },
    { text: "Чай зелёный", weight: 5, kind: "product", productIdx: 2 },
    { text: "Рахат-лукум домашний", weight: 5, kind: "product", productIdx: 3 },
    { text: "Восточные сладости, орехи и сухофрукты. Своя обжарка.", weight: 3, kind: "other" },
    { text: "dastarkhan", weight: 2, kind: "other" },
  ],
  [ // 1: Аруна (текстиль)
    { text: "Текстиль «Аруна» «Аруна» тоқыма", weight: 10, kind: "name" },
    { text: "Одежда Киім", weight: 6, kind: "other" },
    { text: "Платок павлопосадский", weight: 5, kind: "product", productIdx: 0 },
  ],
  [ // 2: Қадам (обувь)
    { text: "Обувь «Қадам» «Қадам» аяқ киім", weight: 10, kind: "name" },
    { text: "Обувь Аяқ киім", weight: 6, kind: "other" },
    { text: "Кроссовки", weight: 5, kind: "product", productIdx: 0 },
  ],
  [ // 3: Бақша (овощи)
    { text: "Овощи и зелень «Бақша»", weight: 10, kind: "name" },
    { text: "Продукты Азық-түлік", weight: 6, kind: "other" },
    { text: "Огурцы свежие", weight: 5, kind: "product", productIdx: 0 },
    { text: "Помидоры", weight: 5, kind: "product", productIdx: 1 },
  ],
  [ // 4: Бекет (мясо, заполнен ТОЛЬКО по-русски)
    { text: "Мясная лавка «Бекет»", weight: 10, kind: "name" },
    { text: "Продукты", weight: 6, kind: "other" },
    { text: "Говядина", weight: 5, kind: "product", productIdx: 0 },
    { text: "Баранина", weight: 5, kind: "product", productIdx: 1 },
    { text: "Казы домашняя", weight: 5, kind: "product", productIdx: 2 },
    { text: "Свежее мясо каждый день", weight: 3, kind: "other" },
  ],
  [ // 5: галантерея «НН» — шумовой сосед: «шкура галантерея» слитно содержит «курага»
    { text: "Шкура, галантерея «НН»", weight: 10, kind: "name" },
    { text: "Одежда", weight: 6, kind: "other" },
    { text: "Ремни кожаные", weight: 5, kind: "product", productIdx: 0 },
  ],
];

const idx = buildIndex(docs);
type R = ReturnType<typeof searchShops>;
const has = (r: R, i: number) => r.hits.some((h) => h.idx === i);

const cases: [string, (r: R) => boolean, string][] = [
  // база
  ["курага", (r) => r.mode === "strict" && r.hits[0]?.idx === 0 && r.hits[0]?.product === 0 && !has(r, 5), "точное слово + сниппет, шум «НН» отсечён"],
  ["куррага", (r) => r.mode === "fuzzy" && r.hits[0]?.idx === 0, "опечатка -> режим fuzzy"],
  ["rehfuf", (r) => r.hits[0]?.idx === 0, "не та раскладка (=курага)"],
  ["kuraga", (r) => has(r, 0), "латиница-транслит"],
  ["таттилер", (r) => has(r, 0), "казахский без спецбукв"],
  ["қадам", (r) => r.hits[0]?.idx === 2, "казахские буквы"],
  ["сладости орехи", (r) => r.mode === "strict" && r.hits[0]?.idx === 0, "два слова"],
  ["дастархан кроссовки", (r) => r.mode === "loose", "несовместимые слова -> похожие"],
  ["обувь", (r) => r.hits[0]?.idx === 2, "ранжирование: имя выше"],
  ["", (r) => r.mode === "all", "пустой запрос"],
  // морфология (Snowball)
  ["орехи", (r) => has(r, 0), "мн.ч.: орехи -> орех"],
  ["орехами", (r) => has(r, 0), "твор.п.: орехами -> орех"],
  ["орехов", (r) => has(r, 0), "род.п.: орехов -> орех"],
  ["сладостями", (r) => has(r, 0), "сладостями -> сладости"],
  ["узбекской", (r) => has(r, 0) && r.hits[0]?.product === 0, "прилагательное: узбекской -> узбекская"],
  ["курагу", (r) => has(r, 0), "вин.п.: курагу -> курага"],
  ["чая", (r) => has(r, 0), "чая -> чай (й в основе)"],
  ["чаем", (r) => has(r, 0), "чаем -> чай"],
  ["платка", (r) => r.hits[0]?.idx === 1, "род.п.: платка -> платок"],
  // беглые гласные и уменьшительные (слой поверх Snowball)
  ["платки", (r) => r.hits[0]?.idx === 1 && r.hits[0]?.product === 0, "платки -> платок (беглая о)"],
  ["платочки", (r) => r.hits[0]?.idx === 1, "уменьшительное: платочки -> платок"],
  ["огурец", (r) => r.hits[0]?.idx === 3, "огурец -> огурцы (беглая е)"],
  ["огурчики", (r) => r.hits[0]?.idx === 3, "уменьшительное: огурчики -> огурцы"],
  ["помидорчики", (r) => r.hits[0]?.idx === 3 && r.hits[0]?.product === 1, "помидорчики -> помидоры"],
  // синонимы и казахский кросс-язык
  ["ет", (r) => has(r, 4), "KZ-синоним: ет -> мясо (магазин без каз. текста)"],
  ["қой", (r) => r.hits.find((h) => h.idx === 4)?.product === 1, "KZ: қой -> Баранина (со сниппетом)"],
  ["сиыр", (r) => has(r, 4), "KZ: сиыр -> говядина"],
  ["изюм", (r) => has(r, 0), "гипероним: изюм -> сухофрукты"],
  ["фисташки", (r) => has(r, 0), "гипероним: фисташки -> орехи"],
  ["жаңғақты", (r) => has(r, 0), "казахское окончание: жаңғақты -> жаңғақтар"],
  ["орамал", (r) => has(r, 1), "KZ: орамал -> платок"],
  // предельные случаи: комбинированные опечатки, слитные написания
  ["куррагой", (r) => has(r, 0), "опечатка + падеж (fuzzy по основам)"],
  ["курог", (r) => has(r, 0), "опечатка в недописанном слове"],
  ["рахатлукум", (r) => r.hits.find((h) => h.idx === 0)?.product === 3, "слитное написание: рахатлукум"],
  ["аяккиим", (r) => has(r, 2), "слитное написание (каз.): аяккиим"],
  ["галантерея", (r) => r.mode === "strict" && r.hits[0]?.idx === 5, "прямой запрос находит «НН»"],
  // защита от ложных срабатываний
  ["чай", (r) => !has(r, 1) && !has(r, 2), "чай не находит текстиль и обувь"],
  ["мясо", (r) => has(r, 4) && !has(r, 0), "мясо находит Бекет, но не сладости"],
];

let fails = 0;
for (const [q, check, label] of cases) {
  const r = searchShops(idx, q);
  const ok = check(r);
  if (!ok) fails++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  «${q}» — ${label}` +
      (ok ? "" : `  => mode=${r.mode} hits=${JSON.stringify(r.hits)}`),
  );
}

// точечные проверки стеммера
const stems: [string, string, string][] = [
  ["книгами", "книг", "сущ. твор.п."],
  ["красивый", "красив", "прилагательное"],
  ["сладостями", "сладост", "сущ. + -ями"],
  ["узбекская", "узбекск", "прил. жен.р."],
  ["узбекской", "узбекск", "прил. род.п."],
  ["очищенный", "очищен", "причастие + нн->н"],
];
for (const [w, want, label] of stems) {
  const got = stemWord(w);
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  stem(${w}) = ${got} (${label})` + (ok ? "" : ` ожидалось ${want}`));
}

const misc: [boolean, string][] = [
  [normalize("Тәттілер") === "таттилер", "normalize: каз. буквы"],
  [normalize("Обувь") === "обув", "normalize: ь убирается для сравнения"],
  [stemVariants("платок").includes("плат"), "stemVariants: платок содержит плат"],
  [stemVariants("огурец").includes("огур"), "stemVariants: огурец содержит огур"],
];
for (const [ok, label] of misc) {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}

{
  const a = searchShops(idx, "грецкий орех").hits.find((h) => h.idx === 0)?.score ?? 0;
  const b = searchShops(idx, "орех грецкий").hits.find((h) => h.idx === 0)?.score ?? 0;
  const ok = a > b;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  фразовый бонус: «грецкий орех» (${a.toFixed(1)}) выше перестановки (${b.toFixed(1)})`);
}

console.log(fails === 0 ? "\nALL GREEN" : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);

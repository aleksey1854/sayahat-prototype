// Поисковый движок каталога. Работает на клиенте, без сервера.
// Понимает: полную русскую морфологию (стеммер Snowball: падежи, числа,
// прилагательные, глаголы) + уменьшительные и беглые гласные (платок/платки/
// платочки, огурец/огурцы/огурчики), опечатки, не ту раскладку, латиницу,
// казахские буквы без спецсимволов, запросы из нескольких слов. Ранжирует.

import { SYNONYMS, HYPERNYMS } from "./synonyms";

export type FieldKind = "name" | "product" | "other";

export type RawField = {
  text: string;
  weight: number;
  kind: FieldKind;
  productIdx?: number;
};

type IdxField = {
  joined: string;
  glued: string;        // joined без пробелов — для слитных написаний
  words: string[];      // свёрнутые формы (для точного/префикса/опечаток)
  stems: string[][];    // варианты основ на слово
  weight: number;
  kind: FieldKind;
  productIdx?: number;
};

export type SearchIndex = IdxField[][];

export type Hit = { idx: number; score: number; product?: number };

// --- базовая токенизация: регистр, ё→е, казахские буквы → русские аналоги.
//     й и ь СОХРАНЯЮТСЯ — они нужны стеммеру. ---

const KZ_FOLD: Record<string, string> = {
  ё: "е", қ: "к", ғ: "г", ң: "н", ә: "а", ө: "о", ұ: "у", ү: "у", һ: "х", і: "и",
};

function tokenizeBase(s: string): string[] {
  const folded = s
    .toLowerCase()
    .split("")
    .map((ch) => (ch in KZ_FOLD ? KZ_FOLD[ch] : ch))
    .join("");
  const cleaned = folded.replace(/[^a-zа-яёй0-9ь]+/g, " ").trim();
  return cleaned ? cleaned.split(/ +/) : [];
}

// --- «свободная» свёртка для сравнения: й→и, ь/ъ убираем ---

function loose(w: string): string {
  return w.replace(/й/g, "и").replace(/[ьъ]/g, "");
}

export function normalize(s: string): string {
  return tokenizeBase(s).map(loose).join(" ");
}

// --- варианты запроса: как есть, с исправленной раскладкой, транслит ---

const LAYOUT: Record<string, string> = {
  q: "й", w: "ц", e: "у", r: "к", t: "е", y: "н", u: "г", i: "ш", o: "щ", p: "з",
  "[": "х", "]": "ъ", a: "ф", s: "ы", d: "в", f: "а", g: "п", h: "р", j: "о",
  k: "л", l: "д", ";": "ж", "'": "э", z: "я", x: "ч", c: "с", v: "м", b: "и",
  n: "т", m: "ь", ",": "б", ".": "ю",
};

const TR_MULTI: [string, string][] = [
  ["shch", "щ"], ["sch", "щ"], ["yo", "е"], ["zh", "ж"], ["kh", "х"],
  ["ts", "ц"], ["ch", "ч"], ["sh", "ш"], ["yu", "ю"], ["ya", "я"],
];

const TR_ONE: Record<string, string> = {
  a: "а", b: "б", c: "ц", d: "д", e: "е", f: "ф", g: "г", h: "х", i: "и",
  j: "й", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "к", r: "р",
  s: "с", t: "т", u: "у", v: "в", w: "в", x: "кс", y: "ы", z: "з",
};

function translit(s: string): string {
  let out = s.toLowerCase();
  for (const [lat, cyr] of TR_MULTI) out = out.split(lat).join(cyr);
  return out.split("").map((ch) => (ch in TR_ONE ? TR_ONE[ch] : ch)).join("");
}

export function queryVariants(raw: string): string[] {
  const set = new Set<string>();
  if (tokenizeBase(raw).length > 0) set.add(raw);
  if (/[a-z]/i.test(raw)) {
    const lay = raw.toLowerCase().split("").map((c) => (c in LAYOUT ? LAYOUT[c] : c)).join("");
    if (tokenizeBase(lay).length > 0) set.add(lay);
    const tr = translit(raw);
    if (tokenizeBase(tr).length > 0) set.add(tr);
  }
  return [...set];
}

// =====================================================================
// Стеммер Snowball для русского (алгоритм М. Портера).
// Тот же, что в Elasticsearch и PostgreSQL FTS для русского языка.
// =====================================================================

const VOWELS = "аеиоуыэюя";
const byLen = (a: string[]) => [...a].sort((x, y) => y.length - x.length);

const PG1 = byLen(["в", "вши", "вшись"]); // после а/я
const PG2 = byLen(["ив", "ивши", "ившись", "ыв", "ывши", "ывшись"]);
const REFLEX = byLen(["ся", "сь"]);
const ADJ = byLen([
  "ее", "ие", "ые", "ое", "ими", "ыми", "ей", "ий", "ый", "ой", "ем", "им",
  "ым", "ом", "его", "ого", "ему", "ому", "их", "ых", "ую", "юю", "ая", "яя",
  "ою", "ею",
]);
const PART1 = byLen(["ем", "нн", "вш", "ющ", "щ"]); // после а/я
const PART2 = byLen(["ивш", "ывш", "ующ"]);
const VERB1 = byLen([
  "ла", "на", "ете", "йте", "ли", "й", "л", "ем", "н", "ло", "но", "ет", "ют",
  "ны", "ть", "ешь", "нно",
]); // после а/я
const VERB2 = byLen([
  "ила", "ыла", "ена", "ейте", "уйте", "ите", "или", "ыли", "ей", "уй", "ил",
  "ыл", "им", "ым", "ен", "ило", "ыло", "ено", "ят", "ует", "уют", "ит", "ыт",
  "ены", "ить", "ыть", "ишь", "ую", "ю",
]);
const NOUN = byLen([
  "а", "ев", "ов", "ие", "ье", "е", "иями", "ями", "ами", "еи", "ии", "и",
  "ией", "ей", "ой", "ий", "й", "иям", "ям", "ием", "ем", "ам", "ом", "о",
  "у", "ах", "иях", "ях", "ы", "ь", "ию", "ью", "ю", "ия", "ья", "я",
]);
const DERIV = byLen(["ость", "ост"]);
const SUPER = byLen(["ейше", "ейш"]);

function isVowel(ch: string) {
  return VOWELS.includes(ch);
}

function regionAfterVC(w: string, start: number): number {
  let sawVowel = false;
  for (let i = start; i < w.length; i++) {
    if (isVowel(w[i])) sawVowel = true;
    else if (sawVowel) return i + 1;
  }
  return w.length;
}

export function stemWord(input: string): string {
  let w = input;
  if (w.length < 3 || !/[а-яё]/.test(w)) return w;
  w = w.replace(/ё/g, "е");

  let rv = w.length;
  for (let i = 0; i < w.length; i++) {
    if (isVowel(w[i])) { rv = i + 1; break; }
  }
  const r1 = regionAfterVC(w, 0);
  const r2 = regionAfterVC(w, r1);

  const fits = (suf: string, region: number) => w.length - suf.length >= region && w.endsWith(suf);
  const precededAYa = (suf: string) => {
    const p = w.length - suf.length - 1;
    return p >= rv && (w[p] === "а" || w[p] === "я");
  };
  const cut = (n: number) => { w = w.slice(0, w.length - n); };

  // Шаг 1
  let gerund = false;
  for (const s of PG2) if (fits(s, rv)) { cut(s.length); gerund = true; break; }
  if (!gerund) {
    for (const s of PG1) if (fits(s, rv) && precededAYa(s)) { cut(s.length); gerund = true; break; }
  }
  if (!gerund) {
    for (const s of REFLEX) if (fits(s, rv)) { cut(s.length); break; }

    let matched = false;
    for (const s of ADJ) {
      if (fits(s, rv)) {
        cut(s.length);
        matched = true;
        let part = false;
        for (const p of PART2) if (fits(p, rv)) { cut(p.length); part = true; break; }
        if (!part) {
          for (const p of PART1) if (fits(p, rv) && precededAYa(p)) { cut(p.length); break; }
        }
        break;
      }
    }
    if (!matched) {
      for (const s of VERB2) if (fits(s, rv)) { cut(s.length); matched = true; break; }
      if (!matched) {
        for (const s of VERB1) if (fits(s, rv) && precededAYa(s)) { cut(s.length); matched = true; break; }
      }
    }
    if (!matched) {
      for (const s of NOUN) if (fits(s, rv)) { cut(s.length); break; }
    }
  }

  // Шаг 2: конечное «и»
  if (fits("и", rv)) cut(1);

  // Шаг 3: словообразовательное -ость/-ост в R2
  for (const s of DERIV) if (fits(s, r2)) { cut(s.length); break; }

  // Шаг 4: нн → н; либо превосходная степень; либо конечное «ь»
  if (fits("нн", rv)) {
    cut(1);
  } else {
    let sup = false;
    for (const s of SUPER) if (fits(s, rv)) { cut(s.length); sup = true; break; }
    if (sup && fits("нн", rv)) cut(1);
    else if (!sup && fits("ь", rv)) cut(1);
  }

  return w;
}

// --- слой поверх Snowball: уменьшительные и суффиксы с беглой гласной ---
//     платок → плат, огурец → огур, платочк → плат, помидорчик → помидор

const DIMIN = byLen([
  "оньк", "еньк", "ичк", "ечк", "очк", "ушк", "юшк", "ышк",
  "чик", "щик", "ик", "ек", "ок", "ец", "иц",
]);

// --- казахские окончания (в свёрнутом виде): мн. число, падежи, принадлежность.
//     жаңғақтар -> жангак, дүкенге -> дукен. До двух суффиксов подряд. ---

const KZ_SUF = byLen([
  "дагы", "деги", "тагы", "теги",
  "лар", "лер", "дар", "дер", "тар", "тер",
  "нын", "нин", "дын", "дин", "тын", "тин",
  "дан", "ден", "тан", "тен", "нан", "нен",
  "мен", "бен", "пен",
  "га", "ге", "ка", "ке", "да", "де", "та", "те",
  "ны", "ни", "ды", "ди", "ты", "ти", "сы", "си",
]);

function kzStem(w: string): string {
  let cur = w;
  for (let pass = 0; pass < 2; pass++) {
    let hit = false;
    for (const s of KZ_SUF) {
      if (cur.length - s.length >= 3 && cur.endsWith(s)) {
        cur = cur.slice(0, cur.length - s.length);
        hit = true;
        break;
      }
    }
    if (!hit) break;
  }
  return cur;
}

export function stemVariants(baseWord: string): string[] {
  const out = new Set<string>();
  const s1 = stemWord(baseWord);
  out.add(loose(s1));
  for (const d of DIMIN) {
    if (s1.length - d.length >= 3 && s1.endsWith(d)) {
      out.add(loose(s1.slice(0, s1.length - d.length)));
      break;
    }
  }
  const lz = loose(baseWord);
  const kz = kzStem(lz);
  if (kz !== lz) out.add(kz);
  return [...out];
}

// --- синонимы: подготовка словарей и расширение токена запроса ---

type SynEntry =
  | { kind: "word"; loose: string; stems: string[] }
  | { kind: "phrase"; phrase: string };

type Expansion = { stems: string[][]; phrases: string[] };

function processEntry(raw: string): SynEntry | null {
  const toks = tokenizeBase(raw);
  if (toks.length === 1) {
    return { kind: "word", loose: loose(toks[0]), stems: stemVariants(toks[0]) };
  }
  if (toks.length > 1) {
    return { kind: "phrase", phrase: toks.map(loose).join(" ") };
  }
  return null;
}

const SYM_GROUPS: SynEntry[][] = SYNONYMS.map((g) =>
  g.map(processEntry).filter((e): e is SynEntry => e !== null),
);

const HYP_GROUPS: { head: SynEntry; rest: SynEntry[] }[] = HYPERNYMS.map((g) => {
  const entries = g.map(processEntry).filter((e): e is SynEntry => e !== null);
  return { head: entries[0], rest: entries.slice(1) };
}).filter((g) => g.head !== undefined);

function entryAligns(e: SynEntry, tLoose: string, tStems: string[]): boolean {
  return e.kind === "word" && (e.loose === tLoose || stemsAlign(tStems, e.stems));
}

function addEntry(e: SynEntry, stems: string[][], phrases: string[]) {
  if (e.kind === "word") stems.push(e.stems);
  else phrases.push(e.phrase);
}

function expandToken(tLoose: string, tStems: string[]): Expansion | null {
  const stems: string[][] = [];
  const phrases: string[] = [];

  // Симметричные группы (переводы): каждое слово тянет остальные.
  for (const g of SYM_GROUPS) {
    if (!g.some((e) => entryAligns(e, tLoose, tStems))) continue;
    for (const e of g) {
      if (entryAligns(e, tLoose, tStems)) continue;
      addEntry(e, stems, phrases);
    }
  }

  // Гиперонимы: общее -> вся конкретика; конкретика -> только общее,
  // соседей по группе НЕ тянем (помидоры не находят огурцы).
  for (const g of HYP_GROUPS) {
    if (entryAligns(g.head, tLoose, tStems)) {
      for (const e of g.rest) addEntry(e, stems, phrases);
    } else if (g.rest.some((e) => entryAligns(e, tLoose, tStems))) {
      addEntry(g.head, stems, phrases);
    }
  }

  if (stems.length === 0 && phrases.length === 0) return null;
  return { stems, phrases };
}

// --- расстояние редактирования (Дамерау—Левенштейн) с потолком ---

export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prevPrev: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prevPrev[j - 2] + 1);
      }
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prevPrev = prev;
    prev = cur;
  }
  return prev[b.length];
}

// --- индекс ---

export function buildIndex(docs: RawField[][]): SearchIndex {
  return docs.map((fields) =>
    fields
      .map((f) => {
        const base = tokenizeBase(f.text);
        const words = base.map(loose);
        const joined = words.join(" ");
        return {
          joined,
          glued: joined.replace(/ /g, ""),
          words,
          stems: base.map(stemVariants),
          weight: f.weight,
          kind: f.kind,
          productIdx: f.productIdx,
        };
      })
      .filter((f) => f.words.length > 0),
  );
}

// --- сопоставление токена с полем: точное > префикс > основа > вхождение > опечатка ---

function stemsAlign(tStems: string[], wStems: string[]): boolean {
  for (const ts of tStems) {
    if (ts.length < 2) continue;
    for (const ws of wStems) {
      if (ts === ws) return true;
      if (
        ts.length >= 3 && ws.length >= 3 &&
        (ws.startsWith(ts) || ts.startsWith(ws))
      ) return true;
    }
  }
  return false;
}

function tokenInField(t: string, tStems: string[], syn: Expansion | null, f: IdxField): number {
  let best = 0;
  for (let i = 0; i < f.words.length; i++) {
    const w = f.words[i];
    if (w === t) return 1;
    if (best < 0.85 && t.length >= 2 && w.startsWith(t)) { best = 0.85; continue; }
    if (best < 0.75 && w.length >= 4 && t.startsWith(w)) { best = 0.75; continue; }
    if (best < 0.7 && stemsAlign(tStems, f.stems[i])) { best = 0.7; continue; }
  }
  if (best < 0.6 && syn) {
    outer: for (const ss of syn.stems) {
      for (const wStems of f.stems) {
        if (stemsAlign(ss, wStems)) { best = 0.6; break outer; }
      }
    }
    if (best < 0.6) {
      for (const p of syn.phrases) {
        if (f.joined.includes(p)) { best = 0.6; break; }
      }
    }
  }
  if (best < 0.5 && t.length >= 3 && f.joined.includes(t)) best = 0.5;
  if (best < 0.45 && t.length >= 5 && f.glued.includes(t)) best = 0.45;
  if (best < 0.45 && t.length >= 4) {
    const max = t.length >= 7 ? 2 : 1;
    for (const w of f.words) {
      if (w.length < 3) continue;
      if (Math.abs(w.length - t.length) <= max && editDistance(t, w, max) <= max) {
        best = 0.45;
        break;
      }
      // опечатка в недописанном слове: сравниваем с началом слова той же длины
      if (w.length > t.length && editDistance(t, w.slice(0, t.length), 1) <= 1) {
        best = 0.45;
        break;
      }
    }
  }
  // опечатка вместе с падежом: fuzzy по основам слов
  if (best < 0.4) {
    outerStems: for (const ts of tStems) {
      if (ts.length < 5) continue;
      for (const wStems of f.stems) {
        for (const ws of wStems) {
          if (ws.length >= 5 && Math.abs(ws.length - ts.length) <= 1 && editDistance(ts, ws, 1) <= 1) {
            best = 0.4;
            break outerStems;
          }
        }
      }
    }
  }
  return best;
}

function scoreDoc(
  tokens: string[],
  tokenStems: string[][],
  expansions: (Expansion | null)[],
  doc: IdxField[],
) {
  let total = 0;
  let allMatched = true;
  let nameRaw = 0;
  let prodRaw = 0;
  let bestProd = -1;

  let minRaw = 1; // худшее из «качеств» совпадения по токенам (1 точное … 0.4 опечатка)

  for (let k = 0; k < tokens.length; k++) {
    let best = 0;
    let bestRawTok = 0;
    for (const f of doc) {
      const raw = tokenInField(tokens[k], tokenStems[k], expansions[k], f);
      if (!raw) continue;
      if (raw > bestRawTok) bestRawTok = raw;
      const s = raw * f.weight;
      if (s > best) best = s;
      if (f.kind === "name" && raw > nameRaw) nameRaw = raw;
      if (f.kind === "product" && raw > prodRaw) {
        prodRaw = raw;
        bestProd = f.productIdx ?? -1;
      }
    }
    if (best === 0) allMatched = false;
    else if (bestRawTok < minRaw) minRaw = bestRawTok;
    total += best;
  }

  // Фразовый бонус: запрос из нескольких слов, встретившийся в поле
  // подряд («грецкий орех» в названии товара), ранжируется выше,
  // чем те же слова, разбросанные по разным полям.
  if (allMatched && tokens.length >= 2) {
    const phrase = tokens.join(" ");
    let bw = 0;
    for (const f of doc) {
      if (f.weight > bw && f.joined.includes(phrase)) bw = f.weight;
    }
    if (bw > 0) total += 0.3 * bw;
  }

  // Сниппет товара показываем, когда совпадение с товаром КАЧЕСТВЕННЕЕ,
  // чем с названием магазина: точность важнее веса поля.
  const product = bestProd >= 0 && prodRaw > nameRaw ? bestProd : undefined;
  return { score: total, strict: allMatched, product, minRaw };
}

// --- поиск: strict = нашлись все слова запроса; loose = только часть ---

export type SearchMode = "all" | "strict" | "fuzzy" | "loose";

export function searchShops(
  index: SearchIndex,
  rawQuery: string,
): { mode: SearchMode; hits: Hit[] } {
  const variants = queryVariants(rawQuery);
  if (variants.length === 0) return { mode: "all", hits: [] };

  const bestByDoc = new Map<number, Hit & { strict: boolean; minRaw: number }>();
  for (const v of variants) {
    const base = tokenizeBase(v);
    if (base.length === 0) continue;
    const tokens = base.map(loose);
    const tokenStems = base.map(stemVariants);
    const expansions = tokens.map((tl, k) => expandToken(tl, tokenStems[k]));
    index.forEach((doc, i) => {
      const r = scoreDoc(tokens, tokenStems, expansions, doc);
      if (r.score <= 0) return;
      const prev = bestByDoc.get(i);
      if (
        !prev ||
        (r.strict && !prev.strict) ||
        (r.strict === prev.strict && r.score > prev.score)
      ) {
        bestByDoc.set(i, { idx: i, score: r.score, product: r.product, strict: r.strict, minRaw: r.minRaw });
      }
    });
  }

  const all = [...bestByDoc.values()];
  // Сильные совпадения (точное / начало / форма слова / синоним, качество >= 0.6)
  // вытесняют слабые (опечатки, склейки): опечаточная логика включается
  // ТОЛЬКО когда точных результатов нет вообще.
  const strong = all.filter((h) => h.strict && h.minRaw >= 0.6);
  const weak = all.filter((h) => h.strict && h.minRaw < 0.6);

  let pool: typeof all;
  let mode: SearchMode;
  if (strong.length > 0) {
    pool = strong;
    mode = "strict";
  } else if (weak.length > 0) {
    pool = weak;
    mode = "fuzzy";
  } else {
    pool = all;
    mode = "loose";
  }
  pool.sort((a, b) => b.score - a.score);
  return {
    mode,
    hits: pool.map(({ idx, score, product }) => ({ idx, score, product })),
  };
}

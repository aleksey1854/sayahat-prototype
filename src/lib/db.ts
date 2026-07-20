// ВРЕМЕННАЯ ПОДМЕНА для пиксельной проверки вёрстки: движок Prisma в песочнице
// недоступен, поэтому данные читаются из фикстуры, собранной настоящим сидом.
// Оригинал лежит в /tmp/render/db.original.ts
import fx from "../../.render-fixtures.json";

type Any = Record<string, any>;
const raw = fx as unknown as { categories: Any[]; shops: Any[]; news: Any[] };
// В JSON даты стали строками — возвращаем их в Date, иначе форматирование падает
const revive = (r: Any): Any => {
  const out: Any = { ...r };
  for (const k of Object.keys(out)) {
    if (/At$/.test(k) && typeof out[k] === "string") out[k] = new Date(out[k]);
    else if (out[k] && typeof out[k] === "object" && !Array.isArray(out[k]) && !(out[k] instanceof Date)) out[k] = revive(out[k]);
    else if (Array.isArray(out[k])) out[k] = out[k].map((x: Any) => (x && typeof x === "object" ? revive(x) : x));
  }
  return out;
};
const data = {
  categories: raw.categories.map(revive),
  shops: raw.shops.map(revive),
  news: raw.news.map(revive),
};

function match(row: Any, where?: Any): boolean {
  if (!where) return true;
  return Object.entries(where).every(([k, v]) => {
    if (k === "NOT") return !match(row, v as Any);
    if (v && typeof v === "object" && "in" in (v as Any)) return (v as Any).in.includes(row[k]);
    return row[k] === v;
  });
}
function sortBy(rows: Any[], orderBy?: Any) {
  if (!orderBy) return rows;
  const [[field, dir]] = Object.entries(orderBy);
  return [...rows].sort((a, b) => {
    const x = a[field], y = b[field];
    const r = x === y ? 0 : x > y ? 1 : -1;
    return dir === "desc" ? -r : r;
  });
}
const table = (rows: () => Any[]) => ({
  findMany: async ({ where, orderBy, take }: Any = {}) => {
    let out = rows().filter((r) => match(r, where));
    out = sortBy(out, orderBy);
    return take ? out.slice(0, take) : out;
  },
  findUnique: async ({ where }: Any) => rows().find((r) => match(r, where)) ?? null,
  findFirst: async ({ where }: Any = {}) => rows().find((r) => match(r, where)) ?? null,
  count: async ({ where }: Any = {}) => rows().filter((r) => match(r, where)).length,
  create: async ({ data: d }: Any) => d,
  update: async ({ data: d }: Any) => d,
  delete: async () => ({}),
  deleteMany: async () => ({ count: 0 }),
});

export const db = {
  category: table(() => data.categories),
  shop: table(() => data.shops),
  newsPost: table(() => data.news),
  product: table(() => []),
  account: table(() => []),
  $disconnect: async () => {},
} as any;

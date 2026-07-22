"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { buildIndex, searchShops, type RawField, type SearchMode } from "@/lib/search";
import type { PavKey } from "@/lib/site";

export type CardProduct = { name: string; price: number | null; unit: string | null };

export type CardShop = {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  cover: string | null;
  location: string;
  pavKey?: PavKey;
  fields: RawField[];
  products: CardProduct[];
};

export type SearchHit = { shop: CardShop; product?: CardProduct };

type Ctx = {
  query: string;
  setQuery: (v: string) => void;
  hits: SearchHit[];
  mode: SearchMode;
  // Фильтр по павильону: им управляют и чипы каталога, и клик по карте.
  pav: PavKey | null;
  setPav: (v: PavKey | null) => void;
};

const CatalogSearchCtx = createContext<Ctx>({
  query: "", setQuery: () => {}, hits: [], mode: "all", pav: null, setPav: () => {},
});

export function useCatalogSearch() {
  return useContext(CatalogSearchCtx);
}

// Владеет данными каталога и поиском: строит индекс один раз, отдаёт
// результаты и герою, и поиску в шапке (для выпадающих подсказок).
export function CatalogProvider({ shops, children, initialQuery = "" }: { shops: CardShop[]; children: React.ReactNode; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [pav, setPav] = useState<PavKey | null>(null);
  const index = useMemo(() => buildIndex(shops.map((s) => s.fields)), [shops]);
  const q = query.trim();

  const { hits, mode } = useMemo(() => {
    if (!q) {
      return { hits: shops.map((shop) => ({ shop })) as SearchHit[], mode: "all" as SearchMode };
    }
    const res = searchShops(index, q);
    return {
      hits: res.hits.map((h) => ({
        shop: shops[h.idx],
        product: h.product != null ? shops[h.idx].products[h.product] : undefined,
      })),
      mode: res.mode,
    };
  }, [index, shops, q]);

  return <CatalogSearchCtx.Provider value={{ query, setQuery, hits, mode, pav, setPav }}>{children}</CatalogSearchCtx.Provider>;
}

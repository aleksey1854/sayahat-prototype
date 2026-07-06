"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCatalogSearch } from "./CatalogProvider";
import { price, ruPlural, srcSetFor } from "@/lib/format";
import { buildIndex, searchShops, type RawField } from "@/lib/search";
import { trackEvent } from "@/lib/track";

export type CardProduct = { name: string; price: number | null; unit: string | null };

export type CardShop = {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  cover: string | null;
  location: string;
  fields: RawField[];
  products: CardProduct[];
};

type Stat = { value: string; label: string };

type Ui = {
  searchPlaceholder: string;
  all: string;
  empty: string;
  open: string;
  clear: string;
  foundPrefix: string;
  looseNote: string;
  showAllFound: string;
  resetSearch: string;
};

type Props = {
  heroTitle: string;
  heroSubtitle: string;
  stats: Stat[];
  catalogEyebrow: string;
  catalogTitle: string;
  shops: CardShop[];
  categories: { slug: string; name: string }[];
  lang: "ru" | "kz";
  ui: Ui;
};

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function CatalogSection({
  heroTitle,
  heroSubtitle,
  stats,
  catalogEyebrow,
  catalogTitle,
  shops,
  categories,
  lang,
  ui,
}: Props) {
  const { query, setQuery } = useCatalogSearch();
  const [cat, setCat] = useState("all");

  const index = useMemo(() => buildIndex(shops.map((s) => s.fields)), [shops]);
  const q = query.trim();

  const { matched, mode } = useMemo(() => {
    if (!q) {
      return {
        matched: shops.map((shop) => ({ shop, product: undefined as CardProduct | undefined })),
        mode: "all" as const,
      };
    }
    const res = searchShops(index, q);
    return {
      matched: res.hits.map((h) => ({
        shop: shops[h.idx],
        product: h.product != null ? shops[h.idx].products[h.product] : undefined,
      })),
      mode: res.mode,
    };
  }, [index, shops, q]);

  const shown = matched.filter((m) => cat === "all" || m.shop.categorySlug === cat);

  // Аналитика запросов: что ищут и что ищут впустую (после паузы в наборе).
  useEffect(() => {
    if (!q) return;
    const timer = setTimeout(() => {
      trackEvent("search", { query: q, results: matched.length });
      if (matched.length === 0) trackEvent("search_empty", { query: q });
    }, 900);
    return () => clearTimeout(timer);
  }, [q, matched.length]);

  const countLine =
    q && matched.length > 0
      ? lang === "kz"
        ? `«${q}»: ${matched.length} дүкен табылды`
        : `Найдено ${matched.length} ${ruPlural(matched.length, "магазин", "магазина", "магазинов")} по запросу «${q}»`
      : "";

  return (
    <>
      <section className="cat-hero">
        <div className="wrap cat-hero__inner">
          <h1>{heroTitle}</h1>
          <p>{heroSubtitle}</p>
          <div className="searchbar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ui.searchPlaceholder}
            />
            {query && (
              <button className="searchbar__clear" type="button" aria-label={ui.clear} onClick={() => setQuery("")}>
                ×
              </button>
            )}
          </div>
          <div className="stats">
            {stats.map((s) => (
              <div key={s.label}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section catalog-grid-section" id="catalog">
        <div className="wrap">
          <div className="section-head" style={{ textAlign: "center" }}>
            <div className="eyebrow">{catalogEyebrow}</div>
            <h2 style={{ margin: "0 auto" }}>{catalogTitle}</h2>
          </div>

          <div className="catbar" style={{ marginBottom: 32 }}>
            <button className={cat === "all" ? "cat-chip on" : "cat-chip"} onClick={() => setCat("all")}>
              {ui.all}
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                className={cat === c.slug ? "cat-chip on" : "cat-chip"}
                onClick={() => setCat(c.slug)}
              >
                {c.name}
              </button>
            ))}
          </div>

          {countLine && (
            <div className="search-meta">
              <b>{countLine}</b>
              {mode === "loose" && <div>{ui.looseNote}</div>}
            </div>
          )}

          <div className="stores">
            {shown.map(({ shop: s, product: m }) => (
              <Link className="store" href={`/shop/${s.slug}`} key={s.slug}>
                <div className={s.cover ? "store__pic" : "store__pic card__pic--empty"}>
                  {s.cover ? (
                    <img
                      className="store__img"
                      src={srcSetFor(s.cover)!.src}
                      srcSet={srcSetFor(s.cover)!.srcSet}
                      sizes="(max-width: 560px) 92vw, 340px"
                      alt={s.name}
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="tile-mono"
                      style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}
                    >
                      {s.name.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="store__tag">{s.categoryName}</span>
                </div>
                <div className="store__body">
                  <h3>{s.name}</h3>
                  {s.location && (
                    <div className="store__loc">
                      <PinIcon /> {s.location}
                    </div>
                  )}
                  {m && (
                    <div className="store__match">
                      {ui.foundPrefix}
                      {m.name}
                      {m.price != null ? ` · ${price(m.price)}${m.unit ? ` / ${m.unit}` : ""}` : ""}
                    </div>
                  )}
                  <div className="store__foot">
                    <span className="store__open">
                      {ui.open}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {shown.length === 0 && (
            <div className="no-results" style={{ display: "block" }}>
              {ui.empty}
              {q && matched.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <button className="link-reset" onClick={() => setCat("all")}>
                    {ui.showAllFound} ({matched.length})
                  </button>
                </div>
              )}
              {q && matched.length === 0 && (
                <div style={{ marginTop: 12 }}>
                  <button className="link-reset" onClick={() => setQuery("")}>
                    {ui.resetSearch}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

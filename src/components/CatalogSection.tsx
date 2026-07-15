"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCatalogSearch, type CardShop, type CardProduct } from "./CatalogProvider";
import { price, ruPlural, srcSetFor } from "@/lib/format";
import { SearchSuggest } from "./SearchSuggest";

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
  nothing: string;
};

type Props = {
  heroTitle: string;
  catalogEyebrow: string;
  catalogTitle: string;
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

export function CatalogSection({ heroTitle, catalogEyebrow, catalogTitle, categories, lang, ui }: Props) {
  const { query, setQuery, hits, mode } = useCatalogSearch();
  const router = useRouter();
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const q = query.trim();
  const items = q ? hits.slice(0, 6) : [];
  const shown = hits.filter((m) => cat === "all" || m.shop.categorySlug === cat);

  function close() {
    setOpen(false);
    setActive(-1);
  }
  function showAll() {
    close();
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!q) return;
    if (e.key === "Escape") return close();
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && active < items.length) {
        close();
        router.push(`/shop/${items[active].shop.slug}`);
      } else {
        showAll();
      }
    }
  }

  const countLine =
    q && hits.length > 0
      ? lang === "kz"
        ? `«${q}»: ${hits.length} дүкен табылды`
        : `Найдено ${hits.length} ${ruPlural(hits.length, "магазин", "магазина", "магазинов")} по запросу «${q}»`
      : "";

  return (
    <>
      {/* Компактный верх: заголовок-строка и поиск, без большого hero-блока */}
      <section className="cat-top">
        <div className="wrap">
          <h1 className="cat-top__title">{heroTitle}</h1>
          <div className="searchbar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setActive(-1);
              }}
              onFocus={() => q && setOpen(true)}
              onBlur={() => setTimeout(close, 120)}
              onKeyDown={onKeyDown}
              placeholder={ui.searchPlaceholder}
            />
            {query && (
              <button
                className="searchbar__clear"
                type="button"
                aria-label={ui.clear}
                onClick={() => {
                  setQuery("");
                  close();
                }}
              >
                ×
              </button>
            )}
            {open && q && (
              <SearchSuggest
                items={items}
                total={hits.length}
                mode={mode}
                active={active}
                showAllLabel={ui.showAllFound}
                emptyLabel={ui.nothing}
                approxLabel={ui.looseNote}
                onPick={close}
                onShowAll={showAll}
              />
            )}
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
              {(mode === "fuzzy" || mode === "loose") && <div>{ui.looseNote}</div>}
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
              {q && hits.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <button className="link-reset" onClick={() => setCat("all")}>
                    {ui.showAllFound} ({hits.length})
                  </button>
                </div>
              )}
              {q && hits.length === 0 && (
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

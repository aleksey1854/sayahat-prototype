"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PAVILION_LIST, type PavKey } from "@/lib/site";
import { CategoryIcon, SHORT_CAT } from "./CategoryIcon";
import { useCatalogSearch } from "./CatalogProvider";
import { price, ruPlural, srcSetFor } from "@/lib/format";

type Ui = {
  all: string;
  empty: string;
  open: string;
  foundPrefix: string;
  looseNote: string;
  showAllFound: string;
  resetSearch: string;
};

type Props = {
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

// Плитка-заглушка для карточек без фото — тон по категории.
const TINT: Record<string, string> = {
  meat: "tile--meat", sweets: "tile--sweets", cloth: "tile--cloth", veg: "tile--veg",
  flowers: "tile--flowers", shoe: "tile--shoe", kids: "tile--kids", home: "tile--home",
  beauty: "tile--beauty", optics: "tile--optics", tech: "tile--tech", tea: "tile--tea",
  pets: "tile--pets", handmade: "tile--handmade", bags: "tile--bags",
};
function tintFor(slug: string) {
  return TINT[slug] ?? "tile--shop";
}

export function CatalogSection({ catalogTitle, categories, lang, ui }: Props) {
  const { query, setQuery, hits, mode, pav, setPav } = useCatalogSearch();
  const [cat, setCat] = useState("all");
  const gridRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());

  const q = query.trim();
  const t = (ru: string, kz: string) => (lang === "kz" ? kz : ru);

  // Два независимых фильтра: категория и павильон.
  // Счётчики у павильонов считаем до применения фильтра павильона,
  // иначе при выборе одного остальные схлопнулись бы в ноль.
  const byCat = hits.filter((m) => cat === "all" || m.shop.categorySlug === cat);
  const shown = byCat.filter((m) => !pav || m.shop.pavKey === pav);
  const pavCount = (k: PavKey) => byCat.filter((m) => m.shop.pavKey === k).length;
  // Если павильоны в данных не заполнены вообще — фильтр не показываем,
  // иначе ряд неактивных чипов выглядит как поломка.
  const hasPav = hits.some((m) => m.shop.pavKey);
  const noPavCount = byCat.filter((m) => !m.shop.pavKey).length;

  // Стаггер карточек: каждая появляется, когда входит в вьюпорт.
  // Состояние в Set (React-controlled) — переживает ре-рендер при фильтрации без мигания.
  const shownKey = shown.map((x) => x.shop.slug).join(",");
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-slug]"));
    if (typeof IntersectionObserver === "undefined") {
      setRevealed((prev) => {
        const n = new Set(prev);
        cards.forEach((c) => c.dataset.slug && n.add(c.dataset.slug));
        return n;
      });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const add: string[] = [];
        for (const e of entries) {
          if (e.isIntersecting) {
            const slug = (e.target as HTMLElement).dataset.slug;
            if (slug) add.push(slug);
            io.unobserve(e.target);
          }
        }
        if (add.length) setRevealed((prev) => new Set([...prev, ...add]));
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [shownKey]);

  const countLine =
    q && hits.length > 0
      ? lang === "kz"
        ? `«${q}»: ${hits.length} дүкен табылды`
        : `Найдено ${hits.length} ${ruPlural(hits.length, "магазин", "магазина", "магазинов")} по запросу «${q}»`
      : "";

  return (
    <>
      <section className="section catalog-grid-section" id="catalog">
        <div className="wrap">
          <h1 className="sr-only">{catalogTitle}</h1>

          <div className="catbar">
            <button className={cat === "all" ? "cat on" : "cat"} onClick={() => setCat("all")} aria-pressed={cat === "all"}>
              <span className="cat__ico cat__ico--all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3.2" y="3.2" width="7.6" height="7.6" rx="2" />
                  <rect x="13.2" y="3.2" width="7.6" height="7.6" rx="2" />
                  <rect x="3.2" y="13.2" width="7.6" height="7.6" rx="2" />
                  <rect x="13.2" y="13.2" width="7.6" height="7.6" rx="2" />
                </svg>
              </span>
              <span className="cat__label">{ui.all}</span>
            </button>
            {categories.map((c) => {
              const short = SHORT_CAT[c.slug];
              return (
                <button
                  key={c.slug}
                  className={cat === c.slug ? "cat on" : "cat"}
                  onClick={() => setCat(c.slug)}
                  aria-pressed={cat === c.slug}
                  title={c.name}
                >
                  <span className={`cat__ico tile--${c.slug}`}>
                    <CategoryIcon slug={c.slug} />
                  </span>
                  <span className="cat__label">{short ? t(short.ru, short.kz) : c.name}</span>
                </button>
              );
            })}
          </div>

          {hasPav && (
          <div className="pavbar">
            <button className={!pav ? "pav-chip on" : "pav-chip"} onClick={() => setPav(null)}>
              {t("Все павильоны", "Барлық павильондар")}
            </button>
            {PAVILION_LIST.map((p) => {
              const n = pavCount(p.key);
              return (
                <button
                  key={p.key}
                  className={pav === p.key ? "pav-chip on" : "pav-chip"}
                  onClick={() => setPav(pav === p.key ? null : p.key)}
                  disabled={n === 0}
                >
                  {t(p.shortRu, p.shortKz)}
                  <span className="pav-chip__n">{n}</span>
                </button>
              );
            })}
          </div>
          )}

          {hasPav && pav && noPavCount > 0 && (
            <p className="pav-note">
              {t(
                `Ещё ${noPavCount} — павильон уточняется, они видны во «Все павильоны».`,
                `Тағы ${noPavCount} — павильоны нақтыланып жатыр, «Барлық павильондар» бөлімінде көрінеді.`,
              )}
            </p>
          )}

          {countLine && (
            <div className="search-meta">
              <b>{countLine}</b>
              {(mode === "fuzzy" || mode === "loose") && <div>{ui.looseNote}</div>}
            </div>
          )}

          <div className="stores" ref={gridRef}>
            {shown.map(({ shop: s, product: m }, i) => (
              <Link
                className={`store reveal ${revealed.has(s.slug) ? "reveal--in" : ""}`}
                href={`/shop/${s.slug}`}
                key={s.slug}
                data-slug={s.slug}
                style={{ transitionDelay: `${(i % 3) * 45}ms` }}
              >
                <div className={s.cover ? "store__pic" : `store__pic card__pic--empty ${tintFor(s.categorySlug)}`}>
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

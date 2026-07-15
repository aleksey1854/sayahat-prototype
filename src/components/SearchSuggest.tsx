"use client";

import Link from "next/link";
import { price, srcSetFor } from "@/lib/format";
import type { SearchHit, CardShop } from "./CatalogProvider";
import type { SearchMode } from "@/lib/search";

function Thumb({ shop }: { shop: CardShop }) {
  const pic = srcSetFor(shop.cover);
  if (pic) {
    return <span className="suggest__thumb" style={{ backgroundImage: `url('${pic.src}')` }} />;
  }
  return <span className="suggest__thumb suggest__thumb--mono">{shop.name.trim().charAt(0).toUpperCase()}</span>;
}

// Выпадающий список подсказок под полем поиска.
export function SearchSuggest({
  items,
  total,
  mode,
  active,
  showAllLabel,
  emptyLabel,
  approxLabel,
  onPick,
  onShowAll,
}: {
  items: SearchHit[];
  total: number;
  mode: SearchMode;
  active: number;
  showAllLabel: string;
  emptyLabel: string;
  approxLabel: string;
  onPick: () => void;
  onShowAll: () => void;
}) {
  return (
    <div className="suggest" role="listbox">
      {total === 0 && <div className="suggest__empty">{emptyLabel}</div>}
      {total > 0 && (mode === "fuzzy" || mode === "loose") && <div className="suggest__note">{approxLabel}</div>}
      {items.map(({ shop, product }, i) => (
        <Link
          key={shop.slug}
          href={`/shop/${shop.slug}`}
          className={active === i ? "suggest__item is-active" : "suggest__item"}
          role="option"
          aria-selected={active === i}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onPick}
        >
          <Thumb shop={shop} />
          <span className="suggest__text">
            <span className="suggest__name">{shop.name}</span>
            <span className="suggest__sub">
              {shop.categoryName}
              {shop.location ? ` · ${shop.location}` : ""}
            </span>
            {product && (
              <span className="suggest__match">
                {product.name}
                {product.price != null ? ` · ${price(product.price)}` : ""}
              </span>
            )}
          </span>
        </Link>
      ))}
      {total > 0 && (
        <button
          type="button"
          className={active === items.length ? "suggest__all is-active" : "suggest__all"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onShowAll}
        >
          {showAllLabel} ({total})
        </button>
      )}
    </div>
  );
}

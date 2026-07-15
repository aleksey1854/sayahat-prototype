"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCatalogSearch } from "./CatalogProvider";
import { SearchSuggest } from "./SearchSuggest";

type Labels = {
  placeholder: string;
  clearLabel: string;
  showAllLabel: string;
  emptyLabel: string;
  approxLabel: string;
};

// Единственное поле поиска каталога — живёт в шапке, всегда видно.
export function HeaderSearch({ placeholder, clearLabel, showAllLabel, emptyLabel, approxLabel }: Labels) {
  const { query, setQuery, hits, mode } = useCatalogSearch();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const q = query.trim();
  const items = q ? hits.slice(0, 6) : [];

  function close() {
    setOpen(false);
    setActive(-1);
  }
  function showAll() {
    close();
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
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

  return (
    <div className="topbar__search" role="search">
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
        placeholder={placeholder}
        aria-label="Поиск по базару"
      />
      {query && (
        <button
          className="searchbar__clear"
          type="button"
          aria-label={clearLabel}
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
          showAllLabel={showAllLabel}
          emptyLabel={emptyLabel}
          approxLabel={approxLabel}
          onPick={close}
          onShowAll={showAll}
        />
      )}
    </div>
  );
}

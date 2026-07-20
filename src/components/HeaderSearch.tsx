"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCatalogSearch } from "./CatalogProvider";
import { SearchSuggest } from "./SearchSuggest";

type Labels = {
  placeholder: string;
  placeholderShort: string;
  clearLabel: string;
  showAllLabel: string;
  emptyLabel: string;
  approxLabel: string;
};

// Единственное поле поиска каталога — живёт в шапке, всегда видно.
export function HeaderSearch({ placeholder, placeholderShort, clearLabel, showAllLabel, emptyLabel, approxLabel }: Labels) {
  const { query, setQuery, hits, mode } = useCatalogSearch();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const q = query.trim();
  // На телефоне поле зажато между логотипом и языком — там помещается
  // от силы пара слов. Пока в нём работают, убираем соседей и отдаём всю ширину.
  const expanded = focused || q.length > 0;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const upd = () => setNarrow(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  useEffect(() => {
    const bar = boxRef.current?.closest(".topbar__inner");
    bar?.classList.toggle("is-searching", narrow && expanded);
  }, [narrow, expanded]);
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
    <div className="topbar__search" role="search" ref={boxRef}>
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
        onFocus={() => {
          setFocused(true);
          if (q) setOpen(true);
        }}
        onBlur={() => {
          setFocused(false);
          setTimeout(close, 120);
        }}
        onKeyDown={onKeyDown}
        placeholder={narrow && !expanded ? placeholderShort : placeholder}
        aria-label={placeholder}
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

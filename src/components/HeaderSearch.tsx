"use client";

import { useEffect, useState } from "react";
import { useCatalogSearch } from "./CatalogProvider";

export function HeaderSearch({ placeholder, clearLabel }: { placeholder: string; clearLabel: string }) {
  const { query, setQuery } = useCatalogSearch();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 380);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function onChange(v: string) {
    // Начал печатать, уже пролистав каталог, — мягко возвращаем к результатам.
    if (query === "" && v !== "") {
      const el = document.getElementById("catalog");
      if (el && el.getBoundingClientRect().top < 0) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
    setQuery(v);
  }

  return (
    <div className={show ? "topbar__search is-visible" : "topbar__search"} role="search" aria-hidden={!show}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Поиск по базару"
        tabIndex={show ? 0 : -1}
      />
      {query && (
        <button
          className="searchbar__clear"
          type="button"
          aria-label={clearLabel}
          onClick={() => setQuery("")}
          tabIndex={show ? 0 : -1}
        >
          ×
        </button>
      )}
    </div>
  );
}

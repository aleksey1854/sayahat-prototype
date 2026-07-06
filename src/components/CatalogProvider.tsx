"use client";

import { createContext, useContext, useState } from "react";

type Ctx = { query: string; setQuery: (v: string) => void };

const CatalogSearchCtx = createContext<Ctx>({ query: "", setQuery: () => {} });

export function useCatalogSearch() {
  return useContext(CatalogSearchCtx);
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  return <CatalogSearchCtx.Provider value={{ query, setQuery }}>{children}</CatalogSearchCtx.Provider>;
}

import Link from "next/link";
import { getLang, pick } from "@/lib/i18n";
import { LangToggle } from "./LangToggle";
import { HeaderSearch } from "./HeaderSearch";

export function Header({ variant = "catalog" }: { variant?: "catalog" | "shop" }) {
  const lang = getLang();

  return (
    <header className="topbar">
      <div className="wrap topbar__inner">
        <div className="topbar__left">
          <Link className="brand" href="/" aria-label="Базары Саяхат — на главную">
            <img src="/logo-mark.png" alt="Базары Саяхат" className="brand__logo" />
          </Link>
          {variant === "shop" && (
            <Link className="topbar__back" href="/">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {pick(lang, "Все магазины", "Барлық дүкендер")}
            </Link>
          )}
        </div>

        <div className="topbar__right">
          {variant === "catalog" && (
            <HeaderSearch
              placeholder={pick(lang, "Поиск по базару…", "Базардан іздеу…")}
              clearLabel={pick(lang, "Очистить", "Тазалау")}
              showAllLabel={pick(lang, "Показать все", "Барлығын көрсету")}
              emptyLabel={pick(lang, "Ничего не нашлось", "Ештеңе табылмады")}
              approxLabel={pick(lang, "Точных совпадений нет — похожие:", "Дәл сәйкестік жоқ — ұқсастары:")}
            />
          )}
          <LangToggle lang={lang} />
        </div>
      </div>
    </header>
  );
}

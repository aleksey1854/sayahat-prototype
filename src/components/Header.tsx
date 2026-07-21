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
          <Link className="brand" href="/" aria-label={pick(lang, "Рынок Саяхат — на главную", "Саяхат базары — басты бетке")}>
            <img src="/logo-mark.png" alt={pick(lang, "Рынок Саяхат", "Саяхат базары")} className="brand__logo" />
            {/* На телефоне широкий логотип с текстом сжимался в нечитаемую полоску —
                там показываем квадратную марку, ту же, что и иконка сайта. */}
            <svg className="brand__square" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="7" fill="#1C6B57" />
              <path d="M9 25V15a7 7 0 0 1 14 0v10h-3.4V15a3.6 3.6 0 0 0-7.2 0v10z" fill="#fff" />
            </svg>
          </Link>
                  </div>

        {(
          <HeaderSearch
            placeholder={pick(lang, "Что ищете? Орехи, платок, обувь…", "Не іздейсіз? Жаңғақ, орамал, аяқ киім…")}
            placeholderShort={pick(lang, "Поиск по рынку", "Базар бойынша іздеу")}
            clearLabel={pick(lang, "Очистить", "Тазалау")}
            showAllLabel={pick(lang, "Показать все", "Барлығын көрсету")}
            emptyLabel={pick(lang, "Ничего не нашлось", "Ештеңе табылмады")}
            approxLabel={pick(lang, "Точных совпадений нет — похожие:", "Дәл сәйкестік жоқ — ұқсастары:")}
          />
        )}
        <div className="topbar__right">
          <LangToggle lang={lang} />
        </div>
      </div>
    </header>
  );
}

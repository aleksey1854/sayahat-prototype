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
              <rect width="32" height="32" rx="7.5" fill="#1C6B57" />
              <path d="M7 25V16a9 9 0 0 1 18 0v9" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
              <path d="M11.5 25v-9a4.5 4.5 0 0 1 9 0v9" fill="none" stroke="#E8A23C" strokeWidth={2.4} strokeLinecap="round" />
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

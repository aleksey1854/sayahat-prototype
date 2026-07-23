import Link from "next/link";
import { getLang, pick } from "@/lib/i18n";
import { site, waLink } from "@/lib/site";
import { LangToggle } from "./LangToggle";
import { HeaderSearch } from "./HeaderSearch";
import { InstagramIcon } from "./InstagramIcon";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function Header({ variant = "catalog" }: { variant?: "catalog" | "shop" }) {
  const lang = getLang();

  return (
    <header className="topbar">
      <div className="wrap topbar__inner">
        <div className="topbar__left">
          <Link className="brand" href="/" aria-label={pick(lang, "Рынок Саяхат — на главную", "Саяхат базары — басты бетке")}>
            <img src="/logo-horizontal.webp" alt={pick(lang, "Рынок Саяхат", "Саяхат базары")} className="brand__logo" />
            {/* На телефоне широкий вордмарк сжимался в нечитаемую полоску —
                там показываем квадратный логотип с верблюдом. */}
            <img src="/logo-square.webp" alt="" aria-hidden="true" className="brand__square" />
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
          <div className="topbar__social">
            <a
              className="topbar__ig"
              href={site.instagramUrl}
              target="_blank"
              rel="noopener"
              aria-label="Instagram"
              title="Instagram"
            >
              <InstagramIcon />
            </a>
            <a
              href={waLink(site.whatsapp)}
              target="_blank"
              rel="noopener"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <WhatsAppIcon />
            </a>
          </div>
          <LangToggle lang={lang} />
        </div>
      </div>
    </header>
  );
}

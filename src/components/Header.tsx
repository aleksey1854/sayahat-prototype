import Link from "next/link";
import { getLang, pick } from "@/lib/i18n";
import { site, waLink } from "@/lib/site";
import { LangToggle } from "./LangToggle";
import { HeaderSearch } from "./HeaderSearch";
import { InstagramIcon } from "./InstagramIcon";
import { WhatsAppIcon } from "./WhatsAppIcon";

// withSearch: на служебных страницах (админка, кабинет, вход) каталога нет,
// и поле поиска там было мёртвым — печатаешь, ничего не происходит.
// Прячем его вместо того, чтобы чинить: искать там нечего.
export function Header({ variant = "catalog", withSearch = true }: { variant?: "catalog" | "shop"; withSearch?: boolean }) {
  const lang = getLang();

  return (
    <header className="topbar">
      <div className={"wrap topbar__inner" + (withSearch ? "" : " topbar__inner--plain")}>
        <div className="topbar__left">
          <Link className="brand" href="/" aria-label={pick(lang, "Рынок Саяхат — на главную", "Саяхат базары — басты бетке")}>
            <img src="/logo-mark.png" alt={pick(lang, "Рынок Саяхат", "Саяхат базары")} className="brand__logo" />
            {/* На телефоне широкий вордмарк сжимался в нечитаемую полоску.
                Квадрат с надписью при 48px превращался в кашу, поэтому здесь
                только верблюд — эмблема без текста читается в любом размере. */}
            <img src="/logo-camel.webp" alt="" aria-hidden="true" className="brand__square" />
            {/* Название рядом с эмблемой на телефоне: бренд молодой,
                верблюда пока никто не знает, а реклама идёт под словом
                «Саяхат». Вырезано из того же логотипа, что на десктопе —
                гарнитура совпадает. */}
            <img src="/logo-wordmark.webp" alt="" aria-hidden="true" className="brand__word" />
          </Link>
                  </div>

        {withSearch && (
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
            {/* Адрес рынка. Ведёт на блок «Как добраться» на главной, поэтому
                ссылка абсолютная: со страницы магазина якорь без пути никуда
                не приведёт.

                На широком экране — текст в две строки, на телефоне остаётся
                одна метка рядом с Instagram и WhatsApp: там в шапке нет места
                даже под одну строку адреса, а нажать нужно уметь одинаково. */}
            <a className="topbar__addr" href="/#how-to-get" title={pick(lang, "Как добраться", "Қалай жетуге болады")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <span className="topbar__addr-txt">
                <b>{pick(lang, `Костанай, ${site.address}`, `Қостанай, ${site.addressKz}`)}</b>
                <i>{pick(lang, "На территории автовокзала", "Автовокзал аумағында")}</i>
              </span>
            </a>
          </div>
          <LangToggle lang={lang} />
        </div>
      </div>
    </header>
  );
}

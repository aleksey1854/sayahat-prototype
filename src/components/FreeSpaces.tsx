import { site, waLink, telHref } from "@/lib/site";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import type { Lang } from "@/lib/i18n";

// «Свободные места» — блок аренды. Данные: аренда от ~7000 ₸/м², отдельный номер.
export function FreeSpaces({ lang }: { lang: Lang }) {
  const t = (ru: string, kz: string) => (lang === "kz" ? kz : ru);
  const waText = t(
    "Здравствуйте! Интересует аренда места на рынке «Саяхат».",
    "Сәлеметсіз бе! «Саяхат» базарынан орын жалдау қызықтырады.",
  );

  return (
    <section className="section" id="arenda">
      <div className="wrap">
        <div className="arenda">
          <div className="arenda__txt">
            <h2>{t("Свободные торговые места", "Бос сауда орындары")}</h2>
            <p>
              {t(
                "Подберём место под ваш формат: продуктовый отдел с холодильным оборудованием, торговую точку в вещевом павильоне, стол или открытый прилавок, место для сезонной торговли, офис либо площадку в ярмарочной зоне.",
                "Форматыңызға сай орын таңдаймыз: тоңазытқыш жабдығы бар азық-түлік бөлімі, киім павильонындағы сауда нүктесі, үстел немесе ашық сөре, маусымдық сауда орны, кеңсе не жәрмеңке аймағындағы алаң.",
              )}
            </p>
            <div className="arenda__price">
              <b>
                {t(
                  `Стоимость аренды — ${site.rentFrom} за 1 м² в месяц.`,
                  `Жалдау құны — айына 1 м² үшін ${site.rentFromKz}.`,
                )}
              </b>
              <span>
                {t(
                  "Итоговая цена зависит от площади, расположения и оснащения места.",
                  "Түпкілікті баға орынның ауданына, орналасуына және жабдықталуына байланысты.",
                )}
              </span>
            </div>
          </div>
          <div className="arenda__cta">
            <a className="btn btn--accent btn--lg" href={telHref(site.rentPhone)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
              </svg>
              {site.rentPhone}
            </a>
            <a className="btn btn--ghost btn--lg" href={waLink(site.rentWhatsapp, waText)} target="_blank" rel="noopener">
              <WhatsAppIcon />
              {t("Написать в WhatsApp", "WhatsApp-қа жазу")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

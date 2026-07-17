import { site, waLink, telHref } from "@/lib/site";
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
                "Больше 40 точек уже работают на «Саяхат». Хотите открыть свою — места сдаются в продуктовом и вещевых павильонах, есть ярмарочная зона Art Bazar.",
                "«Саяхат» базарында 40-тан астам нүкте жұмыс істейді. Өз орныңызды ашқыңыз келсе — азық-түлік және киім павильондарында орындар бар, Art Bazar жәрмеңке аймағы да бар.",
              )}
            </p>
            <div className="arenda__price">
              <span>{t("Аренда", "Жалдау")}</span>
              <b>{t(site.rentFrom, site.rentFromKz)}</b>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.3A8.5 8.5 0 1 1 21 11.5z" />
              </svg>
              {t("Написать в WhatsApp", "WhatsApp-қа жазу")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

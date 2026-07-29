import { site, yandexMapsUrl, yandexWidgetUrl, YANDEX_ORG_ID, yandexRouteUrl, googleRouteUrl, gis2RouteUrl, telHref, waLink } from "@/lib/site";
import type { Lang } from "@/lib/i18n";

// «Как добраться»: рынок на территории автовокзала «Саяхат» (сосед по зданию).
// Карта и навигация — один блок: слева живая карта на всю высоту,
// справа адрес, часы и кнопки маршрутов. Так нет пустых панелей.
export function GettingThere({ lang }: { lang: Lang }) {
  const t = (ru: string, kz: string) => (lang === "kz" ? kz : ru);

  return (
    <section className="section section--tight" id="how-to-get" style={{ background: "var(--surface-2)" }}>
      <div className="wrap">
        <div className="section-head">
          <h2>{t("Как нас найти", "Бізді қалай табуға болады")}</h2>
          <p>
            {t(
              "«Саяхат» легко найти — рынок расположен в одном здании с автовокзалом. Посмотрите адрес и постройте удобный маршрут.",
              "«Саяхатты» табу оңай — базар автовокзалмен бір ғимаратта орналасқан. Мекенжайды қарап, ыңғайлы бағыт құрыңыз.",
            )}
          </p>
        </div>

        <div className="getthere getthere--map">
          {/* Виджет Яндекс.Карт с карточкой рынка. loading="lazy" — чтобы тяжёлый
              сторонний iframe не тормозил первую загрузку главной. Ссылки над ним —
              обязательная атрибуция Яндекса, она перекрывается самой картой. */}
          <div className="getthere__map">
            <a
              href={`https://yandex.kz/maps/org/sayakhat/${YANDEX_ORG_ID}/?utm_medium=mapframe&utm_source=maps`}
              style={{ color: "#eee", fontSize: 12, position: "absolute", top: 0 }}
            >
              Саяхат
            </a>
            <a
              href="https://yandex.kz/maps/10295/kostanai/category/shopping_mall/184108083/?utm_medium=mapframe&utm_source=maps"
              style={{ color: "#eee", fontSize: 12, position: "absolute", top: 14 }}
            >
              {t("Торговый центр в Костанае", "Қостанайдағы сауда орталығы")}
            </a>
            <iframe
              src={yandexWidgetUrl()}
              title={t("Рынок «Саяхат» на Яндекс.Картах", "«Саяхат» базары Яндекс.Карталарда")}
              loading="lazy"
              allowFullScreen
            />
          </div>

          <div className="panel">
            <div className="getthere__row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <div>
                <b>{t(site.addressFull, site.addressFullKz)}</b>
                <span>{t("торговый центр и автовокзал находятся в одном здании", "сауда орталығы мен автовокзал бір ғимаратта орналасқан")}</span>
              </div>
            </div>
            <div className="getthere__row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <div>
                <b>{t(site.hours, site.hoursKz)}</b>
                <span>{t(site.dayOff, site.dayOffKz)}</span>
              </div>
            </div>

            {/* Контакты рынка прямо в панели: Виктор просил, чтобы блок
                читался как полноценная визитка, а не только адрес и часы.
                Телефон и WhatsApp кликабельны, Instagram открывается
                в новой вкладке. */}
            <div className="getthere__row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
              </svg>
              <div>
                <b>
                  <a className="getthere__link" href={telHref(site.phones[0])}>
                    {site.phones[0]}
                  </a>
                </b>
                <span>
                  <a className="getthere__link" href={waLink(site.whatsapp)} target="_blank" rel="noopener">
                    {t("написать в WhatsApp", "WhatsApp-қа жазу")}
                  </a>
                </span>
              </div>
            </div>

            <div className="getthere__row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
              </svg>
              <div>
                <b>
                  <a className="getthere__link" href={site.instagramUrl} target="_blank" rel="noopener">
                    @{site.instagram}
                  </a>
                </b>
                <span>{t("новости и акции рынка", "базар жаңалықтары мен акциялары")}</span>
              </div>
            </div>

            <div className="getthere__actions">
              <a className="btn btn--primary btn--block" href={gis2RouteUrl()} target="_blank" rel="noopener">
                {t("Маршрут в 2ГИС", "2ГИС-те бағыт")}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
              <a className="btn btn--ghost btn--block" href={yandexRouteUrl()} target="_blank" rel="noopener">
                {t("Маршрут в Яндекс.Картах", "Яндекс.Карталарда бағыт")}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
              <a className="btn btn--ghost btn--block" href={googleRouteUrl()} target="_blank" rel="noopener">
                {t("Маршрут в Google Картах", "Google Карталарда бағыт")}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
            </div>

            <p className="getthere__note">
              {t("Покупки и поездки — в одном месте!", "Сауда мен сапар — бір жерде!")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

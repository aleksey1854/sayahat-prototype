import { site, yandexMapsUrl, googleMapsUrl, yandexWidgetUrl, YANDEX_ORG_ID } from "@/lib/site";
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
          <h2>{t("Найти «Саяхат»", "«Саяхатты» табу")}</h2>
          <p>
            {t(
              "Рынок — на территории автовокзала, в одном здании. Карта, адрес и ссылки на маршрут.",
              "Базар — автовокзал аумағында, бір ғимаратта. Карта, мекенжай және бағыт сілтемелері.",
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
                <b>{t(site.addressFull, `${site.addressKz}, ${site.cityKz}`)}</b>
                <span>{t("на территории автовокзала «Саяхат»", "«Саяхат» автовокзалы аумағында")}</span>
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

            <div className="getthere__actions">
              <a className="btn btn--primary btn--block" href={site.gis2Url} target="_blank" rel="noopener">
                {t("Открыть в 2ГИС", "2ГИС-те ашу")}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
              <a className="btn btn--ghost btn--block" href={yandexMapsUrl()} target="_blank" rel="noopener">
                {t("Маршрут в Яндекс.Картах", "Яндекс.Карталарда бағыт")}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
              <a className="btn btn--ghost btn--block" href={googleMapsUrl()} target="_blank" rel="noopener">
                {t("Google Карты", "Google Карталар")}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
            </div>

            <p className="getthere__note">
              {t(
                `Рынок и автовокзал — в одном здании: удобно закупиться перед выездом. ${site.station.name} — отдельная организация, ${site.station.hours}.`,
                `Базар мен автовокзал — бір ғимаратта: жол жүрер алдында дүкен аралау ыңғайлы. ${site.station.nameKz} — бөлек ұйым, ${site.station.hoursKz}.`,
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

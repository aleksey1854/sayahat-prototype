import { getLang } from "@/lib/i18n";
import { site, waLink, telHref } from "@/lib/site";

export function Footer() {
  const lang = getLang();
  const t = (ru: string, kz: string) => (lang === "kz" ? kz : ru);

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-cols">
          <div>
            <img src="/logo-full.webp" alt={t("Рынок Саяхат — Костанай", "«Саяхат» базары — Қостанай")} style={{ height: 100, width: "auto", marginBottom: 14 }} />
            <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 15, maxWidth: "34ch" }}>
              {t(site.slogan, site.sloganKz)}
            </p>
          </div>

          <div>
            <div className="foot-h">{t("Связь", "Байланыс")}</div>
            <a className="foot-link" href={waLink(site.whatsapp)} target="_blank" rel="noopener">
              WhatsApp · {site.phones[0]}
            </a>
            <a className="foot-link" href={site.instagramUrl} target="_blank" rel="noopener">
              Instagram · @{site.instagram}
            </a>
            <a className="foot-link" href={site.gis2Url} target="_blank" rel="noopener">
              {t("Мы в 2ГИС", "2ГИС-те")} · ★ {site.rating}
            </a>
          </div>

          <div>
            <div className="foot-h">{t("Адрес и аренда", "Мекенжай және жалдау")}</div>
            <div className="foot-text">{t(site.addressFull, site.addressFullKz)}</div>
            <div className="foot-text">
              {t(site.hours, site.hoursKz)} · {t(site.dayOff, site.dayOffKz)}
            </div>
            <a className="foot-link" href={telHref(site.rentPhone)} style={{ marginTop: 8 }}>
              {t("Аренда мест", "Орын жалдау")}: {site.rentPhone}
            </a>
          </div>
        </div>

        <div className="footer__bottom">
          © {new Date().getFullYear()} {t("рынок «Саяхат»", "«Саяхат» базары")} · {t(site.city, site.cityKz)}
        </div>
      </div>
    </footer>
  );
}

import { getLang, pick } from "@/lib/i18n";
import { site, waLink, telHref } from "@/lib/site";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

function IgIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

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
            <div className="socials">
              <a href={site.instagramUrl} target="_blank" rel="noopener" aria-label="Instagram" title="Instagram">
                <IgIcon />
              </a>
              <a href={site.gis2Url} target="_blank" rel="noopener" aria-label="2ГИС" title="2ГИС">
                <MapIcon />
              </a>
              <a href={waLink(site.whatsapp)} target="_blank" rel="noopener" aria-label="WhatsApp" title="WhatsApp">
                <WhatsAppIcon />
              </a>
            </div>
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
            <div className="foot-text">{t(site.addressFull, `${site.addressKz}, ${site.cityKz}`)}</div>
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

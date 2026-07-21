import { getLang, pick } from "@/lib/i18n";
import { site, waLink, telHref } from "@/lib/site";

function IgIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" />
    </svg>
  );
}
// Узнаваемый логотип WhatsApp вместо абстрактного облачка: по пузырю
// без трубки не считывалось, что это мессенджер.
function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.03 1.02-1.03 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.27-.2-.57-.34M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.43 9.89-9.88 9.89m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41" />
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
            <img src="/logo.png" alt={t("Рынок Саяхат — Костанай", "«Саяхат» базары — Қостанай")} style={{ height: 84, width: "auto", marginBottom: 14 }} />
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
                <WaIcon />
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

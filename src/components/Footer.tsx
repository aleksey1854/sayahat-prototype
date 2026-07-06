import { getLang, pick } from "@/lib/i18n";
import { site } from "@/lib/site";

export function Footer() {
  const lang = getLang();
  return (
    <footer className="footer">
      <div className="wrap" style={{ textAlign: "center" }}>
        <img
          src="/logo.png"
          alt="Базары Саяхат — Костанай"
          style={{ height: 92, width: "auto", margin: "0 auto 16px" }}
        />
        <div className="footer__meta">
          {pick(
            lang,
            `Рынок «${site.name}» · г. ${site.city} · ${site.hours}`,
            `«${site.name}» базары · ${site.cityKz} қ. · ${site.hoursKz}`,
          )}
        </div>
        <div className="footer__made">
          © {new Date().getFullYear()} <b>{site.name}</b>
        </div>
      </div>
    </footer>
  );
}

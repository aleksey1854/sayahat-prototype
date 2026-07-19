import Link from "next/link";
import { getLang, pick } from "@/lib/i18n";
import { Header } from "@/components/Header";

export default function NotFound() {
  const lang = getLang();
  return (
    <>
      <Header variant="shop" />
      <section className="section">
        <div className="wrap" style={{ textAlign: "center", maxWidth: 640 }}>
          <div className="eyebrow">{pick(lang, "Ошибка 404", "404 қатесі")}</div>
          <h1 style={{ fontSize: 44, margin: "12px 0 14px" }}>
            {pick(lang, "Страница не найдена", "Бет табылмады")}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 18, marginBottom: 28 }}>
            {pick(
              lang,
              "Возможно, магазин переехал или ссылку набрали с опечаткой. Вернитесь в каталог рынка.",
              "Дүкен көшкен болуы мүмкін немесе сілтеме қате терілген. Базар каталогына оралыңыз.",
            )}
          </p>
          <Link className="btn btn--primary btn--lg" href="/">
            {pick(lang, "Все магазины рынка", "Базардың барлық дүкендері")}
          </Link>
        </div>
      </section>
    </>
  );
}

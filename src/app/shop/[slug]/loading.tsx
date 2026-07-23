// Скелетон страницы магазина: шапка + геро + полоса достоинств + карточки.
// Раньше переход с главной в магазин показывал пустой экран.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Загрузка">
      <div className="topbar" style={{ background: "var(--surface)" }}>
        <div className="wrap topbar__inner" aria-hidden="true">
          <div className="topbar__left">
            <div className="sk" style={{ width: 46, height: 46, borderRadius: 999, flex: "none" }} />
          </div>
          {/* Класс контейнера оставляем живой — он сам пилюля с рамкой и
              нужной высотой на каждом брейкпоинте. Внутрь только полоску
              вместо текста плейсхолдера, иначе выходит пилюля в пилюле. */}
          <div className="topbar__search">
            <div className="sk sk-line" style={{ width: 210, height: 20 }} />
          </div>
          <div className="topbar__right" style={{ display: "flex", gap: 10 }}>
            <div className="sk" style={{ width: 38, height: 38, borderRadius: 999, flex: "none" }} />
            <div className="sk" style={{ width: 38, height: 38, borderRadius: 999, flex: "none" }} />
            <div className="sk" style={{ width: 74, height: 42, borderRadius: 999, flex: "none" }} />
          </div>
        </div>
      </div>

      <section className="hero" aria-hidden="true">
        <div className="wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <div className="sk" style={{ width: 64, height: 64, borderRadius: 18, marginBottom: 18 }} />
          <div className="sk sk-line" style={{ width: 180, height: 13 }} />
          <div className="sk sk-line" style={{ width: "min(380px, 82%)", height: 40, marginTop: 12 }} />
          <div className="sk sk-line" style={{ width: "min(440px, 92%)", height: 16, marginTop: 16 }} />
          <div className="sk" style={{ width: 190, height: 52, borderRadius: 999, marginTop: 24 }} />
        </div>
      </section>

      <div style={{ background: "var(--brand)", padding: "16px 0" }} aria-hidden="true">
        <div className="wrap" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="sk" key={i} style={{ flex: "1 1 220px", height: 64, borderRadius: 14, opacity: 0.35 }} />
          ))}
        </div>
      </div>

      <section className="section" aria-hidden="true">
        <div className="wrap">
          <div className="sk sk-line" style={{ width: 240, height: 28, marginBottom: 22 }} />
          <div className="grid-cards">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="card" key={i}>
                <div className="card__pic card__pic--empty sk" />
                <div className="card__body">
                  <div className="sk sk-line" style={{ width: "70%", height: 17 }} />
                  <div className="sk sk-line" style={{ width: "88%", height: 13, marginTop: 10 }} />
                  <div className="sk sk-line" style={{ width: "40%", height: 18, marginTop: 16 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

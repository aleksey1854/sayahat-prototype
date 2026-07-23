// Скелетон первой загрузки и навигации. Повторяет актуальную разметку v3:
// двухстрочную мобильную шапку, ленту новостей, плитки категорий, чипы
// павильонов и сетку из 6 карточек. Использует реальные классы раскладки,
// поэтому мобильный вид собирается тем же CSS, что и у живой страницы.
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

      {/* Новости */}
      <section className="section" style={{ background: "var(--surface)" }} aria-hidden="true">
        <div className="wrap">
          <div className="sk sk-line" style={{ width: 190, height: 30, marginBottom: 22 }} />
          <div className="news-grid">
            {Array.from({ length: 2 }).map((_, i) => (
              <div className="news-card" key={i}>
                <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
                  <div className="sk" style={{ width: 54, height: 58, borderRadius: 12, flex: "none" }} />
                  <div className="sk sk-line" style={{ flex: 1, height: 20, marginTop: 6 }} />
                </div>
                <div className="sk sk-line" style={{ width: "92%", height: 13 }} />
                <div className="sk sk-line" style={{ width: "78%", height: 13, marginTop: 8 }} />
                <div className="sk sk-line" style={{ width: 150, height: 13, marginTop: 14 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Категории + павильоны + сетка магазинов */}
      <section className="section catalog-grid-section" aria-hidden="true">
        <div className="wrap">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "grid", justifyItems: "center", gap: 8 }}>
                <div className="sk" style={{ width: 62, height: 62, borderRadius: 17 }} />
                <div className="sk sk-line" style={{ width: 44, height: 10 }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
            {[118, 132, 110, 96].map((w, i) => (
              <div className="sk" key={i} style={{ width: w, height: 40, borderRadius: 12 }} />
            ))}
          </div>

          <div className="stores">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="store store--sk" key={i}>
                <div className="store__pic sk" />
                <div className="store__body">
                  <div className="sk sk-line" style={{ width: "68%", height: 18 }} />
                  <div className="sk sk-line" style={{ width: "44%", height: 13, marginTop: 12 }} />
                  <div className="sk sk-line" style={{ width: "34%", height: 14, marginTop: 20 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

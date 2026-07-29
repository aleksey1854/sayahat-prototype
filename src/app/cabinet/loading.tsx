/**
 * Экран загрузки кабинета.
 *
 * Кабинет — самая тяжёлая страница у оператора: форма магазина, обложка,
 * логотип, фото блока, галерея, плашки. Переход из админки по «Заполнить»
 * до этого показывал пустой экран на всё время запроса.
 *
 * Шапку рисуем здесь же: в отличие от админки у кабинета нет своего
 * layout, и без неё экран прыгал бы при появлении настоящей страницы.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Загрузка">
      <div className="topbar" style={{ background: "var(--surface)" }} aria-hidden="true">
        <div className="wrap topbar__inner">
          <div className="topbar__left">
            <div className="sk" style={{ width: 46, height: 46, borderRadius: 999, flex: "none" }} />
          </div>
          <div className="topbar__right" style={{ display: "flex", gap: 10 }}>
            <div className="sk" style={{ width: 38, height: 38, borderRadius: 999, flex: "none" }} />
            <div className="sk" style={{ width: 38, height: 38, borderRadius: 999, flex: "none" }} />
            <div className="sk" style={{ width: 74, height: 42, borderRadius: 999, flex: "none" }} />
          </div>
        </div>
      </div>

      <section className="section">
        <div className="wrap cab" aria-hidden="true">
          <div className="cab__top">
            <div>
              <div className="sk sk-line" style={{ width: 150, height: 12 }} />
              <div className="sk sk-line" style={{ width: 260, height: 34, marginTop: 12 }} />
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div className="sk" style={{ width: 150, height: 44, borderRadius: 999 }} />
              <div className="sk" style={{ width: 176, height: 44, borderRadius: 999 }} />
            </div>
          </div>

          {/* Обложка: то же окно 16:10, что и в настоящей форме, чтобы
              страница не подпрыгнула, когда подставится реальное фото. */}
          <div className="panel" style={{ marginBottom: 16, display: "grid", gap: 14 }}>
            <div className="sk sk-line" style={{ width: 180, height: 20 }} />
            <div className="sk" style={{ aspectRatio: "16 / 10", maxWidth: 300, borderRadius: 14 }} />
            <div className="sk" style={{ width: 200, height: 44, borderRadius: 999 }} />
          </div>

          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="panel"
              style={{ marginBottom: 16, display: "grid", gap: 14, opacity: 1 - i * 0.18 }}
            >
              <div className="sk sk-line" style={{ width: 160, height: 20 }} />
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                <div className="sk" style={{ height: 46, borderRadius: 12 }} />
                <div className="sk" style={{ height: 46, borderRadius: 12 }} />
              </div>
              <div className="sk" style={{ height: 46, borderRadius: 12 }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

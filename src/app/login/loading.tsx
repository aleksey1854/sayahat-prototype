/**
 * Экран загрузки входа. Страница лёгкая, но именно её открывают первой
 * после долгого простоя — а база на бесплатном тарифе Neon засыпает,
 * и первый запрос будит её секунду-две. Без скелетона это выглядит
 * так, будто ссылка не работает.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Загрузка">
      <section className="section">
        <div className="wrap" style={{ maxWidth: 420 }} aria-hidden="true">
          <div className="sk sk-line" style={{ width: 120, height: 12 }} />
          <div className="sk sk-line" style={{ width: 200, height: 34, margin: "12px 0 24px" }} />
          <div className="panel" style={{ display: "grid", gap: 14 }}>
            <div className="sk" style={{ height: 46, borderRadius: 12 }} />
            <div className="sk" style={{ height: 46, borderRadius: 12 }} />
            <div className="sk" style={{ width: 140, height: 46, borderRadius: 999 }} />
          </div>
        </div>
      </section>
    </div>
  );
}

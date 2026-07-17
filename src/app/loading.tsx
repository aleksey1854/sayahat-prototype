// Показывается при навигации/первой загрузке вместо пустоты.
// Самодостаточно: поиск в реальном хедере завязан на контекст каталога,
// поэтому здесь скелетон-топбар той же высоты (76px) — без прыжка при загрузке.
export default function Loading() {
  return (
    <>
      <div className="topbar" style={{ background: "var(--surface)" }}>
        <div className="topbar__inner">
          <div className="sk sk-line" style={{ width: 128, height: 30 }} />
          <div className="sk sk-line" style={{ flex: 1, maxWidth: 460, height: 42, borderRadius: 999 }} />
          <div className="sk sk-line" style={{ width: 72, height: 30, marginLeft: "auto" }} />
        </div>
      </div>

      <section className="section catalog-grid-section">
        <div className="wrap">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 40 }}>
            <div className="sk sk-line" style={{ width: "min(200px, 55%)", height: 16, borderRadius: 999 }} />
            <div className="sk sk-line" style={{ width: "min(460px, 84%)", height: 40 }} />
            <div className="sk sk-line" style={{ width: "min(320px, 66%)", height: 20 }} />
          </div>

          <div className="stores" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => (
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
    </>
  );
}

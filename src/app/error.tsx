"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="section">
      <div className="wrap" style={{ textAlign: "center", maxWidth: 640, paddingTop: 40 }}>
        <div className="eyebrow">Ошибка</div>
        <h1 style={{ fontSize: 40, margin: "12px 0 14px" }}>Что-то пошло не так</h1>
        <p style={{ color: "var(--muted)", fontSize: 18, marginBottom: 28 }}>
          Попробуйте ещё раз. Если не помогает — обновите страницу или зайдите чуть позже.
        </p>
        <button className="btn btn--primary btn--lg" onClick={() => reset()}>
          Попробовать снова
        </button>
      </div>
    </section>
  );
}

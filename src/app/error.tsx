"use client";

import { useEffect, useState } from "react";
import { pick, type Lang } from "@/lib/lang";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Страница клиентская, серверный getLang() здесь недоступен.
  // Берём язык из <html lang>, который проставляет layout.
  const [lang, setLang] = useState<Lang>("ru");
  useEffect(() => {
    setLang(document.documentElement.lang === "kz" ? "kz" : "ru");
  }, []);

  return (
    <section className="section">
      <div className="wrap" style={{ textAlign: "center", maxWidth: 640, paddingTop: 40 }}>
        <div className="eyebrow">{pick(lang, "Ошибка", "Қате")}</div>
        <h1 style={{ fontSize: 40, margin: "12px 0 14px" }}>
          {pick(lang, "Что-то пошло не так", "Бірдеңе дұрыс болмады")}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 18, marginBottom: 28 }}>
          {pick(
            lang,
            "Попробуйте ещё раз. Если не помогает — обновите страницу или зайдите чуть позже.",
            "Қайталап көріңіз. Көмектеспесе — бетті жаңартыңыз немесе сәл кейінірек кіріңіз.",
          )}
        </p>
        <button className="btn btn--primary btn--lg" onClick={() => reset()}>
          {pick(lang, "Попробовать снова", "Қайта көру")}
        </button>
      </div>
    </section>
  );
}

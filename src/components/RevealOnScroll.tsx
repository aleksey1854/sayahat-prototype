"use client";

import { useEffect } from "react";

// Появление секций при скролле для СТАТИЧЕСКИХ страниц (магазин).
// Навешивает reveal--in на .reveal по классу. Контент здесь не ре-рендерится,
// поэтому класс не слетит (в отличие от каталога с фильтрацией — там React-Set).
// Скрытое состояние живёт в CSS (html.js .reveal); без JS секции видны.
export function RevealOnScroll() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal:not(.reveal--in)"),
    );
    if (!els.length) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typeof IntersectionObserver === "undefined" || reduce) {
      els.forEach((el) => el.classList.add("reveal--in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("reveal--in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}

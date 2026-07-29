"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Всплывающий баннер на главной.
 *
 * Показывается один раз за визит. Ключ в sessionStorage, а не в
 * localStorage: закрыл вкладку, пришёл завтра — увидит снова. Внутри
 * визита не повторяется, переход «главная → магазин → главная» экран
 * не закрывает.
 *
 * Картинки пока нет. Когда придёт от дизайнера — положить в public
 * и вписать путь в IMAGE. До тех пор на её месте рисуется рамка
 * с нужным размером: так видно, подо что делается макет.
 */
const KEY = "sayahat-promo-seen";
const DELAY = 900;

// Путь к баннеру. Пусто — на его месте рамка с размером.
const IMAGE = "";

// Что просить у дизайнера. Показывается прямо в рамке, чтобы размер
// не приходилось искать в переписке.
const IMAGE_SPEC = "1080 × 1080";

export function PromoModal({
  title,
  text,
  action,
  href,
}: {
  title: string;
  text: string;
  action: string;
  href: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {
      // приватный режим может запретить доступ — тогда просто показываем
    }
    if (seen) return;

    // Задержка: окно поверх ещё не отрисованной страницы выглядит
    // как ошибка загрузки.
    const t = setTimeout(() => setOpen(true), DELAY);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* пусто */
    }
  };

  // Esc закрывает, прокрутка под окном блокируется: иначе страница
  // едет под пальцем на телефоне.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="promo" role="dialog" aria-modal="true" aria-labelledby="promo-title" onClick={close}>
      {/* Клик по самому окну не закрывает: останавливаем всплытие здесь,
          а не вешаем обработчик на подложку. */}
      <div className="promo__box" onClick={(e) => e.stopPropagation()}>
        <button className="promo__x" type="button" onClick={close} aria-label="Закрыть">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="promo__art">
          {IMAGE ? (
            <img className="promo__img" src={IMAGE} alt="" />
          ) : (
            <div className="promo__ph" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="8.5" cy="9.5" r="1.6" />
                <path d="M3.5 17l4.8-4.6a2 2 0 0 1 2.7 0l3 2.8a2 2 0 0 0 2.7 0l2-1.8" />
              </svg>
              <b>Место под баннер</b>
              <span>{IMAGE_SPEC}</span>
            </div>
          )}
        </div>

        <div className="promo__body">
          <h2 id="promo-title">{title}</h2>
          <p>{text}</p>
          <Link className="btn btn--accent btn--lg promo__cta" href={href} onClick={close}>
            {action}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

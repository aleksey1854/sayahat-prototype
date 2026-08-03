"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Всплывающий баннер на главной.
 *
 * Классы начинаются с pmodal, а не promo: класс .promo в проекте уже занят
 * терракотовым блоком на главной. Он задаёт color: #fff и border-radius,
 * и модал молча получал белый текст на кремовом фоне и скруглённые углы
 * у затемнения, сквозь которые была видна страница.
 *
 * Закрыл крестиком — не показывается три дня, потом появляется снова.
 * Дата закрытия в localStorage, поэтому пауза переживает закрытие браузера.
 * Внутри визита окно тоже не повторяется: переход «главная → магазин →
 * главная» экран не закрывает.
 */
const KEY = "sayahat-promo-closed";
// Сколько не показывать после закрытия. Три дня: чаще раздражает,
// реже — про акцию забудут.
const PAUSE_DAYS = 3;
const DELAY = 900;

/**
 * Путь к баннеру. Пусто — на его месте рамка с размером.
 *
 * Имя с версией намеренно: файл лежит в public и отдаётся через nginx
 * хостера, а тот может держать его в кеше. Меняя картинку, меняем имя —
 * это надёжнее любых заголовков, до которых у нас нет доступа.
 *
 * В v2 логотип выровнен по центру (в первом файле он был сдвинут вправо
 * на 19px из 1080) и поле вокруг него уменьшено, чтобы рисунок не терялся
 * на телефоне.
 */
const IMAGE = "/promo-banner-v2.webp";

// Что просить у дизайнера: вертикальный кадр 4:5. Показывается прямо
// в рамке, чтобы размер не искали в переписке.
const IMAGE_SPEC = "1080 × 1350";

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
    let paused = false;
    try {
      const closedAt = Number(localStorage.getItem(KEY));
      if (closedAt) {
        const days = (Date.now() - closedAt) / 86400000;
        paused = days < PAUSE_DAYS;
      }
    } catch {
      // приватный режим может запретить доступ — тогда просто показываем
    }
    if (paused) return;

    // Задержка: окно поверх ещё не отрисованной страницы выглядит
    // как ошибка загрузки.
    const t = setTimeout(() => setOpen(true), DELAY);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      // Пишем момент закрытия, а не флаг: от него считается пауза.
      localStorage.setItem(KEY, String(Date.now()));
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

    // Блокируем прокрутку под окном, иначе на телефоне страница едет
    // под пальцем. Но overflow: hidden убирает полосу прокрутки, а вместе
    // с ней страница становится шире на её ширину — всё содержимое
    // прыгает вбок при открытии и обратно при закрытии. Возвращаем эту
    // ширину отступом, тогда смещения нет.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="pmodal" role="dialog" aria-modal="true" aria-labelledby="pmodal-title" onClick={close}>
      {/* Клик по самому окну не закрывает: останавливаем всплытие здесь,
          а не вешаем обработчик на подложку. */}
      <div className="pmodal__box" onClick={(e) => e.stopPropagation()}>
        <button className="pmodal__x" type="button" onClick={close} aria-label="Закрыть">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="pmodal__art">
          {IMAGE ? (
            <img className="pmodal__img" src={IMAGE} alt="" />
          ) : (
            <div className="pmodal__ph" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="8.5" cy="9.5" r="1.6" />
                <path d="M3.5 17l4.8-4.6a2 2 0 0 1 2.7 0l3 2.8a2 2 0 0 0 2.7 0l2-1.8" />
              </svg>
              <b>Место под баннер</b>
              <span>{IMAGE_SPEC}</span>
            </div>
          )}
        </div>

        <div className="pmodal__body">
          {/* Плашка сидит на стыке картинки и текста и держит два блока
              вместе: без неё они читаются как две отдельные карточки. */}
          <span className="pmodal__badge">Рынок «Саяхат»</span>
          <h2 id="pmodal-title">{title}</h2>
          <p>{text}</p>
          <Link className="btn btn--accent btn--lg pmodal__cta" href={href} onClick={close}>
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

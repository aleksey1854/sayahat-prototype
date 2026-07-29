"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Всплывающий баннер на главной.
 *
 * Показывается один раз за визит. Ключ лежит в sessionStorage, а не
 * в localStorage: закрыл вкладку, пришёл завтра — увидит снова. Если
 * бы ключ жил вечно, человек увидел бы баннер один раз в жизни, и вся
 * затея потеряла бы смысл.
 *
 * Внутри визита баннер не повторяется: переход на страницу магазина
 * и обратно на главную не должен снова закрывать экран.
 *
 * Картинки пока нет. Когда придёт от дизайнера, положить её в public
 * и вписать путь в IMAGE — вёрстка под неё уже готова.
 */
const KEY = "sayahat-promo-seen";
const DELAY = 900;

// Путь к картинке. Пусто — баннер показывается текстом.
const IMAGE = "";

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

    // Небольшая задержка: баннер поверх ещё не отрисованной страницы
    // выглядит как ошибка загрузки.
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

  // Esc закрывает, а прокрутка под окном блокируется: иначе страница
  // едет под пальцем на телефоне, пока окно открыто.
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
      {/* Клик по самому окну не должен его закрывать, поэтому всплытие
          останавливаем здесь, а не вешаем обработчик на подложку. */}
      <div className="promo__box" onClick={(e) => e.stopPropagation()}>
        <button className="promo__x" type="button" onClick={close} aria-label="Закрыть">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {IMAGE && <img className="promo__img" src={IMAGE} alt="" />}

        <div className="promo__body">
          <h2 id="promo-title">{title}</h2>
          <p>{text}</p>
          <Link className="btn btn--primary btn--lg" href={href} onClick={close}>
            {action}
          </Link>
        </div>
      </div>
    </div>
  );
}

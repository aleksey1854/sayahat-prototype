/**
 * Иконки для кнопок админки. Один стиль на все: контур 24×24, толщина 2,
 * скруглённые концы — как у иконок категорий, чтобы панель не выглядела
 * собранной из разных наборов.
 *
 * Подписи у кнопок остаются: иконка без слова заставляет угадывать,
 * а тут действия необратимые.
 */
const S = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" {...S} aria-hidden="true">
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="M14.5 5.5l3 3" />
    </svg>
  );
}

export function IconEye() {
  return (
    <svg viewBox="0 0 24 24" {...S} aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconHide() {
  return (
    <svg viewBox="0 0 24 24" {...S} aria-hidden="true">
      <path d="M4 4l16 16" />
      <path d="M9.6 5.9A9.4 9.4 0 0 1 12 5.6c6 0 9.5 6.4 9.5 6.4a17 17 0 0 1-2.6 3.4M6.7 7.6A17 17 0 0 0 2.5 12s3.5 6.4 9.5 6.4c1 0 1.9-.2 2.7-.5" />
    </svg>
  );
}

export function IconShow() {
  return (
    <svg viewBox="0 0 24 24" {...S} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconTag() {
  return (
    <svg viewBox="0 0 24 24" {...S} aria-hidden="true">
      <path d="M20.5 13.3 13.3 20.5a1.7 1.7 0 0 1-2.4 0l-7.4-7.4V3.5h9.6l7.4 7.4a1.7 1.7 0 0 1 0 2.4z" />
      <circle cx="7.6" cy="7.6" r="1.4" />
    </svg>
  );
}

export function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" {...S} aria-hidden="true">
      <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.9 12.1a1.6 1.6 0 0 0 1.6 1.4h6a1.6 1.6 0 0 0 1.6-1.4L17.5 7" />
      <path d="M10.5 11v6M13.5 11v6" />
    </svg>
  );
}

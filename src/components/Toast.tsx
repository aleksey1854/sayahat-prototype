"use client";

import { useEffect, useState } from "react";

/**
 * Уведомление о результате действия. Всплывает поверх страницы, а не
 * появляется в потоке сверху.
 *
 * Причина: сохранение делается серверным действием с редиректом, то есть
 * страница перезагружается. Плашка в начале содержимого при этом оказывалась
 * выше области просмотра — человек нажимал «Сохранить» в конце длинной формы
 * и не видел никакого подтверждения. Отсюда ощущение, что ничего
 * не произошло.
 *
 * Успех гаснет сам через три секунды: он не требует действий, а висящая
 * плашка мешает работать. Ошибка остаётся до закрытия — её надо прочитать,
 * и обычно она требует что-то исправить.
 *
 * Адрес чистим через history.replaceState: результат приезжает в строке
 * запроса, и без этого при обновлении страницы уведомление всплывало бы
 * снова, хотя ничего не сохранялось. replaceState не перерисовывает
 * страницу, поэтому уведомление остаётся на экране, пока его читают.
 */
export function Toast({
  kind,
  children,
  param = "ok",
}: {
  kind: "ok" | "err";
  children: React.ReactNode;
  /** Какой параметр убрать из адреса после показа. */
  param?: string | string[];
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    const list = Array.isArray(param) ? param : [param];
    let touched = false;
    for (const p of list) {
      if (url.searchParams.has(p)) {
        url.searchParams.delete(p);
        touched = true;
      }
    }
    if (touched) {
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }, [param]);

  useEffect(() => {
    if (kind !== "ok") return;
    const t = setTimeout(() => setOpen(false), 3000);
    return () => clearTimeout(t);
  }, [kind]);

  if (!open) return null;

  return (
    <div className={`toast toast--${kind}`} role="status" aria-live="polite">
      <span className="toast__ico" aria-hidden="true">
        {kind === "ok" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
            <path d="M12 8v5M12 16.5v.5" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        )}
      </span>

      <span className="toast__txt">{children}</span>

      <button className="toast__x" type="button" onClick={() => setOpen(false)} aria-label="Закрыть">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

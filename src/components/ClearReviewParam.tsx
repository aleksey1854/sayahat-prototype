"use client";

import { useEffect } from "react";

/**
 * Убирает ?review=... из адреса после того, как плашка показана.
 *
 * Результат отправки формы приезжает в строке запроса — значит остаётся
 * в адресе, и после перезагрузки плашка появляется снова, хотя ничего
 * не отправлялось.
 *
 * Правим адрес через history.replaceState, а не через router.replace:
 * replaceState меняет строку в браузере и не перерисовывает страницу,
 * поэтому плашка остаётся на экране, пока человек её читает. router.replace
 * вызвал бы перерисовку, и сообщение мигнуло бы и исчезло.
 */
export function ClearReviewParam() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("review")) return;
    url.searchParams.delete("review");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);
  return null;
}

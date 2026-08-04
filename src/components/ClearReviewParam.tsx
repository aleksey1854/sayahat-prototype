"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/track";

/**
 * Убирает ?review=... из адреса после того, как плашка показана,
 * и заодно засчитывает отправленный отзыв.
 *
 * Результат отправки формы приезжает в строке запроса — значит остаётся
 * в адресе, и после перезагрузки плашка появляется снова, хотя ничего
 * не отправлялось.
 *
 * Правим адрес через history.replaceState, а не через router.replace:
 * replaceState меняет строку в браузере и не перерисовывает страницу,
 * поэтому плашка остаётся на экране, пока человек её читает. router.replace
 * вызвал бы перерисовку, и сообщение мигнуло бы и исчезло.
 *
 * Цель шлём именно отсюда, а не по клику на кнопку. Форма отзыва —
 * серверное действие, кнопка не ссылка, и общий трекер её не видит.
 * К тому же клик по «Отправить» ещё ничего не значит: ловушка, лимит по
 * IP и минимальная длина отсеивают часть отправок. review=ok приходит
 * только после того, как отзыв принят и лёг на модерацию, — считать
 * стоит именно это.
 */
export function ClearReviewParam() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get("review");
    if (result === null) return;

    if (result === "ok") {
      const shop = url.pathname.match(/^\/shop\/([^/?#]+)/)?.[1];
      trackEvent("review_submit", shop ? { shop } : undefined);
    }

    url.searchParams.delete("review");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);
  return null;
}

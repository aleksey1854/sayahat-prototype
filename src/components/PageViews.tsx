"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/track";

const SKIP = ["/admin", "/cabinet", "/login"];

/**
 * Отправляет просмотр страницы — и первый, и все последующие.
 *
 * Счётчики настроены не слать просмотры самостоятельно (`defer: true` у
 * Метрики, `send_page_view: false` у GA4), поэтому здесь единственное
 * место, откуда они уходят. Пропускать первый не нужно и нельзя.
 *
 * Вызовы, сделанные до загрузки tag.js, не теряются: заглушка `ym`
 * ставится синхронно и складывает их в очередь.
 *
 * Берём только usePathname, без useSearchParams. Второй в App Router
 * требует обёртки в Suspense, иначе страница уходит в клиентский рендер —
 * ради строки запроса это слишком дорого. Строку читаем из window
 * в момент отправки, результат тот же.
 */
export function PageViews() {
  const pathname = usePathname();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    // Служебные разделы в статистику не идут. Операторы работают с
    // админкой каждый день, и без этого их переходы смешались бы с
    // покупательскими — на рынке с десятками визитов в сутки это не
    // погрешность, а половина данных.
    //
    // Работает только потому, что счётчики настроены не слать просмотры
    // сами: нет вызова — нет визита. Клики по контактам внутри админки
    // тоже не в счёт: без визита цели не к чему привязать.
    if (SKIP.some((p) => pathname?.startsWith(p))) return;

    // Заголовок Next проставляет чуть позже смены адреса, а Метрика
    // читает document.title сама в момент вызова. Отдаём кадр на
    // отрисовку, иначе в отчёт попадёт заголовок предыдущей страницы.
    const id = window.setTimeout(() => {
      const url = window.location.href;
      // На первом просмотре referer не передаём: Метрика возьмёт
      // настоящий внешний источник перехода из document.referrer.
      trackPageView(url, prev.current ?? undefined);
      prev.current = url;
    }, 0);

    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}

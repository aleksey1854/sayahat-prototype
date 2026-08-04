"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/track";

/**
 * Какую цель засчитать по клику на ссылку.
 *
 * data-goal перебивает разбор адреса: телефон аренды — тот же tel:, что
 * и телефон магазина, но воронка у него другая. Виктору важно видеть
 * заявки на аренду отдельно от звонков покупателей в точки.
 */
function goalFor(a: HTMLAnchorElement): string | null {
  if (a.dataset.goal) return a.dataset.goal;
  const href = a.href;
  if (href.startsWith("tel:")) return "call_click";
  if (href.includes("wa.me/")) return "whatsapp_click";
  if (href.includes("kaspi.kz")) return "kaspi_click";
  return null;
}

/**
 * Считает клики по контактам на всём сайте.
 *
 * Раньше висел только на странице магазина, и всё, что происходило на
 * главной, в счётчики не попадало — включая телефон аренды в подвале,
 * который есть на каждой странице. Теперь смонтирован один раз в layout.
 *
 * Магазин определяем по адресу, а не пропсом: экземпляр один на всё
 * приложение, передать ему параметр со страницы больше некому. Заодно
 * ушёл риск двойного счёта от двух смонтированных трекеров.
 */
export function GoalTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const shop = pathname?.match(/^\/shop\/([^/?#]+)/)?.[1];

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const goal = goalFor(a);
      if (!goal) return;
      trackEvent(goal, shop ? { shop } : undefined);
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [pathname]);

  return null;
}

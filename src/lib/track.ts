// Единая отправка событий в Метрику (reachGoal) и GA4. Без счётчиков молчит.
declare global {
  interface Window {
    ym?: (id: number, action: string, arg?: string, params?: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

const YM_ID = Number(process.env.NEXT_PUBLIC_YM_ID || 0);

/**
 * Просмотр страницы при переходе внутри сайта.
 *
 * Next.js меняет страницу без перезагрузки, поэтому код счётчика
 * отрабатывает ровно один раз — при первом заходе. Все дальнейшие
 * переходы (каталог → магазин → обратно) без этого вызова не считаются
 * ни в Метрике, ни в GA4: отчёт по страницам оказался бы почти пустым,
 * а отказы — завышенными.
 *
 * Первый просмотр отсюда не шлём, его уже посчитала инициализация.
 */
export function trackPageView(url: string, referrer?: string) {
  if (typeof window === "undefined") return;
  if (YM_ID && typeof window.ym === "function") {
    window.ym(YM_ID, "hit", url, referrer ? { referer: referrer } : undefined);
  }
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_location: url,
      page_title: document.title,
    });
  }
}

export function trackEvent(goal: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (YM_ID && typeof window.ym === "function") {
    window.ym(YM_ID, "reachGoal", goal, params);
  }
  if (typeof window.gtag === "function") {
    window.gtag("event", goal, { ...(params ?? {}), transport_type: "beacon" });
  }
}

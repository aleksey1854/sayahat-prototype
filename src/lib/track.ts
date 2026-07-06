// Единая отправка событий в Метрику (reachGoal) и GA4. Без счётчиков молчит.
declare global {
  interface Window {
    ym?: (id: number, action: string, goal: string, params?: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

const YM_ID = Number(process.env.NEXT_PUBLIC_YM_ID || 0);

export function trackEvent(goal: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (YM_ID && typeof window.ym === "function") {
    window.ym(YM_ID, "reachGoal", goal, params);
  }
  if (typeof window.gtag === "function") {
    window.gtag("event", goal, { ...(params ?? {}), transport_type: "beacon" });
  }
}

// Чистые функции языка — без next/headers, поэтому доступны и клиентским
// компонентам (например error.tsx). Серверный getLang живёт в i18n.ts.
export type Lang = "ru" | "kz";

export function pick(lang: Lang, ru: string, kz?: string | null): string {
  if (lang === "kz" && kz) return kz;
  return ru;
}

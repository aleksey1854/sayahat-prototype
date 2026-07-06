import { cookies } from "next/headers";

export type Lang = "ru" | "kz";

export function getLang(): Lang {
  const value = cookies().get("lang")?.value;
  return value === "kz" ? "kz" : "ru";
}

export function pick(lang: Lang, ru: string, kz?: string | null): string {
  if (lang === "kz" && kz) return kz;
  return ru;
}

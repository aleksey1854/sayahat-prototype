"use client";

import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

export function LangToggle({ lang }: { lang: Lang }) {
  const router = useRouter();

  function set(next: Lang) {
    if (next === lang) return;
    document.cookie = `lang=${next};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="lang" style={{ marginLeft: "auto" }}>
      <button className={lang === "ru" ? "on" : undefined} onClick={() => set("ru")}>
        РУС
      </button>
      <button className={lang === "kz" ? "on" : undefined} onClick={() => set("kz")}>
        ҚАЗ
      </button>
    </div>
  );
}

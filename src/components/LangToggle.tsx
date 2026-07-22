"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

export function LangToggle({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Переключение языка — серверный ре-рендер (router.refresh), и на главной он
  // не мгновенный: страница тянет каталог из базы. Поэтому подсвечиваем кнопку
  // сразу, не дожидаясь ответа, а когда придёт новый lang — синхронизируемся.
  const [shown, setShown] = useState<Lang>(lang);

  useEffect(() => setShown(lang), [lang]);

  function set(next: Lang) {
    if (next === shown) return;
    setShown(next);
    document.cookie = `lang=${next};path=/;max-age=31536000`;
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className={`lang${pending ? " lang--pending" : ""}`} data-active={shown}>
        <span className="lang__pill" aria-hidden="true" />
        <button
          className={shown === "ru" ? "on" : undefined}
          onClick={() => set("ru")}
          aria-pressed={shown === "ru"}
          lang="ru"
        >
          РУС
        </button>
        <button
          className={shown === "kz" ? "on" : undefined}
          onClick={() => set("kz")}
          aria-pressed={shown === "kz"}
          lang="kk"
        >
          ҚАЗ
        </button>
      </div>

      {/* Компактный переключатель для телефона: короткие метки РУ / ҚЗ с едущей
          пилюлей — как на десктопе, но уже. Отдельный блок, а не спрятанный
          внутри .lang, чтобы не наследовать его размеры. */}
      <div className={`lang-mini${pending ? " is-pending" : ""}`} data-active={shown}>
        <span className="lang-mini__pill" aria-hidden="true" />
        <button
          className={shown === "ru" ? "on" : undefined}
          onClick={() => set("ru")}
          aria-pressed={shown === "ru"}
          aria-label="Русский"
          lang="ru"
        >
          РУ
        </button>
        <button
          className={shown === "kz" ? "on" : undefined}
          onClick={() => set("kz")}
          aria-pressed={shown === "kz"}
          aria-label="Қазақша"
          lang="kk"
        >
          ҚЗ
        </button>
      </div>
    </>
  );
}

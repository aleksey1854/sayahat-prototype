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

      {/* Отдельная кнопка, а не спрятанная внутри .lang: там она наследовала
          min-width и padding от общих правил переключателя и не помещалась
          в контейнер — текст уезжал вбок. Здесь у неё свои размеры. */}
      <button
        className={`lang-mini${pending ? " is-pending" : ""}`}
        onClick={() => set(shown === "ru" ? "kz" : "ru")}
        aria-label={shown === "ru" ? "Тілді ауыстыру: қазақша" : "Сменить язык: русский"}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3.3 9h17.4M3.3 15h17.4" />
          <path d="M12 3.2c2.4 2.6 2.4 15 0 17.6M12 3.2c-2.4 2.6-2.4 15 0 17.6" />
        </svg>
        <span>{shown === "ru" ? "РУС" : "ҚАЗ"}</span>
      </button>
    </>
  );
}

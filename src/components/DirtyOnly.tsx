"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Показывает содержимое только тогда, когда в форме что-то изменили.
 * Вернули значение обратно — снова прячет.
 *
 * Подход тот же, что у Shopify: поля неуправляемые, с defaultValue, а
 * изменения ловятся сравнением снимков формы. Ничего не дублируем
 * в состоянии — сравниваем то, что реально уйдёт на сервер.
 *
 * Две ловушки, из-за которых такие панели обычно врут:
 *
 * Первая — снимок, снятый слишком рано. Браузер восстанавливает значения
 * полей после возврата назад и подставляет автозаполнение уже после
 * отрисовки. Если снять снимок сразу, он окажется пустым, и панель
 * всплывёт на простой перезагрузке, хотя никто ничего не трогал. Поэтому
 * снимаем после кадра отрисовки и повторяем ещё раз чуть позже.
 *
 * Вторая — порядок полей. FormData обходит их в порядке разметки, он
 * стабилен, но значения надо разделять символом, который не встретится
 * в тексте, иначе «аб|в» и «аб|в» из разных полей дадут одинаковую
 * строку при разном содержимом.
 */
const SEP = "\u0000";

function snapshot(form: HTMLFormElement): string {
  const fd = new FormData(form);
  const parts: string[] = [];
  for (const [k, v] of fd.entries()) {
    // Файлы не сравниваем: их значение нельзя прочитать синхронно,
    // да и загрузка фотографий в кабинете идёт отдельными формами.
    if (typeof v !== "string") continue;
    parts.push(k, v);
  }
  return parts.join(SEP);
}

export function DirtyOnly({ children }: { children: React.ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const initial = useRef<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;

    const check = () => {
      if (initial.current === null) return;
      setDirty(snapshot(form) !== initial.current);
    };

    // Снимок после кадра отрисовки, затем ещё раз — на случай позднего
    // автозаполнения браузером.
    const take = () => {
      initial.current = snapshot(form);
      setDirty(false);
    };
    const raf = requestAnimationFrame(take);
    const late = setTimeout(take, 350);

    form.addEventListener("input", check);
    form.addEventListener("change", check);

    // Отправка формы — это уже не «несохранённое», иначе браузер спросит
    // про потерю данных ровно в момент сохранения.
    const onSubmit = () => setDirty(false);
    form.addEventListener("submit", onSubmit);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(late);
      form.removeEventListener("input", check);
      form.removeEventListener("change", check);
      form.removeEventListener("submit", onSubmit);
    };
  }, []);

  // Предупреждение при уходе со страницы с несохранённым. Оператор
  // заполняет длинную форму, и случайно закрытая вкладка стоит дорого.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <>
      <span ref={anchor} hidden aria-hidden="true" />
      {dirty && children}
    </>
  );
}

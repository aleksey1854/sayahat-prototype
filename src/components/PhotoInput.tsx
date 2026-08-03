"use client";

import { useRef, useState } from "react";
import { ratioLabel, photoAdvice, type PhotoKind } from "@/lib/imageMeta";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Ниже этого порога файл уходит как есть: повторное сжатие ради
 * двухсот килобайт только портит картинку.
 *
 * Порог низкий намеренно. Стандартный лимит тела запроса у nginx —
 * 1 МБ, и в этот мегабайт кроме файла попадают остальные поля формы и
 * служебная обвязка multipart. 600 КБ оставляют запас.
 */
const PASS_THROUGH_UNDER = 600 * 1024;

/**
 * Ровно столько же делает сервер, так что качество ничего не теряет,
 * а вес падает с мегабайтов до сотен килобайт.
 */
const MAX_SIDE = 1600;
const QUALITY = 0.88;

const HINTS: Record<PhotoKind, string> = {
  cover: "Горизонтальное, лучше 1600×1200 (4:3). Снимок прямо с телефона подойдёт — уменьшим сами.",
  product: "От 800 px по меньшей стороне, формат любой — квадрат ляжет идеально.",
  logo: "Квадратный файл от 400×400. Подойдёт аватарка из Instagram.",
};

type Info = {
  url: string;
  w: number;
  h: number;
  bytes: number;
  wasBytes: number | null;
  warnings: string[];
};

function looksHeic(file: File): boolean {
  const lower = file.name.toLowerCase();
  return file.type.includes("hei") || lower.endsWith(".heic") || lower.endsWith(".heif");
}

// Декодируем через <img>, а не createImageBitmap: у <img> шире охват
// браузеров, и главное — Safari на iPhone умеет так открывать HEIC,
// а через ImageBitmap не везде.
function decode(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob | null> {
  return new Promise((r) => canvas.toBlob(r, type, q));
}

/**
 * Уменьшает и перекодирует картинку прямо в браузере.
 *
 * Зачем: телефон отдаёт снимок на 3–6 МБ, а между посетителем и
 * приложением стоит nginx хостера со стандартным лимитом тела запроса
 * в 1 МБ. Такой запрос до сервера не доходит вовсе — оператор жмёт
 * «Сохранить», и ничего не происходит. После сжатия файл весит
 * 300–600 КБ и проходит через любой прокси.
 *
 * Побочная польза: HEIC с айфона превращается в обычный JPEG. Sharp
 * на сервере HEIC не читает, а браузер Safari — читает, и через холст
 * формат теряется сам собой.
 *
 * Поворот по EXIF браузер применяет при отрисовке, а на холст попадает
 * уже повёрнутая картинка без метаданных. Поэтому .rotate() на сервере
 * после этого просто ничего не делает — двойного поворота не будет.
 */
async function shrink(file: File, img: HTMLImageElement): Promise<File | null> {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return null;

  const k = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * k);
  canvas.height = Math.round(h * k);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Если webp не поддерживается, toBlob молча отдаёт PNG — а он тяжелее
  // исходника. Поэтому проверяем тип и откатываемся на JPEG.
  let blob = await toBlob(canvas, "image/webp", QUALITY);
  let ext = "webp";
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob(canvas, "image/jpeg", QUALITY);
    ext = "jpg";
  }
  if (!blob) return null;

  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.${ext}`, { type: blob.type, lastModified: Date.now() });
}

// Подменяем файл в самом поле, чтобы форма отправила уже сжатый.
function putBack(input: HTMLInputElement, file: File): boolean {
  try {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    return true;
  } catch {
    return false;
  }
}

// Поле выбора фото с живым предпросмотром: рамка показывает, как фото
// обрежется на карточке; рядом — размеры, соотношение и предупреждения.
export function PhotoInput({
  name,
  kind,
  label,
  required,
}: {
  name: string;
  kind: PhotoKind;
  label: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lockedRef = useRef<HTMLButtonElement[]>([]);
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function clearInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  /**
   * Пока идёт сжатие, кнопки отправки этой же формы блокируются: иначе
   * можно успеть нажать «Сохранить» и отправить исходный тяжёлый файл.
   * Запоминаем только те кнопки, которые выключили сами, — остальные
   * могут быть выключены по своей логике (панель сохранения, DirtyOnly),
   * и включать их обратно нельзя.
   */
  function lockForm(on: boolean) {
    const form = inputRef.current?.form;
    if (!form) return;
    if (on) {
      const btns = Array.from(
        form.querySelectorAll<HTMLButtonElement>("button[type='submit']"),
      ).filter((b) => !b.disabled);
      btns.forEach((b) => (b.disabled = true));
      lockedRef.current = btns;
    } else {
      lockedRef.current.forEach((b) => (b.disabled = false));
      lockedRef.current = [];
    }
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (info) URL.revokeObjectURL(info.url);
    setInfo(null);
    setError(null);
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setError(
        `Файл ${(file.size / 1024 / 1024).toFixed(1)} МБ — больше лимита 8 МБ. Выберите другое фото.`,
      );
      clearInput();
      return;
    }
    if (!file.type.startsWith("image/") && !looksHeic(file)) {
      setError("Это не изображение. Нужен JPG, PNG или WebP.");
      clearInput();
      return;
    }

    setBusy(true);
    lockForm(true);
    try {
      let decoded: { img: HTMLImageElement; url: string };
      try {
        decoded = await decode(file);
      } catch {
        setError(
          looksHeic(file)
            ? "Это HEIC — формат камеры iPhone, и открыть его не удалось. Быстрое решение: отправьте фото себе в WhatsApp и сохраните оттуда (станет JPG). Навсегда: Настройки → Камера → Форматы → «Наиболее совместимые»."
            : "Не удалось прочитать файл — похоже, он повреждён.",
        );
        clearInput();
        return;
      }

      // HEIC пережимаем всегда, даже мелкий: сервер его не примет.
      const heic = looksHeic(file);
      const needShrink =
        heic ||
        file.size > PASS_THROUGH_UNDER ||
        Math.max(decoded.img.naturalWidth, decoded.img.naturalHeight) > MAX_SIDE;

      let finalFile = file;
      let replaced = false;
      if (needShrink) {
        const small = await shrink(file, decoded.img);
        if (small && inputRef.current && putBack(inputRef.current, small)) {
          finalFile = small;
          replaced = true;
        } else if (heic) {
          setError(
            "Не удалось преобразовать HEIC в этом браузере. Отправьте фото себе в WhatsApp и сохраните оттуда — получится JPG.",
          );
          URL.revokeObjectURL(decoded.url);
          clearInput();
          return;
        }
      }

      // Предпросмотр показываем по тому файлу, который реально уйдёт.
      let url = decoded.url;
      let w = decoded.img.naturalWidth;
      let h = decoded.img.naturalHeight;
      if (replaced) {
        URL.revokeObjectURL(decoded.url);
        const again = await decode(finalFile);
        url = again.url;
        w = again.img.naturalWidth;
        h = again.img.naturalHeight;
      }

      setInfo({
        url,
        w,
        h,
        bytes: finalFile.size,
        wasBytes: replaced ? file.size : null,
        warnings: photoAdvice(kind, w, h),
      });
    } finally {
      setBusy(false);
      lockForm(false);
    }
  }

  const sizeOf = (b: number) =>
    b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} МБ` : `${Math.round(b / 1024)} КБ`;

  return (
    <div className="field">
      <label>{label}</label>
      <input
        ref={inputRef}
        className="input"
        type="file"
        name={name}
        accept="image/*"
        required={required}
        onChange={onChange}
      />
      <div className="photo-hint">{HINTS[kind]}</div>
      {busy && <div className="photo-msg photo-msg--busy">Готовлю фото…</div>}
      {error && <div className="photo-msg photo-msg--err">{error}</div>}
      {info && (
        <div className="photo-preview-row">
          <div className="photo-frame">
            <img src={info.url} alt="" />
          </div>
          <div className="photo-facts">
            <b>
              {info.w}×{info.h} · {ratioLabel(info.w, info.h)} · {sizeOf(info.bytes)}
            </b>
            {info.wasBytes && (
              <div className="photo-msg photo-msg--ok">
                Уменьшено в браузере: {sizeOf(info.wasBytes)} → {sizeOf(info.bytes)}. Так фото
                доходит даже на слабой связи.
              </div>
            )}
            {info.warnings.map((w, i) => (
              <div className="photo-msg photo-msg--warn" key={i}>
                {w}
              </div>
            ))}
            {info.warnings.length === 0 && !info.wasBytes && (
              <div className="photo-msg photo-msg--ok">
                Отличное фото. В рамке слева — как оно ляжет на карточку.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

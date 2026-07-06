"use client";

import { useRef, useState } from "react";
import { ratioLabel, photoAdvice, type PhotoKind } from "@/lib/imageMeta";

const MAX_BYTES = 8 * 1024 * 1024;

const HINTS: Record<PhotoKind, string> = {
  cover: "Горизонтальное, лучше 1600×1200 (4:3). До 8 МБ — сожмём сами.",
  product: "От 800 px по меньшей стороне, формат любой — квадрат ляжет идеально. До 8 МБ.",
};

type Info = { url: string; w: number; h: number; bytes: number; warnings: string[] };

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
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);

  function clearInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (info) URL.revokeObjectURL(info.url);
    setInfo(null);
    setError(null);
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (file.type.includes("hei") || lower.endsWith(".heic") || lower.endsWith(".heif")) {
      setError(
        "Это HEIC — формат камеры iPhone, сайт его не примет. Быстрое решение: отправьте фото себе в WhatsApp и сохраните оттуда (станет JPG). Навсегда: Настройки → Камера → Форматы → «Наиболее совместимые».",
      );
      clearInput();
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Это не изображение. Нужен JPG, PNG или WebP.");
      clearInput();
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `Файл ${(file.size / 1024 / 1024).toFixed(1)} МБ — больше лимита 8 МБ. Выберите другое фото или сожмите это.`,
      );
      clearInput();
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setInfo({
        url,
        w: img.naturalWidth,
        h: img.naturalHeight,
        bytes: file.size,
        warnings: photoAdvice(kind, img.naturalWidth, img.naturalHeight),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Не удалось прочитать файл — похоже, он повреждён.");
      clearInput();
    };
    img.src = url;
  }

  const sizeLabel = info
    ? info.bytes >= 1024 * 1024
      ? `${(info.bytes / 1024 / 1024).toFixed(1)} МБ`
      : `${Math.round(info.bytes / 1024)} КБ`
    : "";

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
      {error && <div className="photo-msg photo-msg--err">{error}</div>}
      {info && (
        <div className="photo-preview-row">
          <div className="photo-frame">
            <img src={info.url} alt="" />
          </div>
          <div className="photo-facts">
            <b>
              {info.w}×{info.h} · {ratioLabel(info.w, info.h)} · {sizeLabel}
            </b>
            {info.warnings.map((w, i) => (
              <div className="photo-msg photo-msg--warn" key={i}>
                {w}
              </div>
            ))}
            {info.warnings.length === 0 && (
              <div className="photo-msg photo-msg--ok">
                Отличное фото. В рамке слева — как оно ляжет на карточку; при загрузке сожмётся автоматически.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

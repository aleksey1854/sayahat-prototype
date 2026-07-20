"use client";

import { useState } from "react";
import { CategoryIcon } from "./CategoryIcon";

// Заглушка лежит ПОД картинкой и всегда отрисована. Пока фото грузится или
// если оно не загрузилось — виден силуэт категории вместо пустого места
// и вместо иконки «битое изображение» от браузера.
export function PhotoFallback({ category }: { category: string }) {
  return (
    <span className="ph-fb" aria-hidden="true">
      <CategoryIcon slug={category} />
    </span>
  );
}

type ImgProps = {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
};

// Картинка, которая убирает себя при ошибке загрузки — под ней остаётся
// заглушка. Без этого битое фото показывает системную иконку-«поломку».
export function SafeImg({ src, srcSet, sizes, alt, className, loading = "lazy", decoding = "async" }: ImgProps) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return null;
  return (
    <img
      className={className}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={() => setFailed(true)}
    />
  );
}

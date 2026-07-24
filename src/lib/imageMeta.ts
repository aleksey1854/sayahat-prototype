// Анализ фото на клиенте до загрузки: соотношение сторон и подсказки.
// Чистые функции — покрыты тестами (npm run test:images).

export type PhotoKind = "cover" | "product" | "logo";

const COMMON: [number, number][] = [
  [1, 1], [4, 3], [3, 4], [3, 2], [2, 3], [16, 9], [9, 16], [4, 5], [5, 4], [2, 1], [1, 2],
];

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function ratioLabel(w: number, h: number): string {
  if (w <= 0 || h <= 0) return "?";
  const g = gcd(w, h);
  const a = w / g;
  const b = h / g;
  if (Math.max(a, b) <= 21) return `${a}:${b}`;
  const r = w / h;
  let best = COMMON[0];
  let bestDiff = Infinity;
  for (const [x, y] of COMMON) {
    const d = Math.abs(r - x / y);
    if (d < bestDiff) {
      bestDiff = d;
      best = [x, y];
    }
  }
  return `≈${best[0]}:${best[1]}`;
}

// Предупреждения под конкретное место: обложка магазина или фото товара.
export function photoAdvice(kind: PhotoKind, w: number, h: number): string[] {
  const warnings: string[] = [];
  const r = w / h;
  const label = ratioLabel(w, h);

  if (kind === "cover") {
    if (w < 800) {
      warnings.push(`Ширина всего ${w}px — для обложки будет заметно мыльно. Нужно от 1200.`);
    } else if (w < 1200) {
      warnings.push(`Ширина ${w}px — на грани: может мылить на больших экранах. Лучше от 1200.`);
    }
    if (r < 0.95) {
      warnings.push(`Вертикальное фото (${label}) — обложка горизонтальная, верх и низ обрежутся.`);
    } else if (r < 1.2) {
      warnings.push(`Квадратное (${label}) — допустимо, но горизонтальное 4:3 ляжет лучше.`);
    } else if (r > 2.2) {
      warnings.push(`Панорама (${label}) — по бокам сильно обрежется.`);
    }
  } else if (kind === "logo") {
    // Логотип показывается маленьким квадратом со скруглением: важны
    // квадратность и запас по разрешению, панорамы сюда не годятся.
    const short = Math.min(w, h);
    if (short < 200) {
      warnings.push(`${w}×${h} — меньше 200px сайт не примет. Нужен файл покрупнее.`);
    } else if (short < 400) {
      warnings.push(`${w}×${h} — мелковато, на телефоне будет мыло. Лучше от 400.`);
    }
    if (r < 0.8 || r > 1.25) {
      warnings.push(`${label} — логотип показывается квадратом, края обрежутся. Лучше квадратный файл.`);
    }
  } else {
    const short = Math.min(w, h);
    if (short < 400) {
      warnings.push(`${w}×${h} — слишком мелко, на карточке будет мыло. Нужно от 800 по меньшей стороне.`);
    } else if (short < 800) {
      warnings.push(`${w}×${h} — мелковато: может мылить. Лучше от 800 по меньшей стороне.`);
    }
    if (r < 0.6) {
      warnings.push(`Сильно вытянутое вертикальное (${label}, как сторис) — на карточке останется середина.`);
    } else if (r > 1.9) {
      warnings.push(`Широкая панорама (${label}) — края обрежутся.`);
    }
  }
  return warnings;
}

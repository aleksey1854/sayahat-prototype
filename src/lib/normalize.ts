// Приведение номеров к виду, который понимает wa.me: 7XXXXXXXXXX.
// Чинит типичный ввод: «8 705…», «+7 705…», «705…».
export function normalizeWhatsapp(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (!d) return null;
  if (d.length === 11 && d.startsWith("8")) d = "7" + d.slice(1);
  if (d.length === 10 && d.startsWith("7")) d = "7" + d;
  return d;
}

// Телефон для показа: КЗ-номера приводим к «+7 705 123 45 67», остальное не трогаем.
export function normalizePhone(raw: string): string | null {
  const typed = raw.trim();
  if (!typed) return null;
  let d = typed.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("8")) d = "7" + d.slice(1);
  if (d.length === 10 && d.startsWith("7")) d = "7" + d;
  if (d.length === 11 && d.startsWith("7")) {
    return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
  }
  return typed;
}

// Ссылки от арендаторов: только http/https, «kaspi.kz/…» дополняем схемой,
// javascript: и прочее — отбрасываем.
export function cleanUrl(raw: string): string | null {
  let v = raw.trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

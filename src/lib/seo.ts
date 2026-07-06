// Абсолютный URL для микроразметки: Google требует полные адреса.
export function absUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}

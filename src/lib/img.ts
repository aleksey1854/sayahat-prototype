import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import sharp from "sharp";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type UploadResult = { url: string; bytes: number; width: number; height: number };

// HEIC/HEIF (формат камер iPhone) — sharp его не читает, ловим по сигнатуре
// и отдаём человеку понятную ошибку вместо «что-то пошло не так».
function isHeic(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buf.toString("ascii", 8, 12);
  return ["heic", "heix", "hevc", "heim", "heis", "hevm", "hevs", "mif1", "msf1"].includes(brand);
}

// Принимает файл из формы. Ошибки — кодами: big | heic | small | bad.
// Делает ДВА размера: основной до 1600px и @sm до 640px (для карточек),
// оба webp, поворот по EXIF чинится, метаданные вычищаются.
export async function saveUpload(file: File): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("big");
  const buf = Buffer.from(await file.arrayBuffer());
  if (isHeic(buf)) throw new Error("heic");

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buf).metadata();
  } catch {
    throw new Error("bad");
  }
  const rawW = meta.width ?? 0;
  const rawH = meta.height ?? 0;
  const swapped = (meta.orientation ?? 1) >= 5; // EXIF-поворот на 90°
  const w = swapped ? rawH : rawW;
  const h = swapped ? rawW : rawH;
  if (Math.min(w, h) < 200) throw new Error("small");

  const id = crypto.randomUUID().replace(/-/g, "");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const base = sharp(buf).rotate();
  const main = await base
    .clone()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(path.join(UPLOAD_DIR, `${id}.webp`));
  await base
    .clone()
    .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toFile(path.join(UPLOAD_DIR, `${id}@sm.webp`));

  return { url: `/uploads/${id}.webp`, bytes: main.size, width: main.width, height: main.height };
}

// Тихо удаляет загруженный файл и его @sm-версию (демо-фото не трогает).
export async function removeUpload(publicPath?: string | null) {
  if (!publicPath || !publicPath.startsWith("/uploads/")) return;
  const name = publicPath.slice("/uploads/".length);
  if (!name || name.includes("/") || name.includes("..")) return;
  const targets = [name];
  if (name.endsWith(".webp") && !name.endsWith("@sm.webp")) {
    targets.push(name.replace(/\.webp$/, "@sm.webp"));
  }
  for (const t of targets) {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, t));
    } catch {}
  }
}

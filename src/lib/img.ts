import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import sharp from "sharp";
import { put, del } from "@vercel/blob";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

// Blob (Vercel) в проде, локальный диск в разработке. Определяется наличием токена.
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export type UploadResult = { url: string; bytes: number; width: number; height: number };

// HEIC/HEIF (формат камер iPhone) — sharp его не читает, ловим по сигнатуре.
function isHeic(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buf.toString("ascii", 8, 12);
  return ["heic", "heix", "hevc", "heim", "heis", "hevm", "hevs", "mif1", "msf1"].includes(brand);
}

async function store(key: string, data: Buffer, contentType: string): Promise<string> {
  if (useBlob) {
    const res = await put(key, data, { access: "public", contentType, addRandomSuffix: false });
    return res.url;
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, key), data);
  return `/uploads/${key}`;
}

// Принимает файл из формы. Ошибки — кодами: big | heic | small | bad.
// Делает ДВА размера: основной до 1600px и -sm до 640px (для карточек),
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
  const swapped = (meta.orientation ?? 1) >= 5;
  const w = swapped ? rawH : rawW;
  const h = swapped ? rawW : rawH;
  if (Math.min(w, h) < 200) throw new Error("small");

  const id = crypto.randomUUID().replace(/-/g, "");
  const base = sharp(buf).rotate();

  const [mainBuf, smBuf] = await Promise.all([
    base.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 }).toBuffer({ resolveWithObject: true }),
    base.clone().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 }).toBuffer(),
  ]);

  const url = await store(`${id}.webp`, mainBuf.data, "image/webp");
  await store(`${id}-sm.webp`, smBuf, "image/webp");

  return { url, bytes: mainBuf.info.size, width: mainBuf.info.width, height: mainBuf.info.height };
}

// Малую (-sm) версию строим из основного URL по соглашению об имени.
export function smallVariant(url: string): string {
  return url.endsWith(".webp") && !url.endsWith("-sm.webp")
    ? url.replace(/\.webp(\?|$)/, "-sm.webp$1")
    : url;
}

// Тихо удаляет загруженное фото и его -sm (демо-фото не трогает).
export async function removeUpload(publicUrl?: string | null) {
  if (!publicUrl) return;
  const isOurs = publicUrl.startsWith("/uploads/") || publicUrl.includes(".public.blob.vercel-storage.com");
  if (!isOurs) return;
  const sm = smallVariant(publicUrl);
  const targets = sm !== publicUrl ? [publicUrl, sm] : [publicUrl];

  if (useBlob) {
    try {
      await del(targets);
    } catch {}
    return;
  }
  for (const u of targets) {
    const name = u.startsWith("/uploads/") ? u.slice("/uploads/".length) : "";
    if (!name || name.includes("/") || name.includes("..")) continue;
    try {
      await fs.unlink(path.join(UPLOAD_DIR, name));
    } catch {}
  }
}

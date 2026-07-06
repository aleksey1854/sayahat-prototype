// Тесты фото-конвейера. Запуск: npm run test:images
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { ratioLabel, photoAdvice } from "../src/lib/imageMeta";

let fails = 0;
function check(ok: boolean, label: string, extra = "") {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : "  => " + extra}`);
}

async function expectCode(p: Promise<unknown>, code: string, label: string) {
  try {
    await p;
    check(false, label, "ошибки не было");
  } catch (e) {
    const got = e instanceof Error ? e.message : "?";
    check(got === code, label, `код ${got}`);
  }
}

async function main() {
  // UPLOAD_DIR выставляем ДО загрузки модуля img (он читает env на старте)
  process.env.UPLOAD_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "sayahat-img-"));
  const { saveUpload, removeUpload } = await import("../src/lib/img");
  const sharp = (await import("sharp")).default;

  // градиент — реалистичнее для сжатия, чем однотонная заливка
  async function makeJpeg(w: number, h: number): Promise<Buffer> {
  const raw = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      raw[i] = ((x * 255) / w) | 0;
      raw[i + 1] = ((y * 255) / h) | 0;
      raw[i + 2] = (((x + y) * 127) / (w + h)) | 0;
    }
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 92 }).toBuffer();
  }

  // --- основной путь: телефонное фото 3000×2000 ---
  const bigBuf = await makeJpeg(3000, 2000);
  const res = await saveUpload(new File([new Uint8Array(bigBuf)], "photo.jpg", { type: "image/jpeg" }));
  check(res.width === 1600 && res.height === 1067, `ужато до 1600px по длинной стороне (${res.width}×${res.height})`);
  check(/^\/uploads\/[a-f0-9]{32}\.webp$/.test(res.url), `путь вида /uploads/id.webp (${res.url})`);

  const dir = process.env.UPLOAD_DIR!;
  const mainPath = path.join(dir, path.basename(res.url));
  const smPath = mainPath.replace(/\.webp$/, "@sm.webp");
  const smMeta = await sharp(smPath).metadata();
  check(smMeta.width === 640, `@sm-версия 640px (${smMeta.width})`);

  const smBytes = (await fs.stat(smPath)).size;
  check(res.bytes < bigBuf.length, `легче оригинала: ${(bigBuf.length / 1024) | 0} КБ → ${(res.bytes / 1024) | 0} КБ`);
  check(smBytes < res.bytes, `@sm легче основного: ${(smBytes / 1024) | 0} КБ`);

  await removeUpload(res.url);
  const gone = await Promise.all(
  [mainPath, smPath].map((p) => fs.access(p).then(() => false).catch(() => true)),
  );
  check(gone[0] && gone[1], "removeUpload удаляет обе версии");

  // --- ошибки, каждая своим кодом ---
  const tiny = await makeJpeg(150, 150);
  await expectCode(
  saveUpload(new File([new Uint8Array(tiny)], "t.jpg", { type: "image/jpeg" })),
  "small",
  "меньше 200px -> код small",
  );

  const heic = Buffer.alloc(24);
  heic.write("ftypheic", 4, "ascii");
  await expectCode(
  saveUpload(new File([new Uint8Array(heic)], "img.heic", { type: "image/heic" })),
  "heic",
  "HEIC по сигнатуре -> код heic",
  );

  await expectCode(
  saveUpload(new File([new Uint8Array(Buffer.alloc(9 * 1024 * 1024))], "x.jpg", { type: "image/jpeg" })),
  "big",
  "больше 8 МБ -> код big",
  );

  await expectCode(
  saveUpload(new File([new Uint8Array(Buffer.from("это вообще не картинка"))], "x.jpg", { type: "image/jpeg" })),
  "bad",
  "мусорные байты -> код bad",
  );

  // --- определение соотношений ---
  check(ratioLabel(4032, 3024) === "4:3", `4032×3024 -> 4:3 (${ratioLabel(4032, 3024)})`);
  check(ratioLabel(1080, 1920) === "9:16", `1080×1920 -> 9:16 (${ratioLabel(1080, 1920)})`);
  check(ratioLabel(1000, 1000) === "1:1", `1000×1000 -> 1:1 (${ratioLabel(1000, 1000)})`);
  check(ratioLabel(997, 701).startsWith("≈"), `кривые размеры -> примерное (${ratioLabel(997, 701)})`);

  // --- подсказки под место использования ---
  const vertCover = photoAdvice("cover", 900, 1600);
  check(vertCover.some((w) => w.includes("Вертикальное")), "обложка: вертикальное фото ловится");
  check(photoAdvice("cover", 1600, 1200).length === 0, "обложка: 1600×1200 — без предупреждений");
  check(photoAdvice("cover", 700, 500).some((w) => w.toLowerCase().includes("мыльн")), "обложка: мелкое ловится");
  check(photoAdvice("product", 3000, 900).some((w) => w.toLowerCase().includes("панорам")), "товар: панорама ловится");
  check(photoAdvice("product", 300, 300).some((w) => w.includes("мелко")), "товар: 300×300 ловится");
  check(photoAdvice("product", 900, 1600).some((w) => w.includes("сторис")), "товар: формат сторис ловится");
  check(photoAdvice("product", 1000, 1000).length === 0, "товар: квадрат 1000 — без предупреждений");

  console.log(fails === 0 ? "\nALL GREEN" : `\n${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

const headers = (ext: string) => ({
  "Content-Type": TYPES[ext] ?? "application/octet-stream",
  "Cache-Control": "public, max-age=31536000, immutable",
});

export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const rel = params.path.join("/");
  if (rel.includes("..")) return new Response("Not found", { status: 404 });

  const dir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
  const file = path.join(dir, rel);
  const ext = path.extname(file).toLowerCase();

  try {
    const data = await fs.readFile(file);
    return new Response(new Uint8Array(data), { headers: headers(ext) });
  } catch {
    // У старых загрузок нет @sm-версии — делаем на лету из большой и кэшируем.
    if (file.endsWith("@sm.webp")) {
      try {
        const big = await fs.readFile(file.replace(/@sm\.webp$/, ".webp"));
        const sharp = (await import("sharp")).default;
        const out = await sharp(big)
          .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 78 })
          .toBuffer();
        fs.writeFile(file, out).catch(() => {});
        return new Response(new Uint8Array(out), { headers: headers(".webp") });
      } catch {}
    }
    return new Response("Not found", { status: 404 });
  }
}

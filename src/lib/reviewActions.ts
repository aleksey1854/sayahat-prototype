"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const AUTHOR_MIN = 2;
const AUTHOR_MAX = 60;
const TEXT_MIN = 10;
const TEXT_MAX = 400;

// Не больше стольки отправок с одного адреса за час.
const PER_HOUR = 2;

function str(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

// Храним хеш, а не адрес: для счёта частоты этого достаточно,
// а обратно IP из него не достать.
function ipHashOf() {
  const h = headers();
  const raw =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

/**
 * Приём отзыва с публичной формы.
 *
 * Отзыв всегда создаётся со статусом draft — на сайте он не появится,
 * пока администрация не откроет его в /admin/reviews и не опубликует.
 * Премодерация, а не постмодерация: на рынке, где точки платят за место,
 * снимать уже опубликованную грубость дороже, чем не пустить её.
 */
export async function submitReview(formData: FormData) {
  const slug = str(formData, "slug");
  if (!slug) redirect("/");

  const back = (code: string) => redirect(`/shop/${slug}?review=${code}#otzyvy`);

  // Поле-ловушка. Спрятано от людей, боты заполняют формы целиком.
  // Молча делаем вид, что всё прошло — бот не должен понять, что его отсеяли.
  if (str(formData, "company")) back("ok");

  const author = str(formData, "author");
  const text = str(formData, "text");
  if (author.length < AUTHOR_MIN || text.length < TEXT_MIN) back("short");

  const shop = await db.shop.findUnique({ where: { slug }, select: { id: true } });
  if (!shop) redirect("/");

  const ipHash = ipHashOf();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Внутри try не редиректим: redirect() в Next работает через исключение,
  // и свой же редирект попал бы в catch как ошибка базы.
  let code = "ok";
  try {
    const recent = await db.review.count({
      where: { ipHash, createdAt: { gte: hourAgo } },
    });
    if (recent >= PER_HOUR) {
      code = "limit";
    } else {
      await db.review.create({
        data: {
          shopId: shop.id,
          author: author.slice(0, AUTHOR_MAX),
          text: text.slice(0, TEXT_MAX),
          status: "draft",
          ipHash,
        },
      });
    }
  } catch (e) {
    // Обычно значит, что таблицы Review нет — `npm run db:push` не выполнен.
    console.error("[reviews] Не удалось сохранить отзыв.", e);
    code = "err";
  }

  back(code);
}

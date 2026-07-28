import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/cached";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/Header";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { can } from "@/lib/roles";

// Отзыв — это публичное высказывание о чужом бизнесе, который платит за место.
// Поэтому лимиты жёсткие: короткая подпись и текст в размер карточки.
const AUTHOR_MAX = 60;
const TEXT_MAX = 400;

function cut(value: string, max: number) {
  return value.length > max ? value.slice(0, max).trim() : value;
}

export const metadata: Metadata = {
  title: "Отзывы — модерация",
  robots: { index: false },
};

// Только админ. Роль editor ведёт новости, но отзывы касаются денежных
// отношений с арендаторами — доступ к ним шире не раздаём.
async function requireAdmin() {
  const session = await getSession();
  if (!session.accountId || !can(session.role, "reviews")) redirect("/login");
  return session;
}

function str(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function refresh(slug?: string) {
  revalidateTag(CATALOG_TAG);
  if (slug) revalidatePath(`/shop/${slug}`);
}

async function addReview(formData: FormData) {
  "use server";
  await requireAdmin();
  const shopId = str(formData, "shopId");
  const author = str(formData, "author");
  const text = str(formData, "text");
  if (!shopId) redirect("/admin/reviews?err=shop");
  if (!author) redirect("/admin/reviews?err=author");
  if (!text) redirect("/admin/reviews?err=text");

  const shop = await db.shop.findUnique({ where: { id: shopId } });
  if (!shop) redirect("/admin/reviews?err=shop");

  const top = await db.review.findFirst({
    where: { shopId },
    orderBy: { order: "desc" },
  });

  await db.review.create({
    data: {
      shopId,
      author: cut(author, AUTHOR_MAX),
      text: cut(text, TEXT_MAX),
      status: str(formData, "hidden") === "on" ? "draft" : "published",
      order: (top?.order ?? 0) + 1,
    },
  });

  await refresh(shop.slug);
  redirect("/admin/reviews?ok=1");
}

async function updateReview(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = str(formData, "id");
  const review = await db.review.findUnique({ where: { id }, include: { shop: true } });
  if (!review) redirect("/admin/reviews");

  const author = str(formData, "author");
  const text = str(formData, "text");
  if (!author || !text) redirect("/admin/reviews?err=text");

  await db.review.update({
    where: { id },
    data: { author: cut(author, AUTHOR_MAX), text: cut(text, TEXT_MAX) },
  });

  await refresh(review.shop.slug);
  redirect("/admin/reviews?ok=1");
}

async function toggleReview(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = str(formData, "id");
  const review = await db.review.findUnique({ where: { id }, include: { shop: true } });
  if (!review) redirect("/admin/reviews");

  await db.review.update({
    where: { id },
    data: { status: review.status === "published" ? "draft" : "published" },
  });

  await refresh(review.shop.slug);
  redirect("/admin/reviews?ok=1");
}

async function deleteReview(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = str(formData, "id");
  const review = await db.review.findUnique({ where: { id }, include: { shop: true } });
  if (!review) redirect("/admin/reviews");

  await db.review.delete({ where: { id } });

  await refresh(review.shop.slug);
  redirect("/admin/reviews?ok=1");
}

function loadReviews() {
  return db.review.findMany({
    include: { shop: { select: { nameRu: true, slug: true } } },
    orderBy: [{ createdAt: "desc" }],
  });
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { ok?: string; err?: string };
}) {
  const session = await requireAdmin();

  const shops = await db.shop.findMany({
    orderBy: { nameRu: "asc" },
    select: { id: true, nameRu: true, slug: true },
  });

  // Если таблицы Review нет, страница не должна падать белым экраном —
  // она должна сказать, что делать.
  let reviews: Awaited<ReturnType<typeof loadReviews>> = [];
  let tableMissing = false;
  try {
    reviews = await loadReviews();
  } catch {
    tableMissing = true;
  }

  if (tableMissing) {
    return (
      <>
        <Header />
        <main className="section">
          <div className="wrap">
            <div className="eyebrow">Модерация</div>
            <h1 style={{ fontSize: 34, margin: "8px 0 16px" }}>Отзывы</h1>
            <div className="notice notice--err">Таблица отзывов не создана в базе.</div>
            <p style={{ color: "var(--muted)", maxWidth: 640 }}>
              Выполните <code>npm run db:push</code> в корне проекта. Локальный <code>.env</code> должен
              содержать те же <code>DATABASE_URL</code> и <code>DATABASE_URL_UNPOOLED</code>, что заданы
              в переменных окружения на хостинге — иначе таблица создастся в другой базе.
            </p>
            <p style={{ color: "var(--muted)" }}>
              До этого момента блок отзывов на страницах магазинов просто не показывается,
              сайт работает как обычно.
            </p>
            <Link className="btn btn--ghost" href="/admin">
              К магазинам
            </Link>
          </div>
        </main>
      </>
    );
  }

  const errText: Record<string, string> = {
    shop: "Не выбран магазин.",
    author: "Не заполнена подпись.",
    text: "Не заполнен текст отзыва.",
  };

  return (
    <>
          <div className="cab__top">
            <div>
              <div className="eyebrow">Модерация</div>
              <h1 style={{ fontSize: 34, margin: "8px 0 0" }}>Отзывы ({reviews.length})</h1>
            </div>
            <Link className="btn btn--ghost" href="/admin">
              К магазинам
            </Link>
          </div>


          <p style={{ color: "var(--muted)", maxWidth: 640, marginTop: 12 }}>
            Отзывы с формы на сайте попадают сюда со статусом «на проверке» и не видны посетителям,
            пока вы не нажмёте «Опубликовать». Здесь же можно завести отзыв вручную.
          </p>

          {searchParams.ok && <div className="notice notice--ok">Сохранено.</div>}
          {searchParams.err && (
            <div className="notice notice--err">{errText[searchParams.err] ?? "Не сохранилось."}</div>
          )}

          <form action={addReview} className="panel form-grid" style={{ marginTop: 24, marginBottom: 32 }}>
            <h3 style={{ margin: 0 }}>Новый отзыв</h3>

            <div className="field">
              <label htmlFor="rv-shop">Магазин</label>
              <select id="rv-shop" className="select" name="shopId" defaultValue="" required>
                <option value="" disabled>
                  Выберите магазин
                </option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameRu}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="rv-author">Подпись · до {AUTHOR_MAX} знаков</label>
              <input id="rv-author" className="input" name="author" maxLength={AUTHOR_MAX} placeholder="Айгуль, покупатель" required />
            </div>

            <div className="field">
              <label htmlFor="rv-text">Текст отзыва · до {TEXT_MAX} знаков</label>
              <textarea
                id="rv-text"
                className="textarea"
                name="text"
                rows={4}
                maxLength={TEXT_MAX}
                placeholder="Что человек сказал. Своими словами, без правки под рекламу — иначе отзывы перестают читать."
                required
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" name="hidden" />
              Сохранить скрытым, опубликовать позже
            </label>

            <SubmitButton pendingText="Сохраняю…" style={{ justifySelf: "start" }}>
              Добавить отзыв
            </SubmitButton>
          </form>

          {reviews.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              Отзывов пока нет. Пока их нет ни у одного магазина, блок на страницах показывает
              только приглашение написать.
            </p>
          ) : (
            <div className="rev-admin">
              {reviews.map((r) => (
                <form action={updateReview} className="panel rev-card" key={r.id}>
                  <input type="hidden" name="id" value={r.id} />

                  <div className="rev-card__head">
                    <span className="rev-card__shop">{r.shop.nameRu}</span>
                    <span className={r.status === "published" ? "pill pill--ok" : "pill pill--muted"}>
                      {r.status === "published" ? "на сайте" : "на проверке"}
                    </span>
                    <span>{new Date(r.createdAt).toLocaleDateString("ru-RU")}</span>
                    <span>· /shop/{r.shop.slug}</span>
                  </div>

                  <div className="rev-two">
                    <div className="field">
                      <label>Подпись</label>
                      <input className="input" name="author" defaultValue={r.author} maxLength={AUTHOR_MAX} required />
                    </div>
                    <div className="field">
                      <label>Текст</label>
                      <textarea className="textarea" name="text" defaultValue={r.text} rows={3} maxLength={TEXT_MAX} required style={{ minHeight: 88 }} />
                    </div>
                  </div>

                  <div className="rev-card__acts">
                    <SubmitButton pendingText="Сохраняю…">Сохранить</SubmitButton>
                    <button className="btn btn--ghost" formAction={toggleReview} formNoValidate>
                      {r.status === "published" ? "Скрыть" : "Опубликовать"}
                    </button>
                    <ConfirmButton formAction={deleteReview} formNoValidate message="Удалить отзыв? Восстановить не получится.">
                      Удалить
                    </ConfirmButton>
                  </div>
                </form>
              ))}
            </div>
          )}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { newsDate } from "@/lib/format";
import { Header } from "@/components/Header";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata: Metadata = {
  title: "Новости рынка — управление",
  robots: { index: false },
};

// Новости ведут админ и редактор (SMM). Остальных — на вход.
async function requireNewsAccess() {
  const session = await getSession();
  if (!session.accountId || (session.role !== "admin" && session.role !== "editor")) {
    redirect("/login");
  }
  return session;
}

function str(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function parseDate(value: string): Date {
  const d = value ? new Date(value) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

function dateInputValue(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

async function addNews(formData: FormData) {
  "use server";
  await requireNewsAccess();
  const titleRu = str(formData, "titleRu");
  if (!titleRu) redirect("/admin/news?err=title");

  const top = await db.newsPost.findFirst({ orderBy: { sortOrder: "desc" } });

  await db.newsPost.create({
    data: {
      titleRu,
      titleKz: str(formData, "titleKz") || null,
      bodyRu: str(formData, "bodyRu") || null,
      bodyKz: str(formData, "bodyKz") || null,
      link: str(formData, "link") || null,
      pinned: str(formData, "pinned") === "on",
      sortOrder: (top?.sortOrder ?? 0) + 1,
      publishedAt: parseDate(str(formData, "publishedAt")),
    },
  });

  revalidatePath("/");
  redirect("/admin/news?ok=1");
}

async function updateNews(formData: FormData) {
  "use server";
  await requireNewsAccess();
  const id = str(formData, "id");
  const titleRu = str(formData, "titleRu");
  if (!id || !titleRu) redirect("/admin/news?err=title");

  await db.newsPost.update({
    where: { id },
    data: {
      titleRu,
      titleKz: str(formData, "titleKz") || null,
      bodyRu: str(formData, "bodyRu") || null,
      bodyKz: str(formData, "bodyKz") || null,
      link: str(formData, "link") || null,
      pinned: str(formData, "pinned") === "on",
      publishedAt: parseDate(str(formData, "publishedAt")),
    },
  });

  revalidatePath("/");
  redirect("/admin/news?ok=1");
}

async function togglePin(formData: FormData) {
  "use server";
  await requireNewsAccess();
  const id = str(formData, "id");
  const post = await db.newsPost.findUnique({ where: { id } });
  if (!post) redirect("/admin/news");
  await db.newsPost.update({ where: { id }, data: { pinned: !post.pinned } });
  revalidatePath("/");
  redirect("/admin/news?ok=1");
}

async function moveNews(formData: FormData) {
  "use server";
  await requireNewsAccess();
  const id = str(formData, "id");
  const dir = str(formData, "dir");

  // Тот же порядок, что и на сайте.
  const list = await db.newsPost.findMany({
    orderBy: [{ pinned: "desc" }, { sortOrder: "desc" }, { publishedAt: "desc" }],
  });
  const idx = list.findIndex((n) => n.id === id);
  const j = dir === "up" ? idx - 1 : idx + 1;
  // Двигаем только внутри своей группы: закреплённые отдельно от обычных.
  if (idx < 0 || j < 0 || j >= list.length || list[idx].pinned !== list[j].pinned) {
    redirect("/admin/news");
  }

  await db.$transaction([
    db.newsPost.update({ where: { id: list[idx].id }, data: { sortOrder: list[j].sortOrder } }),
    db.newsPost.update({ where: { id: list[j].id }, data: { sortOrder: list[idx].sortOrder } }),
  ]);

  revalidatePath("/");
  redirect("/admin/news?ok=1");
}

async function deleteNews(formData: FormData) {
  "use server";
  await requireNewsAccess();
  const id = str(formData, "id");
  await db.newsPost.deleteMany({ where: { id } });
  revalidatePath("/");
  redirect("/admin/news?ok=1");
}

async function logout() {
  "use server";
  const session = await getSession();
  session.destroy();
  redirect("/");
}

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: { ok?: string; err?: string };
}) {
  const session = await requireNewsAccess();

  const news = await db.newsPost.findMany({
    orderBy: [{ pinned: "desc" }, { sortOrder: "desc" }, { publishedAt: "desc" }],
  });

  const err = searchParams.err;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Header variant="shop" />
      <section className="section">
        <div className="wrap cab" style={{ maxWidth: 860 }}>
          <div className="cab__top">
            <div>
              <div className="eyebrow">Новости рынка</div>
              <h1 style={{ fontSize: 34, margin: "8px 0 0" }}>Новости ({news.length})</h1>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {session.role === "admin" && (
                <Link href="/admin" className="btn btn--ghost">
                  В админку
                </Link>
              )}
              <form action={logout}>
                <button className="btn btn--ghost" type="submit">
                  Выйти
                </button>
              </form>
            </div>
          </div>

          {searchParams.ok && <div className="notice notice--ok">Готово.</div>}
          {err === "title" && <div className="notice notice--err">Заполните заголовок (русский).</div>}

          <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>
            Заголовок и текст — коротко. «Ссылка» ведёт на пост в Instagram: на сайте у новости
            появится кнопка «Подробнее». Закреплённые всегда сверху.
          </p>

          <form action={addNews} className="panel form-grid" style={{ marginBottom: 24 }}>
            <h3 style={{ margin: 0 }}>Добавить новость</h3>
            <div className="grid2">
              <div className="field">
                <label htmlFor="n-titleRu">Заголовок (русский)</label>
                <input className="input" id="n-titleRu" name="titleRu" required />
              </div>
              <div className="field">
                <label htmlFor="n-titleKz">Заголовок (қазақша)</label>
                <input className="input" id="n-titleKz" name="titleKz" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="n-bodyRu">Текст (русский)</label>
              <textarea className="textarea" id="n-bodyRu" name="bodyRu" style={{ minHeight: 80 }} />
            </div>
            <div className="field">
              <label htmlFor="n-bodyKz">Текст (қазақша)</label>
              <textarea className="textarea" id="n-bodyKz" name="bodyKz" style={{ minHeight: 80 }} />
            </div>
            <div className="grid2">
              <div className="field">
                <label htmlFor="n-link">Ссылка на пост в Instagram</label>
                <input
                  className="input"
                  id="n-link"
                  name="link"
                  type="url"
                  placeholder="https://instagram.com/p/..."
                />
              </div>
              <div className="field">
                <label htmlFor="n-date">Дата</label>
                <input className="input" id="n-date" name="publishedAt" type="date" defaultValue={today} />
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
              <input type="checkbox" name="pinned" /> Закрепить наверху
            </label>
            <SubmitButton className="btn btn--accent" pendingText="Публикую…" style={{ justifySelf: "start" }}>
              Опубликовать новость
            </SubmitButton>
          </form>

          <div className="form-grid">
            {news.map((n, i) => (
              <div className="panel form-grid" key={n.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>{n.titleRu}</strong>
                    {n.pinned && (
                      <span style={{ marginLeft: 8, fontSize: 12.5, fontWeight: 700, color: "var(--accent-700)" }}>
                        · закреплено
                      </span>
                    )}
                    <div style={{ color: "var(--muted)", fontSize: 14 }}>
                      {newsDate(n.publishedAt)}
                      {n.link && (
                        <>
                          {" · "}
                          <a href={n.link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)" }}>
                            ссылка
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <form action={moveNews}>
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button className="btn btn--ghost" type="submit" disabled={i === 0} title="Выше">
                        ↑
                      </button>
                    </form>
                    <form action={moveNews}>
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button className="btn btn--ghost" type="submit" disabled={i === news.length - 1} title="Ниже">
                        ↓
                      </button>
                    </form>
                    <form action={togglePin}>
                      <input type="hidden" name="id" value={n.id} />
                      <button className="btn btn--ghost" type="submit">
                        {n.pinned ? "Открепить" : "Закрепить"}
                      </button>
                    </form>
                  </div>
                </div>

                <details>
                  <summary style={{ cursor: "pointer", fontWeight: 600 }}>Редактировать</summary>
                  <form action={updateNews} className="form-grid" style={{ marginTop: 14 }}>
                    <input type="hidden" name="id" value={n.id} />
                    <div className="grid2">
                      <div className="field">
                        <label>Заголовок (русский)</label>
                        <input className="input" name="titleRu" defaultValue={n.titleRu} required />
                      </div>
                      <div className="field">
                        <label>Заголовок (қазақша)</label>
                        <input className="input" name="titleKz" defaultValue={n.titleKz ?? ""} />
                      </div>
                    </div>
                    <div className="field">
                      <label>Текст (русский)</label>
                      <textarea className="textarea" name="bodyRu" defaultValue={n.bodyRu ?? ""} style={{ minHeight: 80 }} />
                    </div>
                    <div className="field">
                      <label>Текст (қазақша)</label>
                      <textarea className="textarea" name="bodyKz" defaultValue={n.bodyKz ?? ""} style={{ minHeight: 80 }} />
                    </div>
                    <div className="grid2">
                      <div className="field">
                        <label>Ссылка на пост в Instagram</label>
                        <input
                          className="input"
                          name="link"
                          type="url"
                          defaultValue={n.link ?? ""}
                          placeholder="https://instagram.com/p/..."
                        />
                      </div>
                      <div className="field">
                        <label>Дата</label>
                        <input className="input" name="publishedAt" type="date" defaultValue={dateInputValue(n.publishedAt)} />
                      </div>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                      <input type="checkbox" name="pinned" defaultChecked={n.pinned} /> Закрепить наверху
                    </label>
                    <SubmitButton pendingText="Сохраняю…" style={{ justifySelf: "start" }}>
                      Сохранить
                    </SubmitButton>
                  </form>
                </details>

                <form action={deleteNews}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className="btn btn--ghost btn--danger" type="submit">
                    Удалить
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

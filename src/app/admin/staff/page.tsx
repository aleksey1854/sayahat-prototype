import type { Metadata } from "next";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ROLE_NAMES, isRole, type Role } from "@/lib/roles";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Toast } from "@/components/Toast";

export const metadata: Metadata = { title: "Сотрудники", robots: { index: false } };

// Роли сотрудников. Арендаторов сюда не пускаем: их аккаунты привязаны
// к магазину и заводятся на карточке магазина, а не здесь.
const STAFF_ROLES: Role[] = ["admin", "operator", "editor"];

const ROLE_HINT: Record<string, string> = {
  admin: "Всё, включая сотрудников, доступы арендаторов и удаление магазинов",
  operator: "Магазины, новости, отзывы. Без доступов арендаторов и удаления",
  editor: "Только новости",
};

async function requireAdmin() {
  const session = await getSession();
  if (!session.accountId || session.role !== "admin") redirect("/login");
  return session;
}

function str(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

// Последнего админа снимать нельзя: иначе в админку не войдёт никто,
// и чинить придётся из консоли на сервере.
async function adminCount() {
  return db.account.count({ where: { role: "admin" } });
}

async function addStaff(formData: FormData) {
  "use server";
  await requireAdmin();
  const login = str(formData, "login").toLowerCase();
  const password = str(formData, "password");
  const role = str(formData, "role");

  if (!login) redirect("/admin/staff?err=login");
  if (password.length < 6) redirect("/admin/staff?err=pass");
  if (!isRole(role) || !STAFF_ROLES.includes(role)) redirect("/admin/staff?err=role");

  const taken = await db.account.findUnique({ where: { login } });
  if (taken) redirect("/admin/staff?err=taken");

  await db.account.create({
    data: { login, passwordHash: bcrypt.hashSync(password, 10), role },
  });
  redirect("/admin/staff?ok=1");
}

async function setRole(formData: FormData) {
  "use server";
  const session = await requireAdmin();
  const id = str(formData, "id");
  const role = str(formData, "role");
  if (!isRole(role) || !STAFF_ROLES.includes(role)) redirect("/admin/staff?err=role");

  const account = await db.account.findUnique({ where: { id } });
  if (!account) redirect("/admin/staff");

  // Себе роль не меняем: снял с себя админа — и обратно уже не вернёшь.
  if (account.id === session.accountId) redirect("/admin/staff?err=self");
  if (account.role === "admin" && role !== "admin" && (await adminCount()) <= 1) {
    redirect("/admin/staff?err=last");
  }

  await db.account.update({ where: { id }, data: { role } });
  redirect("/admin/staff?ok=1");
}

async function resetPassword(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = str(formData, "id");
  const password = str(formData, "password");
  if (password.length < 6) redirect("/admin/staff?err=pass");

  const account = await db.account.findUnique({ where: { id } });
  if (!account) redirect("/admin/staff");

  await db.account.update({
    where: { id },
    data: { passwordHash: bcrypt.hashSync(password, 10) },
  });
  redirect("/admin/staff?ok=1");
}

async function deleteStaff(formData: FormData) {
  "use server";
  const session = await requireAdmin();
  const id = str(formData, "id");

  const account = await db.account.findUnique({ where: { id } });
  if (!account) redirect("/admin/staff");
  if (account.id === session.accountId) redirect("/admin/staff?err=self");
  if (account.role === "admin" && (await adminCount()) <= 1) redirect("/admin/staff?err=last");

  await db.account.delete({ where: { id } });
  redirect("/admin/staff?ok=1");
}

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: { ok?: string; err?: string };
}) {
  const session = await requireAdmin();

  const [staff, tenants] = await Promise.all([
    db.account.findMany({
      where: { role: { in: STAFF_ROLES } },
      orderBy: [{ role: "asc" }, { login: "asc" }],
    }),
    db.account.findMany({
      where: { role: "tenant" },
      include: { shop: { select: { nameRu: true, id: true } } },
      orderBy: { login: "asc" },
    }),
  ]);

  const errors: Record<string, string> = {
    login: "Заполните логин.",
    pass: "Пароль короче шести символов.",
    role: "Неизвестная роль.",
    taken: "Такой логин уже занят.",
    self: "Свою собственную роль и свой аккаунт менять нельзя.",
    last: "Это последний администратор. Сначала назначьте другого.",
  };

  return (
    <>
      <div className="cab__top">
        <div>
          <div className="eyebrow">Доступы</div>
          <h1 style={{ fontSize: 32, margin: "8px 0 0" }}>Сотрудники ({staff.length})</h1>
        </div>
      </div>

      {searchParams.ok && <Toast kind="ok" param={["ok", "saved", "kb"]}>Готово.</Toast>}
      {searchParams.err && (
        <Toast kind="err" param={["err", "perr"]}>{errors[searchParams.err] ?? "Не сохранилось."}</Toast>
      )}

      <p style={{ color: "var(--muted)", maxWidth: 640, margin: "0 0 20px" }}>
        Пароль после создания посмотреть нельзя, он хранится в зашифрованном виде. Забыли — задайте
        новый кнопкой «Сменить пароль». Передавайте пароли не в общем чате.
      </p>

      <details className="panel" style={{ marginBottom: 20 }}>
        <summary className="admin-add">Добавить сотрудника</summary>
        <form action={addStaff} className="form-grid" style={{ marginTop: 16 }}>
          <div className="grid2">
            <div className="field">
              <label htmlFor="s-login">Логин</label>
              <input className="input" id="s-login" name="login" maxLength={40} required placeholder="operator" />
            </div>
            <div className="field">
              <label htmlFor="s-pass">Пароль</label>
              <input className="input" id="s-pass" name="password" required minLength={6} placeholder="минимум 6 символов" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-role">Роль</label>
            <select className="select" id="s-role" name="role" defaultValue="operator">
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_NAMES[r]} — {ROLE_HINT[r]}
                </option>
              ))}
            </select>
          </div>
          <SubmitButton pendingText="Создаю…" style={{ justifySelf: "start" }}>
            Создать
          </SubmitButton>
        </form>
      </details>

      <div className="cat-rows">
        {staff.map((a) => {
          const isMe = a.id === session.accountId;
          return (
            <div className="cat-row" key={a.id}>
              <div className="shop-row__top">
                <span className="shop-row__name">{a.login}</span>
                <span className="pill pill--muted">{ROLE_NAMES[a.role as Role] ?? a.role}</span>
                {isMe && <span style={{ fontSize: 13, color: "var(--muted)" }}>это вы</span>}
              </div>
              <div className="cat-row__meta">{ROLE_HINT[a.role] ?? ""}</div>

              <div className="cat-row__acts">
                {!isMe && (
                  <form action={setRole} className="shop-row__cat">
                    <input type="hidden" name="id" value={a.id} />
                    <select className="select" name="role" defaultValue={a.role}>
                      {STAFF_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_NAMES[r]}
                        </option>
                      ))}
                    </select>
                    <SubmitButton className="btn btn--ghost btn--sm" pendingText="Меняю…">
                      Сменить роль
                    </SubmitButton>
                  </form>
                )}

                <form action={resetPassword} className="shop-row__cat">
                  <input type="hidden" name="id" value={a.id} />
                  <input className="input" name="password" required minLength={6} placeholder="новый пароль" style={{ width: 200 }} />
                  <SubmitButton className="btn btn--ghost btn--sm" pendingText="Меняю…">
                    Сменить пароль
                  </SubmitButton>
                </form>

                {!isMe && (
                  <form action={deleteStaff}>
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmButton formNoValidate message={`Удалить доступ «${a.login}»? Человек больше не сможет войти.`}>
                      Удалить
                    </ConfirmButton>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tenants.length > 0 && (
        <details style={{ marginTop: 28 }}>
          <summary className="admin-add">Доступы арендаторов ({tenants.length})</summary>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "12px 0" }}>
            Эти аккаунты привязаны к магазинам. Выдача доступов арендаторам входит во второй
            этап, из админки она пока убрана — сейчас в кабинет магазина заходят через
            «Заполнить» в разделе «Магазины».
          </p>
          <div className="cat-rows">
            {tenants.map((a) => (
              <div className="cat-row" key={a.id}>
                <div className="shop-row__top">
                  <span className="shop-row__name">{a.login}</span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{a.shop?.nameRu ?? "магазин удалён"}</span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </>
  );
}

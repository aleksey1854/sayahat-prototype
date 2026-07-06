import type { Metadata } from "next";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { tooManyAttempts, registerFailure, clearFailures } from "@/lib/ratelimit";
import { Header } from "@/components/Header";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata: Metadata = {
  title: "Вход для арендаторов",
  robots: { index: false },
};

// Сравнение выполняется и для несуществующих логинов, чтобы по времени
// ответа нельзя было понять, есть ли такой аккаунт.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

async function login(formData: FormData) {
  "use server";
  const loginStr = String(formData.get("login") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!loginStr || !password) redirect("/login?e=1");

  if (tooManyAttempts(loginStr)) redirect("/login?e=2");

  const account = await db.account.findUnique({ where: { login: loginStr } });
  const ok = bcrypt.compareSync(password, account?.passwordHash ?? DUMMY_HASH) && !!account;

  if (!ok) {
    registerFailure(loginStr);
    redirect("/login?e=1");
  }

  clearFailures(loginStr);

  const session = await getSession();
  session.accountId = account!.id;
  session.role = account!.role === "admin" ? "admin" : "tenant";
  session.shopId = account!.shopId;
  await session.save();

  redirect(session.role === "admin" ? "/admin" : account!.shopId ? "/cabinet" : "/");
}

export default async function LoginPage({ searchParams }: { searchParams: { e?: string } }) {
  const session = await getSession();
  if (session.accountId) {
    redirect(session.role === "admin" ? "/admin" : session.shopId ? "/cabinet" : "/");
  }

  return (
    <>
      <Header variant="shop" />
      <section className="section">
        <div className="wrap cab" style={{ maxWidth: 440 }}>
          <div className="eyebrow">Кабинет арендатора</div>
          <h1 style={{ fontSize: 34, margin: "10px 0 8px" }}>Вход</h1>
          <p style={{ color: "var(--muted)", marginBottom: 22 }}>
            Логин и пароль выдаёт администрация базара.
          </p>

          {searchParams.e === "1" && <div className="notice notice--err">Неверный логин или пароль.</div>}
          {searchParams.e === "2" && (
            <div className="notice notice--err">Слишком много попыток. Подождите 15 минут и попробуйте снова.</div>
          )}

          <form action={login} className="panel form-grid">
            <div className="field">
              <label htmlFor="login">Логин</label>
              <input className="input" id="login" name="login" autoComplete="username" required />
            </div>
            <div className="field">
              <label htmlFor="password">Пароль</label>
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <SubmitButton className="btn btn--primary btn--lg btn--block" pendingText="Проверяю…">
              Войти
            </SubmitButton>
          </form>
        </div>
      </section>
    </>
  );
}

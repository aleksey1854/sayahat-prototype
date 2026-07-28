"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import bcrypt from "bcryptjs";
import { CATALOG_TAG } from "@/lib/cached";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/roles";

/**
 * Действия над магазином, общие для списка и карточки магазина.
 *
 * Вынесены из страницы списка: после разделения их вызывают две страницы,
 * а держать копию в каждой значило бы чинить ошибки дважды.
 */

function str(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

// Куда вернуться после действия. Список и карточка магазина зовут одни и
// те же функции, но возвращаться должны в разные места.
function backTo(formData: FormData, fallback = "/admin") {
  const b = str(formData, "back");
  return b.startsWith("/admin") ? b : fallback;
}

async function requireShops() {
  const session = await getSession();
  if (!session.accountId || !can(session.role, "shops")) redirect("/login");
  return session;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session.accountId || session.role !== "admin") redirect("/login");
  return session;
}

async function refresh(slug?: string) {
  revalidatePath("/");
  revalidateTag(CATALOG_TAG);
  if (slug) revalidatePath(`/shop/${slug}`);
}

export async function setCategory(formData: FormData) {
  await requireShops();
  const id = str(formData, "id");
  const categoryId = str(formData, "categoryId");
  const back = backTo(formData);
  if (!categoryId) redirect(`${back}?err=cat`);

  const [shop, category] = await Promise.all([
    db.shop.findUnique({ where: { id } }),
    db.category.findUnique({ where: { id: categoryId } }),
  ]);
  if (!shop || !category) redirect(`${back}?err=cat`);

  await db.shop.update({ where: { id: shop.id }, data: { categoryId } });
  await refresh(shop.slug);
  redirect(`${back}?ok=1`);
}

export async function toggleStatus(formData: FormData) {
  await requireShops();
  const id = str(formData, "id");
  const back = backTo(formData);
  const shop = await db.shop.findUnique({ where: { id } });
  if (!shop) redirect(back);

  await db.shop.update({
    where: { id: shop.id },
    data: { status: shop.status === "published" ? "draft" : "published" },
  });
  await refresh(shop.slug);
  redirect(`${back}?ok=1`);
}

export async function impersonate(formData: FormData) {
  // Оператору это нужно: «Заполнить» ведёт именно сюда.
  const session = await requireShops();
  const id = str(formData, "id");
  const shop = await db.shop.findUnique({ where: { id } });
  if (!shop) redirect("/admin");

  session.shopId = shop.id;
  await session.save();
  // from=admin: кабинет по этому признаку сбрасывает прокрутку наверх.
  redirect("/cabinet?from=admin");
}

export async function setCredentials(formData: FormData) {
  await requireAdmin();
  const shopId = str(formData, "shopId");
  const login = str(formData, "login").toLowerCase();
  const password = str(formData, "password");
  const back = backTo(formData);
  if (!login) redirect(`${back}?err=login`);
  if (password.length < 6) redirect(`${back}?err=pass`);

  const shop = await db.shop.findUnique({ where: { id: shopId }, include: { account: true } });
  if (!shop) redirect(back);

  const taken = await db.account.findUnique({ where: { login } });
  if (taken && taken.shopId !== shop.id) redirect(`${back}?err=login`);

  const passwordHash = bcrypt.hashSync(password, 10);
  if (shop.account) {
    await db.account.update({ where: { id: shop.account.id }, data: { login, passwordHash } });
  } else {
    await db.account.create({ data: { login, passwordHash, role: "tenant", shopId: shop.id } });
  }
  redirect(`${back}?ok=1`);
}

export async function deleteShop(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const shop = await db.shop.findUnique({ where: { id } });
  if (!shop) redirect("/admin");

  await db.shop.delete({ where: { id: shop.id } });
  await refresh(shop.slug);
  // Возвращаться на карточку удалённого магазина некуда.
  redirect("/admin?ok=1");
}

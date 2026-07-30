"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
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

export async function deleteShop(formData: FormData) {
  // Оператору тоже: он заводит магазины, включая пробные, и убирать
  // их за ним некому.
  await requireShops();
  const id = str(formData, "id");
  const shop = await db.shop.findUnique({ where: { id } });
  if (!shop) redirect("/admin");

  await db.shop.delete({ where: { id: shop.id } });
  await refresh(shop.slug);
  // Возвращаться на карточку удалённого магазина некуда.
  redirect("/admin?ok=1");
}

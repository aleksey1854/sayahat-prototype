/**
 * Роли и что кому доступно.
 *
 * Держим одним файлом, чтобы права не расползались по страницам: раньше
 * каждая админская страница проверяла роль сама, и добавление роли
 * означало правку в четырёх местах с риском что-нибудь забыть.
 *
 * Матрица по договорённости от 28 июля:
 *
 *   роль       магазины  новости  отзывы  сотрудники
 *   admin         да       да       да       да
 *   operator      да       да       да       нет
 *   editor       нет       да      нет       нет
 *   tenant       нет      нет      нет       нет   (только свой кабинет)
 *
 * Внутри раздела «Магазины» у оператора нет двух вещей: выдачи доступов
 * арендаторам и удаления магазина. Первое это раздача паролей, второе
 * необратимо. Обе остаются за админом.
 */
export type Role = "admin" | "operator" | "editor" | "tenant";

export const ROLES: Role[] = ["admin", "operator", "editor", "tenant"];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}

export const ROLE_NAMES: Record<Role, string> = {
  admin: "Администратор",
  operator: "Оператор",
  editor: "СММ",
  tenant: "Арендатор",
};

type Area = "shops" | "news" | "reviews" | "staff";

const ACCESS: Record<Role, Area[]> = {
  admin: ["shops", "news", "reviews", "staff"],
  operator: ["shops", "news", "reviews"],
  editor: ["news"],
  tenant: [],
};

export function can(role: Role | undefined, area: Area): boolean {
  return role ? ACCESS[role].includes(area) : false;
}

// Опасное внутри «Магазинов»: доступы арендаторов и удаление точки.
export function canManageShopAccess(role: Role | undefined): boolean {
  return role === "admin";
}

/** Куда отправить человека сразу после входа. */
export function homeFor(role: Role | undefined, shopId?: string | null): string {
  if (can(role, "shops")) return "/admin";
  if (can(role, "news")) return "/admin/news";
  if (shopId) return "/cabinet";
  return "/";
}

export const AREAS: { area: Area; href: string; label: string }[] = [
  { area: "shops", href: "/admin", label: "Магазины" },
  { area: "news", href: "/admin/news", label: "Новости" },
  { area: "reviews", href: "/admin/reviews", label: "Отзывы" },
  { area: "staff", href: "/admin/staff", label: "Сотрудники" },
];

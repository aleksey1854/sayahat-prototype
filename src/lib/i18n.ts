import { cookies } from "next/headers";

export type { Lang } from "@/lib/lang";
export { pick } from "@/lib/lang";

import type { Lang } from "@/lib/lang";

export function getLang(): Lang {
  const value = cookies().get("lang")?.value;
  return value === "kz" ? "kz" : "ru";
}


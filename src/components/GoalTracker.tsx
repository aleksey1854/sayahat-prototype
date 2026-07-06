"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/track";

function goalFor(a: HTMLAnchorElement): string | null {
  if (a.dataset.goal) return a.dataset.goal;
  const href = a.href;
  if (href.startsWith("tel:")) return "call_click";
  if (href.includes("wa.me/")) return "whatsapp_click";
  if (href.includes("kaspi.kz")) return "kaspi_click";
  return null;
}

// Считает клики по «Позвонить» / WhatsApp / Kaspi.
export function GoalTracker({ shop }: { shop?: string }) {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const goal = goalFor(a);
      if (!goal) return;
      trackEvent(goal, shop ? { shop } : undefined);
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [shop]);

  return null;
}

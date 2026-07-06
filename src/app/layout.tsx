import type { Metadata, Viewport } from "next";
import "@fontsource/onest/400.css";
import "@fontsource/onest/500.css";
import "@fontsource/onest/600.css";
import "@fontsource/onest/700.css";
import "@fontsource/onest/800.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import { getLang } from "@/lib/i18n";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  alternates: { canonical: "/" },
  title: {
    default: "Базар Саяхат — все магазины онлайн · Костанай",
    template: "%s · базар Саяхат",
  },
  description:
    "Базар Саяхат в Костанае онлайн: каталог магазинов, товары и цены, навигация по рядам. Продукты, сладости и орехи, одежда, обувь, товары для дома, электроника.",
  openGraph: {
    type: "website",
    siteName: "Базар Саяхат",
    locale: "ru_RU",
    title: "Базар Саяхат — все магазины онлайн",
    description: "Каталог магазинов рынка Саяхат, Костанай. Товары, цены, навигация по рядам.",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image" },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
};

export const viewport: Viewport = {
  themeColor: "#1C6B57",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  return (
    <html lang={lang}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

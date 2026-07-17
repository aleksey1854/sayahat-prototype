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
    default: "Рынок Саяхат — все магазины онлайн · Костанай",
    template: "%s · рынок Саяхат",
  },
  description:
    "Рынок «Саяхат» в Костанае онлайн: каталог магазинов и товаров, навигация по павильонам. Мясо и колбасы, овощи и фрукты, сладости и бакалея, одежда, обувь, детское, дом и электроника. Карбышева 131.",
  openGraph: {
    type: "website",
    siteName: "Рынок Саяхат",
    locale: "ru_RU",
    title: "Рынок Саяхат — все магазины онлайн",
    description: "Каталог магазинов рынка «Саяхат», Костанай. Навигация по павильонам, аренда мест, как добраться.",
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
    <html lang={lang} suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "@fontsource/onest/600.css";
import "@fontsource/onest/700.css";
import "@fontsource/onest/800.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import { getLang } from "@/lib/i18n";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

// generateMetadata вместо статического объекта: заголовок вкладки, описание
// и превью для мессенджеров зависят от выбранного языка.
export async function generateMetadata(): Promise<Metadata> {
  const lang = getLang();
  const kz = lang === "kz";
  return {
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
    alternates: { canonical: "/" },
    title: {
      default: kz
        ? "«Саяхат» базары — барлық дүкендер онлайн · Қостанай"
        : "Рынок Саяхат — все магазины онлайн · Костанай",
      template: kz ? "%s · «Саяхат» базары" : "%s · рынок Саяхат",
    },
    description: kz
      ? "Қостанайдағы «Саяхат» базары онлайн: дүкендер мен тауарлар каталогы, павильондар бойынша навигация. Ет пен шұжық, көкөніс пен жеміс, тәттілер, киім, аяқ киім, балалар тауарлары, үй және электроника. Карбышев 131."
      : "Рынок «Саяхат» в Костанае онлайн: каталог магазинов и товаров, навигация по павильонам. Мясо и колбасы, овощи и фрукты, сладости и бакалея, одежда, обувь, детское, дом и электроника. Карбышева 131.",
    openGraph: {
      type: "website",
      siteName: kz ? "«Саяхат» базары" : "Рынок Саяхат",
      locale: kz ? "kk_KZ" : "ru_RU",
      title: kz
        ? "«Саяхат» базары — барлық дүкендер онлайн"
        : "Рынок Саяхат — все магазины онлайн",
      description: kz
        ? "«Саяхат» базарының дүкендер каталогы, Қостанай. Павильондар бойынша навигация, орын жалдау, қалай жетуге болады."
        : "Каталог магазинов рынка «Саяхат», Костанай. Навигация по павильонам, аренда мест, как добраться.",
      images: ["/og.png"],
    },
    twitter: { card: "summary_large_image" },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
    },
  };
}

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

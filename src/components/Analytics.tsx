import Script from "next/script";

/**
 * Счётчики Метрики и GA4. Без переменных окружения не рендерится ничего.
 *
 * Оба счётчика намеренно НЕ шлют просмотр страницы сами:
 * у Метрики за это отвечает `defer: true`, у GA4 — `send_page_view: false`.
 * Все просмотры отправляет компонент PageViews.
 *
 * Причина: Next.js меняет страницы без перезагрузки. Если оставить
 * автоматическую отправку, счётчик посчитает только первый просмотр, а
 * PageViews — все последующие. На стыке это расходится: пока грузится
 * tag.js, посетитель успевает уйти с первой страницы, инициализация
 * срабатывает уже на второй — и первая теряется, а вторая считается
 * дважды. Когда отправка ровно в одном месте, такого стыка нет.
 */
export function Analytics() {
  const ym = process.env.NEXT_PUBLIC_YM_ID;
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  if (!ym && !ga) return null;

  return (
    <>
      {ym && (
        <>
          <Script id="ym" strategy="afterInteractive">
            {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${ym}", "ym");
ym(${ym}, "init", {ssr:true, defer:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});`}
          </Script>
          <noscript>
            <div>
              <img src={`https://mc.yandex.ru/watch/${ym}`} style={{ position: "absolute", left: "-9999px" }} alt="" />
            </div>
          </noscript>
        </>
      )}
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga}', { send_page_view: false });`}
          </Script>
        </>
      )}
    </>
  );
}

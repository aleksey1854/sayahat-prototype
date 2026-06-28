/* ============================================================
   Саяхат — интерактив прототипа
   чат-бот · scroll-анимации · фильтр каталога · RU/KZ
   ============================================================ */
(function () {
  "use strict";

  /* ---------- стили виджетов (инжектим, чтобы работало на любой странице) ---------- */
  var css = `
  [data-reveal]{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease}
  [data-reveal].seen{opacity:1;transform:none}
  .assistant{position:fixed;right:22px;bottom:22px;z-index:90;font-family:var(--font-body)}
  .assistant__fab{display:flex;align-items:center;gap:10px;background:var(--brand);color:#fff;border:0;
    padding:14px 20px;border-radius:999px;font-weight:700;font-size:15px;cursor:pointer;
    box-shadow:var(--shadow);transition:transform .15s ease,background .2s ease}
  .assistant__fab:hover{transform:translateY(-2px);background:var(--brand-700)}
  .assistant__fab svg{width:20px;height:20px}
  .assistant__panel{position:absolute;right:0;bottom:70px;width:340px;max-width:84vw;background:var(--surface);
    border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow-lg);overflow:hidden;
    display:none;flex-direction:column}
  .assistant.open .assistant__panel{display:flex;animation:apop .18s ease}
  @keyframes apop{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  .assistant__head{background:var(--brand);color:#fff;padding:16px 18px;display:flex;align-items:center;gap:11px}
  .assistant__head .dot{width:9px;height:9px;border-radius:50%;background:#7DE0B4;box-shadow:0 0 0 3px rgba(125,224,180,.25)}
  .assistant__head b{font-size:15px;font-weight:700}
  .assistant__head span{font-size:12px;color:rgba(255,255,255,.75);display:block}
  .assistant__head button{margin-left:auto;background:transparent;border:0;color:#fff;cursor:pointer;opacity:.8}
  .assistant__head button:hover{opacity:1}
  .assistant__body{padding:16px;max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;background:var(--bg)}
  .msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.5}
  .msg.bot{background:var(--surface);border:1px solid var(--line);border-bottom-left-radius:4px;align-self:flex-start;color:var(--ink-soft)}
  .msg.me{background:var(--brand);color:#fff;border-bottom-right-radius:4px;align-self:flex-end}
  .msg a{color:var(--brand-700);font-weight:700;text-decoration:underline}
  .msg.me a{color:#fff}
  .quicks{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;border-top:1px solid var(--line);background:var(--surface)}
  .quick{font-family:var(--font-body);font-size:13px;font-weight:600;cursor:pointer;background:var(--brand-50);
    color:var(--brand-700);border:1px solid var(--line);padding:8px 12px;border-radius:999px;transition:all .15s ease}
  .quick:hover{background:var(--brand);color:#fff;border-color:var(--brand)}
  @media(max-width:560px){.assistant{right:14px;bottom:14px}.assistant__fab span{display:none}}
  `;
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* ---------- scroll-анимации ---------- */
  function initReveal() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var els = document.querySelectorAll(".section, .hero, .cat-hero, .store, .news-card");
    els.forEach(function (el, i) { el.setAttribute("data-reveal", ""); el.style.transitionDelay = (i % 3) * 60 + "ms"; });
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("seen"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("seen"); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- фильтр каталога (только если есть .stores) ---------- */
  function initCatalog() {
    var grid = document.querySelector(".stores"); if (!grid) return;
    var chips = document.querySelectorAll(".cat-chip");
    var search = document.getElementById("store-search");
    var empty = document.querySelector(".no-results");
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".store"));
    var cat = "all";
    function apply() {
      var q = (search && search.value || "").trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var okCat = cat === "all" || c.dataset.cat === cat;
        var okQ = !q || c.dataset.name.toLowerCase().indexOf(q) > -1 || (c.dataset.cat || "").indexOf(q) > -1;
        var vis = okCat && okQ; c.style.display = vis ? "" : "none"; if (vis) shown++;
      });
      if (empty) empty.style.display = shown ? "none" : "block";
    }
    chips.forEach(function (ch) {
      ch.addEventListener("click", function () {
        chips.forEach(function (x) { x.classList.remove("on"); });
        ch.classList.add("on"); cat = ch.dataset.cat; apply();
      });
    });
    if (search) search.addEventListener("input", apply);
  }

  /* ---------- RU / KZ ---------- */
  function initLang() {
    var box = document.querySelector(".lang"); if (!box) return;
    box.addEventListener("click", function (e) {
      var btn = e.target.closest("button"); if (!btn) return;
      var lang = btn.dataset.lang;
      box.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b === btn); });
      document.querySelectorAll("[data-ru]").forEach(function (el) {
        if (!el.dataset.ru) el.dataset.ru = el.textContent;
        el.textContent = lang === "kz" ? (el.dataset.kz || el.dataset.ru) : el.dataset.ru;
      });
    });
  }

  /* ---------- чат-бот «Помощник базара» ---------- */
  var FLOW = {
    start: { quicks: ["Где купить орехи и сухофрукты?", "Часы работы базара", "Как стать арендатором?", "Найти магазин"] },
    "Где купить орехи и сухофрукты?": "Это лавка «Дастархан» — ряд Б, павильон №14, напротив главного входа. Своя обжарка, опт и розница. <a href='shop.html'>Открыть магазин →</a>",
    "Часы работы базара": "Базар Саяхат работает <b>Пн–Вс, 8:00–19:00</b>, без выходных. У некоторых магазинов часы могут отличаться — смотрите на их странице.",
    "Как стать арендатором?": "Очень просто: жмёте «Добавить магазин», за 10 минут собираете свой лендинг в конструкторе из готовых блоков и публикуете. Помощь и SEO-настройки — внутри. <a href='constructor.html'>Открыть конструктор →</a>",
    "Найти магазин": "Напишите, что ищете — еда, одежда, обувь, сладости, электроника — и я подскажу ряд и павильон. Или листайте каталог на главной. <a href='index.html'>Все магазины →</a>"
  };
  function initBot() {
    var box = document.createElement("div"); box.className = "assistant";
    box.innerHTML =
      '<div class="assistant__panel">' +
        '<div class="assistant__head"><span class="dot"></span><div><b>Помощник базара</b><span>обычно отвечает сразу</span></div>' +
          '<button aria-label="Закрыть" data-close><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
        '<div class="assistant__body"></div>' +
        '<div class="quicks"></div>' +
      '</div>' +
      '<button class="assistant__fab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-12.5 7.3L3 21l2.2-5.4A8.5 8.5 0 1 1 21 11.5z"/></svg><span data-ru data-kz="Көмек" >Помощник</span></button>';
    document.body.appendChild(box);
    var fab = box.querySelector(".assistant__fab");
    var body = box.querySelector(".assistant__body");
    var quicks = box.querySelector(".quicks");
    var greeted = false;
    function add(text, who) {
      var m = document.createElement("div"); m.className = "msg " + who; m.innerHTML = text;
      body.appendChild(m); body.scrollTop = body.scrollHeight;
    }
    function renderQuicks() {
      quicks.innerHTML = "";
      FLOW.start.quicks.forEach(function (q) {
        var b = document.createElement("button"); b.className = "quick"; b.textContent = q;
        b.addEventListener("click", function () {
          add(q, "me");
          setTimeout(function () { add(FLOW[q] || "Подскажу — напишите продавцу в WhatsApp, ответят быстро.", "bot"); }, 350);
        });
        quicks.appendChild(b);
      });
    }
    fab.addEventListener("click", function () {
      box.classList.toggle("open");
      if (box.classList.contains("open") && !greeted) {
        greeted = true;
        add("Салам! Я помощник базара Саяхат. Помогу найти магазин, узнать часы работы или подсказать, как открыть свою точку.", "bot");
        renderQuicks();
      }
    });
    box.querySelector("[data-close]").addEventListener("click", function () { box.classList.remove("open"); });
    window.openAssistant = function () { if (!box.classList.contains("open")) fab.click(); };
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReveal(); initCatalog(); initLang(); initBot();
  });
})();

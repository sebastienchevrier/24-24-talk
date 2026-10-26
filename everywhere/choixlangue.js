/* 24/24 ONE WORLD — choix de la langue : liste A → Z avec barre de recherche. © 2026 Sébastien Chevrier. Tous droits réservés.
   Chargé par le portail et par TALK. Toute liste de langues (menu <select> de 20 choix ou plus) est remplacée à l'écran par un
   bouton ; le toucher ouvre une fenêtre avec une recherche (sans accents, sur le nom ou le code) et la liste triée par ordre
   alphabétique, « Vos langues » (choisie + récentes) en premier. Le menu d'origine reste dans la page, caché : il garde la
   valeur et reçoit l'événement « change » comme avant, donc le reste de l'appli ne change pas. */
(function () {
  "use strict";
  var MIN = 20; // en dessous (ex. langue de l'interface, 11 choix), le menu normal suffit
  var RECENT_KEY = "ew_lang_recent";
  var T = {
    fr: { search: "Rechercher une langue", mine: "Vos langues", all: "Toutes les langues (A → Z)", none: "Aucune langue trouvée.", close: "Fermer", choose: "Choisir la langue" },
    en: { search: "Search for a language", mine: "Your languages", all: "All languages (A → Z)", none: "No language found.", close: "Close", choose: "Choose the language" },
    es: { search: "Buscar un idioma", mine: "Tus idiomas", all: "Todos los idiomas (A → Z)", none: "No se ha encontrado ningún idioma.", close: "Cerrar", choose: "Elegir el idioma" },
    pt: { search: "Procurar uma língua", mine: "As suas línguas", all: "Todas as línguas (A → Z)", none: "Nenhuma língua encontrada.", close: "Fechar", choose: "Escolher a língua" },
    de: { search: "Sprache suchen", mine: "Ihre Sprachen", all: "Alle Sprachen (A → Z)", none: "Keine Sprache gefunden.", close: "Schließen", choose: "Sprache wählen" },
    it: { search: "Cerca una lingua", mine: "Le tue lingue", all: "Tutte le lingue (A → Z)", none: "Nessuna lingua trovata.", close: "Chiudi", choose: "Scegli la lingua" },
    zh: { search: "搜索语言", mine: "你的语言", all: "所有语言", none: "未找到语言。", close: "关闭", choose: "选择语言" },
    ja: { search: "言語を検索", mine: "あなたの言語", all: "すべての言語", none: "言語が見つかりません。", close: "閉じる", choose: "言語を選択" },
    ar: { search: "ابحث عن لغة", mine: "لغاتك", all: "كل اللغات", none: "لم يتم العثور على أي لغة.", close: "إغلاق", choose: "اختر اللغة" },
    ru: { search: "Найти язык", mine: "Ваши языки", all: "Все языки (А → Я)", none: "Язык не найден.", close: "Закрыть", choose: "Выбрать язык" },
    mg: { search: "Hitady fiteny", mine: "Ny fiteninao", all: "Ny fiteny rehetra (A → Z)", none: "Tsy nahitana fiteny.", close: "Hidio", choose: "Fidio ny fiteny" }
  };
  function L() {
    var l = "";
    try { l = localStorage.getItem("lc_uilang") || ""; } catch (e) { /* stockage bloqué */ }
    if (!l || l === "auto") l = document.documentElement.lang || navigator.language || "fr";
    l = String(l).toLowerCase();
    var X = window.EW_CHOIX || {}, c = /^zh-(tw|hk|mo|hant)/.test(l) ? "zh-TW" : l.split("-")[0];
    return Object.assign({}, T.en, T[c] || X[c] || {});
  }
  function fold(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // « 🇯🇵 日本語 · Japonais » → drapeau « 🇯🇵 », nom de tri « Japonais » ; « 🇬🇧 Anglais » → « Anglais ».
  function parts(text) {
    var m = String(text).match(/^([^\p{L}\p{N}]*)(.*)$/u) || ["", "", text];
    var rest = m[2].trim(), sortName = rest.indexOf(" · ") > -1 ? rest.split(" · ").pop() : rest;
    return { flag: m[1].trim(), label: rest, sortName: sortName };
  }
  function recent() { try { var r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); return Array.isArray(r) ? r : []; } catch (e) { return []; } }
  function remember(code) {
    var r = recent().filter(function (c) { return c !== code; });
    r.unshift(code);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, 6))); } catch (e) { /* stockage bloqué */ }
  }

  var css = false;
  function addCss() {
    if (css) return;
    css = true;
    var st = document.createElement("style");
    st.textContent =
      "select.ewl-hidden{position:absolute !important;width:1px !important;height:1px !important;min-width:0 !important;min-height:0 !important;padding:0 !important;border:0 !important;margin:0 !important;opacity:0 !important;pointer-events:none !important;overflow:hidden;}" +
      ".ewl-btn{display:inline-flex;align-items:center;gap:8px;min-height:44px;max-width:100%;min-width:0;flex:0 1 auto;padding:0 12px;border-radius:10px;border:1px solid var(--line,#25325a);" +
      "background:var(--panel,#111a30);color:var(--text,#eef3ff);font:inherit;font-size:16px;font-weight:600;text-transform:none;letter-spacing:0;cursor:pointer;text-align:left;}" +
      ".ewl-btn span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}.ewl-btn::after{content:'▾';opacity:.7;flex:none;}" +
      ".ewl-sheet{position:fixed;inset:0;z-index:3000;display:flex;flex-direction:column;background:rgba(0,0,0,.45);}" +
      ".ewl-panel{margin-top:auto;max-height:92%;height:92%;display:flex;flex-direction:column;background:var(--panel,#111a30);color:var(--text,#eef3ff);" +
      "border-radius:18px 18px 0 0;box-shadow:0 -8px 30px rgba(0,0,0,.3);padding-bottom:env(safe-area-inset-bottom,0px);}" +
      ".ewl-top{display:flex;gap:8px;align-items:center;padding:12px 12px 8px;}" +
      ".ewl-q{flex:1;min-width:0;min-height:48px;border-radius:12px;border:2px solid var(--line,#25325a);background:var(--bg,#050913);color:var(--text,#eef3ff);font-size:17px;padding:0 14px;}" +
      ".ewl-q:focus{outline:none;border-color:var(--teal,#1fe2cd);}" +
      ".ewl-x{flex:none;min-width:48px;min-height:48px;border-radius:12px;border:1px solid var(--line,#25325a);background:transparent;color:inherit;font-size:20px;cursor:pointer;}" +
      ".ewl-list{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:0 8px 12px;}" +
      ".ewl-h{margin:12px 8px 4px;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--muted,#9fb0d4);}" +
      ".ewl-it{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;padding:0 12px;border:0;border-radius:12px;background:transparent;color:inherit;font-size:18px;text-align:left;cursor:pointer;}" +
      ".ewl-it:active,.ewl-it:focus-visible{background:var(--panel2,rgba(127,127,127,.15));}" +
      ".ewl-it .f{font-size:24px;width:30px;flex:none;text-align:center;}.ewl-it .n{flex:1;min-width:0;}" +
      ".ewl-it[aria-selected=true]{font-weight:800;}.ewl-it[aria-selected=true]::after{content:'✓';color:var(--teal,#1fe2cd);font-weight:900;}" +
      ".ewl-none{padding:24px 12px;color:var(--muted,#9fb0d4);}";
    document.head.appendChild(st);
  }

  function opts(sel) {
    return Array.prototype.map.call(sel.options, function (o) { var p = parts(o.textContent); return { value: o.value, flag: p.flag, label: p.label, sortName: p.sortName, key: fold(o.textContent + " " + o.value) }; });
  }
  function labelOf(sel) {
    var o = sel.options[sel.selectedIndex];
    return o ? o.textContent : "";
  }
  function refresh(sel) {
    var b = sel._ewlBtn;
    if (b) b.querySelector("span").textContent = labelOf(sel);
  }
  // La valeur peut être changée par le code (bouton ⇅, voix…) sans événement : le bouton suit quand même.
  var VALUE = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  var INDEX = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "selectedIndex");
  function enhance(sel) {
    if (sel._ewlBtn || sel.multiple || sel.options.length < MIN) return;
    addCss();
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ewl-btn";
    b.setAttribute("aria-haspopup", "dialog");
    b.setAttribute("aria-label", (sel.getAttribute("aria-label") || L().choose) + " : " + labelOf(sel));
    b.innerHTML = "<span></span>";
    if (sel.id) b.id = sel.id + "Pick";
    sel._ewlBtn = b;
    sel.classList.add("ewl-hidden");
    sel.tabIndex = -1;
    sel.setAttribute("aria-hidden", "true");
    sel.insertAdjacentElement("afterend", b);
    refresh(sel);
    try {
      Object.defineProperty(sel, "value", { configurable: true, get: function () { return VALUE.get.call(this); }, set: function (v) { VALUE.set.call(this, v); refresh(this); } });
      Object.defineProperty(sel, "selectedIndex", { configurable: true, get: function () { return INDEX.get.call(this); }, set: function (v) { INDEX.set.call(this, v); refresh(this); } });
    } catch (e) { /* ancien navigateur : le bouton suit au prochain « change » */ }
    sel.addEventListener("change", function () { refresh(sel); });
    b.addEventListener("click", function () { open(sel); });
  }

  var sheet = null;
  function close() {
    if (!sheet) return;
    var s = sheet; sheet = null;
    s.el.remove();
    document.removeEventListener("keydown", s.key, true);
    if (s.sel._ewlBtn && document.contains(s.sel._ewlBtn)) s.sel._ewlBtn.focus();
  }
  function open(sel) {
    close();
    var S = L(), all = opts(sel), cur = sel.value;
    var lang = Object.keys(T).filter(function (k) { return T[k] === S; })[0] || "en";
    all.sort(function (a, b) { return a.sortName.localeCompare(b.sortName, lang, { sensitivity: "base" }); });
    var byVal = {}; all.forEach(function (o) { byVal[o.value] = o; });
    var mine = [cur].concat(recent()).filter(function (v, i, a) { return byVal[v] && a.indexOf(v) === i; }).slice(0, 5).map(function (v) { return byVal[v]; });
    var el = document.createElement("div");
    el.className = "ewl-sheet";
    el.id = "ewlSheet";
    el.innerHTML = '<div class="ewl-panel" role="dialog" aria-modal="true" aria-label="' + esc(sel.getAttribute("aria-label") || S.choose) + '">' +
      '<div class="ewl-top"><input class="ewl-q" id="ewlQ" type="search" autocomplete="off" enterkeyhint="search" placeholder="🔍 ' + esc(S.search) + '" aria-label="' + esc(S.search) + '">' +
      '<button type="button" class="ewl-x" id="ewlClose" aria-label="' + esc(S.close) + '">✕</button></div>' +
      '<div class="ewl-list" id="ewlList" role="listbox"></div></div>';
    document.body.appendChild(el);
    var list = el.querySelector("#ewlList"), q = el.querySelector("#ewlQ");
    function item(o) {
      return '<button type="button" class="ewl-it" role="option" data-v="' + esc(o.value) + '" aria-selected="' + (o.value === cur) + '"><span class="f" aria-hidden="true">' +
        esc(o.flag) + '</span><span class="n">' + esc(o.label) + "</span></button>";
    }
    function paint() {
      var f = fold(q.value.trim());
      if (!f) {
        list.innerHTML = (mine.length ? '<p class="ewl-h">' + esc(S.mine) + "</p>" + mine.map(item).join("") : "") +
          '<p class="ewl-h">' + esc(S.all) + "</p>" + all.map(item).join("");
        return;
      }
      // D'abord les langues dont un mot commence par la recherche (« an » → Anglais avant Roumain), puis les autres.
      var words = function (o) { return fold(o.label + " " + o.sortName).split(/[\s·()\-]+/); };
      var first = [], rest = [];
      all.forEach(function (o) {
        if (o.key.indexOf(f) < 0) return;
        (words(o).some(function (w) { return w.indexOf(f) === 0; }) || fold(o.value) === f ? first : rest).push(o);
      });
      var hits = first.concat(rest);
      list.innerHTML = hits.length ? hits.map(item).join("") : '<p class="ewl-none">' + esc(S.none) + "</p>";
    }
    paint();
    q.addEventListener("input", paint);
    q.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var b = list.querySelector(".ewl-it");
      if (b) b.click();
    });
    list.addEventListener("click", function (e) {
      var b = e.target.closest(".ewl-it");
      if (!b) return;
      var v = b.getAttribute("data-v");
      remember(v);
      close();
      if (v !== sel.value) {
        sel.value = v;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    el.addEventListener("click", function (e) { if (e.target === el) close(); });
    el.querySelector("#ewlClose").addEventListener("click", close);
    var key = function (e) { if (e.key === "Escape") { e.preventDefault(); close(); } };
    document.addEventListener("keydown", key, true);
    sheet = { el: el, sel: sel, key: key };
    q.focus();
  }

  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.tagName === "SELECT") { if (node._ewlBtn) refresh(node); else enhance(node); return; }
    if (node.tagName === "OPTION" || node.tagName === "OPTGROUP") { scan(node.closest("select")); return; }
    if (node.querySelectorAll) Array.prototype.forEach.call(node.querySelectorAll("select"), function (s) { scan(s); });
  }
  function start() {
    scan(document.body);
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.target.tagName === "SELECT" || m.target.tagName === "OPTGROUP") scan(m.target.tagName === "SELECT" ? m.target : m.target.closest("select"));
        Array.prototype.forEach.call(m.addedNodes, scan);
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  window.EWChoixLangue = { enhance: enhance, open: open, close: close };
})();

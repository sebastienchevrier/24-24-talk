/* 24/24 ONE WORLD — coquille commune. © 2026 Sébastien Chevrier. Tous droits réservés.
   Une seule barre du haut et une seule barre du bas, partagées par toutes les pages de 24/24 ONE WORLD :
   le portail (everywhere/) et 24/24 TALK (index.html). Chaque application reste une page à part entière
   (pas de cadre) : on change de page, pas d'univers. Aucune donnée, aucune connexion au serveur ici. */
(function () {
  "use strict";
  var ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    apps: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    talk: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
    learn: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/><path d="M22 9v6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
  };
  var LABELS = {
    fr: { home: "Accueil", apps: "Applications", talk: "Talk", everywhere: "Everywhere", learn: "Learn", profile: "Profil", settings: "Paramètres", nav: "Navigation principale", brand: "24/24 TALK, accueil de 24/24 ONE WORLD" , msg: "Messagerie", phone: "Téléphone", tr: "Traduire", learnv: "Apprendre"},
    en: { home: "Home", apps: "Apps", talk: "Talk", everywhere: "Everywhere", learn: "Learn", profile: "Profile", settings: "Settings", nav: "Main navigation", brand: "24/24 TALK, 24/24 ONE WORLD home" , msg: "Messages", phone: "Phone", tr: "Translate", learnv: "Learn"},
    es: {"home": "Inicio", "apps": "Aplicaciones", "talk": "Talk", "everywhere": "Everywhere", "learn": "Learn", "profile": "Perfil", "settings": "Ajustes", "nav": "Navegación principal", "brand": "24/24 TALK, inicio de 24/24 ONE WORLD", "msg": "Mensajes", "phone": "Teléfono", "tr": "Traducir", "learnv": "Aprender"},
    pt: {"home": "Início", "apps": "Aplicações", "talk": "Talk", "everywhere": "Everywhere", "learn": "Learn", "profile": "Perfil", "settings": "Definições", "nav": "Navegação principal", "brand": "24/24 TALK, início da 24/24 ONE WORLD", "msg": "Mensagens", "phone": "Telefone", "tr": "Traduzir", "learnv": "Aprender"},
    de: {"home": "Start", "apps": "Apps", "talk": "Talk", "everywhere": "Everywhere", "learn": "Learn", "profile": "Profil", "settings": "Einstellungen", "nav": "Hauptnavigation", "brand": "24/24 TALK, Startseite von 24/24 ONE WORLD", "msg": "Nachrichten", "phone": "Telefon", "tr": "Übersetzen", "learnv": "Lernen"},
    it: {"home": "Home", "apps": "App", "talk": "Talk", "everywhere": "Everywhere", "learn": "Learn", "profile": "Profilo", "settings": "Impostazioni", "nav": "Navigazione principale", "brand": "24/24 TALK, home di 24/24 ONE WORLD", "msg": "Messaggi", "phone": "Telefono", "tr": "Traduci", "learnv": "Imparare"},
    zh: {"home": "首页", "apps": "应用", "talk": "Talk", "everywhere": "Everywhere", "learn": "Learn", "profile": "我的", "settings": "设置", "nav": "主导航", "brand": "24/24 TALK，24/24 ONE WORLD 首页", "msg": "消息", "phone": "电话", "tr": "翻译", "learnv": "学习"},
    ja: {"home": "ホーム", "apps": "アプリ", "talk": "Talk", "everywhere": "Everywhere", "learn": "Learn", "profile": "プロフィール", "settings": "設定", "nav": "メインナビゲーション", "brand": "24/24 TALK、24/24 ONE WORLD のホーム", "msg": "メッセージ", "phone": "電話", "tr": "翻訳", "learnv": "学ぶ"},
    ar: {"home": "الرئيسية", "apps": "التطبيقات", "talk": "Talk", "everywhere": "Everywhere", "learn": "Learn", "profile": "ملفي", "settings": "الإعدادات", "nav": "التنقل الرئيسي", "brand": "24/24 TALK، الصفحة الرئيسية لـ 24/24 ONE WORLD", "msg": "الرسائل", "phone": "الهاتف", "tr": "ترجمة", "learnv": "تعلّم"},
    ru: {"home": "Главная", "apps": "Приложения", "talk": "Talk", "everywhere": "Everywhere", "learn": "Learn", "profile": "Профиль", "settings": "Настройки", "nav": "Основная навигация", "brand": "24/24 TALK, главная 24/24 ONE WORLD", "msg": "Сообщения", "phone": "Телефон", "tr": "Перевод", "learnv": "Учиться"},
    mg: {"home": "Fandraisana", "apps": "Rindranasa", "talk": "Talk", "everywhere": "Everywhere", "learn": "Learn", "profile": "Momba ahy", "settings": "Fikirakirana", "nav": "Fitetezana lehibe", "brand": "24/24 TALK, fandraisana 24/24 ONE WORLD", "msg": "Hafatra", "phone": "Telefaonina", "tr": "Handika", "learnv": "Mianara"}
  };
  var VER = "0.8.5";
  function svg(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>"; }
  function langOf() {
    var p = null;
    try { p = localStorage.getItem("lc_uilang"); } catch (e) { p = null; }
    var l = p && p !== "auto" ? p : (navigator.language || "fr");
    return /^fr/i.test(l) ? "fr" : "en";
  }
  // Langue de l'écran (0.8.2) : les 11 langues incluses dans TALK ; les autres passent en anglais.
  // langOf() reste « fr » ou « en » pour les modules qui n'existent que dans ces deux langues.
  var UI_LANGS = ["fr", "en", "es", "pt", "de", "it", "zh", "ja", "ar", "ru", "mg"];
  function uiLangOf() {
    var p = null;
    try { p = localStorage.getItem("lc_uilang"); } catch (e) { p = null; }
    var l = String(p && p !== "auto" ? p : (navigator.language || "fr")).toLowerCase();
    if (/^zh-(tw|hk|mo|hant)/.test(l)) return "en"; // chinois traditionnel : pas encore traduit ici
    l = l.slice(0, 2);
    return UI_LANGS.indexOf(l) !== -1 ? l : "en";
  }

  // Barre du bas unique de 24/24 ONE WORLD (19 oct. 2026), la même que dans TALK :
  // Accueil · Messagerie · Téléphone · Traduire · Apprendre. Le profil s'ouvre depuis la barre du haut.
  // root = chemin vers la racine du site ; inPortal = liens internes du portail (#/…).
  function items(root, inPortal) {
    var ew = inPortal ? "" : root + "everywhere/";
    return [
      { id: "accueil", href: root + "index.html", icon: "home", key: "home" },
      { id: "msg", href: root + "index.html?b=msg", icon: "talk", key: "msg" },
      { id: "call", href: root + "index.html?b=call", icon: "phone", key: "phone" },
      { id: "tr", href: root + "index.html?b=tr", icon: "globe", key: "tr" },
      { id: "learn", href: ew + "#/learn", icon: "learn", key: "learnv" }
    ];
  }
  function navHtml(root, inPortal, active, lang) {
    var L = LABELS[lang] || LABELS[uiLangOf()] || LABELS.en;
    return items(root, inPortal).map(function (n) {
      return '<a href="' + n.href + '" data-nav="' + n.id + '"' + (n.id === active ? ' aria-current="page"' : "") + ">" +
        svg(n.icon) + "<span>" + L[n.key] + "</span></a>";
    }).join("");
  }

  // TALK dans la coquille : barre du haut (logo, nom, roue dentée = réglages de TALK) et barre du bas, TALK actif.
  function mountTalk() {
    if (document.getElementById("ewsTop")) return;
    var root = "./";
    var lang = uiLangOf(), L = LABELS[lang] || LABELS.en;
    var top = document.createElement("header");
    top.className = "topbar ews-top";
    top.id = "ewsTop";
    top.innerHTML = '<a class="brand" href="' + root + 'everywhere/#/accueil" aria-label="' + L.brand + '">' +
      '<img src="' + root + 'everywhere/logo.svg" alt="" width="36" height="36">' +
      '<span class="brand-txt"><b>24/24</b> <span>ONE WORLD</span></span></a>' +
      '<span class="topbar-title"></span>' +
      '<button type="button" class="icon-btn" id="ewsSettings" aria-label="' + L.settings + '">' + svg("gear") + "</button>";
    var banner = document.querySelector(".test-banner");
    if (banner && banner.parentNode === document.body) banner.insertAdjacentElement("afterend", top);
    else document.body.insertBefore(top, document.body.firstChild);
    var slot = document.getElementById("ewsTopSlot");
    if (slot) slot.remove(); // place réservée par TALK : la vraie barre la remplace dans la même image
    top.querySelector("#ewsSettings").addEventListener("click", function () {
      var b = document.getElementById("settingsBtn");
      if (b) b.click();
    });
    var nav = document.createElement("nav");
    nav.className = "mainnav ews-nav";
    nav.id = "ewsNav";
    nav.setAttribute("aria-label", L.nav);
    nav.innerHTML = navHtml(root, false, "talk", lang);
    // 19 oct. 2026 : TALK garde sa propre barre du bas (la même partout) ; la coquille n'ajoute que la barre du haut.
    void nav;
    // VOICE : le même bouton micro que dans le portail (chargé seulement si le navigateur sait reconnaître la voix).
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      var vs = document.createElement("script");
      vs.src = root + "everywhere/voix.js?v=" + VER;
      vs.onload = function () { if (window.EWVoix) window.EWVoix.mount({ root: root, portal: false, lang: lang, before: top.querySelector("#ewsSettings") }); };
      document.head.appendChild(vs);
    }
  }

  window.EWShell = { navHtml: navHtml, items: items, mountTalk: mountTalk, icons: ICONS, lang: langOf, uiLang: uiLangOf };
  if (document.documentElement.classList.contains("ew-shell")) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountTalk);
    else mountTalk();
  }
})();

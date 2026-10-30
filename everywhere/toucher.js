/* © 2026 Sébastien Chevrier. Tous droits réservés.
   24/24 ONE WORLD — couche d'interaction premium, version 2 (30 oct. 2026), commune à toute l'appli.
   Base : proposition ChatGPT « Premium Interaction 2.0.0 », corrigée et complétée par Claude :
   - aucun bouton ne change de mise en page (l'onde est dessinée par-dessus la page, pas d'overflow forcé) ;
   - appui : le bouton s'enfonce, onde orange depuis le doigt, vibration très courte sur Android
     (désactivable : localStorage « ow_vibre » = "0") ; plusieurs doigts gérés séparément ;
   - chaque espace garde ses couleurs : l'onde prend la couleur du bouton touché ; l'orange (#ffc46b → #ff7a1a,
     texte sombre) est réservé à la porte d'entrée ONE WORLD (inscription, Installer, data-ow-primary), sans !important ;
   - le ✓ n'apparaît qu'après une vraie réussite (OWMotion.success), jamais au simple clic ;
   - réussite et erreur sont aussi dites en texte (lecteur d'écran), pas seulement animées ;
   - respecte « réduire les animations » du téléphone et les réglages de l'appli html.motion-off / html.ow-reduce-motion (effet immédiat).
   Rien n'est envoyé sur Internet. */
(function () {
  "use strict";
  if (window.__owToucher) return;
  window.__owToucher = true;

  var VERSION = "2.0.0";
  var BOUTONS = "button, [role=button], .btn, .primary, [data-ow-interactive], .home-tile, .ew-card, .chip, a.tile, a.card";
  var PRINCIPAL = ".btn.primary, .ob-go, .install-top-btn, [data-ow-primary]";
  var ORANGE = ".ob-go, .install-top-btn, [data-ow-primary]";
  var MAX_ONDES = 4;

  // État des doigts posés (déclaré avant le premier calcul de « réduire les animations », qui peut tout relâcher).
  var actifs = new Map();          // pointerId → bouton enfoncé
  var appuis = new WeakMap();      // bouton → nombre de doigts dessus
  var clavier = null;              // bouton enfoncé au clavier

  var mq = null;
  try { mq = window.matchMedia("(prefers-reduced-motion: reduce)"); } catch (e) { /* ignoré */ }
  var reduce = false;
  function majReduce() {
    reduce = !!((mq && mq.matches) || document.documentElement.classList.contains("ow-reduce-motion") || document.documentElement.classList.contains("motion-off"));
    if (reduce) toutRelacher();
  }
  try { if (mq && mq.addEventListener) mq.addEventListener("change", majReduce); else if (mq && mq.addListener) mq.addListener(majReduce); } catch (e) { /* ignoré */ }
  // Réglage manuel : une classe posée sur <html> prend effet tout de suite.
  if (window.MutationObserver) new MutationObserver(majReduce).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  var R = ":is(html.ow-reduce-motion,html.motion-off) ";
  var css = document.createElement("style");
  css.setAttribute("data-ow-toucher", VERSION);
  css.textContent = [
    // Orange de la porte d'entrée : « html » devant suffit à passer devant les anciennes couleurs, sans !important.
    "html .ob-go,html .install-top-btn,html [data-ow-primary]{background:linear-gradient(90deg,#ffc46b,#ff7a1a);color:#1f0d00;border-color:transparent;}",
    ":root{--ow-accent:#ff9a3c;--ow-accent-light:#ffc46b;--ow-accent-strong:#ff7a1a;--ow-glow:0 0 0 1px rgba(255,140,40,.20),0 0 16px rgba(255,140,40,.16);}",
    ":where(button,[role=button],.btn,.primary,[data-ow-interactive],.home-tile,.ew-card,.chip,a.tile,a.card){-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform 130ms ease,filter 130ms ease;}",
    ".ow-press{transform:translateY(1px) scale(.98);filter:brightness(1.06);}",
    ".ow-liquide.ow-press{border-radius:18px;transform:scale(.975);filter:saturate(1.08) brightness(1.05);}",
    // Contour clavier identique partout.
    ":where(button,[role=button],a[href],input,select,textarea,.btn,.primary,[data-ow-interactive],.home-tile,.ew-card,.chip):focus-visible{outline:3px solid #ffc46b;outline-offset:3px;}",
    ":where(.ob-go,[data-ow-primary]){box-shadow:var(--ow-glow);}",
    "@media (hover:hover) and (pointer:fine){:where(.btn.primary,.ob-go,[data-ow-primary]):not(:disabled):hover{filter:brightness(1.05);}}",
    // Respiration seulement là où on la demande (data-ow-breathe), en opacité (peu coûteux), arrêtée page cachée.
    "[data-ow-breathe]{animation:owRespire 3s ease-in-out infinite;}",
    "@keyframes owRespire{0%,100%{opacity:1;}50%{opacity:.88;}}",
    "html.ow-page-hidden [data-ow-breathe]{animation:none;}",
    ".ow-onde{position:fixed;z-index:2147483000;pointer-events:none;width:12px;height:12px;border-radius:50%;",
    "background:radial-gradient(circle,rgba(255,255,255,.42) 0%,var(--ow-tint,rgba(255,140,40,.30)) 38%,transparent 72%);",
    "transform:translate(-50%,-50%) scale(0);animation:owOnde 320ms ease-out forwards;}",
    "@keyframes owOnde{to{transform:translate(-50%,-50%) scale(var(--ow-onde,18));opacity:0;}}",
    ".ow-ok{position:fixed;z-index:2147483001;pointer-events:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;",
    "font:900 16px/1 system-ui,sans-serif;color:#1f0d00;background:#ffc46b;transform:translate(-50%,-50%);animation:owOk 700ms ease forwards;}",
    "@keyframes owOk{0%{transform:translate(-50%,-50%) scale(.5);}30%{transform:translate(-50%,-50%) scale(1.08);}80%{opacity:1;}100%{transform:translate(-50%,-50%) scale(1);opacity:0;}}",
    "[data-ow-state]{position:relative;}",
    "[data-ow-state=loading]{cursor:progress;}",
    "[data-ow-state=loading]::after{content:'';position:absolute;right:14px;top:50%;width:15px;height:15px;margin-top:-8px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:owTourne 700ms linear infinite;}",
    "@keyframes owTourne{to{transform:rotate(360deg);}}",
    "[data-ow-state=success]{box-shadow:0 0 0 1px rgba(255,140,40,.42),0 0 14px rgba(255,140,40,.20);}",
    "[data-ow-state=error]{box-shadow:0 0 0 2px rgba(255,104,104,.65);}",
    ".ow-sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}",
    // Réduire les animations : réglage manuel et réglage du téléphone (le ✓ reste, sans mouvement).
    R + ".ow-press," + R + ".ow-liquide.ow-press{transform:none;filter:none;}",
    R + ".ow-onde{display:none;}" + R + "[data-ow-breathe]," + R + "[data-ow-state]::after," + R + ".ow-ok{animation:none;}",
    R + ".ow-ok{opacity:0;}",
    "@media (prefers-reduced-motion:reduce){.ow-press,.ow-liquide.ow-press{transform:none;filter:none;}.ow-onde{display:none;}",
    "[data-ow-breathe],[data-ow-state]::after,.ow-ok{animation:none;}.ow-ok{opacity:0;}}"
  ].join("");
  (document.head || document.documentElement).appendChild(css);

  function cible(t) {
    if (!t || !t.closest) return null;
    var el = t.closest(BOUTONS);
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return null;
    return el;
  }
  function enfoncer(el) {
    appuis.set(el, (appuis.get(el) || 0) + 1);
    el.classList.add("ow-press");
    if (el.matches(PRINCIPAL)) el.classList.add("ow-liquide");
  }
  function relever(el) {
    if (!el) return;
    var n = appuis.get(el) || 0;
    if (n <= 1) { appuis.delete(el); el.classList.remove("ow-press", "ow-liquide"); }
    else appuis.set(el, n - 1);
  }
  // Relâchement immédiat, doigt par doigt : un nouvel appui n'est jamais effacé par un ancien.
  function lacher(id) {
    if (!actifs.has(id)) return;
    var el = actifs.get(id);
    actifs.delete(id);
    relever(el);
  }
  function toutRelacher() {
    actifs.forEach(relever);
    actifs.clear();
    if (clavier) { relever(clavier); clavier = null; }
  }

  function retirer(n) { if (n && n.parentNode) n.parentNode.removeChild(n); }
  function onde(x, y, el) {
    if (reduce || !document.body) return;
    var vieilles = document.querySelectorAll(".ow-onde");
    for (var i = 0; i <= vieilles.length - MAX_ONDES; i++) retirer(vieilles[i]);
    var r = el.getBoundingClientRect();
    var o = document.createElement("span");
    o.className = "ow-onde";
    o.setAttribute("aria-hidden", "true");
    o.style.left = x + "px";
    o.style.top = y + "px";
    o.style.setProperty("--ow-tint", teinte(el));
    o.style.setProperty("--ow-onde", String(Math.min(Math.max(r.width, r.height) * 2.2, 320) / 12));
    o.addEventListener("animationend", function () { retirer(o); });
    document.body.appendChild(o);
    setTimeout(function () { retirer(o); }, 450);
  }
  // Couleur de l'onde = couleur du bouton touché (chaque espace garde la sienne), orange pour la porte d'entrée.
  function teinte(el) {
    if (el.matches(ORANGE)) return "rgba(255,140,40,.30)";
    var c = getComputedStyle(el), b = c.backgroundColor;
    var m = /rgba?\(([^)]+)\)/.exec(b && b !== "transparent" && !/,\s*0\)$/.test(b) ? b : c.color);
    if (!m) return "rgba(255,140,40,.30)";
    var v = m[1].split(",");
    return "rgba(" + v[0] + "," + v[1] + "," + v[2] + ",.32)";
  }
  function vibrer() {
    if (reduce || !navigator.vibrate) return;
    try { if (localStorage.getItem("ow_vibre") !== "0") navigator.vibrate(8); } catch (e) { /* ignoré */ }
  }

  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var el = cible(e.target);
    if (!el || actifs.has(e.pointerId)) return;
    if (!reduce) { actifs.set(e.pointerId, el); enfoncer(el); onde(e.clientX, e.clientY, el); }
    if (e.pointerType === "touch") vibrer();
  }, { passive: true, capture: true });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (n) {
    document.addEventListener(n, function (e) { lacher(e.pointerId); }, { passive: true, capture: true });
  });
  document.addEventListener("dragstart", toutRelacher, { passive: true, capture: true });
  document.addEventListener("scroll", function () { if (actifs.size) toutRelacher(); }, { passive: true, capture: true });
  window.addEventListener("blur", toutRelacher);
  function majVisible() {
    document.documentElement.classList.toggle("ow-page-hidden", !!document.hidden);
    if (document.hidden) toutRelacher();
  }
  document.addEventListener("visibilitychange", majVisible);
  majVisible();
  // Clavier : Espace ou Entrée enfoncent le bouton comme un doigt (aucune action ajoutée, le clic natif reste).
  document.addEventListener("keydown", function (e) {
    if (reduce || e.repeat || (e.key !== " " && e.key !== "Enter")) return;
    var el = cible(e.target);
    if (!el) return;
    if (clavier) relever(clavier);
    clavier = el;
    enfoncer(el);
  });
  document.addEventListener("keyup", function () { if (clavier) { relever(clavier); clavier = null; } });

  // Annonce en texte pour les lecteurs d'écran (réussite et erreur ne passent pas que par l'animation).
  var annonce = null;
  function dire(texte) {
    if (!texte || !document.body) return;
    if (!annonce) {
      annonce = document.createElement("div");
      annonce.className = "ow-sr";
      annonce.setAttribute("role", "status");
      annonce.setAttribute("aria-live", "polite");
      document.body.appendChild(annonce);
    }
    annonce.textContent = "";
    setTimeout(function () { annonce.textContent = texte; }, 30);
  }
  function coche(el) {
    if (!document.body || !el.getBoundingClientRect) return;
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    var k = document.createElement("span");
    k.className = "ow-ok";
    k.textContent = "✓";
    k.setAttribute("aria-hidden", "true");
    k.style.left = (r.right - Math.min(26, r.width / 4)) + "px";
    k.style.top = (r.top + r.height / 2) + "px";
    k.addEventListener("animationend", function () { retirer(k); });
    document.body.appendChild(k);
    setTimeout(function () { retirer(k); }, 800);
  }

  // États d'un bouton pendant une action. L'état « disabled » d'avant le chargement est toujours rendu tel quel.
  var avant = new WeakMap();
  function garder(el) { if ("disabled" in el && !avant.has(el)) avant.set(el, el.disabled); }
  function rendre(el) { if ("disabled" in el && avant.has(el)) { el.disabled = avant.get(el); avant.delete(el); } }
  function poser(el, s) {
    if (s) el.setAttribute("data-ow-state", s); else el.removeAttribute("data-ow-state");
    if (s === "loading") el.setAttribute("aria-busy", "true"); else el.removeAttribute("aria-busy");
  }
  function loading(el, on, opt) {
    if (!el) return;
    opt = opt || {};
    if (on) {
      poser(el, "loading");
      if ("disabled" in el && opt.disable !== false) { garder(el); el.disabled = true; }
    } else { poser(el, null); rendre(el); }
  }
  function success(el, opt) {
    if (!el) return;
    opt = opt || {};
    poser(el, "success");
    rendre(el);
    coche(el);
    dire(opt.message || "✓");
  }
  function error(el, opt) {
    if (!el) return;
    opt = opt || {};
    poser(el, "error");
    rendre(el);
    if (opt.message) dire(opt.message);
  }
  function reset(el) { if (!el) return; poser(el, null); rendre(el); }

  window.OWMotion = {
    version: VERSION,
    get reducedMotion() { return reduce; },
    setReducedMotion: function (on) { document.documentElement.classList.toggle("ow-reduce-motion", !!on); majReduce(); },
    loading: loading,
    success: success,
    error: error,
    reset: reset,
    vibrate: vibrer,
    clearPresses: toutRelacher
  };
  majReduce();
})();

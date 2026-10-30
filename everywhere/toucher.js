/* © 2026 Sébastien Chevrier. Tous droits réservés.
   24/24 ONE WORLD — couche d'interaction premium (30 oct. 2026), commune à toute l'appli.
   Styles repris de la proposition « Premium Interaction Layer » (ChatGPT), adaptés :
   - aucun bouton ne change de mise en page (pas de position/overflow forcés : l'onde est dessinée par-dessus la page) ;
   - appui : le bouton s'enfonce ; onde lumineuse depuis le doigt ; vibration très courte sur Android
     (désactivable : localStorage « ow_vibre » = "0") ;
   - boutons principaux : lueur orange, respiration (néon), forme qui s'arrondit à l'appui (liquide), ✓ quand on valide ;
   - respecte « réduire les animations » du téléphone. Rien n'est envoyé sur Internet. */
(function () {
  "use strict";
  if (window.__owToucher) return;
  window.__owToucher = true;
  var mq = null;
  try { mq = matchMedia("(prefers-reduced-motion: reduce)"); } catch (e) { /* ignoré */ }
  var reduce = false;
  function majReduce() { reduce = !!(mq && mq.matches) || document.documentElement.classList.contains("ow-reduce-motion"); }
  majReduce();
  // Le réglage du téléphone peut changer pendant que l'appli est ouverte.
  try { if (mq && mq.addEventListener) mq.addEventListener("change", majReduce); else if (mq && mq.addListener) mq.addListener(majReduce); } catch (e) { /* ignoré */ }
  var BOUTONS = "button, [role=button], .btn, .primary, [data-ow-interactive], .home-tile, .ew-card, .chip, a.tile, a.card";
  var PRINCIPAL = ".btn.primary, .ob-go, .install-top-btn, [data-ow-primary]";
  var css = document.createElement("style");
  css.textContent = [
    ":where(.btn.primary,.ob-go,.install-top-btn,[data-ow-primary]){background:linear-gradient(90deg,#ffc46b,#ff7a1a)!important;color:#1f0d00!important;border-color:transparent!important;}",
    ":root{--ow-accent:#ff9a3c;--ow-accent-strong:#ff7a1a;--ow-glow:0 0 0 1px rgba(255,140,40,.20),0 0 22px rgba(255,140,40,.20);",
    "--ow-motion-fast:160ms;--ow-motion-base:220ms;}",
    ":where(button,[role=button],.btn,.primary,[data-ow-interactive],.home-tile,.ew-card,.chip){-webkit-tap-highlight-color:transparent;touch-action:manipulation;",
    "transition:transform var(--ow-motion-fast) ease,box-shadow var(--ow-motion-base) ease,filter var(--ow-motion-base) ease,border-radius 240ms ease;}",
    ".ow-press{transform:translateY(1px) scale(.97);filter:brightness(1.08);}",
    ":where(button,[role=button],.btn,.primary,[data-ow-interactive]):focus-visible{outline:2px solid var(--ow-accent);outline-offset:3px;}",
    ":where(.btn.primary,.ob-go,[data-ow-primary]){box-shadow:var(--ow-glow);}",
    "@media (hover:hover) and (pointer:fine){:where(.btn.primary,.ob-go,[data-ow-primary]):not(:disabled):hover{box-shadow:0 0 0 1px rgba(255,140,40,.35),0 0 28px rgba(255,140,40,.30);filter:brightness(1.04);}}",
    ".ob-go,.install-top-btn,[data-ow-breathe]{animation:owRespire 2.8s ease-in-out infinite;}",
    "@keyframes owRespire{0%,100%{box-shadow:0 0 0 1px rgba(255,140,40,.18),0 0 12px rgba(255,140,40,.12);}50%{box-shadow:0 0 0 1px rgba(255,140,40,.38),0 0 26px rgba(255,140,40,.30);}}",
    ".ow-liquide.ow-press{border-radius:18px!important;transform:scale(.975);filter:saturate(1.12) brightness(1.06);}",
    ".ow-onde{position:fixed;z-index:2147483646;pointer-events:none;width:12px;height:12px;border-radius:50%;",
    "background:radial-gradient(circle,rgba(255,236,214,.58) 0%,rgba(255,140,40,.34) 38%,rgba(255,140,40,0) 72%);",
    "transform:translate(-50%,-50%) scale(0);animation:owOnde 520ms ease-out forwards;}",
    "@keyframes owOnde{to{transform:translate(-50%,-50%) scale(var(--ow-onde,18));opacity:0;}}",
    ".ow-ok{position:fixed;z-index:2147483647;pointer-events:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;",
    "font:900 17px/1 system-ui,sans-serif;color:#1f0d00;background:var(--ow-accent);box-shadow:0 0 0 1px rgba(255,140,40,.42),0 0 18px rgba(255,140,40,.4);",
    "transform:translate(-50%,-50%) scale(.4);animation:owOk 650ms cubic-bezier(.2,1.5,.4,1) forwards;}",
    "@keyframes owOk{40%{transform:translate(-50%,-50%) scale(1.1);opacity:1;}100%{transform:translate(-50%,-50%) scale(.9);opacity:0;}}",
    ".bbar button,.bbar a,.mainnav a,[data-ow-nav-item]{-webkit-tap-highlight-color:transparent;transition:color 180ms ease,background-color 180ms ease,transform 160ms ease;}",
    ".bbar button:active,.bbar a:active,.mainnav a:active,[data-ow-nav-item]:active{transform:scale(.94);}",
    /* États (repris de la proposition ChatGPT) : chargement = petit cercle qui tourne, succès = ✓, erreur = contour rouge. */
    "[data-ow-state]{position:relative;}",
    "[data-ow-state=loading]{cursor:progress;}",
    "[data-ow-state=loading]::after{content:'';position:absolute;right:14px;top:50%;width:16px;height:16px;margin-top:-8px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:owTourne 650ms linear infinite;}",
    "@keyframes owTourne{to{transform:rotate(360deg);}}",
    "[data-ow-state=success]{box-shadow:0 0 0 1px rgba(255,140,40,.42),0 0 18px rgba(255,140,40,.22);}",
    "[data-ow-state=error]{box-shadow:0 0 0 2px rgba(255,104,104,.65);animation:owNon .35s ease;}",
    "@keyframes owNon{20%,60%{transform:translateX(-5px);}40%,80%{transform:translateX(5px);}}",
    "html.ow-reduce-motion .ow-onde,html.ow-reduce-motion .ow-ok{display:none;}",
    "@media (prefers-reduced-motion:reduce){[data-ow-state]::after{animation-duration:2s;}.ow-press,.ow-liquide.ow-press{transform:none;}.ow-onde,.ow-ok{display:none;}",
    ".ob-go,.install-top-btn,[data-ow-breathe]{animation:none;}}"
  ].join("");
  (document.head || document.documentElement).appendChild(css);

  function cible(t) {
    if (!t || !t.closest) return null;
    var el = t.closest(BOUTONS);
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return null;
    return el;
  }
  var enfonce = null;
  function relacher() { if (enfonce) { enfonce.classList.remove("ow-press", "ow-liquide"); enfonce = null; } }
  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var el = cible(e.target);
    if (!el) return;
    relacher();
    if (!reduce) {
      el.classList.add("ow-press");
      if (el.matches(PRINCIPAL)) el.classList.add("ow-liquide");
      enfonce = el;
      var r = el.getBoundingClientRect();
      var o = document.createElement("span");
      o.className = "ow-onde";
      o.style.left = e.clientX + "px";
      o.style.top = e.clientY + "px";
      o.style.setProperty("--ow-onde", String(Math.min(Math.max(r.width, r.height) * 2.2, 320) / 12));
      document.body.appendChild(o);
      setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 600);
    }
    try {
      if (e.pointerType === "touch" && localStorage.getItem("ow_vibre") !== "0" && navigator.vibrate) navigator.vibrate(8);
    } catch (err) { /* ignoré */ }
  }, { passive: true, capture: true });
  ["pointerup", "pointercancel", "dragstart", "scroll"].forEach(function (n) {
    document.addEventListener(n, function () { setTimeout(relacher, 120); }, { passive: true, capture: true });
  });
  // Clavier : Espace ou Entrée enfoncent le bouton comme un doigt.
  document.addEventListener("keydown", function (e) {
    if (reduce || (e.key !== " " && e.key !== "Enter")) return;
    var el = cible(e.target);
    if (el) { relacher(); el.classList.add("ow-press"); enfonce = el; }
  });
  document.addEventListener("keyup", function () { setTimeout(relacher, 80); });
  // ✓ quand un bouton principal est validé, au bord droit du bouton (le texte du bouton ne change pas).
  document.addEventListener("click", function (e) {
    if (reduce) return;
    var el = cible(e.target);
    if (!el || !el.matches(PRINCIPAL)) return;
    var r = el.getBoundingClientRect();
    var k = document.createElement("span");
    k.className = "ow-ok";
    k.textContent = "✓";
    k.setAttribute("aria-hidden", "true");
    k.style.left = (r.right - Math.min(28, r.width / 4)) + "px";
    k.style.top = (r.top + r.height / 2) + "px";
    document.body.appendChild(k);
    setTimeout(function () { if (k.parentNode) k.parentNode.removeChild(k); }, 700);
  }, { capture: true });

  // API pour le code de l'appli (reprise de la proposition ChatGPT « OWMotion ») : états d'un bouton pendant une action.
  function etat(el, s, opt) {
    if (!el) return;
    opt = opt || {};
    if (s) {
      el.setAttribute("data-ow-state", s);
      if (s === "loading") { el.setAttribute("aria-busy", "true"); if ("disabled" in el && opt.disable !== false) el.disabled = true; }
      else el.removeAttribute("aria-busy");
    } else {
      el.removeAttribute("data-ow-state");
      el.removeAttribute("aria-busy");
      if ("disabled" in el && opt.restoreDisabled) el.disabled = false;
    }
  }
  window.OWMotion = {
    version: "1.0.0",
    get reducedMotion() { return reduce; },
    setReducedMotion: function (on) { document.documentElement.classList.toggle("ow-reduce-motion", !!on); majReduce(); },
    loading: function (el, on, opt) { etat(el, on ? "loading" : null, opt); },
    success: function (el) { etat(el, "success"); },
    error: function (el) { etat(el, "error"); },
    reset: function (el, opt) { etat(el, null, opt); }
  };
})();

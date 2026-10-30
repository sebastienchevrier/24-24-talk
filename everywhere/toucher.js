/* © 2026 Sébastien Chevrier. Tous droits réservés.
   Toucher vivant (30 oct. 2026) : chaque bouton réagit au doigt dans tout 24/24 ONE WORLD.
   - le bouton s'enfonce légèrement ;
   - une onde lumineuse part du point touché (dessinée par-dessus la page, elle ne change aucune mise en page) ;
   - les boutons principaux respirent (néon), se remplissent au toucher (liquide) et montrent un ✓ quand on valide ;
   - sur Android, une vibration très courte (désactivable : localStorage « ow_vibre » = "0").
   Rien n'est envoyé sur Internet. Respecte le réglage « réduire les animations » du téléphone. */
(function () {
  "use strict";
  if (window.__owToucher) return;
  window.__owToucher = true;
  var reduce = false;
  try { reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { /* ignoré */ }
  var CIBLES = "button, .btn, [role=button], a.tile, a.card, .home-tile, .bbar a, .bbar button, .ew-card, .chip, label.net-check, input[type=checkbox], input[type=radio], select";
  var css = document.createElement("style");
  css.textContent =
    "button,.btn,[role=button],.home-tile,.ew-card,.chip{-webkit-tap-highlight-color:transparent;transition:transform .14s cubic-bezier(.3,.7,.4,1.4),filter .14s;}" +
    ".ow-press{transform:scale(.95);filter:brightness(1.15);}" +
    ".ow-onde{position:fixed;z-index:2147483646;pointer-events:none;border-radius:50%;transform:translate(-50%,-50%) scale(0);" +
    "background:radial-gradient(circle,rgba(134,239,172,.55) 0%,rgba(74,222,128,.25) 45%,rgba(74,222,128,0) 70%);animation:owOnde .55s ease-out forwards;}" +
    "@keyframes owOnde{to{transform:translate(-50%,-50%) scale(1);opacity:0;}}" +
    /* Néon : les boutons principaux respirent doucement. */
    ".btn.primary,.ob-go,.install-top-btn{animation:owNeon 2.6s ease-in-out infinite;}" +
    "@keyframes owNeon{0%,100%{box-shadow:0 0 6px rgba(74,222,128,.35),0 0 16px rgba(74,222,128,.18);}50%{box-shadow:0 0 12px rgba(74,222,128,.6),0 0 34px rgba(74,222,128,.32);}}" +
    /* Liquide : au toucher, le bouton principal se remplit de lumière depuis le bas. */
    ".ow-liq{position:relative;overflow:hidden;isolation:isolate;}" +
    ".ow-liq::before{content:'';position:absolute;left:-15%;right:-15%;bottom:-170%;height:160%;z-index:-1;border-radius:42%;" +
    "background:rgba(255,255,255,.35);animation:owLiq .7s ease-out forwards,owVague 1.2s linear infinite;}" +
    "@keyframes owLiq{to{bottom:-30%;opacity:0;}}@keyframes owVague{to{transform:rotate(360deg);}}" +
    /* Transformation : un ✓ apparaît au centre une fraction de seconde. */
    ".ow-ok{position:fixed;z-index:2147483647;pointer-events:none;transform:translate(-50%,-50%) scale(.3);font:800 26px/1 system-ui,sans-serif;" +
    "color:#052e16;background:#86efac;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;" +
    "box-shadow:0 0 22px rgba(74,222,128,.8);animation:owOk .6s cubic-bezier(.2,1.5,.4,1) forwards;}" +
    "@keyframes owOk{40%{transform:translate(-50%,-50%) scale(1.1);opacity:1;}100%{transform:translate(-50%,-50%) scale(.9);opacity:0;}}" +
    "@media (prefers-reduced-motion: reduce){.ow-press{transform:none;}.ow-onde,.ow-ok,.ow-liq::before{display:none;}" +
    ".btn.primary,.ob-go,.install-top-btn{animation:none;}}";
  var PRINCIPAL = ".btn.primary, .ob-go, .install-top-btn, .primary";
  (document.head || document.documentElement).appendChild(css);

  function cible(t) {
    if (!t || !t.closest) return null;
    var el = t.closest(CIBLES);
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return null;
    return el;
  }
  var enfonce = null;
  function relacher() { if (enfonce) { enfonce.classList.remove("ow-press"); enfonce = null; } }
  document.addEventListener("pointerdown", function (e) {
    var el = cible(e.target);
    if (!el) return;
    relacher();
    if (!reduce && !/^(INPUT|SELECT)$/.test(el.tagName)) { el.classList.add("ow-press"); enfonce = el; }
    if (!reduce && el.matches && el.matches(PRINCIPAL) && getComputedStyle(el).position === "static") {
      el.classList.remove("ow-liq"); void el.offsetWidth; el.classList.add("ow-liq");
      setTimeout(function () { el.classList.remove("ow-liq"); }, 800);
    }
    if (!reduce) {
      var r = el.getBoundingClientRect();
      var d = Math.min(Math.max(r.width, r.height) * 1.6, 260);
      var o = document.createElement("span");
      o.className = "ow-onde";
      o.style.left = e.clientX + "px";
      o.style.top = e.clientY + "px";
      o.style.width = o.style.height = Math.max(d, 70) + "px";
      document.body.appendChild(o);
      setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 600);
    }
    try {
      if (e.pointerType === "touch" && localStorage.getItem("ow_vibre") !== "0" && navigator.vibrate) navigator.vibrate(8);
    } catch (err) { /* ignoré */ }
  }, { passive: true, capture: true });
  // ✓ quand un bouton principal est vraiment validé (clic), au centre du bouton.
  document.addEventListener("click", function (e) {
    if (reduce) return;
    var el = cible(e.target);
    if (!el || !el.matches || !el.matches(PRINCIPAL)) return;
    var r = el.getBoundingClientRect();
    var k = document.createElement("span");
    k.className = "ow-ok";
    k.textContent = "✓";
    k.setAttribute("aria-hidden", "true");
    k.style.left = (r.left + r.width / 2) + "px";
    k.style.top = (r.top + r.height / 2) + "px";
    document.body.appendChild(k);
    setTimeout(function () { if (k.parentNode) k.parentNode.removeChild(k); }, 650);
  }, { capture: true });
  ["pointerup", "pointercancel", "pointerleave", "dragstart", "scroll"].forEach(function (n) {
    document.addEventListener(n, function () { setTimeout(relacher, 90); }, { passive: true, capture: true });
  });
})();

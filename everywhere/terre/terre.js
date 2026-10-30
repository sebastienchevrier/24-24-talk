/* © 2026 Sébastien Chevrier. Tous droits réservés.
   24/24 ONE WORLD — Terre connectée (lot 3, 30 oct. 2026) : #/terre dans le portail.
   Un globe dessiné sur le téléphone (canvas, aucune image ni bibliothèque), qui tourne lentement ; des arcs lumineux
   relient six grandes régions du monde. Toucher une région (sur le globe ou dans la liste) l'affiche avec deux vrais
   boutons : Apprendre ses langues (#/learn) et Écrire à quelqu'un (messagerie existante).
   Aucune position demandée, aucun compteur inventé, aucune donnée envoyée. Animation coupée si « réduire les
   animations » (téléphone, html.motion-off, html.ow-reduce-motion), page cachée ou écran quitté. */
(function () {
  "use strict";
  var TXT = {
    fr: {
      title: "Terre connectée", sub: "Touchez une région pour la découvrir. Dans ONE WORLD, chacun écrit dans sa langue et lit dans la sienne.",
      list: "Les régions du monde", learn: "Découvrir ses langues", write: "Écrire à quelqu'un", close: "Fermer",
      globe: "Globe terrestre : six régions reliées entre elles", pick: "Région choisie : {r}",
      af: "Afrique", af_d: "Plus de 2 000 langues : swahili, haoussa, yoruba, amharique, zoulou, arabe, français, anglais…",
      eu: "Europe", eu_d: "Une quarantaine de pays et autant de langues : français, allemand, italien, espagnol, polonais, grec…",
      as: "Asie", as_d: "Le continent le plus peuplé : chinois, hindi, japonais, coréen, arabe, indonésien, vietnamien, thaï…",
      na: "Amérique du Nord", na_d: "Du Canada au Mexique et aux Caraïbes : anglais, espagnol, français, créole, langues autochtones…",
      sa: "Amérique du Sud", sa_d: "De la Colombie à la Terre de Feu : espagnol, portugais, quechua, guarani, aymara…",
      oc: "Océanie", oc_d: "Australie, Nouvelle-Zélande et îles du Pacifique : anglais, maori, tok pisin, samoan, fidjien…"
    },
    en: {
      title: "Connected Earth", sub: "Tap a region to discover it. In ONE WORLD, everyone writes in their language and reads in their own.",
      list: "Regions of the world", learn: "Discover its languages", write: "Write to someone", close: "Close",
      globe: "Globe: six regions connected to each other", pick: "Selected region: {r}",
      af: "Africa", af_d: "Over 2,000 languages: Swahili, Hausa, Yoruba, Amharic, Zulu, Arabic, French, English…",
      eu: "Europe", eu_d: "About forty countries and as many languages: French, German, Italian, Spanish, Polish, Greek…",
      as: "Asia", as_d: "The most populated continent: Chinese, Hindi, Japanese, Korean, Arabic, Indonesian, Vietnamese, Thai…",
      na: "North America", na_d: "From Canada to Mexico and the Caribbean: English, Spanish, French, Creole, Indigenous languages…",
      sa: "South America", sa_d: "From Colombia to Tierra del Fuego: Spanish, Portuguese, Quechua, Guarani, Aymara…",
      oc: "Oceania", oc_d: "Australia, New Zealand and the Pacific islands: English, Māori, Tok Pisin, Samoan, Fijian…"
    }
  };
  // Centre approximatif de chaque région (latitude, longitude en degrés).
  var REGIONS = [
    { id: "af", lat: 4, lon: 20 }, { id: "eu", lat: 50, lon: 12 }, { id: "as", lat: 32, lon: 95 },
    { id: "na", lat: 42, lon: -100 }, { id: "sa", lat: -15, lon: -60 }, { id: "oc", lat: -25, lon: 140 }
  ];
  var LIENS = [["eu", "af"], ["eu", "as"], ["eu", "na"], ["na", "sa"], ["af", "sa"], ["as", "oc"], ["af", "as"], ["na", "as"]];
  var ui = "fr", root = null, cv = null, ctx = null, raf = 0, rot = -20, last = 0, sel = null, drag = null, actif = false;

  function t(k, v) {
    var s = (TXT[ui] && TXT[ui][k]) || TXT.en[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function reduit() {
    var h = document.documentElement.classList;
    if (h.contains("motion-off") || h.contains("ow-reduce-motion")) return true;
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function couleur(nom, def) {
    var v = cv && getComputedStyle(cv).getPropertyValue(nom).trim();
    return v || def;
  }

  // Projection orthographique : un point (lat, lon) vu depuis la longitude « rot ». z > 0 : face visible.
  function proj(lat, lon, R, cx, cy) {
    var la = lat * Math.PI / 180, lo = (lon + rot) * Math.PI / 180;
    return { x: cx + R * Math.cos(la) * Math.sin(lo), y: cy - R * Math.sin(la), z: Math.cos(la) * Math.cos(lo) };
  }
  // Arc de grand cercle entre deux régions, découpé en petits segments (seule la face visible est tracée).
  function arc(a, b, R, cx, cy, phase, accent) {
    var A = vec(a), B = vec(b), d = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]))), n = 28;
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var f = i / n, s1 = Math.sin((1 - f) * d) / Math.sin(d), s2 = Math.sin(f * d) / Math.sin(d);
      var p = [s1 * A[0] + s2 * B[0], s1 * A[1] + s2 * B[1], s1 * A[2] + s2 * B[2]];
      var h = 1 + 0.18 * Math.sin(Math.PI * f); // l'arc se soulève au-dessus du globe
      var lat = Math.asin(p[2]) * 180 / Math.PI, lon = Math.atan2(p[1], p[0]) * 180 / Math.PI;
      var q = proj(lat, lon, R * h, cx, cy);
      pts.push(q);
    }
    ctx.lineWidth = 1.6;
    for (var j = 0; j < n; j++) {
      if (pts[j].z < -0.05 && pts[j + 1].z < -0.05) continue;
      var lit = phase === null ? 0.5 : Math.max(0, 1 - Math.abs(j / n - phase) * 5);
      ctx.strokeStyle = "rgba(" + accent + "," + (0.22 + 0.6 * lit).toFixed(3) + ")";
      ctx.beginPath(); ctx.moveTo(pts[j].x, pts[j].y); ctx.lineTo(pts[j + 1].x, pts[j + 1].y); ctx.stroke();
    }
  }
  function vec(r) { var la = r.lat * Math.PI / 180, lo = r.lon * Math.PI / 180; return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)]; }
  function rgb(c) {
    var m = /#([0-9a-f]{6})/i.exec(c);
    if (m) { var n = parseInt(m[1], 16); return (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255); }
    var r = /rgba?\(([^)]+)\)/.exec(c);
    return r ? r[1].split(",").slice(0, 3).join(",") : "255,154,60";
  }

  var places = [];
  function dessiner(now) {
    if (!ctx) return;
    var w = cv.clientWidth, hgt = cv.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(hgt * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, hgt);
    var R = Math.min(w, hgt) * 0.36, cx = w / 2, cy = hgt / 2;
    var accent = rgb(couleur("--earth-accent", "#ff9a3c")), ligne = rgb(couleur("--earth-line", "#9fb4ff"));
    // Halo puis sphère.
    var g = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.35);
    g.addColorStop(0, "rgba(" + accent + ",.18)"); g.addColorStop(1, "rgba(" + accent + ",0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2); ctx.fill();
    var s = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    s.addColorStop(0, couleur("--earth-sea-hi", "#1d3a78")); s.addColorStop(1, couleur("--earth-sea", "#081631"));
    ctx.fillStyle = s; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    // Méridiens et parallèles.
    ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(" + ligne + ",.16)";
    for (var lon = 0; lon < 360; lon += 30) {
      ctx.beginPath();
      var avant = null;
      for (var la = -90; la <= 90; la += 6) {
        var p = proj(la, lon, R, cx, cy);
        if (p.z >= 0) { if (avant) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); avant = p; } else avant = null;
      }
      ctx.stroke();
    }
    for (var pl = -60; pl <= 60; pl += 30) {
      ctx.beginPath();
      var rr = R * Math.cos(pl * Math.PI / 180), yy = cy - R * Math.sin(pl * Math.PI / 180);
      ctx.moveTo(cx - rr, yy); ctx.lineTo(cx + rr, yy); ctx.stroke();
    }
    // Arcs entre régions (la lumière court le long de l'arc), puis les régions.
    var byId = {}; REGIONS.forEach(function (r) { byId[r.id] = r; });
    LIENS.forEach(function (l, i) {
      var phase = reduit() ? null : ((now / 2600 + i * 0.37) % 1.4);
      arc(byId[l[0]], byId[l[1]], R, cx, cy, phase, accent);
    });
    places = [];
    REGIONS.forEach(function (r) {
      var p = proj(r.lat, r.lon, R, cx, cy);
      if (p.z < 0) return;
      var on = sel === r.id, rad = on ? 9 : 6;
      ctx.fillStyle = "rgba(" + accent + "," + (on ? 0.35 : 0.2) + ")";
      ctx.beginPath(); ctx.arc(p.x, p.y, rad * 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgb(" + accent + ")";
      ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill();
      ctx.font = (on ? "700 " : "600 ") + "12px system-ui,sans-serif";
      ctx.fillStyle = couleur("--earth-text", "#eef2ff");
      ctx.textAlign = "center";
      ctx.fillText(t(r.id), p.x, p.y - rad - 8);
      places.push({ id: r.id, x: p.x, y: p.y });
    });
  }
  function boucle(now) {
    raf = 0;
    if (!actif || document.hidden) return;
    if (now - last >= 33) { // 30 images par seconde au plus
      if (!drag && !reduit()) rot += (now - (last || now)) * 0.006;
      last = now;
      dessiner(now);
    }
    if (!reduit()) raf = requestAnimationFrame(boucle);
  }
  function relancer() {
    if (!actif) return;
    if (raf) cancelAnimationFrame(raf);
    raf = 0; last = 0;
    if (reduit()) dessiner(0); else raf = requestAnimationFrame(boucle);
  }

  // Tourner la Terre avec le doigt ; un appui court sur une région la choisit.
  function brancherGlobe() {
    cv.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, r: rot, moved: false }; try { cv.setPointerCapture(e.pointerId); } catch (er) { /* ignoré */ } });
    cv.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      rot = drag.r + dx * 0.4;
      if (reduit()) dessiner(0);
    });
    function fin(e) {
      if (!drag) return;
      var d = drag; drag = null;
      if (d.moved) return;
      var b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top, best = null, bd = 30;
      places.forEach(function (p) { var dd = Math.hypot(p.x - x, p.y - y); if (dd < bd) { bd = dd; best = p.id; } });
      if (best) choisir(best);
    }
    cv.addEventListener("pointerup", fin);
    cv.addEventListener("pointercancel", function () { drag = null; });
  }

  function choisir(id) {
    sel = id;
    var r = null; REGIONS.forEach(function (x) { if (x.id === id) r = x; });
    if (r) rot = -r.lon; // la région vient face à soi
    var box = root.querySelector("#earthInfo");
    box.hidden = false;
    box.innerHTML = '<h2 class="earth-info-h" id="earthInfoH">' + esc(t(id)) + "</h2><p class=\"earth-info-d\">" + esc(t(id + "_d")) + "</p>" +
      '<div class="earth-actions"><a class="btn primary earth-btn" id="earthLearn" href="#/learn">' + esc(t("learn")) + "</a>" +
      '<a class="btn earth-btn" id="earthWrite" href="../index.html?b=msg">' + esc(t("write")) + "</a></div>";
    root.querySelectorAll(".earth-region").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-region") === id ? "true" : "false"); });
    var live = root.querySelector("#earthLive");
    if (live) live.textContent = t("pick", { r: t(id) });
    if (reduit()) dessiner(0);
  }

  function show(el, parts, uiLang) {
    ui = TXT[uiLang] ? uiLang : (uiLang === "fr" ? "fr" : "en");
    root = el;
    el.innerHTML = '<div class="earth">' +
      '<div class="tr-head"><h1 id="h-terre">' + esc(t("title")) + "</h1><p>" + esc(t("sub")) + "</p></div>" +
      '<div class="earth-stage"><canvas class="earth-globe" id="earthGlobe" role="img" aria-label="' + esc(t("globe")) + '"></canvas></div>' +
      '<h2 class="earth-list-h" id="earthListH">' + esc(t("list")) + "</h2>" +
      '<div class="earth-regions" role="group" aria-labelledby="earthListH">' +
      REGIONS.map(function (r) { return '<button type="button" class="earth-region" data-region="' + r.id + '" aria-pressed="false">' + esc(t(r.id)) + "</button>"; }).join("") +
      "</div>" +
      '<div class="earth-info" id="earthInfo" hidden></div>' +
      '<div class="ow-sr earth-sr" id="earthLive" role="status" aria-live="polite"></div></div>';
    cv = el.querySelector("#earthGlobe");
    ctx = cv.getContext && cv.getContext("2d");
    el.querySelectorAll(".earth-region").forEach(function (b) { b.addEventListener("click", function () { choisir(b.getAttribute("data-region")); }); });
    if (ctx) brancherGlobe();
    actif = true;
    sel = null;
    if (parts && parts[1]) { var ok = REGIONS.some(function (r) { return r.id === parts[1]; }); if (ok) choisir(parts[1]); }
    relancer();
    return t("title");
  }
  function leave() {
    actif = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) relancer(); });
  if (window.MutationObserver) new MutationObserver(relancer).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  try { matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", relancer); } catch (e) { /* ignoré */ }
  window.addEventListener("resize", function () { if (actif && reduit()) dessiner(0); });

  window.EWTerre = { show: show, leave: leave, regions: REGIONS.map(function (r) { return r.id; }), get running() { return !!raf; }, get rotation() { return rot; } };
})();

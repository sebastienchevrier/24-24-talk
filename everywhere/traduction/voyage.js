/* 24/24 EVERYWHERE — parcours Voyage. © 2026 Sébastien Chevrier. Tous droits réservés.
   Route : #/everywhere/voyage (dans EVERYWHERE : parler avec des personnes qui ne parlent pas ma langue, en voyage).
   - Préparation linguistique : choisir la langue du pays, rendre les phrases disponibles hors connexion, essayer la voix,
     l'ajouter aux favorites.
   - Phrases utiles par situation (essentiel, transport, hébergement, restaurant, achats, santé et urgence) :
     écouter, montrer en grand à la personne en face.
   - Traduction en situation réelle : ouvre la conversation côte à côte avec la langue du pays déjà réglée.
   - Mode faible connexion, limites explicites : les phrases intégrées (6 langues) et les phrases préparées s'affichent
     sans connexion ; traduire une phrase nouvelle et le micro ont besoin d'Internet ; la voix dépend du téléphone.
     AUCUNE traduction libre hors ligne n'est promise.
   - Recherche dans toutes les phrases (français, anglais, ma langue, langue du pays ; sans tenir compte des accents)
     et phrases favorites (★, onglet « Favorites »).
   - Langue source (« Ma langue ») et langue cible (« Langue du pays ») choisies ici, sans changer les réglages d'EVERYWHERE.
   Contenu extensible : ajouter une situation ou une phrase = une ligne dans phrases.js, rien d'autre à modifier.
   Données sur l'appareil seulement : ew_voyage_v1 (langues, situation, favorites), ew_voyage_tr_<langue> (phrases préparées). */
(function () {
  "use strict";
  var KEY = "ew_voyage_v1";
  var lang = "fr";
  var STR = {
    fr: {
      title: "Voyage", back: "← Face à face", sub: "Préparer son voyage et se faire comprendre sur place.",
      dest: "Langue du pays", src: "Ma langue", swap: "⇄ Inverser", prep_t: "Préparer mon voyage",
      st_builtin: "✅ Phrases intégrées : disponibles même sans connexion.",
      st_ready: "✅ {n} phrases préparées le {d} : disponibles sans connexion.",
      st_partial: "⚠️ {n} phrases sur {t} préparées. Terminez la préparation avec Internet.",
      st_none: "Phrases pas encore disponibles hors connexion pour cette langue.",
      prep_btn: "⬇ Préparer hors connexion", prep_again: "Mettre à jour", prep_run: "Préparation… {n}/{t}",
      prep_note: "Traduction automatique en ligne (service gratuit MyMemory), faite une seule fois puis gardée sur ce téléphone. À vérifier pour les informations importantes.",
      e_offline: "Pas de connexion : la préparation a besoin d'Internet. Réessayez une fois connecté.",
      e_quota: "Limite quotidienne du service de traduction gratuit atteinte : {n} phrases gardées. Réessayez demain.",
      e_other: "La préparation s'est arrêtée ({m}) : {n} phrases gardées. Réessayez.",
      steps_t: "Préparation linguistique", step1: "Langue du pays choisie : {l}", step2: "Phrases disponibles hors connexion", step3: "Voix du téléphone pour {l}",
      step4: "{l} dans mes langues favorites", try_voice: "▶ Essayer la voix", fav_add: "★ Ajouter aux favorites", fav_done: "Ajoutée à vos favorites.",
      step5: "Apprendre les bases avant de partir", learn: "Ouvrir Apprendre",
      no_voice: "Ce téléphone n'a pas de voix pour cette langue : le texte reste affichable (bouton « Montrer »).",
      talk_btn: "Parler avec quelqu'un sur place", talk_d: "Conversation côte à côte, langue du pays déjà réglée",
      low_t: "Connexion faible ou absente", offline_grp: "Hors connexion", online: "🟢 Connecté", offline: "🔴 Hors connexion",
      low_ok: "Fonctionne sans connexion : phrases intégrées et phrases préparées, bouton « Montrer », vos réglages.",
      low_partial: "Dépend du téléphone : la voix (« Écouter ») marche hors connexion seulement si la voix est installée sur le téléphone.",
      low_no: "Besoin d'Internet : traduire une phrase nouvelle, le micro (reconnaissance vocale), les appels de la Messagerie.",
      search: "Rechercher une phrase", search_ph: "ex. : pharmacie, billet, merci", found: "{n} phrase(s) trouvée(s) pour « {q} »",
      found0: "Aucune phrase ne correspond à « {q} ». Essayez un autre mot.", clear: "Effacer",
      fav_cat: "Favorites", fav_on: "Retirer des favorites : {p}", fav_off: "Ajouter aux favorites : {p}",
      fav_none: "Aucune phrase favorite. Appuyez sur ☆ à côté d'une phrase pour la garder ici.",
      cats: "Situations", listen: "▶ Écouter", show: "⤢ Montrer", listen_a: "Écouter : {p}", show_a: "Montrer en grand : {p}",
      close: "Fermer", not_ready: "Pas encore traduite : préparez hors connexion avec Internet.", show_hint: "Montrez cet écran à la personne en face.",
      hint: "Traduction automatique : vérifiez les informations importantes (santé, allergies, adresse)."
    },
    en: {
      title: "Travel", back: "← Face to face", sub: "Prepare your trip and make yourself understood there.",
      dest: "Language of the country", src: "My language", swap: "⇄ Swap", prep_t: "Prepare my trip",
      st_builtin: "✅ Built-in phrases: available even offline.",
      st_ready: "✅ {n} phrases prepared on {d}: available offline.",
      st_partial: "⚠️ {n} of {t} phrases prepared. Finish preparing with the Internet.",
      st_none: "Phrases not yet available offline for this language.",
      prep_btn: "⬇ Prepare for offline", prep_again: "Update", prep_run: "Preparing… {n}/{t}",
      prep_note: "Automatic online translation (free MyMemory service), done once then kept on this phone. Check important information.",
      e_offline: "No connection: preparing needs the Internet. Try again once connected.",
      e_quota: "Daily limit of the free translation service reached: {n} phrases kept. Try again tomorrow.",
      e_other: "Preparation stopped ({m}): {n} phrases kept. Try again.",
      steps_t: "Language preparation", step1: "Country language chosen: {l}", step2: "Phrases available offline", step3: "Phone voice for {l}",
      step4: "{l} in my favorite languages", try_voice: "▶ Try the voice", fav_add: "★ Add to favorites", fav_done: "Added to your favorites.",
      step5: "Learn the basics before leaving", learn: "Open Learn",
      no_voice: "This phone has no voice for this language: the text can still be shown (“Show” button).",
      talk_btn: "Talk with someone there", talk_d: "Side-by-side conversation, country language already set",
      low_t: "Weak or no connection", offline_grp: "Offline", online: "🟢 Online", offline: "🔴 Offline",
      low_ok: "Works offline: built-in and prepared phrases, the “Show” button, your settings.",
      low_partial: "Depends on the phone: the voice (“Listen”) works offline only if the voice is installed on the phone.",
      low_no: "Needs the Internet: translating a new sentence, the mic (speech recognition), calls in Messages.",
      search: "Search a phrase", search_ph: "e.g. pharmacy, ticket, thank you", found: "{n} phrase(s) found for “{q}”",
      found0: "No phrase matches “{q}”. Try another word.", clear: "Clear",
      fav_cat: "Favorites", fav_on: "Remove from favorites: {p}", fav_off: "Add to favorites: {p}",
      fav_none: "No favorite phrase yet. Tap ☆ next to a phrase to keep it here.",
      cats: "Situations", listen: "▶ Listen", show: "⤢ Show", listen_a: "Listen: {p}", show_a: "Show full screen: {p}",
      close: "Close", not_ready: "Not translated yet: prepare for offline with the Internet.", show_hint: "Show this screen to the person in front of you.",
      hint: "Automatic translation: check important information (health, allergies, address)."
    }
  };
  // Autres langues de l'interface (0.8.3) : langues-ecrans.js.
  (function (x) { if (x) Object.keys(x).forEach(function (k) { STR[k] = x[k]; }); })(window.EW_SCREEN_STR && window.EW_SCREEN_STR.voyage);
  function t(k, v) {
    var s = (STR[lang] && STR[lang][k]) || STR.en[k] || STR.fr[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  };
  function M() { return window.EWMoteur; }
  function P() { return window.EW_PHRASES || { langs: [], cats: [], list: [] }; }
  function ew() { return window.EWEverywhere; }
  function known(code) { return typeof code === "string" && (window.EW_LANGS || []).some(function (l) { return l.code === code; }); }
  function langName(code) { return window.EW_LANG_NAME ? window.EW_LANG_NAME(code, lang) : M() ? M().lang(code).name : code; }

  function state() {
    var s = {};
    try { s = JSON.parse(store.get(KEY) || "{}") || {}; } catch (e) { s = {}; }
    if (typeof s !== "object" || Array.isArray(s)) s = {};
    var me = known(s.src) ? s.src : ew() ? ew().prefs().me : "fr";
    var cats = ["fav"].concat(P().cats.map(function (c) { return c.id; }));
    var ids = P().list.map(function (p) { return p.id; });
    var fav = Array.isArray(s.fav) ? s.fav.filter(function (x, i, a) { return ids.indexOf(x) !== -1 && a.indexOf(x) === i; }).slice(0, 60) : [];
    return { src: me, dest: known(s.dest) && s.dest !== me ? s.dest : (me === "en" ? "es" : "en"), cat: cats.indexOf(s.cat) !== -1 ? s.cat : "base", fav: fav, q: "" };
  }
  function saveState(s) { store.set(KEY, JSON.stringify({ src: s.src, dest: s.dest, cat: s.cat, fav: s.fav })); }
  // Recherche sans accents ni majuscules.
  function norm(x) { return String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim(); }
  function builtin(code) { return P().langs.indexOf(code) !== -1; }
  // Phrases préparées (traduites en ligne une fois) pour une langue non intégrée.
  function prepared(code) {
    var o = null;
    try { o = JSON.parse(store.get("ew_voyage_tr_" + code) || "null"); } catch (e) { o = null; }
    if (!o || typeof o !== "object" || !o.items || typeof o.items !== "object") return { ts: "", items: {} };
    var items = {};
    Object.keys(o.items).forEach(function (k) { if (typeof o.items[k] === "string") items[k] = o.items[k].slice(0, 300); });
    return { ts: typeof o.ts === "string" ? o.ts : "", items: items };
  }
  // Côté « ma langue » tant que ses phrases ne sont pas préparées : la langue de l'interface si elle est intégrée,
  // sinon l'anglais (le français pour le malgache, langue officielle à Madagascar). Avant 0.8.3 : toujours le français.
  function mineOf(p, me) { return phraseIn(p, me) || p[builtin(lang) ? lang : lang === "mg" ? "fr" : "en"] || p.fr; }
  function phraseIn(p, code) {
    if (builtin(code)) return p[code] || "";
    return prepared(code).items[p.id] || "";
  }
  function readyCount(code) {
    if (builtin(code)) return P().list.length;
    var it = prepared(code).items;
    return P().list.filter(function (p) { return !!it[p.id]; }).length;
  }

  function langOptions(sel) {
    var fav = window.EWProfil ? window.EWProfil.favorites() : [];
    var all = window.EW_LANGS || [];
    var opt = function (l) { return '<option value="' + esc(l.code) + '"' + (l.code === sel ? " selected" : "") + ">" + esc((l.flag ? l.flag + " " : "") + (window.EW_LANG_NAME ? window.EW_LANG_NAME(l.code, lang) : l.name)) + "</option>"; };
    var favs = all.filter(function (l) { return fav.indexOf(l.code) !== -1; });
    var built = all.filter(function (l) { return builtin(l.code) && fav.indexOf(l.code) === -1; });
    return (favs.length ? '<optgroup label="★">' + favs.map(opt).join("") + "</optgroup>" : "") +
      '<optgroup label="✅ ' + esc(t("offline_grp")) + '">' + built.map(opt).join("") + "</optgroup>" +
      '<optgroup label="🌐">' + all.filter(function (l) { return !builtin(l.code) && fav.indexOf(l.code) === -1; }).map(opt).join("") + "</optgroup>";
  }

  var cur = null; // { root, s, busy, token }
  function show(root, uiLang) {
    lang = STR[uiLang] ? uiLang : "fr";
    cur = { root: root, s: state(), busy: false, token: (cur ? cur.token : 0) + 1, auto: {}, prog: null };
    paint();
    return t("title");
  }
  function statusHtml(code) {
    var total = P().list.length, n = readyCount(code);
    if (builtin(code)) return '<p class="vy-st ok">' + esc(t("st_builtin")) + "</p>";
    var pr = prepared(code);
    if (n === total) return '<p class="vy-st ok">' + esc(t("st_ready", { n: n, d: pr.ts ? new Date(pr.ts).toLocaleDateString(lang) : "?" })) + "</p>";
    if (n > 0) return '<p class="vy-st warn">' + esc(t("st_partial", { n: n, t: total })) + "</p>";
    return '<p class="vy-st">' + esc(t("st_none")) + "</p>";
  }
  function paint() {
    var root = cur.root, s = cur.s, d = s.dest, me = s.src;
    var total = P().list.length, ready = readyCount(d) === total && readyCount(me) === total;
    var needPrep = !builtin(d) || !builtin(me);
    var fav = window.EWProfil ? window.EWProfil.favorites() : [];
    var voices = M() && M().canSpeak ? M().voicesFor(d).length : 0;
    var learnable = d === "en" || d === "es";
    var step = function (ok, txt, extra) { return '<li class="vy-step' + (ok ? " ok" : "") + '"><span aria-hidden="true">' + (ok ? "✓" : "○") + "</span><span>" + esc(txt) + (extra || "") + "</span></li>"; };
    root.innerHTML = '<a class="tr-back" href="#/everywhere">' + esc(t("back")) + '</a><h1 id="h-tr">' + esc(t("title")) + '</h1><p class="muted">' + esc(t("sub")) + "</p>" +
      '<div class="card"><h2 class="tr-h2">' + esc(t("prep_t")) + "</h2>" +
        '<div class="vy-pair"><label class="tr-field"><span>' + esc(t("src")) + '</span><select id="vySrc">' + langOptions(me) + "</select></label>" +
        '<button type="button" class="btn vy-mini" id="vySwap">' + esc(t("swap")) + "</button>" +
        '<label class="tr-field"><span>' + esc(t("dest")) + '</span><select id="vyDest">' + langOptions(d) + "</select></label></div>" +
        '<div id="vyStatus">' + statusHtml(d) + (builtin(me) ? "" : statusHtml(me)) + "</div>" +
        (needPrep ? '<button type="button" class="btn primary wide" id="vyPrep"' + (cur.busy ? " disabled" : "") + ">" + esc(ready ? t("prep_again") : t("prep_btn")) + '</button><p class="note">' + esc(t("prep_note")) + "</p>" : "") +
        '<p class="tr-msg" id="vyMsg" role="status"></p>' +
        '<h2 class="tr-h2 vy-h">' + esc(t("steps_t")) + '</h2><ul class="vy-steps">' +
          step(true, t("step1", { l: langName(d) })) +
          step(ready, t("step2")) +
          step(voices > 0, t("step3", { l: langName(d) }), '<br><button type="button" class="btn vy-mini" id="vyTry">' + esc(t("try_voice")) + "</button>" + (M() && M().canSpeak && !voices ? '<small class="vy-small">' + esc(t("no_voice")) + "</small>" : "")) +
          step(fav.indexOf(d) !== -1, t("step4", { l: langName(d) }), fav.indexOf(d) === -1 && window.EWProfil ? '<br><button type="button" class="btn vy-mini" id="vyFav">' + esc(t("fav_add")) + "</button>" : "") +
          (learnable ? step(false, t("step5"), '<br><a class="btn vy-mini" href="#/learn">' + esc(t("learn")) + "</a>") : "") +
        "</ul></div>" +
      '<a class="tr-big face" id="vyTalk" href="#/everywhere/face"><span class="tr-big-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16"/><rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M10 7.5h4M10 16.5h4"/></svg></span><span><b>' + esc(t("talk_btn")) + "</b><small>" + esc(t("talk_d")) + "</small></span></a>" +
      '<div class="card vy-low"><h2 class="tr-h2">' + esc(t("low_t")) + ' <span class="vy-net" id="vyNet">' + esc(navigator.onLine === false ? t("offline") : t("online")) + "</span></h2>" +
        '<ul class="vy-list"><li>' + esc(t("low_ok")) + "</li><li>" + esc(t("low_partial")) + "</li><li>" + esc(t("low_no")) + "</li></ul></div>" +
      '<label class="tr-field vy-search"><span>' + esc(t("search")) + '</span><span class="vy-sbox"><input type="search" id="vySearch" maxlength="60" autocomplete="off" placeholder="' + esc(t("search_ph")) + '" value="' + esc(s.q) + '">' +
        '<button type="button" class="btn vy-mini" id="vyClear"' + (s.q ? "" : " hidden") + ">" + esc(t("clear")) + "</button></span></label>" +
      '<p class="vy-found" id="vyFound" role="status" aria-live="polite"></p>' +
      '<h2 class="tr-h2" id="vyCatsH">' + esc(t("cats")) + '</h2><div class="vy-cats" role="tablist" aria-labelledby="vyCatsH">' +
        [{ id: "fav", icon: "★", name: { fr: t("fav_cat"), en: t("fav_cat") } }].concat(P().cats).map(function (c) {
          return '<button type="button" role="tab" class="vy-cat" data-cat="' + esc(c.id) + '" aria-selected="' + (c.id === s.cat) + '"' + (c.id === s.cat ? "" : ' tabindex="-1"') + ">" +
            '<span aria-hidden="true">' + c.icon + "</span> " + esc(c.name[lang] || c.name.fr) + "</button>";
        }).join("") + "</div>" +
      '<div role="tabpanel" id="vyPanel" aria-labelledby="vyCatsH"><ul class="vy-phrases" id="vyList"></ul></div><p class="note">' + esc(t("hint")) + "</p>";
    paintList();
    // Avec Internet, les phrases d'une langue non intégrée se traduisent toutes seules (une fois par langue et par visite) :
    // plus besoin de trouver le bouton « Préparer » (retour de Sébastien, 17 oct. 2026).
    var key = d + "|" + me;
    if (needPrep && !ready && !cur.busy && navigator.onLine !== false && !cur.auto[key]) { cur.auto[key] = true; setTimeout(prepare, 0); }
  }
  function paintList() {
    var ul = cur.root.querySelector("#vyList");
    if (!ul) return;
    var d = cur.s.dest, me = cur.s.src, q = norm(cur.s.q), fav = cur.s.fav;
    var found = cur.root.querySelector("#vyFound"), tabs = cur.root.querySelector(".vy-cats");
    var list = q ? P().list.filter(function (p) { return norm([p.fr, p.en, phraseIn(p, me), phraseIn(p, d)].join(" ")).indexOf(q) !== -1; })
      : cur.s.cat === "fav" ? fav.map(function (id) { return P().list.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean)
      : P().list.filter(function (p) { return p.cat === cur.s.cat; });
    // Pendant une recherche, les onglets ne filtrent plus : on les masque pour ne pas tromper.
    if (tabs) tabs.hidden = !!q;
    var head = cur.root.querySelector("#vyCatsH"); if (head) head.hidden = !!q;
    if (found) found.textContent = q ? (list.length ? t("found", { n: list.length, q: cur.s.q.trim() }) : t("found0", { q: cur.s.q.trim() })) : "";
    if (!list.length && !q && cur.s.cat === "fav") { ul.innerHTML = '<li class="vy-empty muted">' + esc(t("fav_none")) + "</li>"; return; }
    ul.innerHTML = list.map(function (p) {
      var there = phraseIn(p, d), mine = mineOf(p, me), on = fav.indexOf(p.id) !== -1;
      return '<li class="vy-ph"><button type="button" class="vy-star" data-fav="' + esc(p.id) + '" aria-pressed="' + on + '" aria-label="' + esc(t(on ? "fav_on" : "fav_off", { p: mine })) + '">' + (on ? "★" : "☆") + "</button>" +
        '<p class="vy-there" lang="' + esc(d) + '" dir="auto">' + (there ? esc(there) : '<span class="muted">' + esc(cur.busy && cur.prog ? "⏳ " + t("prep_run", cur.prog) : t("not_ready")) + "</span>") + "</p>" +
        '<p class="vy-mine" lang="' + esc(me) + '" dir="auto">' + esc(mine) + "</p>" +
        (there ? '<div class="vy-acts"><button type="button" class="btn" data-say="' + esc(p.id) + '" aria-label="' + esc(t("listen_a", { p: mine })) + '">' + esc(t("listen")) + "</button>" +
          '<button type="button" class="btn" data-big="' + esc(p.id) + '" aria-label="' + esc(t("show_a", { p: mine })) + '">' + esc(t("show")) + "</button></div>" : "") + "</li>";
    }).join("");
  }
  function speakIt(text) {
    var m = M(), pr = ew() ? ew().prefs() : { volume: 1, rate: 1, voices: {} };
    if (!m) return;
    m.speak(text, cur.s.dest, pr.volume, { rate: pr.rate, voice: (pr.voices || {})[cur.s.dest] });
  }
  function bigScreen(p) {
    var d = cur.s.dest, me = cur.s.src;
    var old = document.getElementById("vyBig");
    if (old) old.remove();
    var box = document.createElement("div");
    box.className = "vy-big";
    box.id = "vyBig";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "vyBigTxt");
    box.innerHTML = '<p class="vy-big-hint">' + esc(t("show_hint")) + '</p><p class="vy-big-txt" id="vyBigTxt" lang="' + esc(d) + '" dir="auto">' + esc(phraseIn(p, d)) + "</p>" +
      '<p class="vy-big-mine" lang="' + esc(me) + '" dir="auto">' + esc(mineOf(p, me)) + "</p>" +
      '<div class="cx-actions"><button type="button" class="btn" id="vyBigSay">' + esc(t("listen")) + '</button><button type="button" class="btn primary" id="vyBigClose">' + esc(t("close")) + "</button></div>";
    document.body.appendChild(box);
    var back = document.querySelector('[data-big="' + p.id + '"]');
    function close() { box.remove(); M() && M().stopSpeaking(); if (back) back.focus(); }
    box.querySelector("#vyBigClose").addEventListener("click", close);
    box.querySelector("#vyBigSay").addEventListener("click", function () { speakIt(phraseIn(p, d)); });
    box.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    box.querySelector("#vyBigClose").focus();
  }
  // Préparation hors connexion : chaque phrase est traduite une fois, du français vers la langue voulue, puis gardée.
  function prepare() {
    if (cur.busy) return;
    var me = cur.s.src;
    var todo = [cur.s.dest, me].filter(function (c, i, a) { return !builtin(c) && a.indexOf(c) === i; });
    if (!todo.length) return;
    var c = cur, msg = c.root.querySelector("#vyMsg"), btn = c.root.querySelector("#vyPrep");
    if (navigator.onLine === false) { msg.textContent = t("e_offline"); return; }
    c.busy = true;
    var my = c.token, list = P().list, total = list.length * todo.length, done = 0;
    btn.disabled = true;
    var jobs = [];
    // La situation ouverte d'abord, pour voir les phrases apparaître tout de suite.
    var open = list.filter(function (p) { return p.cat === c.s.cat; }), rest = list.filter(function (p) { return p.cat !== c.s.cat; });
    todo.forEach(function (code) { open.concat(rest).forEach(function (p) { jobs.push({ code: code, p: p }); }); });
    var bags = {};
    todo.forEach(function (code) { bags[code] = prepared(code); });
    function keep() { todo.forEach(function (code) { store.set("ew_voyage_tr_" + code, JSON.stringify({ ts: new Date().toISOString(), items: bags[code].items })); }); }
    function next() {
      if (cur !== c || my !== c.token) { keep(); return; }
      var j = jobs.shift();
      if (!j) { keep(); c.busy = false; c.prog = null; paint(); return; }
      if (bags[j.code].items[j.p.id]) { done++; return next(); }
      c.prog = { n: done, t: total };
      if (btn.isConnected) btn.textContent = t("prep_run", c.prog);
      M().translate(j.p.fr, "fr", j.code).then(function (tr) {
        bags[j.code].items[j.p.id] = String(tr).slice(0, 300);
        done++;
        if (done % 3 === 0 || !jobs.length) { keep(); if (cur === c && my === c.token) { c.prog = { n: done, t: total }; paintList(); } }
        next();
      }, function (e) {
        keep();
        c.busy = false; c.prog = null;
        var code = e && e.message, n = Object.keys(bags[c.s.dest] ? bags[c.s.dest].items : {}).length;
        if (cur !== c || my !== c.token) return;
        paint();
        var m2 = c.root.querySelector("#vyMsg");
        m2.textContent = code === "QUOTA_PROVIDER" ? t("e_quota", { n: n }) : code === "OFFLINE" || code === "NETWORK" ? t("e_offline") : t("e_other", { m: code, n: n });
      });
    }
    next();
  }

  document.addEventListener("click", function (e) {
    if (!cur || !e.target.closest) return;
    var b = e.target.closest("#vyPrep, #vyTry, #vyFav, #vyTalk, #vySwap, #vyClear, [data-cat], [data-say], [data-big], [data-fav]");
    if (!b || !cur.root.contains(b)) return;
    if (b.id === "vyPrep") prepare();
    else if (b.id === "vySwap") {
      var x = cur.s.src; cur.s.src = cur.s.dest; cur.s.dest = x; saveState(cur.s);
      cur.token++; cur.busy = false; paint();
      var sw = cur.root.querySelector("#vySwap"); if (sw) sw.focus();
    } else if (b.id === "vyClear") {
      cur.s.q = ""; paintList(); b.hidden = true;
      var si = cur.root.querySelector("#vySearch"); if (si) { si.value = ""; si.focus(); }
    } else if (b.hasAttribute("data-fav")) {
      var fid = b.getAttribute("data-fav"), i = cur.s.fav.indexOf(fid);
      if (i === -1) cur.s.fav.push(fid); else cur.s.fav.splice(i, 1);
      saveState(cur.s); paintList();
      var nb = cur.root.querySelector('[data-fav="' + fid + '"]');
      if (nb) nb.focus();
    }
    else if (b.id === "vyTry") {
      var first = P().list[0];
      speakIt(phraseIn(first, cur.s.dest) || langName(cur.s.dest));
    } else if (b.id === "vyFav") {
      if (window.EWProfil && window.EWProfil.addFavorite(cur.s.dest)) { paint(); var m = cur.root.querySelector("#vyMsg"); if (m) m.textContent = t("fav_done"); }
    } else if (b.id === "vyTalk") {
      // La conversation côte à côte s'ouvre avec la langue du pays pour la personne en face.
      if (ew() && ew().setOther) ew().setOther(cur.s.dest);
    } else if (b.hasAttribute("data-cat")) {
      cur.s.cat = b.getAttribute("data-cat"); saveState(cur.s);
      cur.root.querySelectorAll("[data-cat]").forEach(function (x) { var on = x === b; x.setAttribute("aria-selected", String(on)); if (on) x.removeAttribute("tabindex"); else x.setAttribute("tabindex", "-1"); });
      paintList();
    } else {
      var id = b.getAttribute("data-say") || b.getAttribute("data-big");
      var p = P().list.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      if (b.hasAttribute("data-say")) speakIt(phraseIn(p, cur.s.dest));
      else bigScreen(p);
    }
  });
  document.addEventListener("change", function (e) {
    var id = e.target.id;
    if (!cur || (id !== "vyDest" && id !== "vySrc") || !cur.root.contains(e.target)) return;
    if (!known(e.target.value)) return;
    var other = id === "vyDest" ? "src" : "dest", mine = id === "vyDest" ? "dest" : "src";
    // Même langue des deux côtés : on inverse plutôt que de garder deux langues identiques.
    if (e.target.value === cur.s[other]) cur.s[other] = cur.s[mine];
    cur.s[mine] = e.target.value; saveState(cur.s);
    cur.token++; cur.busy = false;
    paint();
    var sel = cur.root.querySelector("#" + id); if (sel) sel.focus();
  });
  document.addEventListener("input", function (e) {
    if (!cur || e.target.id !== "vySearch" || !cur.root.contains(e.target)) return;
    cur.s.q = e.target.value.slice(0, 60);
    var cl = cur.root.querySelector("#vyClear"); if (cl) cl.hidden = !cur.s.q;
    paintList();
  });
  // Onglets des situations : flèches gauche/droite.
  document.addEventListener("keydown", function (e) {
    if (!cur || (e.key !== "ArrowRight" && e.key !== "ArrowLeft") || !e.target.closest || !e.target.closest(".vy-cats")) return;
    var bs = [].slice.call(cur.root.querySelectorAll("[data-cat]")), i = bs.indexOf(e.target);
    if (i === -1) return;
    var n = bs[(i + (e.key === "ArrowRight" ? 1 : bs.length - 1)) % bs.length];
    n.focus(); n.click(); e.preventDefault();
  });
  function onNet() { var n = cur && cur.root.querySelector("#vyNet"); if (n) n.textContent = navigator.onLine === false ? t("offline") : t("online"); }
  window.addEventListener("online", onNet);
  window.addEventListener("offline", onNet);

  function leave() { if (cur) cur.token++; cur = null; var b = document.getElementById("vyBig"); if (b) b.remove(); }
  window.EWVoyage = { show: show, leave: leave, _prepared: prepared, _strings: STR };
})();

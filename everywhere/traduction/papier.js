/* 24/24 EVERYWHERE — Comprendre un papier. © 2026 Sébastien Chevrier. Tous droits réservés.
   Route : #/everywhere/papier. On photographie une lettre, une ordonnance, un formulaire, un panneau ; le téléphone lit
   le texte (Tesseract.js, gratuit, licence Apache 2.0, chargé seulement ici) puis on le lit dans sa langue.
   La photo ne quitte jamais le téléphone : seul le texte lu part vers le service de traduction gratuit (MyMemory).
   Première lecture d'une langue : téléchargement de ses données de lecture (quelques Mo), gardées ensuite sur le téléphone.
   Limites dites à l'écran : écriture à la main mal lue, traduction automatique à faire vérifier pour un papier important. */
(function () {
  "use strict";
  var M = window.EWMoteur;
  var LIB = "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js";
  var LIB_SRI = "sha384-r1ru3tcf6FhnCFR4B7pIFG+BhFF9LlFtz/P1y4pblWn3AGs9y3lBx5SKLNf4+rED";
  // Code de langue (ISO 639-1) → données de lecture Tesseract. Langue absente : lecture en alphabet latin (anglais).
  var OCR = { fr: "fra", en: "eng", es: "spa", pt: "por", de: "deu", it: "ita", nl: "nld", pl: "pol", ro: "ron", cs: "ces", sv: "swe",
    da: "dan", no: "nor", fi: "fin", hu: "hun", el: "ell", tr: "tur", ru: "rus", uk: "ukr", bg: "bul", sr: "srp", hr: "hrv",
    zh: "chi_sim", ja: "jpn", ko: "kor", ar: "ara", fa: "fas", he: "heb", ur: "urd", hi: "hin", bn: "ben", ta: "tam", te: "tel",
    mr: "mar", gu: "guj", pa: "pan", th: "tha", vi: "vie", id: "ind", ms: "msa", tl: "tgl", sw: "swa", am: "amh", mg: "eng" };
  var lang = "fr";
  var STR = {
    fr: {
      title: "📄 Tout comprendre", back: "← Traduire",
      sub: "Photographiez une lettre, une ordonnance, un formulaire, un panneau, un menu, un écran ou une étiquette : lisez-le dans votre langue.",
      from: "Langue du papier", to: "Ma langue", shoot: "📷 Photographier", pick: "🖼 Choisir une image",
      private: "La photo reste sur votre téléphone. Seul le texte lu est envoyé au service de traduction gratuit.",
      first: "Première fois pour cette langue : le téléphone télécharge ses données de lecture (quelques Mo).",
      loading: "Préparation de la lecture…", reading: "Lecture du papier… {p} %", read_t: "Texte lu (corrigez-le si besoin)",
      none: "Aucun texte trouvé. Reprenez la photo bien à plat, avec plus de lumière.",
      e_lib: "La lecture n'a pas pu démarrer : il faut Internet la première fois. Réessayez une fois connecté.",
      e_read: "La lecture a échoué. Reprenez la photo.",
      translate: "Traduire dans ma langue", translating: "Traduction…", result: "Dans ma langue", speak: "🔊 Écouter",
      e_tr: "La traduction n'a pas pu se faire (connexion ou limite du jour). Réessayez.",
      warn: "Traduction automatique : pour un papier important (justice, santé, argent, titre de séjour), faites vérifier par une personne de confiance ou une association. L'écriture à la main est souvent mal lue.",
      help: "Demander de l'aide dans Entraide",
      snap: "📸 Prendre la photo", cancel: "Annuler",
      e_cam: "La caméra ne s'ouvre pas. Utilisez « Appareil photo du téléphone » ou « Choisir une image ».",
      e_cam_no: "La caméra est bloquée pour ONE WORLD. Touchez « Appareil photo du téléphone » ci-dessous : il marche sans autorisation. Pour débloquer : Chrome → ⋮ → Paramètres → Paramètres des sites → Appareil photo.",
      e_cam_busy: "La caméra est déjà prise par une autre appli (appel, visio). Fermez-la, ou touchez « Appareil photo du téléphone ».",
      native: "📷 Appareil photo du téléphone"
    },
    en: {
      title: "📄 Understand anything", back: "← Translate",
      sub: "Take a photo of a letter, a prescription, a form, a sign, a menu, a screen or a label: read it in your language.",
      from: "Language of the document", to: "My language", shoot: "📷 Take a photo", pick: "🖼 Choose an image",
      private: "The photo stays on your phone. Only the text that was read is sent to the free translation service.",
      first: "First time for this language: the phone downloads its reading data (a few MB).",
      loading: "Getting ready to read…", reading: "Reading the document… {p} %", read_t: "Text read (correct it if needed)",
      none: "No text found. Take the photo again, flat and with more light.",
      e_lib: "Reading could not start: the first time needs Internet. Try again once connected.",
      e_read: "Reading failed. Take the photo again.",
      translate: "Translate into my language", translating: "Translating…", result: "In my language", speak: "🔊 Listen",
      e_tr: "The translation could not be done (connection or daily limit). Try again.",
      warn: "Machine translation: for an important document (court, health, money, residence permit), have it checked by someone you trust or an association. Handwriting is often misread.",
      help: "Ask for help in Mutual aid",
      snap: "📸 Take the photo", cancel: "Cancel",
      e_cam: "The camera does not open. Use “Phone camera” or “Choose an image”.",
      e_cam_no: "The camera is blocked for ONE WORLD. Tap “Phone camera” below: it works without permission. To unblock: Chrome → ⋮ → Settings → Site settings → Camera.",
      e_cam_busy: "The camera is already used by another app (call, video). Close it, or tap “Phone camera”.",
      native: "📷 Phone camera"
    }
  };
  function t(k, v) {
    var X = window.EW_SCREEN_STR && window.EW_SCREEN_STR.papier && window.EW_SCREEN_STR.papier[lang];
    var s = (STR[lang] && STR[lang][k]) || (X && X[k]) || STR.en[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function base(c) { return String(c || "").split("-")[0].toLowerCase(); }
  var libP = null;
  function loadLib() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (libP) return libP;
    libP = new Promise(function (ok, ko) {
      var s = document.createElement("script");
      s.src = LIB;
      if (!window.__EW_NO_SRI) { s.integrity = LIB_SRI; s.crossOrigin = "anonymous"; }
      s.onload = function () { window.Tesseract ? ok(window.Tesseract) : ko(new Error("LIB")); };
      s.onerror = function () { libP = null; ko(new Error("LIB")); };
      document.head.appendChild(s);
    });
    return libP;
  }
  var token = 0, worker = null, stream = null;
  // Caméra dans la page (getUserMedia) : sur beaucoup d'Android, l'appareil photo externe (input capture) fait fermer
  // la page par le téléphone pendant la prise de vue, et la photo est perdue au retour. Ici la page reste ouverte.
  function stopCam() { if (stream) { stream.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e) { /* déjà arrêtée */ } }); stream = null; } }
  function stopWorker() { if (worker) { try { worker.terminate(); } catch (e) { /* déjà arrêté */ } worker = null; } }
  function langOpts(sel) {
    return (M.langs || []).map(function (l) { return '<option value="' + esc(l.code) + '"' + (l.code === sel ? " selected" : "") + ">" + esc((l.flag ? l.flag + " " : "") + l.name) + "</option>"; }).join("");
  }
  function show(root, uiLang, me) {
    var packs = (window.EW_SCREEN_STR && window.EW_SCREEN_STR.papier) || {};
    lang = STR[uiLang] || packs[uiLang] ? uiLang : (uiLang ? "en" : "fr");
    token += 1;
    var tok = token, mine = base(me || uiLang || "fr"), from = mine === "en" ? "fr" : "en";
    try { var saved = localStorage.getItem("ew_papier_from"); if (saved) from = saved; } catch (e) { /* rien de gardé */ }
    root.innerHTML = '<a class="tr-back" href="#/everywhere">' + esc(t("back")) + "</a>" +
      '<div class="tr-head"><div><h1 id="h-tr">' + esc(t("title")) + '</h1><p class="muted">' + esc(t("sub")) + "</p></div></div>" +
      '<div class="card pp-card">' +
        '<label class="tr-field">' + esc(t("from")) + '<select id="ppFrom">' + langOpts(from) + "</select></label>" +
        '<label class="tr-field">' + esc(t("to")) + '<select id="ppTo">' + langOpts(mine) + "</select></label>" +
        '<div class="es-row pp-row"><button type="button" class="btn primary" id="ppShoot">' + esc(t("shoot")) + '</button>' +
        '<label class="btn pp-file" id="ppNative" hidden>' + esc(t("native")) + '<input id="ppCam" type="file" accept="image/*" capture="environment" hidden></label>' +
        '<label class="btn pp-file">' + esc(t("pick")) + '<input id="ppPick" type="file" accept="image/*" hidden></label></div>' +
        '<div id="ppCamBox" class="pp-cam" hidden><video id="ppVideo" playsinline muted autoplay></video>' +
        '<div class="es-row pp-row"><button type="button" class="btn primary" id="ppSnap">' + esc(t("snap")) + '</button><button type="button" class="btn" id="ppCamStop">' + esc(t("cancel")) + "</button></div></div>" +
        '<p class="muted es-small">' + esc(t("private")) + " " + esc(t("first")) + "</p>" +
      "</div>" +
      '<p id="ppMsg" class="pp-msg" role="status" aria-live="polite"></p>' +
      '<div id="ppOut" hidden><div class="card"><label class="tr-field">' + esc(t("read_t")) + '<textarea id="ppText" rows="6" dir="auto"></textarea></label>' +
        '<button type="button" class="btn primary" id="ppGo">' + esc(t("translate")) + "</button></div>" +
        '<div class="card" id="ppRes" hidden><h2 class="tr-h2">' + esc(t("result")) + '</h2><p id="ppTr" class="pp-tr" dir="auto"></p>' +
        '<div class="es-row"><button type="button" class="btn" id="ppSay">' + esc(t("speak")) + '</button><a class="btn" href="#/entraide/new">' + esc(t("help")) + "</a></div></div>" +
        '<p class="muted es-small">' + esc(t("warn")) + "</p></div>";
    var msg = root.querySelector("#ppMsg"), fromSel = root.querySelector("#ppFrom"), toSel = root.querySelector("#ppTo");
    fromSel.addEventListener("change", function () { try { localStorage.setItem("ew_papier_from", fromSel.value); } catch (e) { /* tant pis */ } });
    function onFile(e) {
      var f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      read(f);
    }
    root.querySelector("#ppCam").addEventListener("change", onFile);
    var camBox = root.querySelector("#ppCamBox"), video = root.querySelector("#ppVideo");
    function camOff() { stopCam(); video.srcObject = null; camBox.hidden = true; }
    root.querySelector("#ppShoot").addEventListener("click", function () {
      var md = navigator.mediaDevices;
      if (!md || !md.getUserMedia) { root.querySelector("#ppCam").click(); return; } // très vieux téléphone : appareil photo externe
      msg.textContent = "";
      stopCam();
      md.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }).then(function (s) {
        if (tok !== token) { s.getTracks().forEach(function (tr) { tr.stop(); }); return; }
        stream = s;
        video.srcObject = s;
        camBox.hidden = false;
        var pl = video.play();
        if (pl && pl.catch) pl.catch(function () { /* lecture auto refusée : l'image arrive quand même */ });
        try { camBox.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { /* ignoré */ }
      }, function (err) {
        // Caméra refusée ou occupée : l'appareil photo du téléphone (input capture) ne demande aucune autorisation au site.
        var n = err && err.name;
        msg.textContent = t(n === "NotAllowedError" || n === "SecurityError" ? "e_cam_no" : n === "NotReadableError" || n === "AbortError" ? "e_cam_busy" : "e_cam");
        root.querySelector("#ppNative").hidden = false;
      });
    });
    root.querySelector("#ppCamStop").addEventListener("click", camOff);
    root.querySelector("#ppSnap").addEventListener("click", function () {
      var w = video.videoWidth, h = video.videoHeight;
      if (!w || !h) return;
      var c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(video, 0, 0, w, h);
      camOff();
      c.toBlob(function (b) { if (b) read(b); else msg.textContent = t("e_read"); }, "image/jpeg", 0.92);
    });
    root.querySelector("#ppPick").addEventListener("change", onFile);
    function read(file) {
      var code = OCR[base(fromSel.value)] || "eng";
      root.querySelector("#ppOut").hidden = true;
      root.querySelector("#ppRes").hidden = true;
      msg.textContent = t("loading");
      loadLib().then(function (T) {
        if (tok !== token) return null;
        stopWorker();
        return T.createWorker(code, 1, {
          logger: function (m) { if (tok === token && m && m.status === "recognizing text") msg.textContent = t("reading", { p: Math.round((m.progress || 0) * 100) }); }
        }).then(function (w) {
          worker = w;
          if (tok !== token) { stopWorker(); return null; }
          return w.recognize(file);
        });
      }, function () { throw new Error("LIB"); }).then(function (r) {
        if (!r || tok !== token) return;
        stopWorker();
        var txt = String((r.data && r.data.text) || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
        if (!txt) { msg.textContent = t("none"); return; }
        msg.textContent = "";
        root.querySelector("#ppText").value = txt;
        root.querySelector("#ppOut").hidden = false;
        go();
      }).catch(function (e) {
        stopWorker();
        if (tok === token) msg.textContent = t(e && e.message === "LIB" ? "e_lib" : "e_read");
      });
    }
    function go() {
      var src = root.querySelector("#ppText").value.trim(), out = root.querySelector("#ppTr"), res = root.querySelector("#ppRes");
      if (!src) return;
      var f = base(fromSel.value), to = base(toSel.value);
      msg.textContent = t("translating");
      M.translate(src, f, to).then(function (tr) {
        if (tok !== token) return;
        msg.textContent = "";
        out.textContent = tr;
        out.setAttribute("lang", to);
        res.hidden = false;
      }).catch(function () { if (tok === token) msg.textContent = t("e_tr"); });
    }
    root.querySelector("#ppGo").addEventListener("click", go);
    root.querySelector("#ppSay").addEventListener("click", function () { M.speak(root.querySelector("#ppTr").textContent, toSel.value, 1); });
    return t("title").replace(/^📄\s*/, "");
  }
  function leave() { token += 1; stopWorker(); stopCam(); }
  window.EWPapier = { show: show, leave: leave, _ocr: OCR, _strings: STR };
})();

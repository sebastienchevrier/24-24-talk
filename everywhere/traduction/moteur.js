/* 24/24 EVERYWHERE — moteur de traduction et de voix. © 2026 Sébastien Chevrier. Tous droits réservés.
   Mêmes services que 24/24 TALK, gratuits et sans clé :
   - traduction : MyMemory (api.mymemory.translated.net), comme le moteur en ligne de TALK ;
   - écoute : reconnaissance vocale du navigateur (la langue doit être connue : un bouton micro par langue) ;
   - lecture : voix de synthèse du téléphone.
   Le dictionnaire de phrases hors ligne de TALK n'est pas repris ici (prochaine étape : un fichier commun à TALK et EVERYWHERE). */
(function () {
  "use strict";
  var LANGS = window.EW_LANGS || [];
  function lang(code) {
    return LANGS.filter(function (l) { return l.code === code; })[0] || { code: code, name: code, flag: "", speech: code };
  }

  // ---------- Traduction ----------
  // Résultat : texte traduit. Erreurs (message) : EMPTY, OFFLINE, NETWORK, SERVER, QUOTA_PROVIDER, EMPTY_RESULT.
  // (SERVER couvre aussi une réponse illisible ou un code d'erreur de MyMemory.)
  // Rapidité : chaque traduction est gardée (200 dernières), et une traduction déjà demandée en avance
  // (pendant que la personne finit sa phrase) est réutilisée au lieu d'être redemandée.
  var cache = {}, cacheKeys = [];
  function translate(text, from, to) {
    text = String(text || "").trim();
    if (!text) return Promise.reject(new Error("EMPTY"));
    if (from === to) return Promise.resolve(text);
    var key = from + "|" + to + "|" + text.toLowerCase();
    if (cache[key]) return cache[key];
    var p = fetchTranslation(text, from, to);
    cache[key] = p;
    cacheKeys.push(key);
    if (cacheKeys.length > 200) delete cache[cacheKeys.shift()];
    p.catch(function () { if (cache[key] === p) delete cache[key]; }); // une erreur n'est jamais gardée
    return p;
  }
  // MyMemory refuse les textes de plus de 500 octets : une longue phrase est découpée (fin de phrase, puis espaces)
  // et les morceaux sont traduits l'un après l'autre.
  var MAX_BYTES = 450;
  function bytes(s) { return unescape(encodeURIComponent(s)).length; }
  function pieces(text) {
    if (bytes(text) <= MAX_BYTES) return [text];
    var parts = text.match(/[^.!?。！？]+[.!?。！？]*\s*/g) || [text], out = [], cur = "";
    function push(w) {
      if (cur && bytes(cur + w) > MAX_BYTES) { out.push(cur.trim()); cur = ""; }
      while (bytes(w) > MAX_BYTES) { var n = MAX_BYTES; while (bytes(w.slice(0, n)) > MAX_BYTES) n -= 10; out.push(w.slice(0, n)); w = w.slice(n); }
      cur += w;
    }
    parts.forEach(function (p) { if (bytes(p) > MAX_BYTES) p.split(/(\s+)/).forEach(push); else push(p); });
    if (cur.trim()) out.push(cur.trim());
    return out.filter(Boolean);
  }
  function fetchTranslation(text, from, to) {
    var list = pieces(text);
    if (list.length === 1) return fetchOne(text, from, to);
    var joint = /^(zh|ja|th|lo|km|my)\b/.test(to) ? "" : " ", done = [];
    return list.reduce(function (p, part) {
      return p.then(function () { return fetchOne(part, from, to).then(function (tr) { done.push(tr); }); });
    }, Promise.resolve()).then(function () { return done.join(joint); });
  }
  // Réponse de MyMemory : le quota épuisé arrive parfois comme un texte « traduit » (MYMEMORY WARNING…) avec un
  // code 429 dans responseStatus ; il ne doit jamais être affiché ni lu à voix haute comme une traduction.
  // Hors correspondance exacte, la traduction automatique (« MT! ») vaut mieux que la phrase voisine de la mémoire
  // de MyMemory (souvent des sous-titres) : même règle que TALK (mesure du 19 oct. 2026).
  // Essai réel du 31 oct. 2026 : sans entrée « MT! », la mémoire renvoie aussi « Hola XXX, ¿cómo estás? » ou une
  // question à la place d'une phrase (« J'ai besoin d'un médecin » → « Y a-t-il un médecin ? ») : on prend alors la
  // proposition suivante (match ≥ 0,9) et on enlève le tiret des sous-titres. Même règle que mmBest dans index.html.
  function best(data, src) {
    var rd = data && data.responseData, tr = rd && rd.translatedText;
    var list = data && Array.isArray(data.matches) ? data.matches : [];
    var mt = rd && Number(rd.match) >= 1 ? null : list.filter(function (m) { return m && m["created-by"] === "MT!" && m.translation; })[0];
    var s = String(src || "").trim(), ask = /[?？؟]$/.test(s), dash = /^[-–—]/.test(s), xx = /XXX/.test(s);
    function fits(t) { return !!t && !(!xx && /XXX/.test(t)) && !(!ask && /[?？؟]\s*$/.test(String(t))); }
    function clean(t) { t = String(t || ""); if (!dash) t = t.replace(/^\s*[-–—]\s*/, ""); if (!xx) t = t.replace(/\s*XXX+/g, ""); return t.replace(/\s+([,.!?،])/g, "$1").trim(); }
    var cands = [mt ? mt.translation : tr, tr].concat(list.filter(function (m) { return m && m.translation && Number(m.match) >= 0.9; }).map(function (m) { return m.translation; }));
    for (var i = 0; i < cands.length; i++) if (fits(cands[i])) return clean(cands[i]);
    return tr ? clean(mt ? mt.translation : tr) : tr;
  }
  function checkAnswer(data, src) {
    var tr = best(data, src);
    var st = Number(data && data.responseStatus) || 0;
    var note = String((data && data.responseDetails) || "") + " " + String(tr || "");
    if ((data && data.quotaFinished) || st === 429 || /MYMEMORY WARNING|ALL AVAILABLE FREE TRANSLATIONS|QUOTA/i.test(note)) throw new Error("QUOTA_PROVIDER");
    if (st && st !== 200) throw new Error("SERVER");
    if (!tr) throw new Error("EMPTY_RESULT");
    return decodeEntities(String(tr));
  }
  function decodeEntities(s) {
    return s.replace(/&(#x?[0-9a-f]+|quot|amp|lt|gt|apos);/gi, function (m, e) {
      var k = e.toLowerCase();
      if (k === "quot") return '"'; if (k === "amp") return "&"; if (k === "lt") return "<"; if (k === "gt") return ">"; if (k === "apos") return "'";
      var n = k[1] === "x" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
      return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    });
  }
  function fetchOne(text, from, to) {
    if (navigator.onLine === false) return Promise.reject(new Error("OFFLINE"));
    var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=" + encodeURIComponent(from) + "|" + encodeURIComponent(to);
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;
    return fetch(url, { method: "GET", signal: ctrl ? ctrl.signal : undefined })
      .catch(function () { throw new Error("NETWORK"); })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (res.status === 429) throw new Error("QUOTA_PROVIDER");
        if (!res.ok) throw new Error("SERVER");
        return res.json().catch(function () { throw new Error("SERVER"); });
      })
      .then(function (d) { return checkAnswer(d, text); });
  }

  // ---------- Lecture à voix haute ----------
  // Le son sort là où Android l'envoie : haut-parleur du téléphone, ou écouteurs Bluetooth s'ils sont connectés.
  // Une page web ne peut pas choisir elle-même la sortie ni piloter les écouteurs.
  var canSpeak = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
  function allVoices() { try { return (canSpeak && window.speechSynthesis.getVoices()) || []; } catch (e) { return []; } }
  // Voix du téléphone pour une langue (fr → fr-FR, fr-CA…).
  function voicesFor(code) {
    var want = String(lang(code).speech || code).toLowerCase().replace("_", "-"), base = want.split("-")[0];
    return allVoices().filter(function (v) { var l = String(v.lang || "").toLowerCase().replace("_", "-"); return l === want || l.split("-")[0] === base; })
      .sort(function (a, b) { return (String(b.lang).toLowerCase() === want) - (String(a.lang).toLowerCase() === want); });
  }
  // Voix choisie (identifiant gardé dans les réglages) ou, à défaut, la plus naturelle disponible.
  function pickVoice(code, uri) {
    var list = voicesFor(code);
    if (uri) { var v = list.filter(function (x) { return x.voiceURI === uri; })[0]; if (v) return v; }
    return list.filter(function (x) { return /natural|neural|premium|enhanced|google/i.test(x.name || ""); })[0] || list[0] || null;
  }
  // opts : { rate (0,5 à 1,5), voice (identifiant), done() appelé une fois la phrase lue, ou tout de suite si rien n'est lu }.
  function speak(text, code, volume, opts) {
    opts = opts || {};
    var called = false, timer = null;
    function done() { if (called) return; called = true; clearTimeout(timer); if (opts.done) opts.done(); }
    if (!canSpeak || !text) { done(); return false; }
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang(code).speech;
      u.volume = typeof volume === "number" ? Math.max(0, Math.min(1, volume)) : 1;
      var rate = typeof opts.rate === "number" ? Math.max(0.5, Math.min(1.5, opts.rate)) : 1;
      u.rate = rate;
      var v = pickVoice(code, opts.voice);
      if (v) { try { u.voice = v; u.lang = v.lang || u.lang; } catch (e) { /* voix refusée : voix par défaut */ } }
      u.onend = done;
      u.onerror = done;
      // Certains Android n'annoncent pas toujours la fin de la phrase : délai de secours selon la longueur.
      timer = setTimeout(done, Math.min(20000, 1500 + String(text).length * 90 / rate));
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { done(); return false; }
  }
  function stopSpeaking() { if (canSpeak) { try { window.speechSynthesis.cancel(); } catch (e) { /* rien */ } } }

  // ---------- Écoute (un seul micro à la fois sur un téléphone) ----------
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var micOk = false;
  // Autorisation du micro : comme dans TALK, on la demande nous-mêmes (Android ne l'affiche pas toujours).
  function askMic() {
    if (micOk || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.resolve(true);
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) {
      st.getTracks().forEach(function (tr) { tr.stop(); });
      micOk = true;
      return new Promise(function (r) { setTimeout(function () { r(true); }, 250); });
    }, function (e) {
      if (e && (e.name === "NotAllowedError" || e.name === "SecurityError" || e.name === "PermissionDeniedError")) return false;
      return true; // autre souci : la reconnaissance vocale tente sa chance
    });
  }
  // cb : { interim(text), final(text), error(code), end(), stable(text) } ; codes : DENIED, NETWORK, NO_SPEECH, FAIL.
  // Renvoie un objet { stop() } ou null si l'écoute n'a pas pu démarrer.
  // Captation plus tolérante : si le téléphone n'a rien entendu (on a parlé trop tôt, trop bas, ou Android a coupé),
  // l'écoute repart toute seule, sans rien afficher, pendant 20 secondes au plus. La fin de phrase attend un peu plus
  // longtemps quand la phrase est encore courte (moins de 3 mots), pour ne pas couper « oui… bonjour ».
  var RETRY_MS = 20000;
  function listen(code, cb) {
    if (!SR) return null;
    var done = false, stopped = false, settle = null, early = null, shown = "", cur = null, t0 = Date.now();
    function deliver(txt) {
      if (done || !txt) return;
      done = true;
      clearTimeout(settle); clearTimeout(early);
      try { cur.abort(); } catch (e) { /* déjà arrêté */ }
      cb.final(txt);
    }
    function finish(errCode) {
      if (done) return;
      done = true;
      clearTimeout(settle); clearTimeout(early);
      if (errCode) cb.error(errCode);
      if (cb.end) cb.end();
    }
    function startOne() {
      var r = new SR();
      cur = r;
      r.lang = lang(code).speech;
      r.interimResults = true;
      r.continuous = false;
      var heard = false;
      // cb.sound(true/false) : une voix est captée ou non (le bouton micro réagit).
      r.onsoundstart = r.onspeechstart = function () { if (!done && cur === r && cb.sound) cb.sound(true); };
      r.onsoundend = r.onspeechend = function () { if (!done && cur === r && cb.sound) cb.sound(false); };
      r.onresult = function (ev) {
        if (done || cur !== r) return;
        if (cb.sound) cb.sound(true);
        var fin = "", inter = "";
        for (var i = ev.resultIndex || 0; i < ev.results.length; i++) {
          if (ev.results[i].isFinal) fin += ev.results[i][0].transcript; else inter += ev.results[i][0].transcript;
        }
        shown = (fin || inter).trim();
        if (shown) heard = true;
        if (cb.interim) cb.interim(shown);
        clearTimeout(settle);
        clearTimeout(early);
        if (fin) deliver(fin.trim());
        else if (shown) {
          // Phrase stable 250 ms : la traduction part en avance (cb.stable). Fin de phrase : 600 ms de calme, 900 ms si moins de 3 mots.
          var s = shown, wait = s.split(/\s+/).length < 3 ? 900 : 600;
          if (cb.stable) early = setTimeout(function () { if (!done) cb.stable(s); }, 250);
          settle = setTimeout(function () { deliver(shown); }, wait);
        }
      };
      var again = function () { return !stopped && !heard && !shown && Date.now() - t0 < (window.EW_STT_RETRY_MS || RETRY_MS); }; // EW_STT_RETRY_MS : tests automatiques seulement
      r.onerror = function (ev) {
        if (done || cur !== r || ev.error === "aborted") return;
        if ((ev.error === "no-speech" || ev.error === "audio-capture") && again()) { r._retry = true; return; } // onend relance
        r._fail = ev.error === "not-allowed" || ev.error === "service-not-allowed" ? "DENIED" : ev.error === "network" ? "NETWORK" : ev.error === "no-speech" ? "NO_SPEECH" : "FAIL";
      };
      r.onend = function () {
        if (done || cur !== r) return;
        if (shown) { deliver(shown); return; }
        if (r._fail) { finish(r._fail); return; }
        if ((r._retry || !heard) && again()) { setTimeout(function () { if (!done && !stopped) { try { startOne(); } catch (e) { finish("FAIL"); } } }, 150); return; }
        finish(heard ? null : "NO_SPEECH");
      };
      r.start();
    }
    try { startOne(); } catch (e) { return null; }
    return { stop: function () {
      stopped = true;
      if (shown) { deliver(shown); return; }
      try { cur.stop(); } catch (e) { /* déjà arrêté */ }
      setTimeout(function () { finish(null); }, 400); // certains Android n'annoncent pas la fin après stop()
    } };
  }

  window.EWMoteur = { lang: lang, langs: LANGS, translate: translate, speak: speak, stopSpeaking: stopSpeaking, canSpeak: canSpeak, voicesFor: voicesFor, pickVoice: pickVoice,
    canListen: !!SR, askMic: askMic, listen: listen, _pieces: pieces };
})();

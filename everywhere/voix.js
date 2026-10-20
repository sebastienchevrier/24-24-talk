/* 24/24 ONE WORLD — VOICE : commandes vocales, seulement quand on appuie sur le micro. © 2026 Sébastien Chevrier. Tous droits réservés.
   Un bouton micro dans la barre du haut (portail et TALK). Un appui = une phrase écoutée, comparée à une courte liste
   de commandes en français et en anglais (aucune intelligence artificielle, aucun service payant), puis l'action comprise
   est affichée avant d'être faite. Pas d'écoute permanente, pas de mot magique : le micro se coupe tout seul après la phrase.
   « Appelle … » n'appelle jamais directement : la fiche d'appel s'ouvre et c'est la personne qui touche « Appeler ».
   Navigateur sans reconnaissance vocale (Firefox, certains iPhone) : le bouton n'apparaît pas, tout reste faisable au toucher. */
(function () {
  "use strict";
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var PENDING = "ew_voice_next"; // action à finir après un changement de page (« ouvre la messagerie » depuis le portail : TALK la lit au chargement)

  var STR = {
    fr: { btn: "Commande vocale", listening: "Je vous écoute…", stop: "Arrêter", heard: "Compris : « {t} »",
      not_understood: "Je n'ai pas compris « {t} ». Essayez : « Ouvre la messagerie », « Traduis en anglais », « Appelle maria ».",
      help: "Vous pouvez dire : « Ouvre la messagerie », « Ouvre Face à face », « Ouvre Apprendre », « Ouvre mon profil », « Traduis en anglais », « Appelle maria », « Lis mon dernier message », « Arrête ».",
      no_speech: "Je n'ai rien entendu. Touchez le micro et parlez juste après.",
      denied: "Le micro est bloqué. Dans Chrome : cadenas à gauche de l'adresse, Autorisations, Micro, Autoriser.",
      network: "La reconnaissance vocale a besoin d'Internet. Réessayez quand vous êtes connecté.",
      busy: "Le micro est déjà utilisé par une autre fonction. Terminez-la, puis réessayez.",
      opening: "J'ouvre {x}", translating: "Traduction vers : {x}", calling: "Je cherche @{x} pour l'appeler (vous confirmerez)",
      stopped: "Arrêté.", reading: "Je lis le dernier message.", no_msg: "Aucun message reçu dans cette discussion.", no_read: "Ouvrez une discussion dans la Messagerie, puis dites « Lis mon dernier message ».",
      unknown_lang: "Je ne connais pas la langue « {x} ». Choisissez-la dans Mes langues.",
      names: { accueil: "l'accueil", talk: "la messagerie", msg: "la messagerie", everywhere: "Face à face", learn: "Apprendre", profil: "votre profil",
        parametres: "les paramètres", face: "la conversation côte à côte", appel: "Appeler un contact", langues: "Mes langues" } },
    en: { btn: "Voice command", listening: "Listening…", stop: "Stop", heard: "Understood: “{t}”",
      not_understood: "I didn't understand “{t}”. Try: “Open messages”, “Translate to Spanish”, “Call maria”.",
      help: "You can say: “Open messages”, “Open Face to face”, “Open Learn”, “Open my profile”, “Translate to Spanish”, “Call maria”, “Read my last message”, “Stop”.",
      no_speech: "I didn't hear anything. Tap the microphone and speak right after.",
      denied: "The microphone is blocked. In Chrome: padlock left of the address, Permissions, Microphone, Allow.",
      network: "Voice recognition needs the Internet. Try again when you are online.",
      busy: "The microphone is already in use by another feature. Finish it, then try again.",
      opening: "Opening {x}", translating: "Translating to: {x}", calling: "Looking for @{x} to call (you will confirm)",
      stopped: "Stopped.", reading: "Reading the last message.", no_msg: "No message received in this chat.", no_read: "Open a chat in Messages, then say “Read my last message”.",
      unknown_lang: "I don't know the language “{x}”. Choose it in My languages.",
      names: { accueil: "home", talk: "messages", msg: "messages", everywhere: "Face to face", learn: "Learn", profil: "your profile",
        parametres: "settings", face: "side-by-side conversation", appel: "Call a contact", langues: "My languages" } }
  };

  // Langues que l'on peut nommer à voix haute (noms français et anglais) → code de TALK / EVERYWHERE.
  var LANG_ALIASES = {
    fr: "francais french", en: "anglais english", es: "espagnol spanish castillan", pt: "portugais portuguese bresilien",
    de: "allemand german", it: "italien italian", zh: "chinois chinese mandarin", ja: "japonais japanese", ar: "arabe arabic",
    ru: "russe russian", mg: "malgache malagasy", nl: "neerlandais hollandais dutch", pl: "polonais polish", tr: "turc turkish",
    ko: "coreen korean", hi: "hindi", vi: "vietnamien vietnamese", th: "thai thailandais", uk: "ukrainien ukrainian",
    ro: "roumain romanian", el: "grec greek", sv: "suedois swedish", sw: "swahili", id: "indonesien indonesian", he: "hebreu hebrew"
  };

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/['’`\-_.,;:!?«»"“”()]/g, " ").replace(/\s+/g, " ").trim();
  }
  function langCode(word) {
    var w = norm(word).replace(/^(l |le |la |en |vers |to |into )+/, "").trim();
    if (!w) return null;
    var codes = Object.keys(LANG_ALIASES);
    for (var i = 0; i < codes.length; i++) if ((" " + LANG_ALIASES[codes[i]] + " ").indexOf(" " + w + " ") !== -1) return codes[i];
    // Portail : les 112 langues d'EVERYWHERE (noms français) sont aussi reconnues.
    var all = window.EWMoteur && window.EWMoteur.langs;
    if (all) for (var j = 0; j < all.length; j++) if (norm(all[j].name) === w) return all[j].code;
    return null;
  }
  var TARGETS = [
    ["talk", /^(talk|tolk|tok|toc|talc|24 24 talk|l appli talk)$/],
    ["msg", /^(messagerie|messages?|discussions?|conversations?|chats?|messenger)$/],
    ["everywhere", /^(everywhere|every where|evrywhere|evriwer|everyware|traducteur)$/],
    ["learn", /^(learn|lern|apprendre|apprentissage|lecons?|lessons?)$/],
    ["profil", /^(profil|profile|compte|account|mon compte|my account)$/],
    ["parametres", /^(parametres?|reglages?|settings|options)$/],
    ["accueil", /^(accueil|home|debut|page d accueil|home page)$/],
    ["face", /^(cote a cote|face a face|conversation|conversation cote a cote|conversation face a face|traduction|side by side|face to face|translation)$/],
    ["appel", /^(appels?|appeler|appeler sur talk|calls?)$/],
    ["langues", /^(langues|mes langues|languages|my languages)$/]
  ];
  function target(rest) {
    var r = norm(rest).replace(/^(moi |me )/, "").replace(/^(le |la |l |les |mon |ma |mes |my |the |a |an |sur |dans |a )+/, "").trim();
    for (var i = 0; i < TARGETS.length; i++) if (TARGETS[i][1].test(r)) return TARGETS[i][0];
    return null;
  }

  // Phrase entendue → commande. Fonction pure (testée sur des phrases écrites).
  function parse(text) {
    var s = norm(text)
      .replace(/^(ok |bon |alors |euh |hey |dis |please |s il te plait |s il vous plait |stp |peux tu |pouvez vous |tu peux |je veux |je voudrais |j aimerais |can you |could you |i want to |i would like to )+/, "")
      .replace(/( s il te plait| s il vous plait| stp| please)$/, "").trim();
    if (!s) return { act: "none" };
    var m;
    if (/^(arrete|arreter|arretez|stop|stoppe|stopper|tais toi|silence|annule|annuler|cancel|be quiet|quiet)\b/.test(s)) return { act: "stop" };
    if (/^(aide|help|qu est ce que je peux dire|que puis je dire|commandes|what can i say)\b/.test(s)) return { act: "help" };
    if (/^(lis|lire|relis|relire|lit|read|read out|read me)( moi| me)?( mon| le| ma| my| the)?( dernier| derniere| last)? (message|messages|reponse|sms)( recu)?$/.test(s)) return { act: "read" };
    if ((m = s.match(/^(traduis|traduire|traduit|traduisez|traduction|translate|translation)( le| la| moi| me| it)?( (?:de|du|des|depuis|from) [a-z ]+?)? (en|vers|a|to|into|in) (.+)$/))) {
      var code = langCode(m[5]);
      return code ? { act: "translate", lang: code } : { act: "unknown_lang", word: m[5] };
    }
    if ((m = s.match(/^(appelle|appeler|appelez|appel|telephone a|telephoner a|call|phone|ring)( a)? (.+)$/))) {
      var who = m[3].replace(/^(arobase |at |@)/, "").replace(/\s+/g, "");
      if (who && who.length <= 30) return { act: "call", who: who };
    }
    if ((m = s.match(/^(ouvre|ouvrir|ouvrez|ouvert|ouvre moi|va|vas|aller|allez|affiche|afficher|montre|montre moi|open|go|go to|show|show me|lance|lancer|launch|start)( a| au| aux| sur| dans| to| on| into)? (.+)$/))) {
      var tg = target(m[3]);
      if (tg) return { act: "open", target: tg };
    }
    var bare = target(s);
    if (bare) return { act: "open", target: bare };
    return { act: "none" };
  }

  // ---------- Interface ----------
  var ctx = null; // { root, portal, lang }
  var rec = null;
  function L() { return STR[ctx && ctx.lang === "en" ? "en" : "fr"]; }
  function fmt(s, v) { Object.keys(v || {}).forEach(function (k) { s = s.split("{" + k + "}").join(v[k]); }); return s; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function bar() {
    var b = document.getElementById("ewvBar");
    if (b) return b;
    b = document.createElement("div");
    b.id = "ewvBar";
    b.className = "ewv-bar";
    b.hidden = true;
    b.innerHTML = '<span class="ewv-dot" aria-hidden="true"></span><span class="ewv-txt" id="ewvTxt" role="status" aria-live="polite"></span>' +
      '<button type="button" class="ewv-x" id="ewvStop"></button>';
    document.body.appendChild(b);
    b.querySelector("#ewvStop").addEventListener("click", function () { stopListening(); hideBar(); });
    return b;
  }
  var hideT = null;
  function showBar(text, live, ms) {
    var b = bar();
    clearTimeout(hideT);
    b.hidden = false;
    b.classList.toggle("live", !!live);
    b.querySelector("#ewvTxt").textContent = text;
    var x = b.querySelector("#ewvStop");
    x.textContent = live ? "✕ " + L().stop : "✕";
    x.setAttribute("aria-label", L().stop);
    if (ms) hideT = setTimeout(hideBar, ms);
  }
  function hideBar() { var b = document.getElementById("ewvBar"); if (b) b.hidden = true; }
  function setBtn(on) {
    var btn = document.getElementById("ewvBtn");
    if (btn) { btn.setAttribute("aria-pressed", String(!!on)); btn.classList.toggle("on", !!on); if (!on) btn.classList.remove("hear"); }
    document.documentElement.classList.toggle("ew-mic-on", !!on);
  }
  function setHear(on) { var btn = document.getElementById("ewvBtn"); if (btn) btn.classList.toggle("hear", !!on && btn.classList.contains("on")); }
  function stopListening() {
    if (rec) { var r = rec; rec = null; try { r.abort(); } catch (e) { /* déjà arrêté */ } }
    setBtn(false);
  }

  var listenT0 = 0;
  function listen(retry) {
    if (rec && retry !== true) { stopListening(); hideBar(); return; }
    if (retry !== true) listenT0 = Date.now();
    if (!SR) return;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* rien à couper */ }
    var r;
    try { r = new SR(); } catch (e) { showBar(L().busy, false, 6000); return; }
    rec = r;
    r.lang = ctx.lang === "en" ? "en-US" : "fr-FR";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 3;
    var done = false;
    setBtn(true);
    showBar(L().listening, true);
    r.onsoundstart = r.onspeechstart = function () { if (rec === r) setHear(true); };
    r.onsoundend = r.onspeechend = function () { if (rec === r) setHear(false); };
    r.onresult = function (e) {
      if (rec !== r) return;
      setHear(true);
      var res = e.results[e.results.length - 1];
      if (!res.isFinal) { showBar("🎤 " + res[0].transcript, true); return; }
      done = true;
      var alts = [];
      for (var i = 0; i < res.length; i++) alts.push(res[i].transcript);
      stopListening();
      handle(alts);
    };
    r.onerror = function (e) {
      if (rec !== r) return;
      done = true;
      stopListening();
      var code = e && e.error;
      if (code === "aborted") { hideBar(); return; }
      // Rien entendu (parlé trop tôt ou trop bas) : on réécoute tout seul, 8 secondes au plus.
      if ((code === "no-speech" || code === "audio-capture") && Date.now() - listenT0 < 8000) { setTimeout(function () { listen(true); }, 150); return; }
      showBar(code === "not-allowed" || code === "service-not-allowed" ? L().denied : code === "network" ? L().network
        : code === "audio-capture" ? L().busy : L().no_speech, false, 8000);
    };
    r.onend = function () {
      if (rec !== r) return;
      stopListening();
      if (!done) showBar(L().no_speech, false, 5000);
    };
    try { r.start(); } catch (e) { stopListening(); showBar(L().busy, false, 6000); }
  }

  // Plusieurs façons d'avoir entendu la phrase : la première qui donne une commande gagne.
  function handle(alts) {
    var heard = String(alts[0] || "").trim(), cmd = { act: "none" };
    for (var i = 0; i < alts.length && cmd.act === "none"; i++) cmd = parse(alts[i]);
    run(cmd, heard);
  }

  function go(url) { setTimeout(function () { location.href = url; }, 900); }
  function portalHash(h) { return ctx.portal ? h : ctx.root + "everywhere/" + h; }
  var HASH = { accueil: "#/accueil", everywhere: "#/everywhere", learn: "#/learn", profil: "#/profil", parametres: "#/parametres",
    face: "#/everywhere/face", appel: "#/everywhere/appel", langues: "#/everywhere/langues" };

  function run(cmd, heard) {
    var T = L();
    var ev = new CustomEvent("ew:voice", { detail: cmd, cancelable: true });
    // Une page peut prendre la commande elle-même (ex. TALK : messagerie, lecture du dernier message).
    if (!window.dispatchEvent(ev)) {
      if (cmd.sayKey && T[cmd.sayKey]) showBar(fmt(T[cmd.sayKey], { x: T.names[cmd.target] || "" }), false, 4000);
      return;
    }
    if (cmd.act === "none") { showBar(fmt(T.not_understood, { t: heard }), false, 9000); return; }
    if (cmd.act === "help") { showBar(T.help, false, 14000); return; }
    if (cmd.act === "stop") {
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* rien */ }
      showBar(T.stopped, false, 2500);
      return;
    }
    if (cmd.act === "read") { showBar(T.no_read, false, 7000); return; }
    if (cmd.act === "unknown_lang") { showBar(fmt(T.unknown_lang, { x: cmd.word }), false, 7000); return; }
    if (cmd.act === "translate") {
      var name = cmd.lang;
      try { name = new Intl.DisplayNames([ctx.lang], { type: "language" }).of(cmd.lang) || cmd.lang; } catch (e) { /* code seul */ }
      showBar(fmt(T.translating, { x: name }), false, 3000);
      if (window.EWEverywhere && window.EWEverywhere.setOther) window.EWEverywhere.setOther(cmd.lang);
      else saveOther(cmd.lang);
      if (ctx.portal) setTimeout(function () { location.hash = HASH.face; }, 900);
      else go(portalHash(HASH.face));
      return;
    }
    if (cmd.act === "call") {
      showBar(fmt(T.calling, { x: cmd.who }), false, 4000);
      try { sessionStorage.setItem("ew_voice_call", cmd.who); } catch (e) { /* recherche à faire au toucher */ }
      if (ctx.portal) setTimeout(function () { if (location.hash === HASH.appel) window.dispatchEvent(new HashChangeEvent("hashchange")); else location.hash = HASH.appel; }, 900);
      else go(portalHash(HASH.appel));
      return;
    }
    if (cmd.act === "open") {
      showBar(fmt(T.opening, { x: T.names[cmd.target] || cmd.target }), false, 3000);
      if (cmd.target === "talk") { go(ctx.root + "index.html?ew=1"); return; }
      if (cmd.target === "msg") {
        try { sessionStorage.setItem(PENDING, "msg"); } catch (e) { /* TALK s'ouvrira sur son accueil */ }
        go(ctx.root + "index.html?ew=1");
        return;
      }
      if (ctx.portal) setTimeout(function () { location.hash = HASH[cmd.target]; }, 900);
      else go(portalHash(HASH[cmd.target]));
    }
  }
  // TALK (hors portail) : même clé que le module EVERYWHERE, l'autre langue de la conversation côte à côte.
  function saveOther(code) {
    try {
      var p = JSON.parse(localStorage.getItem("ew_tr_v1") || "{}") || {};
      p.other = code;
      if (p.me === code) p.me = code === "fr" ? "en" : "fr";
      localStorage.setItem("ew_tr_v1", JSON.stringify(p));
    } catch (e) { /* réglage non gardé */ }
  }

  // Bouton micro placé dans la barre du haut, juste avant la roue dentée.
  function mount(opts) {
    ctx = { root: opts.root || "./", portal: !!opts.portal, lang: opts.lang === "en" ? "en" : "fr" };
    if (!SR || document.getElementById("ewvBtn")) return false;
    var before = opts.before;
    if (!before || !before.parentNode) return false;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "icon-btn ewv-btn";
    b.id = "ewvBtn";
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", L().btn);
    b.title = L().btn;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
    before.parentNode.insertBefore(b, before);
    b.addEventListener("click", listen);
    // L'appli passe en arrière-plan (appel téléphonique, autre appli) : on coupe le micro proprement.
    document.addEventListener("visibilitychange", function () { if (document.hidden && rec) { stopListening(); hideBar(); } });
    return true;
  }
  function setLang(l) { if (ctx) ctx.lang = l === "en" ? "en" : "fr"; var b = document.getElementById("ewvBtn"); if (b) b.setAttribute("aria-label", L().btn); }
  window.EWVoix = { parse: parse, langCode: langCode, mount: mount, setLang: setLang, run: run, supported: !!SR,
    show: showBar, hide: hideBar };
})();

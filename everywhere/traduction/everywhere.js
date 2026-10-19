/* 24/24 EVERYWHERE — parler avec quelqu'un qui ne parle pas ma langue. © 2026 Sébastien Chevrier. Tous droits réservés.
   Interface EVERYWHERE de 24/24 ONE WORLD (une application, un compte, trois interfaces : TALK, EVERYWHERE, LEARN).
   Écrans (routes du portail) :
     #/everywhere            accueil : conversation côte à côte, appeler sur TALK, mes langues, configurations
     #/everywhere/face       mode A : écran coupé en deux (haut et bas, même sens de lecture), un micro par personne
     #/everywhere/appel      mode B : contacts TALK, inviter un contact, appel traduit (celui de TALK, sans autre infrastructure)
     #/everywhere/langues    mes langues
     #/everywhere/reglages   configurations (son, haut-parleur ou écouteurs, voix, vitesse, volume, taille du texte)
     #/everywhere/voyage     parcours Voyage (voyage.js) : préparation, phrases utiles, faible connexion
   Profil linguistique (profil/profil.js) : langue maternelle = « Ma langue » par défaut, favorites en tête des listes,
   vitesse de lecture (nombre de phrases affichées) et préférence Parler/Écrire en conversation côte à côte.
   Aucune fonction d'apprentissage ici (LEARN) ; les appels restent ceux de TALK.
   Son : haut-parleur du téléphone, ou écouteurs Bluetooth du commerce (option). Android envoie le son vers les écouteurs
   connectés ; l'appli ne pilote pas les écouteurs (aucune fonction propre à un fabricant).
   Réglages gardés sur cet appareil (clé ew_tr_v1). La conversation côte à côte n'est enregistrée nulle part. */
(function () {
  "use strict";
  var M = window.EWMoteur;
  var CFG = window.EW_CONFIG || { basePath: "../" };
  var KEY = "ew_tr_v1";
  var lang = "fr";

  var STR = {
    fr: {
      idle: "Pause après 2 minutes sans parole : l'écran peut de nouveau s'éteindre. Touchez un micro pour reprendre.",
      title: "Face à face", sub: "Traduire et connecter partout.",
      face: "Conversation côte à côte", face_d: "Téléphone posé entre vous deux", call: "Appeler sur TALK", call_d: "Appel traduit avec un contact",
      trip: "Voyage", trip_d: "Phrases utiles, préparation, faible connexion", fav_group: "★ Favorites", c_also: "Parle aussi {l}",
      my_langs: "Mes langues", settings: "Configurations", settings_d: "Son, volume, texte", back: "← EVERYWHERE",
      p1: "Personne 1", p2: "Personne 2", p3: "Personne 3", lang_third: "Langue de la personne 3", three_btn: "À trois",
      three_on: "Conversation à trois : chacun lit tout dans sa langue.", three_off: "Retour à deux personnes.", speak: "Parler", speak_in: "Parler en {l}", type: "Écrire", type_in: "Écrire en {l}", send: "Traduire",
      listening: "J'écoute…", translating: "Traduction…", empty: "Touchez le micro et parlez. La traduction s'affiche dans l'autre moitié et peut être lue à voix haute.",
      langs_btn: "Langues", sound_btn: "Son", text_btn: "Texte", swap: "Inverser les langues",
      sound_on: "Lecture à voix haute activée", sound_off: "Lecture à voix haute coupée",
      no_stt: "Le micro n'est pas disponible dans ce navigateur : utilisez « Écrire ». Sur Android, ouvrez le site dans Chrome.",
      mic_denied: "Le micro est bloqué pour ce site. Autorisez-le dans les réglages du navigateur (cadenas à côté de l'adresse), puis réessayez.",
      no_speech: "Je n'ai rien entendu. Touchez le micro et parlez.", net_err: "Pas de connexion : la traduction a besoin d'Internet.",
      stt_fail: "L'écoute n'a pas marché. Réessayez.", busy: "Un seul micro à la fois : attendez la fin de l'autre phrase.",
      tr_err: "Traduction impossible ({m}). Réessayez.", quota: "Limite quotidienne du service de traduction gratuit atteinte. Réessayez demain.",
      tr_hint: "Traduction automatique : vérifiez les informations importantes.",
      lang_me: "Ma langue", lang_other: "Langue de la personne en face", lang_note: "La personne 1 (en bas) parle votre langue, la personne 2 (en haut) la langue de la personne en face. Le pseudo et la langue de votre profil TALK restent réglés dans TALK.",
      save: "Enregistrer", saved: "Enregistré.", close: "Fermer",
      set_sound: "Lire la traduction à voix haute", set_volume: "Volume", set_size: "Taille du texte (côte à côte)", sizes: "Normal|Grand|Très grand",
      set_note: "Ces réglages restent sur cet appareil. Thème et contraste : Paramètres de 24/24 ONE WORLD.", a11y_link: "Ouvrir les Paramètres",
      c_search: "Rechercher un contact", c_invite: "📨 Inviter un contact", invite_talk: "📨 Inviter sur TALK", invite_talk_d: "Envoyer le lien TALK à une personne", c_invite_d: "Le lien TALK part par SMS, WhatsApp ou e-mail. Dès que la personne a choisi son pseudo, elle apparaît ici.",
      c_call: "Appeler", c_loading: "Lecture de vos contacts TALK…", c_none: "Pas encore de contact. Invitez quelqu'un : il apparaîtra ici dès qu'il aura choisi son pseudo.",
      c_nomatch: "Aucun contact ne correspond.", c_err: "Impossible de lire vos contacts pour le moment.", retry: "Réessayer",
      c_off: "La messagerie de TALK n'est pas activée sur ce site.", c_noprof: "Il faut d'abord un compte 24/24 ONE WORLD (un pseudo, votre langue et un e-mail confirmé).",
      c_create: "Créer mon compte", c_link_copied: "Lien copié : collez-le dans un SMS ou WhatsApp.", c_link_txt: "Copiez ce lien et envoyez-le : {u}",
      c_before: "Appeler @{p}", c_i_speak: "Je parle", c_i_read: "Je lis et j'écoute", c_go: "📞 Appeler @{p}", cancel: "Annuler",
      c_how: "L'appel s'ouvre dans TALK, avec la traduction : chacun parle sa langue, l'autre lit et entend la traduction. À la fin, vous revenez ici.",
      c_lang_of: "Parle {l}",
      out_btn_sp: "Haut-parleur", out_btn_ea: "Écouteurs", hands_btn: "Mains libres", replay: "Répéter la dernière traduction",
      out_sp_on: "🔊 Haut-parleur : chaque traduction est lue à voix haute pour la personne en face.",
      out_ea_on: "🎧 Écouteurs : la personne 1 entend dans ses écouteurs ce que dit la personne 2. La personne 2 lit sa traduction en haut.",
      hands_on: "Mains libres : après chaque phrase, le micro s'ouvre tout seul pour l'autre personne. Touchez un micro allumé pour arrêter.",
      hands_off: "Mains libres arrêté.", hands_pause: "Mains libres en pause (rien entendu). Touchez un micro pour reprendre.",
      nothing_replay: "Rien à répéter pour l'instant.",
      set_out: "Sortie du son", set_out_sp: "🔊 Haut-parleur du téléphone", set_out_sp_d: "Les deux personnes entendent chaque traduction.",
      set_out_ea: "🎧 Écouteurs Bluetooth (option)", set_out_ea_d: "Vous portez des écouteurs du commerce, déjà connectés au téléphone en Bluetooth. Vous entendez la traduction de ce que dit l'autre ; l'autre lit la sienne à l'écran.",
      set_hands: "Mains libres (le micro passe tout seul à l'autre personne)",
      set_rate: "Vitesse de la voix", set_voice: "Voix pour {l}", voice_auto: "Automatique (la plus naturelle du téléphone)", voice_none: "Aucune voix trouvée sur ce téléphone pour cette langue : la voix par défaut sera utilisée.",
      try_voice: "▶ Essayer", sample: "Bonjour, je suis la voix de 24/24 ONE WORLD.",
      bt_note: "Écouteurs : n'importe quel modèle Bluetooth du commerce. Connectez-les dans les réglages Bluetooth d'Android, puis touchez « Essayer » : le son doit sortir dans les écouteurs. L'appli ne choisit pas elle-même la sortie et ne pilote pas les boutons des écouteurs. Le micro utilisé (téléphone ou écouteurs) dépend d'Android."
    },
    en: {
      idle: "Paused after 2 minutes without speech: the screen can turn off again. Tap a microphone to resume.",
      title: "Face to face", sub: "Translate and connect everywhere.",
      face: "Side-by-side conversation", face_d: "Phone placed between you", call: "Call on TALK", call_d: "Translated call with a contact",
      trip: "Travel", trip_d: "Useful phrases, preparation, weak connection", fav_group: "★ Favorites", c_also: "Also speaks {l}",
      my_langs: "My languages", settings: "Settings", settings_d: "Sound, volume, text", back: "← EVERYWHERE",
      p1: "Person 1", p2: "Person 2", p3: "Person 3", lang_third: "Person 3's language", three_btn: "Three",
      three_on: "Three-way conversation: everyone reads everything in their language.", three_off: "Back to two people.", speak: "Speak", speak_in: "Speak in {l}", type: "Type", type_in: "Type in {l}", send: "Translate",
      listening: "Listening…", translating: "Translating…", empty: "Tap the mic and speak. The translation appears in the other half and can be read aloud.",
      langs_btn: "Languages", sound_btn: "Sound", text_btn: "Text", swap: "Swap languages",
      sound_on: "Read aloud on", sound_off: "Read aloud off",
      no_stt: "The mic isn't available in this browser: use “Type”. On Android, open the site in Chrome.",
      mic_denied: "The mic is blocked for this site. Allow it in the browser settings (padlock next to the address), then try again.",
      no_speech: "I didn't hear anything. Tap the mic and speak.", net_err: "No connection: translation needs the Internet.",
      stt_fail: "Listening didn't work. Try again.", busy: "One mic at a time: wait for the other sentence to finish.",
      tr_err: "Translation failed ({m}). Try again.", quota: "Daily limit of the free translation service reached. Try again tomorrow.",
      tr_hint: "Automatic translation: check important information.",
      lang_me: "My language", lang_other: "Language of the person in front", lang_note: "Person 1 (bottom) speaks your language, person 2 (top) the other person's language. Your TALK username and language stay set in TALK.",
      save: "Save", saved: "Saved.", close: "Close",
      set_sound: "Read the translation aloud", set_volume: "Volume", set_size: "Text size (side by side)", sizes: "Normal|Large|Extra large",
      set_note: "These settings stay on this device. Theme and contrast: 24/24 ONE WORLD Settings.", a11y_link: "Open Settings",
      c_search: "Search a contact", c_invite: "📨 Invite a contact", invite_talk: "📨 Invite to TALK", invite_talk_d: "Send the TALK link to someone", c_invite_d: "The TALK link goes by SMS, WhatsApp or email. As soon as the person picks a username, they appear here.",
      c_call: "Call", c_loading: "Reading your TALK contacts…", c_none: "No contact yet. Invite someone: they'll appear here as soon as they pick a username.",
      c_nomatch: "No matching contact.", c_err: "Your contacts can't be read right now.", retry: "Try again",
      c_off: "TALK messaging is not enabled on this site.", c_noprof: "You need a 24/24 ONE WORLD account first (a username, your language and a confirmed email).",
      c_create: "Create my account", c_link_copied: "Link copied: paste it in an SMS or WhatsApp.", c_link_txt: "Copy this link and send it: {u}",
      c_before: "Call @{p}", c_i_speak: "I speak", c_i_read: "I read and listen in", c_go: "📞 Call @{p}", cancel: "Cancel",
      c_how: "The call opens in TALK, with translation: each person speaks their language, the other reads and hears the translation. At the end, you come back here.",
      c_lang_of: "Speaks {l}",
      out_btn_sp: "Speaker", out_btn_ea: "Earbuds", hands_btn: "Hands-free", replay: "Repeat the last translation",
      out_sp_on: "🔊 Speaker: each translation is read aloud for the other person.",
      out_ea_on: "🎧 Earbuds: person 1 hears what person 2 says in their earbuds. Person 2 reads their translation at the top.",
      hands_on: "Hands-free: after each sentence, the mic opens by itself for the other person. Tap a lit mic to stop.",
      hands_off: "Hands-free stopped.", hands_pause: "Hands-free paused (nothing heard). Tap a mic to resume.",
      nothing_replay: "Nothing to repeat yet.",
      set_out: "Sound output", set_out_sp: "🔊 Phone speaker", set_out_sp_d: "Both people hear each translation.",
      set_out_ea: "🎧 Bluetooth earbuds (option)", set_out_ea_d: "You wear store-bought earbuds, already connected to the phone by Bluetooth. You hear the translation of what the other person says; they read theirs on the screen.",
      set_hands: "Hands-free (the mic passes to the other person by itself)",
      set_rate: "Voice speed", set_voice: "Voice for {l}", voice_auto: "Automatic (the phone's most natural voice)", voice_none: "No voice found on this phone for this language: the default voice will be used.",
      try_voice: "▶ Try", sample: "Hello, I am the voice of 24/24 ONE WORLD.",
      bt_note: "Earbuds: any store-bought Bluetooth model. Connect them in Android's Bluetooth settings, then tap “Try”: the sound should come out in the earbuds. The app doesn't choose the output itself and doesn't control the earbud buttons. Which mic is used (phone or earbuds) depends on Android."
    }
  };
  // Autres langues de l'interface (0.8.3) : langues-ecrans.js.
  (function (x) { if (x) Object.keys(x).forEach(function (k) { STR[k] = x[k]; }); })(window.EW_SCREEN_STR && window.EW_SCREEN_STR.everywhere);
  function t(k, v) {
    var s = (STR[lang] && STR[lang][k]) || STR.en[k] || STR.fr[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* réglage pour cette visite seulement */ } }
  };

  // ---------- Réglages (sur cet appareil) ----------
  var mem = null;
  function defMe() {
    var nat = window.EWProfil && window.EWProfil.native();
    if (nat && M.lang(nat).name !== nat) return nat; // langue maternelle du profil linguistique
    var p = store.get("lc_uilang");
    var l = (p && p !== "auto" ? p : (navigator.language || "fr")).slice(0, 2).toLowerCase();
    return M.lang(l).name !== l ? l : "fr";
  }
  function prefs() {
    if (mem) return mem;
    var p = {};
    try { p = JSON.parse(store.get(KEY) || "{}") || {}; } catch (e) { p = {}; }
    var me = M.lang(p.me).name !== p.me ? p.me : defMe();
    var other = M.lang(p.other).name !== p.other ? p.other : (me === "en" ? "fr" : "en");
    var third = M.lang(p.third).name !== p.third ? p.third : ["es", "de", "it", "pt"].filter(function (c) { return c !== me && c !== other; })[0];
    mem = { me: me, other: other, third: third, three: p.three === true, sound: p.sound !== false, volume: typeof p.volume === "number" ? Math.max(0, Math.min(1, p.volume)) : 1,
      size: [0, 1, 2].indexOf(p.size) !== -1 ? p.size : 0,
      out: p.out === "earbuds" ? "earbuds" : "speaker", hands: p.hands === true,
      rate: typeof p.rate === "number" ? Math.max(0.7, Math.min(1.3, p.rate)) : 1,
      voices: p.voices && typeof p.voices === "object" ? p.voices : {} };
    return mem;
  }
  function savePrefs() { store.set(KEY, JSON.stringify(mem)); }

  // Langues favorites du profil linguistique en tête de liste (sans les retirer de la liste complète).
  function langOptions(sel) {
    var fav = window.EWProfil ? window.EWProfil.favorites() : [];
    var favSel = false;
    var opt = function (l, inFav) {
      var on = l.code === sel && (inFav || !favSel);
      if (on && inFav) favSel = true;
      return '<option value="' + esc(l.code) + '"' + (on ? " selected" : "") + ">" + esc((l.flag ? l.flag + " " : "") + (window.EW_LANG_NAME ? window.EW_LANG_NAME(l.code, lang) : l.name)) + "</option>";
    };
    var favs = M.langs.filter(function (l) { return fav.indexOf(l.code) !== -1; });
    var head = favs.length ? '<optgroup label="' + esc(t("fav_group")) + '">' + favs.map(function (l) { return opt(l, true); }).join("") + "</optgroup>" : "";
    return head + M.langs.map(function (l) { return opt(l, false); }).join("");
  }
  function langName(code) { return window.EW_LANG_NAME ? window.EW_LANG_NAME(code, lang) : M.lang(code).name; }
  function backLink() { return '<a class="tr-back" href="#/everywhere">' + esc(t("back")) + "</a>"; }

  // ---------- Accueil EVERYWHERE ----------
  var ICON = {
    face: '<path d="M4 12h16"/><rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M10 7.5h4M10 16.5h4"/>',
    call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
    kb: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
    replay: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    trip: '<rect x="4" y="7" width="16" height="13" rx="2.5"/><path d="M9 7V4.5h6V7"/><path d="M4 12h16"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[n] + "</svg>"; }
  function home(root) {
    var p = prefs();
    loadMyPseudo();
    root.innerHTML = '<div class="tr-head"><span class="tr-logo" aria-hidden="true">' + ic("globe") + '</span><div><h1 id="h-tr">' + esc(t("title")) + '</h1><p class="muted">' + esc(t("sub")) + "</p></div></div>" +
      '<a class="tr-big face" id="trGoFace" href="#/everywhere/face"><span class="tr-big-ic">' + ic("face") + "</span><span><b>" + esc(t("face")) + "</b><small>" + esc(t("face_d")) + "</small></span></a>" +
      '<a class="tr-big call" id="trGoCall" href="#/everywhere/appel"><span class="tr-big-ic">' + ic("call") + "</span><span><b>" + esc(t("call")) + "</b><small>" + esc(t("call_d")) + "</small></span></a>" +
      '<a class="tr-big trip" id="trGoTrip" href="#/everywhere/voyage"><span class="tr-big-ic">' + ic("trip") + "</span><span><b>" + esc(t("trip")) + "</b><small>" + esc(t("trip_d")) + "</small></span></a>" +
      '<button type="button" class="tr-big invite" id="trGoInvite" data-invite-now><span class="tr-big-ic tr-wave" aria-hidden="true">👋</span><span><b>' + esc(t("invite_talk").replace(/^📨\s*/, "")) + "</b><small>" + esc(t("invite_talk_d")) + "</small></span></button>" +
      '<a class="tr-row" href="#/everywhere/langues"><b>' + esc(t("my_langs")) + "</b><span>" + esc(langName(p.me)) + " ⇄ " + esc(langName(p.other)) + "</span></a>" +
      '<a class="tr-row" href="#/everywhere/reglages"><b>' + esc(t("settings")) + "</b><span>" + esc(t("settings_d")) + "</span></a>";
  }

  // ---------- Mode A : côte à côte ----------
  var face = null; // { lines:[{from:1|2, orig, tr, err}], listening: 1|2|0, rec, root }
  function halfLang(who) { var p = prefs(); return who === 1 ? p.me : who === 2 ? p.other : p.third; }
  // Conversation à trois (même téléphone) : une troisième part d'écran, chacun lit tout dans sa langue.
  function persons() { return prefs().three ? [1, 2, 3] : [1, 2]; }
  function others(who) { return persons().filter(function (x) { return x !== who; }); }
  function clearMsgs() { persons().forEach(function (w) { msg(w, ""); }); }
  function faceScreen(root) {
    var p = prefs();
    face = { lines: [], listening: 0, rec: null, root: root, typing: 0, seq: 0 };
    loadMyPseudo();
    root.innerHTML = '<h1 class="sr" id="h-tr">' + esc(t("face")) + "</h1>" +
      '<div class="tr-face' + (p.three ? " three" : "") + '" id="trFace" data-size="' + p.size + '" data-out="' + p.out + '">' +
        halfHtml(1) +
        '<div class="tr-mid" role="toolbar" aria-label="' + esc(t("face")) + '">' +
          '<button type="button" class="tr-tool" id="trSwap" aria-label="' + esc(t("swap")) + '">⇅ ' + esc(t("langs_btn")) + "</button>" +
          '<button type="button" class="tr-tool" id="trSound" role="switch" aria-checked="' + p.sound + '">' + (p.sound ? "🔊" : "🔇") + " " + esc(t("sound_btn")) + "</button>" +
          '<button type="button" class="tr-tool" id="trOut">' + outLabel(p.out) + "</button>" +
          '<button type="button" class="tr-tool" id="trHands" role="switch" aria-checked="' + p.hands + '">🙌 ' + esc(t("hands_btn")) + "</button>" +
          '<button type="button" class="tr-tool" id="trSize">A+ ' + esc(t("text_btn")) + "</button>" +
          '<button type="button" class="tr-tool" id="trThree" role="switch" aria-checked="' + p.three + '">👥 ' + esc(t("three_btn")) + "</button>" +
          '<button type="button" class="tr-tool tr-invite-pill" id="trFaceInvite" data-invite-now><span class="tr-wave" aria-hidden="true">👋</span> ' + esc(t("invite_talk").replace(/^📨\s*/, "")) + "</button>" +
          '<a class="tr-tool" href="#/everywhere/reglages" aria-label="' + esc(t("settings")) + '">⚙</a>' +
        "</div>" +
        halfHtml(2) +
        (p.three ? halfHtml(3) : "") +
      "</div>" +
      '<p class="sr" role="status" id="trFaceSr"></p>';
    paintFace();
    // LISTEN : téléphone posé entre deux personnes, l'écran reste allumé ; libéré après 2 minutes sans parole.
    var f = face;
    f.idle = function () {
      if (face !== f) return;
      f.paused = true;
      f.seq++; // annule l'enchaînement des mains libres
      if (f.rec) { try { f.rec.stop(); } catch (e) { /* déjà arrêté */ } }
      M.stopSpeaking();
      setTimeout(function () { if (face === f) { clearMsgs(); msg(1, t("idle")); } }, 300);
    };
    if (window.EWEcoute) window.EWEcoute.keepAwake("ew-face", f.idle);
    // Préférence « Écrire » du profil : les claviers sont ouverts d'emblée (sans prendre le focus).
    if (window.EWProfil && window.EWProfil.prefer() === "text") root.querySelectorAll("form.tr-type").forEach(function (f) { f.hidden = false; });
  }
  function outLabel(out) { return out === "earbuds" ? "🎧 " + esc(t("out_btn_ea")) : "🔈 " + esc(t("out_btn_sp")); }
  function halfHtml(who) {
    var code = halfLang(who);
    return '<section class="tr-half p' + who + '" data-who="' + who + '" aria-label="' + esc(t("p" + who)) + '">' +
      '<label class="tr-who"><span>' + esc(t("p" + who)) + ' · </span><select data-lang-of="' + who + '" aria-label="' + esc(t(who === 1 ? "lang_me" : who === 2 ? "lang_other" : "lang_third")) + '">' + langOptions(code) + "</select></label>" +
      '<div class="tr-log" data-log="' + who + '" aria-live="polite" tabindex="0"></div>' +
      '<p class="tr-msg" data-msg="' + who + '" role="alert"></p>' +
      '<form class="tr-type" data-type="' + who + '" hidden><input type="text" data-input="' + who + '" autocomplete="off" lang="' + esc(code) + '"><button type="submit" class="btn primary">' + esc(t("send")) + "</button></form>" +
      '<div class="tr-acts"><button type="button" class="tr-mic" data-mic="' + who + '" aria-label="' + esc(t("speak_in", { l: langName(code) })) + '">' + ic("mic") + "</button>" +
      '<button type="button" class="tr-kb" data-kb="' + who + '" aria-label="' + esc(t("type_in", { l: langName(code) })) + '">' + ic("kb") + "</button>" +
      '<button type="button" class="tr-kb" data-replay="' + who + '" aria-label="' + esc(t("replay")) + '">' + ic("replay") + "</button></div>" +
      "</section>";
  }
  function paintFace() {
    if (!face) return;
    var root = face.root;
    persons().forEach(function (who) {
      var code = halfLang(who);
      var log = root.querySelector('[data-log="' + who + '"]');
      if (!log) return;
      if (!face.lines.length) { log.innerHTML = '<p class="tr-empty">' + esc(t("empty")) + "</p>"; }
      else {
        // Chaque moitié lit tout dans sa propre langue : en grand ce qui est dit (ou traduit) pour elle, en petit l'autre langue.
        // Vitesse de lecture du profil : lente = 2 phrases (plus d'espace), normale = 4, rapide = 6.
        var rd = window.EWProfil ? window.EWProfil.reading() : "normal";
        log.innerHTML = face.lines.slice(rd === "slow" ? -2 : rd === "fast" ? -6 : -4).map(function (l) {
          var mine = l.from === who;
          // Traduction en cours : écrit en toutes lettres (« Traduction… »), distinct de l'écoute et de la lecture.
          // À trois, ma moitié montre en petit la traduction pour la première des deux autres personnes.
          var tr = mine ? l.trs[others(who)[0]] : l.trs[who];
          var wait = !tr && !l.err;
          var big = mine ? l.orig : (tr || (l.err ? "" : t("translating")));
          var small = mine ? (tr || (l.err ? "" : t("translating"))) : l.orig;
          return '<div class="tr-line' + (mine ? " mine" : "") + (wait ? " wait" : "") + '"><p class="tr-big-txt" lang="' + esc(code) + '">' + esc(big) + "</p>" +
            (small ? '<p class="tr-small-txt">' + esc(small) + "</p>" : "") + (l.err ? '<p class="tr-err">' + esc(l.err) + "</p>" : "") + "</div>";
        }).join("");
        log.scrollTop = log.scrollHeight;
      }
      var mic = root.querySelector('[data-mic="' + who + '"]');
      mic.classList.toggle("on", face.listening === who);
      if (face.listening !== who) mic.classList.remove("hear");
      mic.setAttribute("aria-pressed", String(face.listening === who));
    });
  }
  function msg(who, txt) {
    if (!face) return;
    var el = face.root.querySelector('[data-msg="' + who + '"]');
    if (el) el.textContent = txt || "";
  }
  function errText(code) {
    return code === "QUOTA_PROVIDER" ? t("quota") : code === "OFFLINE" || code === "NETWORK" ? t("net_err") : t("tr_err", { m: code });
  }
  function say(who, text) {
    if (window.EWEcoute) window.EWEcoute.activity();
    var from = halfLang(who), dest = others(who), list = persons();
    var line = { from: who, orig: text, trs: {}, err: "" };
    face.lines.push(line);
    if (face.lines.length > 30) face.lines.shift();
    clearMsgs();
    paintFace();
    // Une traduction par autre personne (une seule demande quand deux personnes ont la même langue).
    var byLang = {};
    dest.forEach(function (w) { var c = halfLang(w); if (!byLang[c]) byLang[c] = c === from ? Promise.resolve(text) : M.translate(text, from, c); });
    Promise.all(dest.map(function (w) { return byLang[halfLang(w)].then(function (tr) { line.trs[w] = tr; paintFace(); return tr; }); })).then(function (trs) {
      var sr = face && face.root.querySelector("#trFaceSr");
      if (sr) sr.textContent = trs.join(" · ");
      var p = prefs(), next = list[(list.indexOf(who) + 1) % list.length], f = face, my = ++f.seq;
      var chain = function () { if (face === f && f.seq === my && prefs().hands && !f.listening && !f.paused) startMic(next); };
      // Haut-parleur : chaque traduction est lue, l'une après l'autre (une seule fois par langue).
      // Écouteurs (portés par la personne 1) : seul ce qui est dit à la personne 1 est lu.
      var seen = {}, queue = dest.filter(function (w) {
        var c = halfLang(w);
        if (seen[c] || c === from) return false;
        seen[c] = 1;
        return p.sound && (p.out === "speaker" || w === 1);
      });
      var speakNext = function () {
        if (face !== f || f.seq !== my) return;
        var w = queue.shift();
        if (!w) { setTimeout(chain, 350); return; }
        var c = halfLang(w);
        M.speak(line.trs[w], c, p.volume, { rate: p.rate, voice: p.voices[c], done: function () { setTimeout(speakNext, 200); } });
      };
      if (queue.length) speakNext(); else setTimeout(chain, 150);
    }, function (e) {
      line.err = errText(e && e.message);
      paintFace();
    });
  }
  // Répéter : relit la dernière traduction destinée à cette moitié (comme le bouton « répéter » d'un écouteur traducteur).
  function replay(who) {
    if (!face) return;
    var last = face.lines.filter(function (l) { return l.from !== who && l.trs[who]; }).pop();
    if (!last) { msg(who, t("nothing_replay")); return; }
    var p = prefs(), code = halfLang(who);
    face.seq++;
    // Micro ouvert pendant la réécoute : on le coupe, sinon il entendrait la voix du téléphone.
    // Les mots à moitié dits avant « Répéter » sont abandonnés : sinon ils partaient traduits et lus juste après la réécoute.
    if (face.listening && face.rec) { face.paused = true; face.drop = true; try { face.rec.stop(); } catch (e) { /* déjà arrêté */ } }
    M.speak(last.trs[who], code, p.volume, { rate: p.rate, voice: p.voices[code] });
  }
  function startMic(who) {
    if (!face) return;
    if (window.EWEcoute) { window.EWEcoute.activity(); window.EWEcoute.keepAwake("ew-face", face.idle); }
    face.seq++; // un micro touché annule l'enchaînement automatique en cours
    // Micro allumé touché : arrêt (en mains libres, l'enchaînement se met en pause jusqu'au prochain micro touché).
    if (face.listening === who) { face.paused = true; if (face.rec) face.rec.stop(); return; }
    face.paused = false;
    if (face.listening) { msg(who, t("busy")); return; }
    if (!M.canListen) { msg(who, t("no_stt")); openType(who); return; }
    clearMsgs();
    M.stopSpeaking();
    M.askMic().then(function (ok) {
      if (!face) return;
      if (!ok) { msg(who, t("mic_denied")); return; }
      face.listening = who;
      paintFace();
      msg(who, t("listening"));
      var f = face, early = 0;
      f.rec = M.listen(halfLang(who), {
        interim: function (txt) { if (face === f) msg(who, txt ? "🎤 " + txt : t("listening")); },
        sound: function (on) { var b = face === f && f.listening === who && f.root.querySelector('[data-mic="' + who + '"]'); if (b) b.classList.toggle("hear", !!on); },
        // Traduction demandée en avance pendant que la phrase se termine (gardée, réutilisée si la phrase ne change plus).
        // Au plus 2 demandes en avance par phrase, et seulement pour une phrase assez longue : le quota gratuit est limité.
        stable: function (txt) { if (face === f && early < 2 && String(txt || "").trim().length >= 6 && ++early) M.translate(txt, halfLang(who), halfLang(others(who)[0])).catch(function () {}); },
        final: function (txt) { if (face !== f) return; f.listening = 0; f.rec = null; msg(who, ""); if (f.drop) { f.drop = false; paintFace(); return; } say(who, txt); },
        error: function (code) {
          if (face !== f) return;
          f.listening = 0; f.rec = null; paintFace();
          msg(who, code === "DENIED" ? t("mic_denied") : code === "NETWORK" ? t("net_err") : code === "NO_SPEECH" ? (prefs().hands ? t("hands_pause") : t("no_speech")) : t("stt_fail"));
        },
        end: function () { if (face !== f) return; f.drop = false; if (f.listening === who) { f.listening = 0; f.rec = null; msg(who, ""); } paintFace(); }
      });
      if (!f.rec) { f.listening = 0; paintFace(); msg(who, t("stt_fail")); }
    });
  }
  function openType(who) {
    var form = face.root.querySelector('[data-type="' + who + '"]');
    form.hidden = !form.hidden;
    if (!form.hidden) form.querySelector("input").focus();
  }

  // ---------- Mes langues ----------
  function langsScreen(root) {
    var p = prefs();
    root.innerHTML = backLink() + '<h1 id="h-tr">' + esc(t("my_langs")) + "</h1>" +
      '<div class="card"><label class="tr-field"><span>' + esc(t("lang_me")) + '</span><select id="trMe">' + langOptions(p.me) + "</select></label>" +
      '<label class="tr-field"><span>' + esc(t("lang_other")) + '</span><select id="trOther">' + langOptions(p.other) + "</select></label>" +
      '<p class="note">' + esc(t("lang_note")) + '</p><p class="tr-ok" id="trLangOk" role="status"></p></div>';
    function upd() { var q = prefs(); q.me = root.querySelector("#trMe").value; q.other = root.querySelector("#trOther").value; savePrefs(); root.querySelector("#trLangOk").textContent = t("saved"); }
    root.querySelector("#trMe").addEventListener("change", upd);
    root.querySelector("#trOther").addEventListener("change", upd);
  }

  // ---------- Configurations ----------
  function settingsScreen(root) {
    var p = prefs();
    var sizes = t("sizes").split("|");
    root.innerHTML = backLink() + '<h1 id="h-tr">' + esc(t("settings")) + "</h1>" +
      '<div class="card">' +
        '<div class="row"><span id="trLblSound">' + esc(t("set_sound")) + '</span><button type="button" class="toggle" id="trSetSound" role="switch" aria-labelledby="trLblSound" aria-checked="' + p.sound + '"></button></div>' +
        '<label class="tr-field"><span>' + esc(t("set_volume")) + ' <b id="trVolTxt">' + Math.round(p.volume * 100) + ' %</b></span><input type="range" id="trVol" min="0" max="100" step="10" value="' + Math.round(p.volume * 100) + '"></label>' +
        '<div class="row"><span id="trLblSize">' + esc(t("set_size")) + '</span><span class="seg" role="radiogroup" aria-labelledby="trLblSize">' +
          sizes.map(function (n, i) { return '<button type="button" role="radio" data-trsize="' + i + '" aria-checked="' + (p.size === i) + '" aria-label="' + esc(n) + '" class="ts' + i + '">A</button>'; }).join("") +
        "</span></div>" +
        '<p class="note">' + esc(t("set_note")) + ' <a href="#/parametres">' + esc(t("a11y_link")) + "</a></p>" +
      "</div>" +
      '<div class="card"><h2 class="tr-h2" id="trLblOut">' + esc(t("set_out")) + '</h2><div role="radiogroup" aria-labelledby="trLblOut">' +
        ["speaker", "earbuds"].map(function (o) {
          var k = o === "speaker" ? "set_out_sp" : "set_out_ea";
          return '<label class="tr-opt"><input type="radio" name="trOut" value="' + o + '"' + (p.out === o ? " checked" : "") + "><span><b>" + esc(t(k)) + "</b><small>" + esc(t(k + "_d")) + "</small></span></label>";
        }).join("") +
        '</div><div class="row"><span id="trLblHands">' + esc(t("set_hands")) + '</span><button type="button" class="toggle" id="trSetHands" role="switch" aria-labelledby="trLblHands" aria-checked="' + p.hands + '"></button></div>' +
        '<label class="tr-field"><span>' + esc(t("set_rate")) + ' <b id="trRateTxt">' + Math.round(p.rate * 100) + ' %</b></span><input type="range" id="trRate" min="70" max="130" step="10" value="' + Math.round(p.rate * 100) + '"></label>' +
        '<div id="trVoices"></div>' +
        '<p class="note">' + esc(t("bt_note")) + "</p>" +
      "</div>";
    root.querySelector("#trSetSound").addEventListener("click", function (e) { var q = prefs(); q.sound = !q.sound; savePrefs(); e.currentTarget.setAttribute("aria-checked", String(q.sound)); });
    root.querySelector("#trVol").addEventListener("input", function (e) { var q = prefs(); q.volume = (+e.target.value) / 100; savePrefs(); root.querySelector("#trVolTxt").textContent = e.target.value + " %"; });
    root.querySelectorAll('input[name="trOut"]').forEach(function (r) {
      r.addEventListener("change", function () { var q = prefs(); q.out = r.value; savePrefs(); });
    });
    root.querySelector("#trSetHands").addEventListener("click", function (e) { var q = prefs(); q.hands = !q.hands; savePrefs(); e.currentTarget.setAttribute("aria-checked", String(q.hands)); });
    root.querySelector("#trRate").addEventListener("input", function (e) { var q = prefs(); q.rate = (+e.target.value) / 100; savePrefs(); root.querySelector("#trRateTxt").textContent = e.target.value + " %"; });
    paintVoices(root);
    if (M.canSpeak && window.speechSynthesis.addEventListener) {
      // La liste des voix arrive parfois après l'ouverture de l'écran.
      var onVoices = function () { if (document.body.contains(root.querySelector("#trVoices"))) paintVoices(root); else window.speechSynthesis.removeEventListener("voiceschanged", onVoices); };
      try { window.speechSynthesis.addEventListener("voiceschanged", onVoices); } catch (e) { /* rien */ }
    }
    root.querySelectorAll("[data-trsize]").forEach(function (b) {
      b.addEventListener("click", function () {
        var q = prefs(); q.size = +b.getAttribute("data-trsize"); savePrefs();
        root.querySelectorAll("[data-trsize]").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
      });
    });
  }

  // Une liste de voix par langue de la conversation (ma langue, langue d'en face), avec un bouton pour l'essayer.
  function paintVoices(root) {
    var box = root.querySelector("#trVoices");
    if (!box) return;
    var p = prefs();
    box.innerHTML = [p.me, p.other].filter(function (x, i, a) { return a.indexOf(x) === i; }).map(function (code) {
      var list = M.voicesFor(code), cur = p.voices[code] || "";
      return '<label class="tr-field"><span>' + esc(t("set_voice", { l: langName(code) })) + '</span><select data-voice="' + esc(code) + '">' +
        '<option value="">' + esc(t("voice_auto")) + "</option>" +
        list.map(function (v) { return '<option value="' + esc(v.voiceURI) + '"' + (v.voiceURI === cur ? " selected" : "") + ">" + esc(v.name + " (" + v.lang + ")") + "</option>"; }).join("") +
        "</select></label>" + (list.length ? "" : '<p class="note">' + esc(t("voice_none")) + "</p>") +
        '<button type="button" class="btn" data-try="' + esc(code) + '">' + esc(t("try_voice")) + " · " + esc(langName(code)) + "</button>";
    }).join("");
    box.querySelectorAll("[data-voice]").forEach(function (s) {
      s.addEventListener("change", function () { var q = prefs(); var c = s.getAttribute("data-voice"); if (s.value) q.voices[c] = s.value; else delete q.voices[c]; savePrefs(); });
    });
    box.querySelectorAll("[data-try]").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = b.getAttribute("data-try"), q = prefs();
        var txt = STR[c] ? STR[c].sample : (c === lang ? t("sample") : "24/24 ONE WORLD");
        M.speak(txt, c, q.volume, { rate: q.rate, voice: q.voices[c] });
      });
    });
  }

  // ---------- Mode B : appeler sur TALK ----------
  // Contacts lus sur le serveur avec la session de TALK (même compte, même site), comme le fait TALK :
  // seules les personnes déjà en discussion avec moi (contacts autorisés). L'appel lui-même est celui de TALK.
  var callState = null; // { me, pseudo, plang, contacts:[{convId, id, pseudo, lang}] }
  function talkUrl(q) { return CFG.basePath + "index.html" + (q || ""); }
  function callScreen(root, my) {
    root.innerHTML = backLink() + '<h1 id="h-tr">' + esc(t("call")) + '</h1><div id="trCallBody"><div class="state"><div class="spinner" aria-hidden="true"></div><p>' + esc(t("c_loading")) + "</p></div></div>";
    var body = root.querySelector("#trCallBody");
    if (!window.EWConnect || !window.EWConnect.client) { body.innerHTML = '<p class="muted">' + esc(t("c_off")) + "</p>"; return; }
    window.EWConnect.client().then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        var s = r && r.data && r.data.session;
        if (!s) return { none: true };
        var me = s.user.id;
        return Promise.all([
          sb.from("profiles").select("id,pseudo,lang").eq("id", me).maybeSingle(),
          sb.from("members").select("conversation_id,user_id"),
          sb.from("blocks").select("blocked")
        ]).then(function (res) {
          if (res[0].error || res[1].error) throw res[0].error || res[1].error;
          var prof = res[0].data;
          if (!prof) return { none: true };
          var mems = res[1].data || [];
          var blocked = (res[2].data || []).map(function (b) { return b.blocked; });
          var mine = mems.filter(function (m) { return m.user_id === me; }).map(function (m) { return m.conversation_id; });
          var others = mems.filter(function (m) { return m.user_id !== me && mine.indexOf(m.conversation_id) !== -1 && blocked.indexOf(m.user_id) === -1; });
          var ids = others.map(function (m) { return m.user_id; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
          return (ids.length ? sb.from("profiles").select("id,pseudo,lang").in("id", ids) : Promise.resolve({ data: [] })).then(function (pr) {
            var profs = (pr && pr.data) || [];
            var contacts = others.map(function (m) {
              var p = profs.filter(function (x) { return x.id === m.user_id; })[0];
              return p ? { convId: m.conversation_id, id: p.id, pseudo: p.pseudo, lang: p.lang } : null;
            }).filter(Boolean).sort(function (a, b) { return a.pseudo < b.pseudo ? -1 : 1; });
            // Langues que mes contacts ont choisi de montrer (profil linguistique « visible par mes contacts ») ; sinon rien.
            return sb.rpc("langues_de_mes_contacts").then(function (lr) {
              var rows = lr && !lr.error && Array.isArray(lr.data) ? lr.data : [];
              contacts.forEach(function (c) {
                var r = rows.filter(function (x) { return x && x.user_id === c.id; })[0];
                c.also = r && Array.isArray(r.spoken) ? r.spoken.map(function (x) { return x && typeof x.code === "string" ? x.code : null; }).filter(Boolean).slice(0, 6) : [];
              });
            }, function () { /* fonction absente : on garde la liste */ }).then(function () {
              return { me: me, pseudo: prof.pseudo, plang: prof.lang, contacts: contacts };
            });
          });
        });
      });
    }).then(function (st) {
      if (my !== token) return;
      if (st.none) {
        body.innerHTML = '<p class="muted">' + esc(t("c_noprof")) + '</p><a class="btn primary wide" href="' + esc(talkUrl("?ew=1")) + '">' + esc(t("c_create")) + "</a>";
        return;
      }
      callState = st;
      body.innerHTML = '<input type="search" class="cx-input tr-search" id="trSearch" placeholder="' + esc(t("c_search")) + '" aria-label="' + esc(t("c_search")) + '">' +
        '<button type="button" class="tr-invite" id="trInvite">' + esc(t("c_invite")) + '</button><p class="note">' + esc(t("c_invite_d")) + '</p><p class="tr-ok" id="trInviteMsg" role="status"></p>' +
        '<ul class="tr-contacts" id="trContacts"></ul>';
      // VOICE : « Appelle maria » → recherche remplie ; un seul contact trouvé → sa fiche d'appel s'ouvre (on confirme avec « Appeler »).
      var vq = null;
      try { vq = sessionStorage.getItem("ew_voice_call"); sessionStorage.removeItem("ew_voice_call"); } catch (e) { vq = null; }
      body.querySelector("#trSearch").value = vq || "";
      paintContacts(vq || "");
      if (vq) {
        var hits = callState.contacts.filter(function (c) { return c.pseudo.indexOf(String(vq).toLowerCase()) !== -1; });
        if (hits.length === 1) callSheet(hits[0].convId);
      }
      body.querySelector("#trSearch").addEventListener("input", function (e) { paintContacts(e.target.value); });
      body.querySelector("#trInvite").addEventListener("click", invite);
    }, function (e) {
      if (my !== token) return;
      body.innerHTML = e && e.message === "OFF" ? '<p class="muted">' + esc(t("c_off")) + "</p>"
        : '<div class="state" role="alert"><p>' + esc(t("c_err")) + '</p><button type="button" class="btn primary" id="trRetry">' + esc(t("retry")) + "</button></div>";
      var r = body.querySelector("#trRetry");
      if (r) r.addEventListener("click", function () { show(root, ["appel"], lang); });
    });
  }
  function paintContacts(q) {
    var ul = document.getElementById("trContacts");
    if (!ul || !callState) return;
    q = String(q || "").trim().replace(/^@/, "").toLowerCase();
    var list = callState.contacts.filter(function (c) { return !q || c.pseudo.indexOf(q) !== -1; });
    if (!callState.contacts.length) { ul.innerHTML = '<li class="muted tr-none">' + esc(t("c_none")) + "</li>"; return; }
    if (!list.length) { ul.innerHTML = '<li class="muted tr-none">' + esc(t("c_nomatch")) + "</li>"; return; }
    ul.innerHTML = list.map(function (c) {
      return '<li class="tr-ct"><span class="tr-av" aria-hidden="true">' + esc(c.pseudo.charAt(0).toUpperCase()) + "</span>" +
        "<span><b>@" + esc(c.pseudo) + "</b><small>" + esc(t("c_lang_of", { l: langName(c.lang) })) +
        (c.also && c.also.length ? " · " + esc(t("c_also", { l: c.also.map(langName).join(", ") })) : "") + "</small></span>" +
        '<button type="button" class="btn tr-callbtn" data-call="' + esc(c.convId) + '" aria-label="' + esc(t("c_call") + " @" + c.pseudo) + '">' + esc(t("c_call")) + "</button></li>";
    }).join("");
  }
  // Langues de la discussion, au même endroit que TALK (lc_convlang_<discussion>) : TALK les utilise pour l'appel.
  function convLangs(convId) {
    var o = {};
    try { o = JSON.parse(store.get("lc_convlang_" + convId) || "{}") || {}; } catch (e) { o = {}; }
    return { speak: o.speak || callState.plang, read: o.read || callState.plang };
  }
  function setConvLangs(convId, speak, read) {
    var o = { speak: speak === callState.plang ? "" : speak, read: read === callState.plang ? "" : read };
    try {
      if (!o.speak && !o.read) localStorage.removeItem("lc_convlang_" + convId);
      else localStorage.setItem("lc_convlang_" + convId, JSON.stringify(o));
    } catch (e) { /* stockage indisponible : TALK prendra la langue du profil */ }
  }
  function callSheet(convId) {
    var c = callState.contacts.filter(function (x) { return x.convId === convId; })[0];
    if (!c) return;
    var cl = convLangs(convId);
    var old = document.getElementById("trSheet");
    if (old) old.remove();
    var d = document.createElement("div");
    d.className = "tr-sheet";
    d.id = "trSheet";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-modal", "true");
    d.setAttribute("aria-labelledby", "trSheetH");
    d.innerHTML = '<div class="tr-sheet-in"><h2 id="trSheetH">' + esc(t("c_before", { p: c.pseudo })) + "</h2>" +
      '<label class="tr-field"><span>' + esc(t("c_i_speak")) + '</span><select id="trCSpeak">' + langOptions(cl.speak) + "</select></label>" +
      '<label class="tr-field"><span>' + esc(t("c_i_read")) + '</span><select id="trCRead">' + langOptions(cl.read) + "</select></label>" +
      '<p class="note">' + esc(t("c_how")) + "</p>" +
      '<a class="btn primary wide" id="trCGo" href="' + esc(talkUrl("?ew=1&ew_appel=" + encodeURIComponent(convId))) + '">' + esc(t("c_go", { p: c.pseudo })) + "</a>" +
      '<button type="button" class="btn wide" id="trCCancel">' + esc(t("cancel")) + "</button></div>";
    document.body.appendChild(d);
    d.querySelector("#trCSpeak").focus();
    d.querySelector("#trCGo").addEventListener("click", function () { setConvLangs(convId, d.querySelector("#trCSpeak").value, d.querySelector("#trCRead").value); });
    function close() { d.remove(); var b = document.querySelector('[data-call="' + convId + '"]'); if (b) b.focus(); }
    d.querySelector("#trCCancel").addEventListener("click", close);
    d.addEventListener("click", function (e) { if (e.target === d) close(); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }
  // Invitation : le même lien que « Inviter un ami » de TALK (…/?ajouter=<mon pseudo>), envoyé avec le partage du téléphone.
  function invite() {
    var out = document.getElementById("trInviteMsg");
    var url = new URL(CFG.basePath, location.href).href + "?ajouter=" + encodeURIComponent(callState.pseudo) + "&i=5";
    var copy = function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { out.textContent = t("c_link_copied"); }, function () { out.textContent = t("c_link_txt", { u: url }); });
      } else out.textContent = t("c_link_txt", { u: url });
    };
    if (navigator.share) {
      navigator.share({ url: url }).catch(function (e) { if (!(e && e.name === "AbortError")) copy(); });
    } else copy();
  }

  // Invitation en un seul appui (accueil EVERYWHERE et conversation côte à côte) : mon pseudo TALK est lu à l'avance,
  // le lien part tout de suite avec le partage du téléphone. Sans profil TALK, on ouvre l'écran qui explique comment en créer un.
  var myPseudo = null;
  var pseudoReq = null;
  function loadMyPseudo() {
    if (myPseudo || pseudoReq || !window.EWConnect || !window.EWConnect.client) return pseudoReq;
    pseudoReq = window.EWConnect.client().then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        var s = r && r.data && r.data.session;
        if (!s) return null;
        return sb.from("profiles").select("pseudo").eq("id", s.user.id).maybeSingle().then(function (p) { return p && p.data ? p.data.pseudo : null; });
      });
    }).then(function (ps) { myPseudo = ps || null; pseudoReq = null; return myPseudo; }, function () { pseudoReq = null; return null; });
    return pseudoReq;
  }
  function toast(txt) {
    var old = document.getElementById("trToast");
    if (old) old.remove();
    var d = document.createElement("p");
    d.id = "trToast"; d.className = "tr-toast"; d.setAttribute("role", "status"); d.textContent = txt;
    document.body.appendChild(d);
    setTimeout(function () { if (d.isConnected) d.remove(); }, 6000);
  }
  function inviteNow() {
    var go = function (ps) {
      if (!ps) { location.hash = "#/everywhere/appel"; return; }
      var url = new URL(CFG.basePath, location.href).href + "?ajouter=" + encodeURIComponent(ps) + "&i=5";
      var copy = function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { toast(t("c_link_copied")); }, function () { toast(t("c_link_txt", { u: url })); });
        } else toast(t("c_link_txt", { u: url }));
      };
      if (navigator.share) navigator.share({ url: url }).catch(function (e) { if (!(e && e.name === "AbortError")) copy(); });
      else copy();
    };
    if (myPseudo) go(myPseudo);
    else Promise.resolve(loadMyPseudo()).then(go);
  }

  // ---------- Événements ----------
  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    if (e.target.closest("[data-invite-now]")) { inviteNow(); return; }
    var b = e.target.closest("[data-mic], [data-kb], [data-replay], #trSwap, #trSound, #trOut, #trHands, #trSize, #trThree, [data-call]");
    if (!b) return;
    if (b.hasAttribute("data-call")) { callSheet(b.getAttribute("data-call")); return; }
    if (!face || !face.root.contains(b)) return;
    var p = prefs();
    if (b.hasAttribute("data-mic")) startMic(+b.getAttribute("data-mic"));
    else if (b.hasAttribute("data-kb")) openType(+b.getAttribute("data-kb"));
    else if (b.hasAttribute("data-replay")) replay(+b.getAttribute("data-replay"));
    else if (b.id === "trOut") {
      p.out = p.out === "earbuds" ? "speaker" : "earbuds"; savePrefs();
      b.innerHTML = outLabel(p.out);
      face.root.querySelector("#trFace").setAttribute("data-out", p.out);
      clearMsgs(); msg(1, t(p.out === "earbuds" ? "out_ea_on" : "out_sp_on"));
    } else if (b.id === "trHands") {
      p.hands = !p.hands; savePrefs();
      b.setAttribute("aria-checked", String(p.hands));
      if (!p.hands) face.seq++;
      clearMsgs(); msg(1, t(p.hands ? "hands_on" : "hands_off"));
    }
    else if (b.id === "trSwap") {
      var x = p.me; p.me = p.other; p.other = x; savePrefs();
      faceScreen(face.root);
    } else if (b.id === "trSound") {
      p.sound = !p.sound; savePrefs();
      if (!p.sound) M.stopSpeaking();
      b.setAttribute("aria-checked", String(p.sound));
      b.innerHTML = (p.sound ? "🔊" : "🔇") + " " + esc(t("sound_btn"));
      var sr = face.root.querySelector("#trFaceSr");
      if (sr) sr.textContent = t(p.sound ? "sound_on" : "sound_off");
    } else if (b.id === "trThree") {
      p.three = !p.three; savePrefs();
      var keep = face.lines;
      faceScreen(face.root);
      face.lines = keep;
      paintFace();
      msg(1, t(p.three ? "three_on" : "three_off"));
    } else if (b.id === "trSize") {
      p.size = (p.size + 1) % 3; savePrefs();
      face.root.querySelector("#trFace").setAttribute("data-size", String(p.size));
    }
  });
  document.addEventListener("change", function (e) {
    var s = e.target;
    if (!face || !s.hasAttribute || !s.hasAttribute("data-lang-of") || !face.root.contains(s)) return;
    var p = prefs();
    var w = s.getAttribute("data-lang-of");
    if (w === "1") p.me = s.value; else if (w === "2") p.other = s.value; else p.third = s.value;
    savePrefs();
    var lines = face.lines;
    faceScreen(face.root);
    face.lines = lines;
    paintFace();
  });
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!face || !f.hasAttribute || !f.hasAttribute("data-type")) return;
    e.preventDefault();
    var inp = f.querySelector("input");
    var v = inp.value.trim();
    if (!v) return;
    inp.value = "";
    say(+f.getAttribute("data-type"), v);
  });

  // ---------- Point d'entrée (appelé par app.js à chaque changement d'adresse) ----------
  var token = 0;
  function show(root, parts, uiLang) {
    lang = STR[uiLang] ? uiLang : "fr";
    token += 1;
    if (face && face.rec) face.rec.stop();
    face = null;
    if (window.EWEcoute) window.EWEcoute.release("ew-face");
    M.stopSpeaking();
    var old = document.getElementById("trSheet");
    if (old) old.remove();
    if (window.EWVoyage) window.EWVoyage.leave();
    var s = (parts || [])[0] || "";
    root.classList.toggle("tr-full", s === "face");
    if (s === "face") { faceScreen(root); return t("face"); }
    if (s === "appel") { callScreen(root, token); return t("call"); }
    if (s === "langues") { langsScreen(root); return t("my_langs"); }
    if (s === "reglages") { settingsScreen(root); return t("settings"); }
    if (s === "voyage" && window.EWVoyage) return window.EWVoyage.show(root, lang);
    home(root);
    return t("title");
  }
  // VOICE : « Traduis en … » choisit l'autre langue de la conversation côte à côte.
  function setOther(code) {
    var p = prefs();
    if (M.lang(code).name === code) return false;
    if (p.me === code) p.me = p.other;
    p.other = code;
    savePrefs();
    return true;
  }
  window.EWEverywhere = { show: show, _strings: STR, prefs: prefs, setOther: setOther,
    reload: function () { mem = null; } }; // reload : le profil linguistique a modifié ew_tr_v1
})();

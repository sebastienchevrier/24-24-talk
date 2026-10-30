/* 24/24 ONE WORLD — profil linguistique. © 2026 Sébastien Chevrier. Tous droits réservés.
   Un seul profil pour TALK, EVERYWHERE et LEARN : langue maternelle, langues parlées et niveaux, langue de l'interface,
   langues favorites, voix et lecture, accessibilité, communication, confidentialité.
   Écrans (routes du portail) : #/profil (résumé, sous CONNECT) et #/profil/linguistique (modifier).

   Confidentialité (minimisation des données) :
   - par défaut, le profil reste SUR CET APPAREIL (clé ow_profile_v1) ; rien n'est envoyé ;
   - « Sauvegarder sur mon compte » (désactivé par défaut) l'enregistre dans la table language_profiles,
     lisible et modifiable par la seule personne (règles RLS) ;
   - « Visible par mes contacts » (désactivé par défaut) laisse les personnes déjà en discussion avec moi voir
     ma langue maternelle, mes langues parlées et mon nom affiché, rien d'autre (fonction langues_de_mes_contacts).
   Où chaque réglage s'applique : voir APPLIED ci-dessous (affiché à l'écran, rien n'est promis sans être branché). */
(function () {
  "use strict";
  var KEY = "ow_profile_v1";
  var LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  var MAX_SPOKEN = 12, MAX_FAV = 6, MAX_NAME = 40;
  var lang = "fr";
  // Langues de l'interface du portail (0.8.3), chacune écrite dans sa propre langue.
  var UI_NAMES = { fr: "Français", en: "English", es: "Español", pt: "Português", de: "Deutsch", it: "Italiano", zh: "中文", ja: "日本語", ar: "العربية", ru: "Русский", mg: "Malagasy" };

  var STR = {
    fr: {
      title: "Profil linguistique", back: "← Profil", sum_title: "Profil linguistique", sum_edit: "Modifier mon profil linguistique",
      sum_empty: "Indiquez vos langues : Face à face et Apprendre s'y adaptent.", sum_create: "Créer mon profil linguistique",
      native_s: "Langue maternelle : {l}", spoken_s: "Parle aussi : {l}", none: "aucune",
      priv_private: "🔒 Privé : sur cet appareil seulement", priv_synced: "🔒 Privé : sur cet appareil et sur mon compte", priv_contacts: "👥 Langues visibles par mes contacts",
      s_identity: "Identité", pseudo_note: "Votre pseudo public est celui de la Messagerie (il se règle dans la Messagerie). Le nom affiché est facultatif.",
      name: "Nom affiché (facultatif)", name_ph: "Ex. : Seb",
      s_langs: "Mes langues", native: "Langue maternelle", spoken: "Langues parlées et niveau", add_lang: "Ajouter une langue", add: "Ajouter", remove: "Retirer {l}",
      level_of: "Niveau en {l}", level_hint: "Niveau déclaré, selon l'échelle européenne (A1 débutant → C2 maîtrise).",
      levels: "A1 · Débutant (mots, phrases simples)|A2 · Élémentaire (situations courantes)|B1 · Intermédiaire (voyage, conversation simple)|B2 · Avancé (conversation fluide)|C1 · Autonome (presque tout)|C2 · Maîtrise (comme un natif)",
      max_spoken: "12 langues au maximum.", already: "Cette langue est déjà dans la liste.",
      s_ui: "Langue de l'interface", ui: "Langue de l'interface", ui_auto: "Automatique (celle du téléphone)", ui_note: "La même langue s'applique partout. Un écran pas encore traduit dans votre langue s'affiche en anglais.",
      e_off: "compte non disponible sur ce site", e_net: "pas de connexion",
      s_fav: "Langues favorites", fav_note: "Proposées en premier dans Face à face et Voyage (6 au maximum).", max_fav: "6 langues favorites au maximum.",
      s_voice: "Voix et lecture", rate: "Vitesse de la voix", reading: "Ma vitesse de lecture", reading_opts: "Lente|Normale|Rapide",
      reading_note: "Lente : moins de phrases à l'écran en conversation côte à côte, en plus grand espace. Rapide : plus de phrases.",
      s_a11y: "Accessibilité", text_size: "Taille du texte", ts_names: "Normal|Grand|Très grand", contrast: "Contraste renforcé", motion: "Réduire les animations",
      theme: "Thème", th: "Clair|Sombre|Auto",
      s_comm: "Communication", prefer: "Je préfère", prefer_opts: "Parler|Écrire", prefer_note: "« Écrire » ouvre directement le clavier dans la conversation côte à côte.",
      hands: "Mains libres (le micro passe tout seul à l'autre personne)", out: "Sortie du son", out_sp: "Haut-parleur", out_ea: "Écouteurs",
      s_priv: "Confidentialité", sync: "Sauvegarder sur mon compte", sync_note: "Désactivé : votre profil reste sur cet appareil. Activé : il est enregistré sur votre compte, pour le retrouver sur vos autres appareils. Personne d'autre ne peut le lire.",
      sync_need: "Il faut un compte 24/24 ONE WORLD pour sauvegarder sur le compte.",
      vis: "Qui voit mes langues", vis_private: "Personne (privé, par défaut)", vis_contacts: "Mes contacts (langue maternelle, langues parlées et nom affiché seulement)",
      vis_need_sync: "Pour que vos contacts voient vos langues, activez d'abord « Sauvegarder sur mon compte ».",
      never: "Jamais visibles : votre e-mail, vos appareils, vos réglages, votre progression dans Apprendre.",
      cancel: "Annuler", cancel_note: "Rien n'est enregistré tant que vous n'appuyez pas sur « Enregistrer ».",
      dates: "Créé le {c} · modifié le {u}", dates_new: "Pas encore enregistré.",
      consent: "J'accepte que mon profil linguistique soit enregistré sur le serveur du projet (Supabase, Union européenne) pour le retrouver sur mes autres appareils. Je peux retirer cet accord à tout moment en désactivant la sauvegarde : la copie du serveur est alors effacée.",
      consent_need: "Cochez la case d'accord pour sauvegarder sur votre compte, ou désactivez la sauvegarde.", consent_on: "Accord donné le {d}.",
      avatar_note: "Avatar : vos initiales. Aucune photo n'est envoyée ni stockée.",
      save: "Enregistrer", saving: "Enregistrement…", saved: "Enregistré sur cet appareil.", saved_sync: "Enregistré sur cet appareil et sur votre compte.",
      sync_err: "Enregistré sur cet appareil. Le compte n'a pas pu être mis à jour ({m}). Réessayez plus tard.",
      offline: "Hors ligne : enregistré sur cet appareil seulement. Touchez de nouveau « Enregistrer » une fois connecté.",
      loaded: "Profil retrouvé sur votre compte.", erase: "Effacer mon profil linguistique", erase_sure: "Confirmer l'effacement",
      erased: "Profil linguistique effacé.", erased_sync: "Profil linguistique effacé de cet appareil et de votre compte.",
      applied: "Où ce profil s'applique", applied_list: "Langue maternelle → « Ma langue » dans Face à face|Favorites → en tête des listes de langues de Face à face et de Voyage|Voix, mains libres, sortie du son → conversation côte à côte|Vitesse de lecture et préférence Parler/Écrire → conversation côte à côte|Accessibilité → tout ONE WORLD (comme dans Paramètres)|Langue de l'interface → ONE WORLD et la Messagerie",
      e_name: "Nom affiché : 40 caractères au maximum, sans < ni >."
    },
    en: {
      title: "Language profile", back: "← Profile", sum_title: "Language profile", sum_edit: "Edit my language profile",
      sum_empty: "Tell us your languages: Face to face and Learn adapt to them.", sum_create: "Create my language profile",
      native_s: "Native language: {l}", spoken_s: "Also speaks: {l}", none: "none",
      priv_private: "🔒 Private: on this device only", priv_synced: "🔒 Private: on this device and my account", priv_contacts: "👥 Languages visible to my contacts",
      s_identity: "Identity", pseudo_note: "Your public username is your Messages one (set in Messages). The display name is optional.",
      name: "Display name (optional)", name_ph: "E.g. Seb",
      s_langs: "My languages", native: "Native language", spoken: "Languages spoken and level", add_lang: "Add a language", add: "Add", remove: "Remove {l}",
      level_of: "Level in {l}", level_hint: "Self-declared level, on the European scale (A1 beginner → C2 mastery).",
      levels: "A1 · Beginner (words, simple phrases)|A2 · Elementary (everyday situations)|B1 · Intermediate (travel, simple conversation)|B2 · Upper intermediate (fluent conversation)|C1 · Advanced (almost everything)|C2 · Mastery (like a native)",
      max_spoken: "12 languages at most.", already: "This language is already in the list.",
      s_ui: "Interface language", ui: "Interface language", ui_auto: "Automatic (the phone's)", ui_note: "The same language applies everywhere. A screen not yet translated into your language is shown in English.",
      e_off: "account not available on this site", e_net: "no connection",
      s_fav: "Favorite languages", fav_note: "Offered first in Face to face and Travel (6 at most).", max_fav: "6 favorite languages at most.",
      s_voice: "Voice and reading", rate: "Voice speed", reading: "My reading speed", reading_opts: "Slow|Normal|Fast",
      reading_note: "Slow: fewer sentences on screen in side-by-side conversation, with more space. Fast: more sentences.",
      s_a11y: "Accessibility", text_size: "Text size", ts_names: "Normal|Large|Extra large", contrast: "High contrast", motion: "Reduce animations",
      theme: "Theme", th: "Light|Dark|Auto",
      s_comm: "Communication", prefer: "I prefer", prefer_opts: "Speaking|Typing", prefer_note: "“Typing” opens the keyboard directly in side-by-side conversation.",
      hands: "Hands-free (the mic passes to the other person by itself)", out: "Sound output", out_sp: "Speaker", out_ea: "Earbuds",
      s_priv: "Privacy", sync: "Save to my account", sync_note: "Off: your profile stays on this device. On: it is saved to your account so you find it on your other devices. Nobody else can read it.",
      sync_need: "You need a 24/24 ONE WORLD account to save to the account.",
      vis: "Who sees my languages", vis_private: "Nobody (private, default)", vis_contacts: "My contacts (native language, languages spoken and display name only)",
      vis_need_sync: "For your contacts to see your languages, first turn on “Save to my account”.",
      never: "Never visible: your email, your devices, your settings, your Learn progress.",
      cancel: "Cancel", cancel_note: "Nothing is saved until you tap “Save”.",
      dates: "Created {c} · updated {u}", dates_new: "Not saved yet.",
      consent: "I agree that my language profile is stored on the project's server (Supabase, European Union) so I can get it back on my other devices. I can withdraw this at any time by turning sync off: the server copy is then erased.",
      consent_need: "Tick the consent box to save to your account, or turn sync off.", consent_on: "Consent given on {d}.",
      avatar_note: "Avatar: your initials. No photo is sent or stored.",
      save: "Save", saving: "Saving…", saved: "Saved on this device.", saved_sync: "Saved on this device and to your account.",
      sync_err: "Saved on this device. Your account couldn't be updated ({m}). Try again later.",
      offline: "Offline: saved on this device only. Tap “Save” again once connected.",
      loaded: "Profile found on your account.", erase: "Erase my language profile", erase_sure: "Confirm erasing",
      erased: "Language profile erased.", erased_sync: "Language profile erased from this device and your account.",
      applied: "Where this profile applies", applied_list: "Native language → “My language” in Face to face|Favorites → top of Face to face and Travel language lists|Voice, hands-free, sound output → side-by-side conversation|Reading speed and Speak/Type preference → side-by-side conversation|Accessibility → all of ONE WORLD (as in Settings)|Interface language → ONE WORLD and Messages",
      e_name: "Display name: 40 characters at most, without < or >."
    }
  };
  // Autres langues de l'interface (0.8.3) : langues-ecrans.js.
  (function (x) { if (x) Object.keys(x).forEach(function (k) { STR[k] = x[k]; }); })(window.EW_SCREEN_STR && window.EW_SCREEN_STR.profil);
  function t(k, v) {
    var s = (STR[lang] && STR[lang][k]) || STR.en[k] || STR.fr[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* rien */ } }
  };

  // ---------- Langues (même liste que TALK et EVERYWHERE) ----------
  function LANGS() { return window.EW_LANGS || []; }
  function known(code) { return typeof code === "string" && LANGS().some(function (l) { return l.code === code; }); }
  function langName(code) { if (window.EW_LANG_NAME && known(code)) return window.EW_LANG_NAME(code, lang); var l = LANGS().filter(function (x) { return x.code === code; })[0]; return l ? l.name : String(code || ""); }
  function langLabel(code) { var l = LANGS().filter(function (x) { return x.code === code; })[0]; return l ? (l.flag ? l.flag + " " : "") + langName(code) : String(code || ""); }
  function deviceLang() {
    var p = store.get("lc_uilang");
    var l = (p && p !== "auto" ? p : (navigator.language || "fr")).slice(0, 2).toLowerCase();
    return known(l) ? l : "fr";
  }

  // ---------- Modèle : lecture tolérante (réglages abîmés → valeurs par défaut, jamais d'erreur) ----------
  function clean(raw) {
    var p = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    var native = known(p.native) ? p.native : null;
    var seen = {};
    var spoken = (Array.isArray(p.spoken) ? p.spoken : []).filter(function (s) {
      if (!s || typeof s !== "object" || !known(s.code) || s.code === native || seen[s.code]) return false;
      seen[s.code] = 1; return true;
    }).slice(0, MAX_SPOKEN).map(function (s) {
      return { code: s.code, level: LEVELS.indexOf(s.level) !== -1 ? s.level : "A1", source: s.source === "estime" ? "estime" : "declare" };
    });
    var fav = (Array.isArray(p.favorites) ? p.favorites : []).filter(function (c, i, a) { return known(c) && a.indexOf(c) === i; }).slice(0, MAX_FAV);
    var name = typeof p.name === "string" ? p.name.replace(/[\u0000-\u001f\u007f<>]/g, "").slice(0, MAX_NAME) : "";
    var num = function (v, lo, hi, d) { return typeof v === "number" && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
    return {
      v: 1, exists: !!native,
      name: name,
      native: native,
      spoken: spoken,
      ui: UI_NAMES[p.ui] || known(p.ui) ? p.ui : "auto",
      favorites: fav,
      rate: num(p.rate, 0.7, 1.3, 1),
      reading: ["slow", "normal", "fast"].indexOf(p.reading) !== -1 ? p.reading : "normal",
      prefer: p.prefer === "text" ? "text" : "voice",
      visibility: p.visibility === "contacts" ? "contacts" : "private",
      sync: p.sync === true,
      updated: typeof p.updated === "string" ? p.updated.slice(0, 40) : "",
      created: typeof p.created === "string" ? p.created.slice(0, 40) : "",
      // Accord explicite pour la copie sur le compte : date ISO, ou "" (jamais d'accord présumé).
      consent: p.sync === true && typeof p.consent === "string" ? p.consent.slice(0, 40) : ""
    };
  }
  function initials(p) {
    var src = (p.name || "").trim() || langName(p.native) || "?";
    return src.split(/\s+/).slice(0, 2).map(function (w) { return Array.from(w)[0] || ""; }).join("").toUpperCase() || "?";
  }
  function day(iso) { var d = new Date(iso); return isNaN(d) ? "?" : d.toLocaleDateString(lang === "en" ? "en-GB" : lang === "fr" ? "fr-FR" : lang, { day: "numeric", month: "long", year: "numeric" }); }
  function datesTxt(p) { return p.created || p.updated ? t("dates", { c: day(p.created || p.updated), u: day(p.updated || p.created) }) : t("dates_new"); }
  function read() {
    var raw = null;
    try { raw = JSON.parse(store.get(KEY) || "null"); } catch (e) { raw = null; }
    return clean(raw);
  }
  function write(p) {
    var o = { v: 1, name: p.name, native: p.native, spoken: p.spoken, ui: p.ui, favorites: p.favorites, rate: p.rate, reading: p.reading,
      prefer: p.prefer, visibility: p.visibility, sync: p.sync, consent: p.sync ? p.consent || "" : "",
      created: p.created || new Date().toISOString(), updated: new Date().toISOString() };
    store.set(KEY, JSON.stringify(o));
    return clean(o);
  }

  // ---------- Application aux autres interfaces (rien d'autre n'est modifié) ----------
  function apply(p, a11y) {
    if (window.EWPrefs && a11y) {
      window.EWPrefs.set("text", a11y.text); window.EWPrefs.set("contrast", a11y.contrast);
      window.EWPrefs.set("theme", a11y.theme); window.EWPrefs.set("motion", a11y.motion);
    }
    // EVERYWHERE (clé ew_tr_v1) : ma langue, voix, mains libres, sortie du son.
    var tr = {};
    try { tr = JSON.parse(store.get("ew_tr_v1") || "{}") || {}; } catch (e) { tr = {}; }
    if (typeof tr !== "object" || Array.isArray(tr)) tr = {};
    if (p.native) { tr.me = p.native; if (tr.other === p.native) tr.other = p.native === "en" ? "fr" : "en"; }
    tr.rate = p.rate;
    if (p._comm) { tr.hands = !!p._comm.hands; tr.out = p._comm.out === "earbuds" ? "earbuds" : "speaker"; }
    store.set("ew_tr_v1", JSON.stringify(tr));
    if (window.EWEverywhere && window.EWEverywhere.reload) window.EWEverywhere.reload();
    // Langue de l'interface : même réglage que TALK (clé lc_uilang).
    var before = store.get("lc_uilang") || "auto";
    if (before !== p.ui && !(p.ui === "auto" && !store.get("lc_uilang"))) { store.set("lc_uilang", p.ui); return true; }
    return false;
  }

  // ---------- Compte (facultatif) : table language_profiles, protégée par les règles RLS ----------
  function client() { return window.EWConnect && window.EWConnect.client ? window.EWConnect.client() : Promise.reject(new Error("OFF")); }
  function session(c) { return c.auth.getSession().then(function (r) { return r && r.data && r.data.session ? r.data.session : null; }); }
  function toRow(p, uid) {
    var a = window.EWPrefs ? window.EWPrefs.read() : {};
    var tr = trPrefs();
    return { user_id: uid, display_name: p.name, native_lang: p.native, spoken: p.spoken, ui_lang: p.ui, favorites: p.favorites, visibility: p.visibility,
      prefs: { rate: p.rate, reading: p.reading, prefer: p.prefer, hands: !!tr.hands, out: tr.out === "earbuds" ? "earbuds" : "speaker",
        a11y: { text: a.text || 0, contrast: !!a.contrast, theme: a.theme || "light", motion: !!a.motion } } };
  }
  function fromRow(r) {
    var pr = r.prefs && typeof r.prefs === "object" ? r.prefs : {};
    return clean({ name: r.display_name, native: r.native_lang, spoken: r.spoken, ui: r.ui_lang, favorites: r.favorites, visibility: r.visibility, sync: true,
      rate: pr.rate, reading: pr.reading, prefer: pr.prefer, updated: r.updated_at,
      // La ligne n'existe sur le serveur que si l'accord a été donné : on reprend sa date de dernière écriture.
      consent: r.updated_at });
  }
  function trPrefs() { var o = {}; try { o = JSON.parse(store.get("ew_tr_v1") || "{}") || {}; } catch (e) { o = {}; } return typeof o === "object" ? o : {}; }
  function errMsg(e) {
    var m = String((e && (e.message || e.code)) || e || "");
    if (/OFF/.test(m)) return t("e_off");
    if (/failed to fetch|network|NETWORK/i.test(m)) return t("e_net");
    return m.slice(0, 60) || "?";
  }

  // ---------- Résumé (écran Profil) ----------
  function summary(box, uiLang) {
    lang = STR[uiLang] ? uiLang : "fr";
    if (!box) return;
    var p = read();
    if (!p.exists) {
      box.innerHTML = '<h2 class="cx-h">' + esc(t("sum_title")) + '</h2><p class="muted">' + esc(t("sum_empty")) + '</p><a class="btn primary wide" href="#/profil/linguistique" id="lpOpen">' + esc(t("sum_create")) + "</a>";
      return;
    }
    var priv = p.visibility === "contacts" && p.sync ? t("priv_contacts") : p.sync ? t("priv_synced") : t("priv_private");
    box.innerHTML = '<h2 class="cx-h">' + esc(t("sum_title")) + "</h2>" +
      '<div class="lp-who"><span class="avatar lp-av" aria-hidden="true">' + esc(initials(p)) + "</span><span><b>" + esc(p.name || langLabel(p.native)) + '</b><small class="muted">' + esc(datesTxt(p)) + "</small></span></div>" +
      '<p class="lp-line">' + esc(t("native_s", { l: langLabel(p.native) })) + "</p>" +
      '<p class="lp-line">' + esc(t("spoken_s", { l: p.spoken.length ? p.spoken.map(function (s) { return langName(s.code) + " " + s.level; }).join(", ") : t("none") })) + "</p>" +
      '<p class="lp-priv">' + esc(priv) + "</p>" +
      '<a class="btn wide" href="#/profil/linguistique" id="lpOpen">' + esc(t("sum_edit")) + "</a>";
  }

  // ---------- Écran « Modifier mon profil linguistique » ----------
  var token = 0;
  function langOptions(sel, exclude) {
    var fav = read().favorites;
    var opt = function (l) { return '<option value="' + esc(l.code) + '"' + (l.code === sel ? " selected" : "") + ">" + esc((l.flag ? l.flag + " " : "") + (window.EW_LANG_NAME ? window.EW_LANG_NAME(l.code, lang) : l.name)) + "</option>"; };
    var list = LANGS().filter(function (l) { return !exclude || exclude.indexOf(l.code) === -1 || l.code === sel; });
    var favs = list.filter(function (l) { return fav.indexOf(l.code) !== -1; });
    return (favs.length ? '<optgroup label="★">' + favs.map(opt).join("") + "</optgroup>" : "") + list.map(opt).join("");
  }
  function seg(name, labels, cur, values) {
    return '<span class="seg" role="radiogroup" aria-label="' + esc(name) + '">' + labels.map(function (lb, i) {
      var v = values[i];
      return '<button type="button" role="radio" data-seg="' + esc(name) + '" data-v="' + esc(String(v)) + '" aria-checked="' + (String(cur) === String(v)) + '">' + esc(lb) + "</button>";
    }).join("") + "</span>";
  }
  function toggle(id, label, on, disabled) {
    return '<div class="row"><span id="' + id + 'L">' + esc(label) + '</span><button type="button" class="toggle" id="' + id + '" role="switch" aria-labelledby="' + id + 'L" aria-checked="' + !!on + '"' + (disabled ? ' aria-disabled="true"' : "") + "></button></div>";
  }

  function edit(outer, uiLang) {
    lang = STR[uiLang] ? uiLang : "fr";
    var my = ++token;
    // Nouveau conteneur à chaque affichage : les écouteurs d'événements ne s'empilent pas.
    outer.innerHTML = "";
    var root = document.createElement("div");
    outer.appendChild(root);
    var p = read();
    if (!p.native) p.native = deviceLang();
    // Langue de l'interface : le menu montre le réglage réel, partagé avec TALK (lc_uilang), pour qu'« Enregistrer »
    // ne remette pas « Automatique » sur une langue choisie dans TALK (0.8.3).
    var uiNow = store.get("lc_uilang") || "auto";
    if (uiNow === "auto" || UI_NAMES[uiNow] || known(uiNow)) p.ui = uiNow;
    var a = window.EWPrefs ? window.EWPrefs.read() : { text: 0, contrast: false, theme: "light", motion: false };
    var tr = trPrefs();
    var st = { p: p, a: { text: a.text, contrast: !!a.contrast, theme: a.theme, motion: !!a.motion }, comm: { hands: tr.hands === true, out: tr.out === "earbuds" ? "earbuds" : "speaker" },
      hasAccount: !!store.get("lc_net_auth") };
    var lv = t("levels").split("|");

    function spokenHtml() {
      if (!st.p.spoken.length) return '<li class="muted lp-none">' + esc(t("none")) + "</li>";
      return st.p.spoken.map(function (s, i) {
        return '<li class="lp-sp"><span class="lp-sp-name">' + esc(langLabel(s.code)) + "</span>" +
          '<select data-level="' + i + '" aria-label="' + esc(t("level_of", { l: langName(s.code) })) + '">' +
          LEVELS.map(function (L, j) { return '<option value="' + L + '"' + (L === s.level ? " selected" : "") + ">" + esc(lv[j]) + "</option>"; }).join("") + "</select>" +
          '<button type="button" class="link-btn" data-rm="' + i + '" aria-label="' + esc(t("remove", { l: langName(s.code) })) + '">✕</button></li>';
      }).join("");
    }
    function favHtml() {
      var pool = [st.p.native].concat(st.p.spoken.map(function (s) { return s.code; })).concat(st.p.favorites).filter(function (c, i, arr) { return c && arr.indexOf(c) === i; });
      return pool.map(function (c) {
        var on = st.p.favorites.indexOf(c) !== -1;
        return '<button type="button" class="lp-chip" data-fav="' + esc(c) + '" aria-pressed="' + on + '">' + (on ? "★ " : "☆ ") + esc(langName(c)) + "</button>";
      }).join("") + '<label class="lp-addfav"><span class="sr">' + esc(t("add_lang")) + '</span><select id="lpFavAdd"><option value="">＋ ' + esc(t("add_lang")) + "</option>" + langOptions("", pool) + "</select></label>";
    }
    var tsn = t("ts_names").split("|"), th = t("th").split("|"), rd = t("reading_opts").split("|"), pf = t("prefer_opts").split("|");
    root.innerHTML = '<a class="tr-back" href="#/profil">' + esc(t("back")) + '</a><h1 class="h1" id="h-lp">' + esc(t("title")) + "</h1>" +
      '<div id="lpMsgTop" aria-live="polite"></div>' +
      // Identité
      '<section class="card" aria-labelledby="lpH1"><h2 class="cx-h" id="lpH1">' + esc(t("s_identity")) + "</h2>" +
        '<label class="tr-field"><span>' + esc(t("name")) + '</span><input class="cx-input" id="lpName" maxlength="' + MAX_NAME + '" autocomplete="nickname" placeholder="' + esc(t("name_ph")) + '" value="' + esc(st.p.name) + '"></label>' +
        '<p class="note">' + esc(t("pseudo_note")) + '</p><div class="lp-who"><span class="avatar lp-av" aria-hidden="true" id="lpAv">' + esc(initials(st.p)) + '</span><span><small class="muted">' + esc(t("avatar_note")) + '</small><small class="muted" id="lpDates">' + esc(datesTxt(read())) + "</small></span></div></section>" +
      // Langues
      '<section class="card" aria-labelledby="lpH2"><h2 class="cx-h" id="lpH2">' + esc(t("s_langs")) + "</h2>" +
        '<label class="tr-field"><span>' + esc(t("native")) + '</span><select id="lpNative">' + langOptions(st.p.native) + "</select></label>" +
        '<p class="lp-lbl" id="lpSpL">' + esc(t("spoken")) + '</p><ul class="lp-spoken" id="lpSpoken" aria-labelledby="lpSpL">' + spokenHtml() + "</ul>" +
        '<div class="lp-add"><label class="sr" for="lpAddSel">' + esc(t("add_lang")) + '</label><select id="lpAddSel">' + langOptions("en") + '</select><button type="button" class="btn" id="lpAddBtn">' + esc(t("add")) + "</button></div>" +
        '<p class="note">' + esc(t("level_hint")) + '</p><p class="tr-msg" id="lpLangMsg" role="alert"></p></section>' +
      // Interface et favorites
      '<section class="card" aria-labelledby="lpH3"><h2 class="cx-h" id="lpH3">' + esc(t("s_ui")) + "</h2>" +
        '<label class="tr-field"><span>' + esc(t("ui")) + '</span><select id="lpUi"><option value="auto"' + (st.p.ui === "auto" ? " selected" : "") + ">" + esc(t("ui_auto")) + "</option>" + Object.keys(UI_NAMES).concat(st.p.ui !== "auto" && !UI_NAMES[st.p.ui] ? [st.p.ui] : []).map(function (c) { return '<option value="' + c + '"' + (st.p.ui === c ? " selected" : "") + ' lang="' + c + '">' + esc(UI_NAMES[c] || langName(c)) + "</option>"; }).join("") + "</select></label>" +
        '<p class="note">' + esc(t("ui_note")) + "</p>" +
        '<h2 class="cx-h" id="lpH4">' + esc(t("s_fav")) + '</h2><div class="lp-favs" id="lpFavs" role="group" aria-labelledby="lpH4">' + favHtml() + "</div>" +
        '<p class="note">' + esc(t("fav_note")) + "</p></section>" +
      // Voix et lecture
      '<section class="card" aria-labelledby="lpH5"><h2 class="cx-h" id="lpH5">' + esc(t("s_voice")) + "</h2>" +
        '<label class="tr-field"><span>' + esc(t("rate")) + ' <b id="lpRateTxt">' + Math.round(st.p.rate * 100) + ' %</b></span><input type="range" id="lpRate" min="70" max="130" step="10" value="' + Math.round(st.p.rate * 100) + '"></label>' +
        '<div class="row"><span>' + esc(t("reading")) + "</span>" + seg(t("reading"), rd, st.p.reading, ["slow", "normal", "fast"]) + "</div>" +
        '<p class="note">' + esc(t("reading_note")) + "</p></section>" +
      // Accessibilité
      '<section class="card" aria-labelledby="lpH6"><h2 class="cx-h" id="lpH6">' + esc(t("s_a11y")) + "</h2>" +
        '<div class="row"><span>' + esc(t("text_size")) + "</span>" + seg(t("text_size"), tsn, st.a.text, [0, 1, 2]) + "</div>" +
        '<div class="row"><span>' + esc(t("theme")) + "</span>" + seg(t("theme"), th, st.a.theme, ["light", "dark", "auto"]) + "</div>" +
        toggle("lpContrast", t("contrast"), st.a.contrast) + toggle("lpMotion", t("motion"), st.a.motion) + "</section>" +
      // Communication
      '<section class="card" aria-labelledby="lpH7"><h2 class="cx-h" id="lpH7">' + esc(t("s_comm")) + "</h2>" +
        '<div class="row"><span>' + esc(t("prefer")) + "</span>" + seg(t("prefer"), pf, st.p.prefer, ["voice", "text"]) + "</div>" +
        '<p class="note">' + esc(t("prefer_note")) + "</p>" +
        toggle("lpHands", t("hands"), st.comm.hands) +
        '<div class="row"><span>' + esc(t("out")) + "</span>" + seg(t("out"), [t("out_sp"), t("out_ea")], st.comm.out, ["speaker", "earbuds"]) + "</div></section>" +
      // Confidentialité
      '<section class="card" aria-labelledby="lpH8"><h2 class="cx-h" id="lpH8">' + esc(t("s_priv")) + "</h2>" +
        toggle("lpSync", t("sync"), st.p.sync, !st.hasAccount) +
        '<p class="note" id="lpSyncNote">' + esc(st.hasAccount ? t("sync_note") : t("sync_need")) + "</p>" +
        '<label class="tr-opt lp-consent" id="lpConsentBox"' + (st.p.sync ? "" : " hidden") + '><input type="checkbox" id="lpConsent"' + (st.p.consent ? " checked" : "") + "><span>" + esc(t("consent")) +
          (st.p.consent ? '<small class="muted">' + esc(t("consent_on", { d: day(st.p.consent) })) + "</small>" : "") + "</span></label>" +
        '<div role="radiogroup" aria-labelledby="lpVisL"><p class="lp-lbl" id="lpVisL">' + esc(t("vis")) + "</p>" +
          '<label class="tr-opt"><input type="radio" name="lpVis" value="private"' + (st.p.visibility !== "contacts" ? " checked" : "") + "><span><b>" + esc(t("vis_private")) + "</b></span></label>" +
          '<label class="tr-opt"><input type="radio" name="lpVis" value="contacts"' + (st.p.visibility === "contacts" ? " checked" : "") + "><span><b>" + esc(t("vis_contacts")) + "</b></span></label></div>" +
        '<p class="note" id="lpVisNote"></p><p class="note">' + esc(t("never")) + "</p></section>" +
      '<section class="card"><h2 class="cx-h">' + esc(t("applied")) + '</h2><ul class="lp-applied">' + t("applied_list").split("|").map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></section>" +
      '<div class="lp-actions"><button type="button" class="btn primary wide" id="lpSave">' + esc(t("save")) + '</button>' +
        '<button type="button" class="btn wide" id="lpCancel">' + esc(t("cancel")) + '</button><p class="note">' + esc(t("cancel_note")) + '</p><div id="lpMsg" aria-live="polite"></div>' +
      (read().exists ? '<button type="button" class="link-btn lp-erase" id="lpErase">' + esc(t("erase")) + "</button>" : "") + "</div>";

    var $ = function (s) { return root.querySelector(s); };
    function note(box, text, kind) { box.innerHTML = text ? '<p class="cx-msg ' + (kind || "ok") + '" role="' + (kind === "err" ? "alert" : "status") + '">' + esc(text) + "</p>" : ""; }
    function paintVis() {
      var on = st.p.sync && st.hasAccount;
      root.querySelectorAll('input[name="lpVis"]').forEach(function (r) { if (r.value === "contacts") r.disabled = !on; });
      if (!on && st.p.visibility === "contacts") { st.p.visibility = "private"; root.querySelector('input[name="lpVis"][value="private"]').checked = true; }
      $("#lpVisNote").textContent = on ? "" : t("vis_need_sync");
    }
    function repaintLangs() { $("#lpSpoken").innerHTML = spokenHtml(); $("#lpFavs").innerHTML = favHtml(); }
    paintVis();

    root.addEventListener("change", function (e) {
      var el = e.target;
      if (el.id === "lpNative") {
        st.p.native = el.value;
        st.p.spoken = st.p.spoken.filter(function (s) { return s.code !== el.value; });
        repaintLangs();
      } else if (el.hasAttribute && el.hasAttribute("data-level")) {
        var s = st.p.spoken[+el.getAttribute("data-level")]; if (s) { s.level = el.value; s.source = "declare"; }
      } else if (el.id === "lpUi") st.p.ui = el.value;
      else if (el.id === "lpFavAdd" && el.value) {
        if (st.p.favorites.length >= MAX_FAV) $("#lpLangMsg").textContent = t("max_fav");
        else st.p.favorites.push(el.value);
        $("#lpFavs").innerHTML = favHtml();
      } else if (el.name === "lpVis") st.p.visibility = el.value === "contacts" ? "contacts" : "private";
      else if (el.id === "lpConsent") st.p.consent = el.checked ? new Date().toISOString() : "";
    });
    root.addEventListener("input", function (e) {
      if (e.target.id === "lpName") { st.p.name = e.target.value; $("#lpAv").textContent = initials({ name: e.target.value.replace(/[<>]/g, ""), native: st.p.native }); }
      if (e.target.id === "lpRate") { st.p.rate = (+e.target.value) / 100; $("#lpRateTxt").textContent = e.target.value + " %"; }
    });
    root.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b || !root.contains(b)) return;
      if (b.id === "lpAddBtn") {
        var c = $("#lpAddSel").value;
        $("#lpLangMsg").textContent = "";
        if (c === st.p.native || st.p.spoken.some(function (s) { return s.code === c; })) { $("#lpLangMsg").textContent = t("already"); return; }
        if (st.p.spoken.length >= MAX_SPOKEN) { $("#lpLangMsg").textContent = t("max_spoken"); return; }
        st.p.spoken.push({ code: c, level: "A1", source: "declare" });
        repaintLangs();
        var sel = root.querySelector('[data-level="' + (st.p.spoken.length - 1) + '"]'); if (sel) sel.focus();
      } else if (b.hasAttribute("data-rm")) {
        st.p.spoken.splice(+b.getAttribute("data-rm"), 1); repaintLangs(); $("#lpAddSel").focus();
      } else if (b.hasAttribute("data-fav")) {
        var f = b.getAttribute("data-fav"), i = st.p.favorites.indexOf(f);
        if (i !== -1) st.p.favorites.splice(i, 1);
        else if (st.p.favorites.length >= MAX_FAV) { $("#lpLangMsg").textContent = t("max_fav"); return; }
        else st.p.favorites.push(f);
        $("#lpFavs").innerHTML = favHtml();
        var nb = root.querySelector('[data-fav="' + f + '"]'); if (nb) nb.focus();
      } else if (b.hasAttribute("data-seg")) {
        var g = b.parentNode, v = b.getAttribute("data-v"), name = b.getAttribute("data-seg");
        g.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
        if (name === t("reading")) st.p.reading = v;
        else if (name === t("text_size")) st.a.text = +v;
        else if (name === t("theme")) st.a.theme = v;
        else if (name === t("prefer")) st.p.prefer = v;
        else if (name === t("out")) st.comm.out = v;
      } else if (b.id === "lpContrast") { st.a.contrast = !st.a.contrast; b.setAttribute("aria-checked", String(st.a.contrast)); }
      else if (b.id === "lpMotion") { st.a.motion = !st.a.motion; b.setAttribute("aria-checked", String(st.a.motion)); }
      else if (b.id === "lpHands") { st.comm.hands = !st.comm.hands; b.setAttribute("aria-checked", String(st.comm.hands)); }
      else if (b.id === "lpSync") {
        if (!st.hasAccount) { $("#lpSyncNote").textContent = t("sync_need"); return; }
        st.p.sync = !st.p.sync; b.setAttribute("aria-checked", String(st.p.sync)); paintVis();
        $("#lpConsentBox").hidden = !st.p.sync;
        if (!st.p.sync) { st.p.consent = ""; $("#lpConsent").checked = false; }
      } else if (b.id === "lpSave") save(b);
      else if (b.id === "lpCancel") { token++; location.hash = "#/profil"; }
      else if (b.id === "lpErase") erase(b);
    });

    function save(btn) {
      var name = $("#lpName").value;
      if (name.length > MAX_NAME || /[<>]/.test(name)) { note($("#lpMsg"), t("e_name"), "err"); $("#lpName").focus(); return; }
      st.p.name = name.trim();
      if (st.p.sync && !st.p.consent) { note($("#lpMsg"), t("consent_need"), "err"); $("#lpConsent").focus(); return; }
      var wasSynced = read().sync;
      var p2 = write(st.p);
      p2._comm = st.comm;
      var reload = apply(p2, st.a);
      btn.disabled = true; btn.textContent = t("saving");
      var finish = function (text, kind) {
        if (my !== token) return;
        btn.disabled = false; btn.textContent = t("save");
        var dt = $("#lpDates"); if (dt) dt.textContent = datesTxt(read());
        note($("#lpMsg"), text, kind);
        if (reload) setTimeout(function () { location.reload(); }, 900); // nouvelle langue de l'interface
      };
      if (!p2.sync && !wasSynced) return finish(t("saved"));
      if (navigator.onLine === false) return finish(t("offline"), "err");
      client().then(function (c) {
        return session(c).then(function (s) {
          if (!s) throw new Error("OFF");
          // Synchronisation arrêtée : on retire aussi la copie du compte (minimisation).
          var q = p2.sync ? c.from("language_profiles").upsert(toRow(p2, s.user.id), { onConflict: "user_id" }) : c.from("language_profiles").delete().eq("user_id", s.user.id);
          return q.then(function (r) { if (r && r.error) throw r.error; });
        });
      }).then(function () { finish(p2.sync ? t("saved_sync") : t("saved")); }, function (e) { finish(t("sync_err", { m: errMsg(e) }), "err"); });
    }
    function erase(btn) {
      if (!btn.classList.contains("sure")) { btn.classList.add("sure"); btn.textContent = t("erase_sure"); return; }
      var wasSynced = read().sync;
      store.del(KEY);
      var done = function (txt) { if (my !== token) return; edit(outer, lang); note(outer.querySelector("#lpMsgTop"), txt); };
      if (!wasSynced) return done(t("erased"));
      client().then(function (c) {
        return session(c).then(function (s) { if (!s) return; return c.from("language_profiles").delete().eq("user_id", s.user.id).then(function (r) { if (r && r.error) throw r.error; }); });
      }).then(function () { done(t("erased_sync")); }, function (e) { done(t("erased") + " " + t("sync_err", { m: errMsg(e) })); });
    }

    // Nouvel appareil : si le compte a un profil sauvegardé et que cet appareil n'en a pas, on le reprend.
    if (!read().exists && st.hasAccount && navigator.onLine !== false) {
      client().then(function (c) {
        return session(c).then(function (s) {
          if (!s) return null;
          return c.from("language_profiles").select("*").eq("user_id", s.user.id).maybeSingle().then(function (r) { return r && !r.error ? r.data : null; });
        });
      }).then(function (row) {
        if (my !== token || !row || !row.native_lang) return;
        var got = fromRow(row);
        write(got);
        edit(outer, lang);
        note(outer.querySelector("#lpMsgTop"), t("loaded"));
      }, function () { /* pas de compte joignable : on garde l'écran local */ });
    }
  }

  // Point d'entrée (app.js) : parts = ["linguistique"] → écran de modification.
  function show(root, uiLang) { edit(root, uiLang); return t("title"); }

  window.EWProfil = {
    read: read, summary: summary, show: show,
    favorites: function () { return read().favorites; },
    // Voyage : ajouter la langue du pays aux favorites (sur l'appareil ; le compte sera mis à jour au prochain « Enregistrer »).
    addFavorite: function (code) {
      var p = read();
      if (!p.exists) { p.native = deviceLang(); }
      if (p.favorites.indexOf(code) !== -1) return true;
      if (p.favorites.length >= MAX_FAV || !known(code)) return false;
      p.favorites.push(code); write(p); return true;
    },
    native: function () { return read().native; },
    reading: function () { return read().reading; },
    prefer: function () { return read().prefer; },
    _clean: clean, _strings: STR
  };
})();

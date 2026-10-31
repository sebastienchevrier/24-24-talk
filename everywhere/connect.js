/* 24/24 EVERYWHERE — CONNECT : un compte, plusieurs appareils. © 2026 Sébastien Chevrier. Tous droits réservés.
   - Sécuriser mon compte : relier une adresse e-mail au compte actuel (sans mot de passe, code de 6 à 10 chiffres).
   - J'ai déjà un compte : se connecter sur cet appareil avec le code reçu par e-mail.
   - Mes appareils : voir ses appareils connectés, en déconnecter un (perdu) ou tous les autres.
   Même session que 24/24 TALK (clé lc_net_auth, même site) : rien n'est recopié. Clé publique uniquement. */
(function () {
  "use strict";
  var CFG = window.EW_CONFIG || {};
  // Retour depuis le lien de l'e-mail (#access_token=…&refresh_token=…&type=…, ou #error_…) : on le lit tout de suite,
  // on efface l'adresse (le jeton ne reste pas dans l'historique) et on ouvre Profil.
  var RETURN = null;
  (function () {
    var h = location.hash || "";
    if (!/(^#|&)(access_token|error_code|error_description|message)=/.test(h)) return;
    var q = {};
    h.replace(/^#/, "").split("&").forEach(function (kv) {
      var i = kv.indexOf("=");
      if (i > 0) try { q[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " ")); } catch (e) { /* ignoré */ }
    });
    RETURN = { at: q.access_token || "", rt: q.refresh_token || "", type: q.type || "", err: q.error_description || q.error_code || "", msg: q.message || "" };
    try { history.replaceState(null, "", location.pathname + location.search + "#/profil"); } catch (e) { location.hash = "#/profil"; }
  })();
  var S = {
    fr: {
      loading: "Lecture de votre profil…", error: "Impossible de joindre le serveur. Vérifiez votre connexion.", retry: "Réessayer",
      off: "La messagerie n'est pas activée sur ce site.",
      none: "Vous n'avez pas encore de profil sur cet appareil.", none_txt: "Créez votre compte 24/24 ONE WORLD : un pseudo, votre langue et un e-mail confirmé. Ou connectez-vous si vous avez déjà un compte.",
      create: "Créer mon compte", have: "J'ai déjà un compte", lang: "Langue parlée : {l}", chats: "Ouvrir mes discussions",
      sec_title: "Sécurité du compte",
      sec_no: "Ce compte n'est relié à aucune adresse e-mail. Si vous perdez ou changez de téléphone, ou si les données du navigateur sont effacées, il ne pourra pas être retrouvé.",
      sec_btn: "Sécuriser mon compte",
      sec_yes: "Compte sécurisé : {e}", sec_pending: "Adresse en attente de confirmation : {e}",
      sync: "Sur un autre appareil, vous retrouvez votre pseudo, vos contacts et les messages des 90 derniers jours. L'historique de traduction, les favoris et les réglages restent sur cet appareil.",
      email_lbl: "Votre adresse e-mail", email_ph: "nom@exemple.com", send: "Recevoir le code", cancel: "Annuler",
      email_link_txt: "Nous envoyons un e-mail de confirmation à cette adresse. Elle sert uniquement à retrouver votre compte et n'est jamais montrée aux autres utilisateurs.",
      login_txt: "Saisissez l'adresse e-mail reliée à votre compte : nous y envoyons un e-mail de connexion.",
      code_lbl: "Si l'e-mail contient un code à 6–10 chiffres, saisissez-le ici", code_sent: "E-mail envoyé à {e}. Ouvrez-le sur ce téléphone et appuyez sur le lien : il ramène ici, dans Chrome. Pensez à regarder dans les courriers indésirables.", verify: "Valider",
      refresh: "J'ai appuyé sur le lien : actualiser", ret_err: "Le lien de l'e-mail n'a pas fonctionné ({m}). Demandez un nouvel e-mail.", ret_half: "Première confirmation reçue. Confirmez aussi avec le lien envoyé à votre autre adresse.",
      linked_ok: "C'est fait : votre compte est relié à {e}.", login_ok: "Connecté : bienvenue {p} !",
      replace_warn: "Attention : cet appareil a déjà le compte {p}, qui n'est relié à aucun e-mail. Si vous vous connectez à un autre compte, {p} sera perdu définitivement.",
      replace_ok: "Je comprends, continuer",
      other_account: "Se connecter à un autre compte",
      logout: "Se déconnecter de ce téléphone", logout_done: "Vous êtes déconnecté sur ce téléphone. Votre compte est gardé : reconnectez-vous avec votre e-mail.",
      dev_title: "Mes appareils", dev_this: "Cet appareil", dev_seen: "Vu {d}", dev_since: "Connecté {d}", dev_out: "Déconnecter", dev_out_sure: "Confirmer", dev_out_all: "Déconnecter tous les autres appareils",
      dev_out_done: "Appareil déconnecté : il n'a plus accès à vos conversations et ne sonnera plus.", dev_all_done: "Tous vos autres appareils sont déconnectés.",
      dev_none: "Aucun autre appareil connecté.", dev_err: "Impossible de lire la liste des appareils pour le moment.",
      e_email: "Adresse e-mail invalide.", e_code: "Le code doit faire 6–10 chiffres.", e_bad_code: "Code incorrect ou expiré. Demandez-en un nouveau.",
      e_taken: "Cette adresse est déjà reliée à un autre compte. Utilisez « J'ai déjà un compte » sur l'écran de connexion, ou une autre adresse.",
      e_unknown: "Aucun compte n'est relié à cette adresse.", e_rate: "Trop d'e-mails envoyés pour le moment. Réessayez dans une heure.",
      e_notauth: "Site de test : seules les adresses des membres de l'équipe du projet reçoivent les e-mails.",
      e_net: "Pas de connexion. Réessayez.", e_other: "Ça n'a pas marché ({m}). Réessayez.",
      del_title: "Supprimer mon compte", del_txt: "Votre compte {p} sera effacé du serveur : pseudo, contacts, conversations, appareils connectés, profil linguistique synchronisé et adresse e-mail reliée. C'est définitif : personne ne pourra le récupérer, pas même l'équipe.",
      del_local: "Les réglages enregistrés seulement sur cet appareil (préférences, phrases préparées) restent ici ; vous pouvez les effacer dans Paramètres.",
      del_btn: "Supprimer mon compte…", del_type: "Pour confirmer, écrivez votre pseudo : {p}", del_go: "Supprimer définitivement", del_wrong: "Le pseudo ne correspond pas.",
      del_wait: "Suppression en cours…", del_done: "Votre compte a été supprimé du serveur. Cet appareil n'est plus connecté.",
      del_net: "Pas de connexion : rien n'a été supprimé. Réessayez quand vous aurez du réseau.", del_auth: "Votre session a expiré ou a été déconnectée : rien n'a été supprimé. Reconnectez-vous puis recommencez.",
      dev_out_none: "Cet appareil n'est plus dans votre liste : rien n'a été modifié.",
      today: "aujourd'hui", ago_min: "il y a {n} min", ago_h: "il y a {n} h", ago_d: "il y a {n} j",
      android: "Android", iphone: "iPhone", ipad: "iPad", windows: "Ordinateur Windows", mac: "Mac", linux: "Ordinateur Linux", other: "Appareil"
    },
    en: {
      loading: "Reading your profile…", error: "Can't reach the server. Check your connection.", retry: "Try again",
      off: "Messaging is not enabled on this site.",
      none: "You don't have a profile on this device yet.", none_txt: "Create your 24/24 ONE WORLD account: a username, your language and a confirmed email. Or sign in if you already have an account.",
      create: "Create my account", have: "I already have an account", lang: "Spoken language: {l}", chats: "Open my chats",
      sec_title: "Account security",
      sec_no: "This account isn't linked to any email address. If you lose or change your phone, or if browser data is cleared, it can't be recovered.",
      sec_btn: "Secure my account",
      sec_yes: "Account secured: {e}", sec_pending: "Address waiting for confirmation: {e}",
      sync: "On another device you get back your username, your contacts and the last 90 days of messages. Translation history, favorites and settings stay on this device.",
      email_lbl: "Your email address", email_ph: "name@example.com", send: "Get the code", cancel: "Cancel",
      email_link_txt: "We send a confirmation email to this address. It's only used to recover your account and is never shown to other users.",
      login_txt: "Enter the email address linked to your account: we send a sign-in email to it.",
      code_lbl: "If the email contains a 6–10-digit code, enter it here", code_sent: "Email sent to {e}. Open it on this phone and tap the link: it brings you back here, in Chrome. Check your spam folder too.", verify: "Confirm",
      refresh: "I tapped the link: refresh", ret_err: "The email link didn't work ({m}). Ask for a new email.", ret_half: "First confirmation received. Also confirm with the link sent to your other address.",
      linked_ok: "Done: your account is linked to {e}.", login_ok: "Signed in: welcome {p}!",
      replace_warn: "Warning: this device already has the account {p}, which isn't linked to any email. If you sign in to another account, {p} will be lost for good.",
      replace_ok: "I understand, continue",
      other_account: "Sign in to another account",
      logout: "Sign out on this phone", logout_done: "You're signed out on this phone. Your account is kept: sign back in with your email.",
      dev_title: "My devices", dev_this: "This device", dev_seen: "Seen {d}", dev_since: "Signed in {d}", dev_out: "Sign out", dev_out_sure: "Confirm", dev_out_all: "Sign out all other devices",
      dev_out_done: "Device signed out: it no longer has access to your chats and won't ring.", dev_all_done: "All your other devices are signed out.",
      dev_none: "No other device signed in.", dev_err: "Can't read the device list right now.",
      e_email: "Invalid email address.", e_code: "The code must be 6–10 digits.", e_bad_code: "Wrong or expired code. Ask for a new one.",
      e_taken: "This address is already linked to another account. Use “I already have an account” on the sign-in screen, or another address.",
      e_unknown: "No account is linked to this address.", e_rate: "Too many emails sent for now. Try again in an hour.",
      e_notauth: "Test site: only addresses of the project's team members receive emails.",
      e_net: "No connection. Try again.", e_other: "That didn't work ({m}). Try again.",
      del_title: "Delete my account", del_txt: "Your account {p} will be erased from the server: username, contacts, chats, signed-in devices, synced language profile and linked email address. This is final: nobody can recover it, not even the team.",
      del_local: "Settings saved only on this device (preferences, prepared phrases) stay here; you can erase them in Settings.",
      del_btn: "Delete my account…", del_type: "To confirm, type your username: {p}", del_go: "Delete for good", del_wrong: "The username doesn't match.",
      del_wait: "Deleting…", del_done: "Your account has been deleted from the server. This device is no longer signed in.",
      del_net: "No connection: nothing was deleted. Try again when you're online.", del_auth: "Your session expired or was signed out: nothing was deleted. Sign in again, then retry.",
      dev_out_none: "This device is no longer in your list: nothing was changed.",
      today: "today", ago_min: "{n} min ago", ago_h: "{n} h ago", ago_d: "{n} d ago",
      android: "Android", iphone: "iPhone", ipad: "iPad", windows: "Windows computer", mac: "Mac", linux: "Linux computer", other: "Device"
    }
  };
  var LANG_NAMES = { fr: "Français", en: "English", es: "Español", pt: "Português", de: "Deutsch", it: "Italiano", mg: "Malagasy", zh: "中文", ja: "日本語", ar: "العربية", ru: "Русский" };
  // Autres langues de l'interface (0.8.3) : langues-ecrans.js.
  (function (x) { if (x) Object.keys(x).forEach(function (k) { S[k] = x[k]; }); })(window.EW_SCREEN_STR && window.EW_SCREEN_STR.connect);
  var lang = (window.EWShell && (window.EWShell.uiLang ? window.EWShell.uiLang() : window.EWShell.lang())) || "fr";
  if (!S[lang]) lang = "en";
  function t(k, v) {
    var s = (S[lang] && S[lang][k]) || S.en[k] || S.fr[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }
  };

  // ---------- Client Supabase partagé avec TALK (même session, chargé seulement quand on en a besoin) ----------
  var sb = null, sdkP = null;
  function client() {
    if (sb) return Promise.resolve(sb);
    if (!CFG.supabase || !CFG.supabase.url || !CFG.supabase.key) return Promise.reject(new Error("OFF"));
    if (!sdkP) sdkP = new Promise(function (ok, ko) {
      if (window.supabase && window.supabase.createClient) return ok(window.supabase);
      var s = document.createElement("script");
      s.src = CFG.supabase.sdk;
      if (CFG.supabase.sri && !window.__EW_NO_SRI) { s.integrity = CFG.supabase.sri; s.crossOrigin = "anonymous"; } // __EW_NO_SRI : tests seulement
      s.async = true;
      s.onload = function () { window.supabase && window.supabase.createClient ? ok(window.supabase) : ko(new Error("SDK")); };
      s.onerror = function () { sdkP = null; ko(new Error("NETWORK")); };
      document.head.appendChild(s);
    });
    return sdkP.then(function (lib) {
      if (!sb) sb = lib.createClient(CFG.supabase.url, CFG.supabase.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "lc_net_auth" }
      });
      return sb;
    });
  }

  function returnUrl() { return location.href.split("#")[0].split("?")[0]; }
  function errText(e) {
    var m = String((e && (e.message || e.msg || e.error_description)) || e || "");
    var code = String((e && (e.code || e.error_code)) || "");
    var st = e && e.status;
    if (/not authorized/i.test(m)) return t("e_notauth");
    if (st === 429 || /rate limit|too many/i.test(m) || /over_email_send_rate_limit|over_request_rate_limit/.test(code)) return t("e_rate");
    if (/email_exists|already been registered|already registered|already exists/i.test(code + " " + m)) return t("e_taken");
    if (/otp_disabled|signups not allowed|user not found/i.test(code + " " + m)) return t("e_unknown");
    if (/otp_expired|expired|invalid/i.test(code + " " + m)) return t("e_bad_code");
    if (/failed to fetch|network|NETWORK/i.test(m)) return t("e_net");
    return t("e_other", { m: m.slice(0, 80) || code || "?" });
  }
  function maskEmail(e) {
    var p = String(e || "").split("@");
    if (p.length !== 2) return e;
    return p[0].slice(0, 2) + "•••@" + p[1];
  }
  function deviceName(ua) {
    ua = String(ua || "");
    var os = /iPhone/.test(ua) ? t("iphone") : /iPad/.test(ua) ? t("ipad") : /Android/.test(ua) ? t("android") : /Windows/.test(ua) ? t("windows")
      : /Macintosh|Mac OS X/.test(ua) ? t("mac") : /Linux/.test(ua) ? t("linux") : t("other");
    var br = /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox"
      : /CriOS|Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
    return os + (br ? " · " + br : "");
  }
  function ago(d) {
    var ms = Date.now() - new Date(d).getTime();
    if (!(ms >= 0)) return t("today");
    var min = Math.round(ms / 60000);
    if (min < 60) return t("ago_min", { n: Math.max(1, min) });
    var h = Math.round(min / 60);
    if (h < 24) return t("ago_h", { n: h });
    return t("ago_d", { n: Math.round(h / 24) });
  }
  function msg(box, text, kind) { box.innerHTML = text ? '<p class="cx-msg ' + (kind || "err") + '" role="' + (kind === "ok" ? "status" : "alert") + '">' + esc(text) + "</p>" : ""; }

  // ---------- Formulaire en deux temps : e-mail, puis code à 6 chiffres ----------
  // mode "link" : relier l'e-mail au compte actuel ; mode "login" : se connecter à un compte existant.
  function emailForm(box, mode, done, cancel) {
    box.innerHTML =
      '<div class="cx-form">' +
      '<p class="muted">' + esc(mode === "link" ? t("email_link_txt") : t("login_txt")) + "</p>" +
      '<label class="cx-lbl" for="cxEmail">' + esc(t("email_lbl")) + "</label>" +
      '<input class="cx-input" id="cxEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="' + esc(t("email_ph")) + '">' +
      '<div class="cx-actions"><button type="button" class="btn primary" id="cxSend">' + esc(t("send")) + '</button>' +
      '<button type="button" class="btn" id="cxCancel">' + esc(t("cancel")) + "</button></div>" +
      '<div id="cxStep2"></div><div id="cxMsg" aria-live="polite"></div></div>';
    var email = box.querySelector("#cxEmail"), m = box.querySelector("#cxMsg"), send = box.querySelector("#cxSend");
    box.querySelector("#cxCancel").addEventListener("click", cancel);
    email.focus();
    send.addEventListener("click", function () {
      var e = email.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return msg(m, t("e_email"));
      send.disabled = true;
      msg(m, "");
      client().then(function (c) {
        return mode === "link" ? c.auth.updateUser({ email: e }, { emailRedirectTo: returnUrl() })
          : c.auth.signInWithOtp({ email: e, options: { shouldCreateUser: false, emailRedirectTo: returnUrl() } });
      }).then(function (r) {
        send.disabled = false;
        if (r && r.error) return msg(m, errText(r.error));
        msg(m, t("code_sent", { e: e }), "ok");
        codeStep(box.querySelector("#cxStep2"), m, mode, e, done);
      }, function (err) { send.disabled = false; msg(m, errText(err)); });
    });
  }
  function codeStep(step, m, mode, email, done) {
    step.innerHTML =
      '<label class="cx-lbl" for="cxCode">' + esc(t("code_lbl")) + "</label>" +
      '<input class="cx-input cx-code" id="cxCode" inputmode="numeric" autocomplete="one-time-code" maxlength="10" pattern="[0-9]*">' +
      '<div class="cx-actions"><button type="button" class="btn" id="cxVerify">' + esc(t("verify")) + "</button></div>" +
      '<button type="button" class="btn primary wide" id="cxRefresh">' + esc(t("refresh")) + "</button>";
    var code = step.querySelector("#cxCode"), ver = step.querySelector("#cxVerify");
    step.querySelector("#cxRefresh").addEventListener("click", function () { location.reload(); });
    code.addEventListener("input", function () { code.value = code.value.replace(/\D/g, "").slice(0, 10); }); // code e-mail : 6 à 10 chiffres
    ver.addEventListener("click", function () {
      var k = code.value.trim();
      if (!/^\d{6,10}$/.test(k)) return msg(m, t("e_code"));
      ver.disabled = true;
      client().then(function (c) {
        return c.auth.verifyOtp({ email: email, token: k, type: mode === "link" ? "email_change" : "email" });
      }).then(function (r) {
        ver.disabled = false;
        if (r && r.error) return msg(m, errText(r.error));
        store.set("lc_net_joined", "1"); // TALK se reconnecte tout seul à ce compte
        done(email);
      }, function (err) { ver.disabled = false; msg(m, errText(err)); });
    });
  }

  // ---------- Mes appareils ----------
  function devices(box, flash) {
    box.innerHTML = '<h2 class="cx-h">' + esc(t("dev_title")) + '</h2><div class="spinner" aria-hidden="true"></div>';
    client().then(function (c) { return c.rpc("mes_appareils"); }).then(function (r) {
      if (r.error) throw r.error;
      var list = r.data || [];
      var others = list.filter(function (d) { return !d.actuel; });
      var html = '<h2 class="cx-h">' + esc(t("dev_title")) + "</h2>" + (flash ? '<p class="cx-msg ok" role="status">' + esc(flash) + "</p>" : "") + '<ul class="cx-devs">';
      list.forEach(function (d) {
        html += '<li class="cx-dev"><span><b>' + esc(deviceName(d.appareil)) + "</b><small>" +
          esc(d.actuel ? t("dev_since", { d: ago(d.depuis) }) : t("dev_seen", { d: ago(d.vu) })) + "</small></span>" +
          (d.actuel ? '<span class="badge">' + esc(t("dev_this")) + "</span>" : '<button type="button" class="link-btn" data-out="' + esc(d.id) + '">' + esc(t("dev_out")) + "</button>") + "</li>";
      });
      html += "</ul>" + (others.length ? '<button type="button" class="btn wide" id="cxOutAll">' + esc(t("dev_out_all")) + "</button>" : '<p class="muted">' + esc(t("dev_none")) + "</p>") +
        '<div id="cxDevMsg" aria-live="polite"></div>';
      box.innerHTML = html;
      var dm = box.querySelector("#cxDevMsg");
      // Deux appuis pour déconnecter (pas de fenêtre de confirmation du navigateur).
      box.querySelectorAll("[data-out]").forEach(function (b) {
        b.addEventListener("click", function () {
          if (!b.classList.contains("sure")) { b.classList.add("sure"); b.textContent = t("dev_out_sure"); return; }
          b.disabled = true;
          client().then(function (c) { return c.rpc("deconnecter_appareil", { sid: b.getAttribute("data-out") }); }).then(function (x) {
            if (x.error) { b.disabled = false; return msg(dm, errText(x.error)); }
            // Le serveur ne déconnecte qu'un appareil de CE compte : « false » = rien n'a été touché.
            devices(box, x.data === false ? t("dev_out_none") : t("dev_out_done"));
          }, function (err) { b.disabled = false; msg(dm, errText(err)); });
        });
      });
      var all = box.querySelector("#cxOutAll");
      if (all) all.addEventListener("click", function () {
        if (!all.classList.contains("sure")) { all.classList.add("sure"); all.textContent = t("dev_out_sure"); return; }
        all.disabled = true;
        client().then(function (c) { return c.auth.signOut({ scope: "others" }); }).then(function (x) {
          if (x && x.error) { all.disabled = false; return msg(dm, errText(x.error)); }
          devices(box, t("dev_all_done"));
        }, function (err) { all.disabled = false; msg(dm, errText(err)); });
      });
    }).catch(function () { box.innerHTML = '<h2 class="cx-h">' + esc(t("dev_title")) + '</h2><p class="muted">' + esc(t("dev_err")) + "</p>"; });
  }

  // ---------- Supprimer mon compte ----------
  // Le serveur (supprimer_mon_compte) n'efface QUE le compte du jeton présenté, et seulement si la session est encore active.
  // Ici : confirmation explicite (écrire son pseudo), puis nettoyage de la session sur cet appareil.
  function deleteBox(box, prof, card, opts) {
    box.innerHTML = '<h2 class="cx-h">' + esc(t("del_title")) + '</h2><button type="button" class="btn danger wide" id="cxDelOpen">' + esc(t("del_btn")) + '</button><div id="cxDelForm"></div>';
    var open = box.querySelector("#cxDelOpen"), f = box.querySelector("#cxDelForm");
    open.addEventListener("click", function () {
      open.hidden = true;
      f.innerHTML = '<p class="cx-warn">' + esc(t("del_txt", { p: prof.pseudo })) + '</p><p class="muted">' + esc(t("del_local")) + "</p>" +
        '<label class="cx-lbl" for="cxDelName">' + esc(t("del_type", { p: prof.pseudo })) + "</label>" +
        '<input class="cx-input" id="cxDelName" autocomplete="off" autocapitalize="none" spellcheck="false" dir="ltr">' +
        '<div class="cx-actions"><button type="button" class="btn danger" id="cxDelGo">' + esc(t("del_go")) + '</button>' +
        '<button type="button" class="btn primary" id="cxDelNo">' + esc(t("cancel")) + '</button></div><div id="cxDelMsg" aria-live="polite"></div>';
      var inp = f.querySelector("#cxDelName"), go = f.querySelector("#cxDelGo"), m = f.querySelector("#cxDelMsg");
      inp.focus();
      f.querySelector("#cxDelNo").addEventListener("click", function () { f.innerHTML = ""; open.hidden = false; open.focus(); });
      go.addEventListener("click", function () {
        if (inp.value.trim().replace(/^@/, "").toLowerCase() !== String(prof.pseudo).toLowerCase()) return msg(m, t("del_wrong"));
        go.disabled = true;
        msg(m, t("del_wait"), "ok");
        client().then(function (c) {
          return c.rpc("supprimer_mon_compte").then(function (r) {
            if (r.error) throw r.error;
            return c.auth.signOut({ scope: "local" }).catch(function () { /* compte déjà effacé */ });
          });
        }).then(function () {
          ["lc_net_auth", "lc_net_joined"].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignoré */ } });
          try {
            Object.keys(localStorage).filter(function (k) { return k.indexOf("lc_callhist_") === 0; }).forEach(function (k) { localStorage.removeItem(k); });
            var lp = JSON.parse(localStorage.getItem("ow_profile_v1") || "null");
            if (lp && lp.sync) { lp.sync = false; localStorage.setItem("ow_profile_v1", JSON.stringify(lp)); }
          } catch (e) { /* ignoré */ }
          render(card, { openTalk: opts.openTalk, note: t("del_done"), noteOk: true });
        }).catch(function (e) {
          go.disabled = false;
          var s = String((e && (e.message || e.code)) || e || "");
          msg(m, /AUTH|JWT|401|403|42501/i.test(s + " " + (e && e.status)) ? t("del_auth") : /fetch|network|NETWORK|Load failed/i.test(s) || !navigator.onLine ? t("del_net") : t("e_other", { m: s.slice(0, 80) }));
        });
      });
    });
  }

  // ---------- Écran Profil ----------
  // opts.openTalk(view) : ouvre TALK. opts.login : ouvrir directement « J'ai déjà un compte ».
  function render(card, opts) {
    opts = opts || {};
    if (!CFG.supabase) { card.innerHTML = '<div class="state"><p>' + esc(t("off")) + "</p></div>"; return; }
    // Aucune session enregistrée sur cet appareil : pas besoin du serveur pour afficher l'invitation (marche aussi hors ligne).
    if (RETURN) return finishReturn(card, opts);
    if (!store.get("lc_net_auth")) return noProfile(card, opts);
    card.innerHTML = '<div class="state"><div class="spinner" aria-hidden="true"></div><p>' + esc(t("loading")) + "</p></div>";
    var c, user = null, prof = null;
    client().then(function (x) { c = x; return c.auth.getSession(); }).then(function (r) {
      if (r.error) throw r.error;
      user = r.data && r.data.session ? r.data.session.user : null;
      if (!user) return null;
      // Données du compte à jour (e-mail confirmé depuis le lien, par exemple).
      return c.auth.getUser().then(function (u) { if (u && u.data && u.data.user) user = u.data.user; }, function () { /* on garde la session */ });
    }).then(function () {
      if (!user) return null;
      return c.from("profiles").select("id,pseudo,lang,nom").eq("id", user.id).maybeSingle().then(function (p) {
        if (p.error) throw p.error;
        return p.data;
      });
    }).then(function (p) {
      prof = p || null;
      if (!prof) return noProfile(card, opts);
      showProfile(card, user, prof, opts);
    }).catch(function () {
      card.innerHTML = '<div class="state" role="alert"><p>' + esc(t("error")) + '</p><button type="button" class="btn primary" id="cxRetry">' + esc(t("retry")) + "</button></div>";
      card.querySelector("#cxRetry").addEventListener("click", function () { render(card, opts); });
    });
  }
  function finishReturn(card, opts) {
    var r = RETURN; RETURN = null;
    var o = { openTalk: opts.openTalk };
    if (r.err) { o.note = t("ret_err", { m: r.err.slice(0, 80) }); return render(card, o); }
    if (!r.at || !r.rt) { o.note = r.msg ? t("ret_half") : ""; o.noteOk = true; return render(card, o); }
    card.innerHTML = '<div class="state"><div class="spinner" aria-hidden="true"></div><p>' + esc(t("loading")) + "</p></div>";
    client().then(function (c) { return c.auth.setSession({ access_token: r.at, refresh_token: r.rt }); }).then(function (x) {
      if (x && x.error) throw x.error;
      store.set("lc_net_joined", "1"); // TALK se reconnecte tout seul à ce compte
      o.flash = r.type === "email_change" ? "linked" : "login";
      render(card, o);
    }).catch(function (e) { o.note = t("ret_err", { m: errText(e) }); render(card, o); });
  }
  function noteHtml(opts) { return opts.note ? '<p class="cx-msg ' + (opts.noteOk ? "ok" : "err") + '" role="status">' + esc(opts.note) + "</p>" : ""; }
  function noProfile(card, opts) {
    card.innerHTML = noteHtml(opts) + '<div class="state"><p><b>' + esc(t("none")) + '</b></p><p class="muted">' + esc(t("none_txt")) + "</p>" +
      '<button type="button" class="btn primary wide" id="cxCreate">' + esc(t("create")) + "</button>" +
      '<button type="button" class="btn wide" id="cxHave">' + esc(t("have")) + '</button></div><div id="cxBox"></div>';
    card.querySelector("#cxCreate").addEventListener("click", function () { opts.openTalk && opts.openTalk("net"); });
    var box = card.querySelector("#cxBox");
    function openLogin() {
      emailForm(box, "login", function () { render(card, { openTalk: opts.openTalk, flash: "login" }); }, function () { box.innerHTML = ""; });
    }
    card.querySelector("#cxHave").addEventListener("click", openLogin);
    if (opts.login) openLogin();
  }
  function showProfile(card, user, prof, opts) {
    var l = LANG_NAMES[prof.lang] || String(prof.lang || "").toUpperCase();
    var email = user.email || "", pending = user.new_email || "";
    var secured = !!email && user.is_anonymous !== true;
    var html = noteHtml(opts) + (opts.flash === "login" ? '<p class="cx-msg ok" role="status">' + esc(t("login_ok", { p: prof.nom || prof.pseudo })) + "</p>" : "") +
      (opts.flash === "linked" ? '<p class="cx-msg ok" role="status">' + esc(t("linked_ok", { e: maskEmail(email || pending) })) + "</p>" : "") +
      '<div class="profile-head"><span class="avatar" aria-hidden="true">' + esc((prof.nom || prof.pseudo).charAt(0).toUpperCase()) + "</span>" +
      '<span><b dir="auto">' + esc(prof.nom || prof.pseudo) + '</b><span class="muted">' + esc(t("lang", { l: l })) + "</span></span></div>" +
      '<button type="button" class="btn primary wide" id="cxChats">' + esc(t("chats")) + "</button>" +
      '<section class="cx-sec"><h2 class="cx-h">' + esc(t("sec_title")) + "</h2>";
    if (secured) html += '<p class="cx-ok">✅ ' + esc(t("sec_yes", { e: maskEmail(email) })) + '</p><p class="muted">' + esc(t("sync")) + "</p>";
    else {
      html += '<p class="cx-warn">' + esc(t("sec_no")) + "</p>" + (pending ? '<p class="muted">' + esc(t("sec_pending", { e: maskEmail(pending) })) + "</p>" : "") +
        '<button type="button" class="btn primary wide" id="cxSecure">' + esc(t("sec_btn")) + '</button><div id="cxBox"></div>' +
        '<p class="muted">' + esc(t("sync")) + "</p>";
    }
    html += '</section><section class="cx-sec" id="cxDevices"></section>' +
      '<section class="cx-sec cx-del" id="cxDelete"></section>' +
      '<p class="cx-other"><button type="button" class="link-btn" id="cxOther">' + esc(t("other_account")) + '</button></p><div id="cxOtherBox"></div>' +
      // Audit du 31 oct. 2026 : aucun moyen de se déconnecter sur CE téléphone. Proposé seulement si le compte est relié à un
      // e-mail confirmé (sinon il serait perdu) ; deux appuis, comme pour les autres appareils.
      (secured ? '<p class="cx-other"><button type="button" class="btn wide" id="cxLogout">' + esc(t("logout")) + '</button></p><div id="cxLogoutMsg" aria-live="polite"></div>' : "");
    card.innerHTML = html;
    card.querySelector("#cxChats").addEventListener("click", function () { opts.openTalk && opts.openTalk("net"); });
    var sec = card.querySelector("#cxSecure");
    if (sec) sec.addEventListener("click", function () {
      sec.hidden = true;
      emailForm(card.querySelector("#cxBox"), "link", function () { render(card, { openTalk: opts.openTalk, flash: "linked" }); },
        function () { card.querySelector("#cxBox").innerHTML = ""; sec.hidden = false; });
    });
    devices(card.querySelector("#cxDevices"));
    var lo = card.querySelector("#cxLogout");
    if (lo) lo.addEventListener("click", function () {
      if (!lo.classList.contains("sure")) { lo.classList.add("sure"); lo.textContent = t("dev_out_sure"); return; }
      lo.disabled = true;
      client().then(function (c) { return c.auth.signOut({ scope: "local" }); }).then(function (x) {
        if (x && x.error) throw x.error;
        ["lc_net_auth", "lc_net_joined"].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignoré */ } });
        render(card, { openTalk: opts.openTalk, note: t("logout_done"), noteOk: true });
      }).catch(function (e) { lo.disabled = false; msg(card.querySelector("#cxLogoutMsg"), errText(e)); });
    });
    deleteBox(card.querySelector("#cxDelete"), prof, card, opts);
    // Autre compte : prévenir si le compte actuel n'est relié à aucun e-mail (il serait perdu).
    var other = card.querySelector("#cxOther"), ob = card.querySelector("#cxOtherBox");
    other.addEventListener("click", function () {
      other.hidden = true;
      var go = function () {
        emailForm(ob, "login", function () { render(card, { openTalk: opts.openTalk, flash: "login" }); }, function () { ob.innerHTML = ""; other.hidden = false; });
      };
      if (secured) return go();
      ob.innerHTML = '<p class="cx-warn" role="alert">' + esc(t("replace_warn", { p: prof.pseudo })) + '</p><div class="cx-actions">' +
        '<button type="button" class="btn" id="cxReplaceOk">' + esc(t("replace_ok")) + '</button><button type="button" class="btn primary" id="cxReplaceNo">' + esc(t("cancel")) + "</button></div>";
      ob.querySelector("#cxReplaceOk").addEventListener("click", go);
      ob.querySelector("#cxReplaceNo").addEventListener("click", function () { ob.innerHTML = ""; other.hidden = false; });
    });
  }

  window.EWConnect = { render: render, deviceName: deviceName, errText: errText, client: client, _strings: S };
})();

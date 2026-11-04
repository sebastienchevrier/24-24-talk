/* 24/24 ONE WORLD — OWIdentite, le gardien unique de l'identité (OW-012, lot 4, étape A). © 2026 Sébastien Chevrier. Tous droits réservés.

   RÔLE
   Un seul endroit répond à « qui est connecté ? » et prévient tous les écrans quand le compte change.
   Il ne remplace ni l'authentification Supabase (session supabase-js, clé lc_net_auth) ni la sécurité du serveur :
   les règles RLS restent la seule protection des données. Le gardien ne fait que l'affichage et le ménage du téléphone.
   Il ne stocke AUCUN profil : le nom et la langue maternelle viennent de la table profiles, lue au plus une fois
   par compte et gardée en mémoire seulement.

   ÉTAPE A : le fichier existe et il est testé, mais aucun écran ne s'en sert encore (étapes B à F).

   API (window.OWIdentite)
   - adopter(client)        l'écran confie SON client supabase-js (un seul par page) ; le gardien s'abonne à ses événements.
   - client()               Promise du client adopté.
   - moi()                  Promise de { id, pseudo, nom, langue, email, emailConfirme } ou null (pas de session ou pas de profil).
                            Appels simultanés = une seule lecture ; résultat gardé pour ce compte.
   - etat()                 "inconnu" | "chargement" | "connecte" | "sans-profil" | "deconnecte" | "hors-ligne" | "expire".
   - ecouter(fn)            fn(evenement, moi) ; evenement = "connexion" | "deconnexion" | "changement-de-compte" | "expiration"
                            | "profil-modifie" | "hors-ligne" | "en-ligne". Renvoie une fonction pour se désabonner.
   - proteger(promesse)     rejette avec OW_COMPTE_CHANGE si le compte a changé pendant l'attente (réponse d'un ancien compte ignorée).
   - profilModifie()        à appeler après une modification du nom ou de la langue : relit profiles au prochain moi().
   - seDeconnecter()        déconnecte CE téléphone (le compte reste) puis fait le ménage ; rien n'est effacé si la déconnexion échoue.
   - supprimerLeCompte()    RPC serveur supprimer_mon_compte, puis déconnexion et ménage ; rien n'est effacé si le serveur refuse.
   - nettoyerAppareil(o)    efface les données personnelles du compte et des contacts sur ce téléphone (liste ci-dessous) ;
                            o.garderSession = true garde la session (changement de compte : la nouvelle session est déjà là).
   - CLES                   la liste, pour les tests et la documentation.

   RÈGLES DE SÉCURITÉ DU MÉNAGE
   - Jamais localStorage.clear(), sessionStorage.clear(), ni suppression de base IndexedDB ou de cache : seulement la liste.
   - Jamais de ménage sur une erreur réseau : avant d'effacer, on vérifie que la session a VRAIMENT disparu
     (getSession vide ET clé lc_net_auth absente du téléphone).
   - On garde : langue de l'interface, thème et réglages de l'appareil (voir GARDE). */
(function () {
  "use strict";
  if (window.OWIdentite) return;

  var CLE_SESSION = "lc_net_auth";
  // Données personnelles du compte et des contacts (téléphone partagé : rien ne doit rester pour le suivant).
  var CLES = {
    local: [
      "lc_net_auth",      // session supabase-js
      "lc_net_joined",    // « ce téléphone a un compte »
      "lc_home_name",     // prénom affiché sur l'accueil
      "lc_signup",        // brouillon d'inscription (pseudo, e-mail)
      "lc_net_pending",   // ajout de contact en attente
      "lc_hidden_msgs",   // messages masqués pour moi
      "lc_photos_v1",     // photos des contacts
      "lc_pres_hidden",   // ma présence masquée
      "lc_push",          // notifications de ce compte
      "lc_history",       // historique de traduction
      "lc_favorites",     // traductions favorites
      "ow_profile_v1",    // profil de langue (langues parlées)
      "ew_learn_v1",      // progression Apprendre
      "ew_voyage_v1"      // langues, situation et phrases favorites du voyage
    ],
    prefixesLocal: ["lc_callhist_", "lc_cleared_", "lc_convlang_"],
    session: ["ew_voice_call", "ew_voice_next", "ew_face_other", "ew_connect_login"]
  };
  // Gardé exprès (réglages de l'appareil, pas de donnée personnelle) : lc_uilang (langue de l'interface), ew_prefs (thème…),
  // lc_stats_off, lc_speaker, lc_autospeak, lc_aud, ow_vibre, lc_keep_history, lc_net_tr, lc_net_autoread, ew_lang_recent,
  // ew_tr_v1, ew_papier_from, ew_voyage_tr_* (phrases toutes faites, identiques pour tous).
  var GARDE = ["lc_uilang", "ew_prefs", "lc_stats_off", "lc_speaker", "lc_autospeak", "lc_aud", "ow_vibre", "lc_keep_history",
    "lc_net_tr", "lc_net_autoread", "ew_lang_recent", "ew_tr_v1", "ew_papier_from"];

  var cli = null, attenteClient = [], abonnes = [];
  var etatCourant = "inconnu", idCourant = null, generation = 0;
  var cacheMoi = null, lectureMoi = null, deconnexionVoulue = false;

  function stockage(nom) { try { return window[nom]; } catch (e) { return null; } }
  function cleSessionPresente() { var s = stockage("localStorage"); try { return !!(s && s.getItem(CLE_SESSION)); } catch (e) { return false; } }
  function enLigne() { try { return navigator.onLine !== false; } catch (e) { return true; } }

  function annoncer(ev, m) {
    abonnes.slice().forEach(function (fn) { try { fn(ev, m === undefined ? cacheMoi : m); } catch (e) { /* un écran en panne ne bloque pas les autres */ } });
  }
  function changerCompte(id) {
    if (id === idCourant) return false;
    idCourant = id; generation++; cacheMoi = null; lectureMoi = null;
    return true;
  }

  function nettoyerAppareil(o) {
    o = o || {};
    var efface = [], ls = stockage("localStorage"), ss = stockage("sessionStorage");
    function ote(s, k) { try { if (s && s.getItem(k) !== null) { s.removeItem(k); efface.push(k); } } catch (e) { /* ignoré */ } }
    if (ls) {
      CLES.local.forEach(function (k) { if (!(o.garderSession && k === CLE_SESSION)) ote(ls, k); });
      try {
        Object.keys(ls).filter(function (k) { return CLES.prefixesLocal.some(function (p) { return k.indexOf(p) === 0; }); })
          .forEach(function (k) { ote(ls, k); });
      } catch (e) { /* ignoré */ }
    }
    if (ss) CLES.session.forEach(function (k) { ote(ss, k); });
    return efface;
  }

  // La session a-t-elle vraiment disparu ? (et pas juste un réseau coupé)
  function sessionDisparue() {
    if (cleSessionPresente()) return Promise.resolve(false);
    if (!cli) return Promise.resolve(true);
    return Promise.resolve(cli.auth.getSession()).then(function (r) {
      return !(r && r.data && r.data.session);
    }, function () { return false; }); // erreur : dans le doute, on n'efface rien
  }

  function finDeSession(raison) {
    // raison : "deconnexion" (voulue ici), "expiration" (révoquée, expirée, autre onglet)
    return sessionDisparue().then(function (partie) {
      if (!partie) return false;
      var avait = idCourant !== null || etatCourant === "connecte" || etatCourant === "sans-profil";
      nettoyerAppareil();
      changerCompte(null);
      etatCourant = raison === "expiration" ? "expire" : "deconnecte";
      if (avait || raison === "deconnexion") annoncer(raison, null);
      return true;
    });
  }

  function surEvenement(ev, session) {
    var uid = session && session.user ? session.user.id : null;
    if (ev === "SIGNED_OUT") {
      // Déconnexion demandée ici : seDeconnecter() / supprimerLeCompte() font eux-mêmes le ménage.
      // Sinon (session révoquée à distance, expirée, autre onglet) : ménage seulement si la session a vraiment disparu.
      if (!deconnexionVoulue) setTimeout(function () { finDeSession("expiration"); }, 0);
      return;
    }
    if (ev === "INITIAL_SESSION" || ev === "SIGNED_IN" || ev === "TOKEN_REFRESHED") {
      if (!uid) return;
      var avant = idCourant;
      if (changerCompte(uid)) {
        if (avant) { nettoyerAppareil({ garderSession: true }); annoncer("changement-de-compte", null); }
        else if (ev !== "TOKEN_REFRESHED") annoncer("connexion", null);
      }
      return;
    }
    if (ev === "USER_UPDATED") { cacheMoi = null; lectureMoi = null; annoncer("profil-modifie", null); }
  }

  function adopter(c) {
    if (!c || !c.auth || cli === c) return;
    if (cli) return; // un seul client par page : le premier adopté reste la référence
    cli = c;
    try { c.auth.onAuthStateChange(function (ev, s) { surEvenement(ev, s); }); } catch (e) { /* ignoré */ }
    attenteClient.splice(0).forEach(function (f) { f(c); });
  }
  function client() { return cli ? Promise.resolve(cli) : new Promise(function (ok) { attenteClient.push(ok); }); }

  // E-mail confirmé = indicateur réel de Supabase (email_confirmed_at), jamais la simple présence d'une adresse.
  // Compte anonyme = jamais confirmé. Adresse en attente de changement (new_email) : seule l'adresse confirmée compte.
  function emailConfirme(u) { return !!(u && !u.is_anonymous && u.email && u.email_confirmed_at); }

  function moi() {
    if (cacheMoi && cacheMoi.id === idCourant) return Promise.resolve(cacheMoi);
    if (lectureMoi) return lectureMoi;
    if (!enLigne() && !cacheMoi) { etatCourant = "hors-ligne"; }
    var gen = generation;
    if (etatCourant === "inconnu" || etatCourant === "deconnecte" || etatCourant === "expire") etatCourant = "chargement";
    lectureMoi = client().then(function (c) {
      return Promise.resolve(c.auth.getSession()).then(function (r) {
        var s = r && r.data && r.data.session;
        if (r && r.error) throw r.error;
        if (!s) { if (gen === generation) { changerCompte(null); etatCourant = "deconnecte"; } return null; }
        var u = s.user || {};
        if (idCourant !== u.id) { changerCompte(u.id); gen = generation; }
        return Promise.resolve(c.from("profiles").select("id,pseudo,nom,lang").eq("id", u.id).maybeSingle()).then(function (p) {
          if (p && p.error) throw p.error;
          if (gen !== generation) throw new Error("OW_COMPTE_CHANGE");
          if (!p || !p.data) { etatCourant = "sans-profil"; return null; }
          cacheMoi = { id: u.id, pseudo: p.data.pseudo || "", nom: p.data.nom || "", langue: p.data.lang || "",
            email: u.email || "", emailConfirme: emailConfirme(u) };
          etatCourant = "connecte";
          return cacheMoi;
        });
      });
    }).then(function (m) { lectureMoi = null; return m; }, function (e) {
      lectureMoi = null;
      var msg = String((e && (e.message || e.code)) || e || "");
      if (/OW_COMPTE_CHANGE/.test(msg)) return moi();
      if (!enLigne() || /fetch|network|NETWORK|Load failed/i.test(msg)) etatCourant = "hors-ligne";
      throw e;
    });
    return lectureMoi;
  }

  function proteger(p) {
    var gen = generation;
    return Promise.resolve(p).then(function (v) {
      if (gen !== generation) throw new Error("OW_COMPTE_CHANGE");
      return v;
    });
  }

  function seDeconnecter() {
    return client().then(function (c) {
      deconnexionVoulue = true;
      return Promise.resolve(c.auth.signOut({ scope: "local" })).then(function (x) {
        if (x && x.error) throw x.error;
        return finDeSession("deconnexion");
      });
    }).then(function (ok) { deconnexionVoulue = false; return ok; }, function (e) { deconnexionVoulue = false; throw e; });
  }

  function supprimerLeCompte() {
    return client().then(function (c) {
      return Promise.resolve(c.rpc("supprimer_mon_compte")).then(function (r) {
        if (r && r.error) throw r.error; // serveur : refus ou réseau → rien n'est effacé ici
        deconnexionVoulue = true;
        return Promise.resolve(c.auth.signOut({ scope: "local" })).catch(function () { /* compte déjà effacé */ });
      }).then(function () {
        nettoyerAppareil();
        changerCompte(null);
        etatCourant = "deconnecte";
        annoncer("deconnexion", null);
        return true;
      });
    }).then(function (ok) { deconnexionVoulue = false; return ok; }, function (e) { deconnexionVoulue = false; throw e; });
  }

  // Autre onglet ou autre page du site sur ce téléphone : la session disparaît.
  try {
    window.addEventListener("storage", function (e) {
      if (e && e.key === CLE_SESSION && e.oldValue && !e.newValue) finDeSession("expiration");
    });
    window.addEventListener("offline", function () { if (etatCourant === "connecte" || etatCourant === "sans-profil") { etatCourant = "hors-ligne"; annoncer("hors-ligne"); } });
    window.addEventListener("online", function () {
      if (etatCourant !== "hors-ligne") return;
      etatCourant = cacheMoi ? "connecte" : "chargement";
      annoncer("en-ligne");
    });
  } catch (e) { /* ignoré */ }

  window.OWIdentite = {
    version: "A2",
    CLES: CLES, GARDE: GARDE, CLE_SESSION: CLE_SESSION,
    adopter: adopter, client: client, moi: moi,
    etat: function () { return etatCourant; },
    ecouter: function (fn) {
      if (typeof fn !== "function") return function () {};
      abonnes.push(fn);
      return function () { abonnes = abonnes.filter(function (x) { return x !== fn; }); };
    },
    proteger: proteger,
    profilModifie: function () { cacheMoi = null; lectureMoi = null; annoncer("profil-modifie", null); },
    seDeconnecter: seDeconnecter, supprimerLeCompte: supprimerLeCompte, nettoyerAppareil: nettoyerAppareil
  };
})();

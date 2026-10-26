/* 24/24 ONE WORLD — espaces COMMUNITY, LIVE, BUSINESS et Avantages. © 2026 Sébastien Chevrier. Tous droits réservés.
   Routes du portail :
     #/community, #/community/<id>   communautés : salons publics, chacun lit chaque message dans sa langue
     #/live, #/live/<id>             directs : l'animateur parle, chaque spectateur lit (et peut écouter) dans sa langue,
                                     caméra de l'animateur envoyée en direct d'un téléphone à l'autre (12 spectateurs au plus)
     #/business, #/business/new      petites annonces traduites ; le contact passe par la Messagerie (lien d'ajout du vendeur)
     #/avantages                     partenaires (liens d'affiliation, partenaires.js) et parrainage (lien d'invitation)
   Serveur : tables ow_rooms, ow_room_members, ow_room_msgs, ow_listings (supabase/20-espaces-community-live-business.sql).
   Traduction : moteur.js (service gratuit MyMemory), sur le téléphone de celui qui lit. Rien n'est payant. */
(function () {
  "use strict";
  var STR = {
    fr: {
      community: "Community", community_sub: "Des communautés sans frontière de langue : chacun écrit dans sa langue, tout le monde lit dans la sienne.",
      live: "Live", live_sub: "Des directs suivis dans votre langue : sous-titres traduits, et la voix traduite si vous le voulez.",
      business: "Business", business_sub: "Tous les échanges du monde : vendre, acheter, trouver un fournisseur, proposer un service, s'associer. Chaque annonce se lit dans votre langue.",
      avantages: "Avantages", avantages_sub: "Ce que 24/24 ONE WORLD vous apporte en plus.",
      create_c: "＋ Créer une communauté", create_l: "＋ Lancer un direct", f_title: "Nom", f_about: "Description (facultatif)",
      f_title_ph_c: "ex. : Cuisine du monde", f_title_ph_l: "ex. : Visite de Bali en direct", create: "Créer", cancel: "Annuler",
      none_c: "Aucune communauté pour l'instant. Créez la première !", none_l: "Aucun direct pour l'instant. Lancez le premier !",
      members: "{n} membre(s)", on_air: "🔴 En direct", by: "par {n}", back_c: "← Communautés", back_l: "← Directs", back_b: "← Annonces",
      join: "Rejoindre", leave: "Quitter", joined: "Vous êtes membre.", join_to_write: "Rejoignez pour écrire.",
      write_ph: "Écrivez dans votre langue…", send: "Envoyer", empty_room: "Pas encore de message. Lancez la conversation !",
      orig: "Original", translating: "Traduction…", delete_room: "Supprimer", delete_room_q: "Supprimer définitivement « {t} » et tous ses messages ?",
      live_start: "▶ Démarrer le direct", live_stop: "⏹ Arrêter le direct", cam: "📹 Caméra", cam_off: "📹 Couper la caméra",
      live_voice: "🔊 Écouter la voix traduite", live_voice_off: "🔇 Couper la voix", live_wait: "Le direct n'a pas encore commencé.",
      live_host_hint: "Parlez : vos phrases s'affichent en sous-titres, traduites pour chaque spectateur.",
      live_watch: "Rejoignez pour voir la caméra et écrire.", live_mic_denied: "Micro refusé : autorisez-le dans Chrome (cadenas ▸ Autorisations).",
      live_no_mic: "Ce navigateur ne sait pas écouter : écrivez vos sous-titres ci-dessous.", caption_ph: "Sous-titre à envoyer…",
      live_viewers: "{n} spectateur(s) en vidéo", cam_fail: "Caméra indisponible : autorisez-la dans Chrome.",
      b_all: "Tout", b_sell: "Vente", b_buy: "Achat", b_wholesale: "Gros / fournisseur", b_sourcing: "Sourcing", b_service: "Service", b_partner: "Partenariat",
      b_kind_wholesale: "Je fournis en gros (fournisseur, fabricant)", b_kind_sourcing: "Je cherche un fournisseur (sourcing)", b_kind_partner: "Partenariat, associé, emploi",
      mk_t: "📈 Marchés et trading", mk_d: "Discutez des marchés avec le monde entier dans les communautés, et apprenez les bases dans Apprendre. 24/24 ONE WORLD n'exécute aucun ordre et ne donne aucun conseil en investissement.",
      mk_c: "Communautés", mk_l: "Apprendre", b_new: "＋ Publier une annonce",
      b_none: "Aucune annonce pour l'instant. Publiez la première !", b_contact: "💬 Contacter", b_mine: "Votre annonce", b_close: "Retirer",
      b_kind: "Type", b_ttl: "Titre", b_ttl_ph: "ex. : Vélo de ville, très bon état", b_body: "Description", b_price: "Prix (facultatif)",
      b_cur: "Monnaie", b_place: "Lieu (facultatif)", b_place_ph: "ex. : Antananarivo", b_publish: "Publier",
      b_safety: "Prudence : ne payez jamais d'avance une personne que vous ne connaissez pas. 24/24 ONE WORLD met les personnes en relation et n'intervient pas dans les ventes.",
      av_partners: "Voyager moins cher", av_partners_sub: "Nos partenaires, au même prix pour vous.",
      av_invite: "Inviter mes proches", av_invite_sub: "Partagez votre lien : vos proches vous retrouvent tout de suite dans la Messagerie.",
      av_invite_btn: "↗ Partager mon lien", av_copied: "Lien copié : collez-le où vous voulez.",
      av_note: "Liens partenaires : une réservation peut rapporter une commission à 24/24 ONE WORLD, sans frais en plus pour vous. Cela finance un réseau libre et gratuit.",
      av_soon: "Bientôt : des réductions réservées aux membres, négociées avec nos partenaires.",
      need_account: "Créez d'abord votre compte (gratuit) dans la Messagerie.", open_msg: "Ouvrir la Messagerie",
      e_net: "Pas de connexion au serveur. Réessayez.", e_rate: "Trop d'envois d'un coup : patientez un peu.", e_other: "Impossible pour l'instant ({m}).",
      retry: "Réessayer", loading: "Chargement…", auto_tr: "Traduction automatique : vérifiez les informations importantes.",
      open_new: "{b} (s'ouvre dans un nouvel onglet)"
    },
    en: {
      community: "Community", community_sub: "Communities without language borders: everyone writes in their language, everyone reads in theirs.",
      live: "Live", live_sub: "Live streams in your language: translated subtitles, and the translated voice if you like.",
      business: "Business", business_sub: "All the world's trade: sell, buy, find a supplier, offer a service, team up. Every listing reads in your language.",
      avantages: "Benefits", avantages_sub: "What 24/24 ONE WORLD gives you on top.",
      create_c: "＋ Create a community", create_l: "＋ Start a live", f_title: "Name", f_about: "Description (optional)",
      f_title_ph_c: "e.g. World cooking", f_title_ph_l: "e.g. Live tour of Bali", create: "Create", cancel: "Cancel",
      none_c: "No community yet. Create the first one!", none_l: "No live yet. Start the first one!",
      members: "{n} member(s)", on_air: "🔴 Live", by: "by {n}", back_c: "← Communities", back_l: "← Lives", back_b: "← Listings",
      join: "Join", leave: "Leave", joined: "You are a member.", join_to_write: "Join to write.",
      write_ph: "Write in your language…", send: "Send", empty_room: "No message yet. Start the conversation!",
      orig: "Original", translating: "Translating…", delete_room: "Delete", delete_room_q: "Permanently delete “{t}” and all its messages?",
      live_start: "▶ Start the live", live_stop: "⏹ Stop the live", cam: "📹 Camera", cam_off: "📹 Turn camera off",
      live_voice: "🔊 Hear the translated voice", live_voice_off: "🔇 Mute the voice", live_wait: "The live hasn't started yet.",
      live_host_hint: "Speak: your sentences appear as subtitles, translated for each viewer.",
      live_watch: "Join to see the camera and write.", live_mic_denied: "Microphone blocked: allow it in your browser settings.",
      live_no_mic: "This browser can't listen: type your subtitles below.", caption_ph: "Subtitle to send…",
      live_viewers: "{n} viewer(s) on video", cam_fail: "Camera unavailable: allow it in your browser settings.",
      b_all: "All", b_sell: "For sale", b_buy: "Wanted", b_wholesale: "Wholesale / supplier", b_sourcing: "Sourcing", b_service: "Service", b_partner: "Partnership",
      b_kind_wholesale: "I supply wholesale (supplier, manufacturer)", b_kind_sourcing: "I'm looking for a supplier (sourcing)", b_kind_partner: "Partnership, associate, job",
      mk_t: "📈 Markets and trading", mk_d: "Talk about the markets with the whole world in the communities, and learn the basics in Learn. 24/24 ONE WORLD executes no orders and gives no investment advice.",
      mk_c: "Communities", mk_l: "Learn", b_new: "＋ Post a listing",
      b_none: "No listing yet. Post the first one!", b_contact: "💬 Contact", b_mine: "Your listing", b_close: "Remove",
      b_kind: "Type", b_ttl: "Title", b_ttl_ph: "e.g. City bike, very good condition", b_body: "Description", b_price: "Price (optional)",
      b_cur: "Currency", b_place: "Place (optional)", b_place_ph: "e.g. Antananarivo", b_publish: "Publish",
      b_safety: "Be careful: never pay a stranger in advance. 24/24 ONE WORLD connects people and takes no part in sales.",
      av_partners: "Travel for less", av_partners_sub: "Our partners, same price for you.",
      av_invite: "Invite my loved ones", av_invite_sub: "Share your link: your loved ones find you right away in Messages.",
      av_invite_btn: "↗ Share my link", av_copied: "Link copied: paste it wherever you like.",
      av_note: "Partner links: a booking may earn 24/24 ONE WORLD a commission, at no extra cost to you. It funds a free, open network.",
      av_soon: "Coming soon: member-only discounts negotiated with our partners.",
      need_account: "First create your free account in Messages.", open_msg: "Open Messages",
      e_net: "No connection to the server. Try again.", e_rate: "Too many posts at once: wait a moment.", e_other: "Not possible right now ({m}).",
      retry: "Try again", loading: "Loading…", auto_tr: "Machine translation: check important information.",
      open_new: "{b} (opens in a new tab)"
    }
  };
  var CUR = ["EUR", "USD", "GBP", "CHF", "CAD", "AUD", "JPY", "CNY", "INR", "BRL", "MXN", "MGA", "MUR", "XOF", "XAF", "MAD", "IDR", "THB", "AED", "RUB"];
  var MAX_VIEWERS = 12;
  var ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];

  var ui = "fr", cur = null, uidP = null, myLang = null;
  function t(k, v) {
    var s = (STR[ui] && STR[ui][k]) || (window.EW_SCREEN_STR && window.EW_SCREEN_STR.espaces && window.EW_SCREEN_STR.espaces[ui] && window.EW_SCREEN_STR.espaces[ui][k]) || STR.en[k] || STR.fr[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function base(l) { return String(l || "").toLowerCase().split(/[-_]/)[0]; }
  function flag(l) { var x = window.EWMoteur && window.EWMoteur.lang(base(l)); return (x && x.flag) || ""; }
  function errText(e) {
    var m = String((e && (e.message || e.code)) || e || "");
    if (/OW_RATE/.test(m)) return t("e_rate");
    if (/fetch|network|NETWORK|OFF/i.test(m)) return t("e_net");
    return t("e_other", { m: m.slice(0, 60) });
  }
  function sb() { return window.EWConnect && window.EWConnect.client ? window.EWConnect.client() : Promise.reject(new Error("OFF")); }
  // Mon compte (identifiant, langue de lecture) : celui de la Messagerie, sur ce téléphone.
  function account() {
    if (!uidP) uidP = sb().then(function (c) {
      return c.auth.getSession().then(function (r) {
        var u = r && r.data && r.data.session && r.data.session.user;
        if (!u) return null;
        return c.from("profiles").select("id,pseudo,lang").eq("id", u.id).maybeSingle().then(function (p) {
          var prof = p && p.data;
          if (!prof) return null;
          myLang = base(prof.lang) || ui;
          return { id: u.id, pseudo: prof.pseudo, lang: myLang };
        });
      });
    }).catch(function (e) { uidP = null; throw e; });
    return uidP;
  }
  // Traduction pour moi : rien à faire si le texte est déjà dans ma langue.
  function tr(text, from) {
    var to = myLang || ui;
    if (!text || base(from) === base(to) || !window.EWMoteur) return Promise.resolve(text);
    return window.EWMoteur.translate(text, base(from), base(to)).catch(function () { return text; });
  }
  // Remplit chaque élément [data-tr] avec sa traduction (original gardé dans [data-orig] si différent).
  function fillTr(box) {
    box.querySelectorAll("[data-tr]").forEach(function (el) {
      var text = el.getAttribute("data-tr"), from = el.getAttribute("data-from");
      el.removeAttribute("data-tr");
      if (base(from) === base(myLang || ui)) { el.textContent = text; return; }
      el.textContent = text;
      el.classList.add("es-pending");
      var tok = cur && cur.token;
      tr(text, from).then(function (out) {
        if (!cur || cur.token !== tok) return;
        el.classList.remove("es-pending");
        el.textContent = out;
        if (out !== text && el.getAttribute("data-show-orig") !== "no") {
          var o = document.createElement("small");
          o.className = "es-orig";
          o.setAttribute("dir", "auto");
          o.textContent = flag(from) + " " + text;
          el.insertAdjacentElement("afterend", o);
        }
      });
    });
  }
  function busy(root) { root.innerHTML = '<div class="card"><p class="muted">' + esc(t("loading")) + "</p></div>"; }
  function fail(root, e, again) {
    root.innerHTML = '<div class="card"><p class="tr-err">' + esc(errText(e)) + '</p><button type="button" class="btn" id="esRetry">' + esc(t("retry")) + "</button></div>";
    root.querySelector("#esRetry").addEventListener("click", again);
  }
  function noAccount(root) {
    root.innerHTML = '<div class="card"><p>' + esc(t("need_account")) + '</p><a class="btn primary" href="../index.html?b=msg">' + esc(t("open_msg")) + "</a></div>";
  }
  function head(kind) {
    return '<div class="tr-head es-head"><div><h1 id="h-es">' + esc(t(kind)) + '</h1><p class="muted">' + esc(t(kind + "_sub")) + "</p></div></div>";
  }
  function when(d) {
    try { return new Date(d).toLocaleString(ui, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; }
  }

  // ---------- Listes de salons (Community, Live) ----------
  function roomsList(root, kind) {
    var k1 = kind === "live" ? "l" : "c";
    root.innerHTML = head(kind) +
      '<button type="button" class="tr-big es-new ' + kind + '" id="esNewBtn"><span class="tr-big-ic">＋</span><span><b>' + esc(t("create_" + k1).replace(/^＋ /, "")) + "</b></span></button>" +
      '<form class="card es-form" id="esNew" hidden><label class="tr-field">' + esc(t("f_title")) +
      '<input id="esTitle" maxlength="80" required minlength="3" placeholder="' + esc(t("f_title_ph_" + k1)) + '"></label>' +
      '<label class="tr-field">' + esc(t("f_about")) + '<textarea id="esAbout" maxlength="500" rows="3"></textarea></label>' +
      '<p class="tr-err" id="esErr"></p><div class="es-row"><button class="btn primary" type="submit">' + esc(t("create")) + '</button><button class="btn" type="button" id="esCancel">' + esc(t("cancel")) + "</button></div></form>" +
      '<div id="esList" class="es-list"><p class="muted">' + esc(t("loading")) + "</p></div>";
    var form = root.querySelector("#esNew");
    root.querySelector("#esNewBtn").addEventListener("click", function () { form.hidden = false; root.querySelector("#esTitle").focus(); });
    root.querySelector("#esCancel").addEventListener("click", function () { form.hidden = true; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var title = root.querySelector("#esTitle").value.trim(), about = root.querySelector("#esAbout").value.trim();
      if (title.length < 3) return;
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      Promise.all([sb(), account()]).then(function (r) {
        if (!r[1]) throw new Error("ACCOUNT");
        return r[0].from("ow_rooms").insert({ kind: kind, title: title, about: about, lang: r[1].lang }).select("id").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        location.hash = "#/" + kind + "/" + res.data.id;
      }).catch(function (err) { btn.disabled = false; root.querySelector("#esErr").textContent = errText(err); });
    });
    var tok = cur.token;
    Promise.all([sb(), account()]).then(function (r) {
      if (!r[1]) { noAccount(root.querySelector("#esList")); root.querySelector("#esNewBtn").hidden = true; return; }
      var q = r[0].from("ow_rooms").select("*").eq("kind", kind);
      if (kind === "live") q = q.order("live_on", { ascending: false });
      return q.order("last_at", { ascending: false }).limit(60).then(function (res) {
        if (!cur || cur.token !== tok) return;
        if (res.error) throw res.error;
        var list = root.querySelector("#esList");
        if (!res.data.length) { list.innerHTML = '<div class="card es-empty"><p>' + esc(t("none_" + k1)) + "</p></div>"; return; }
        list.innerHTML = res.data.map(function (r) {
          return '<a class="card es-room" href="#/' + kind + "/" + esc(r.id) + '">' +
            (r.live_on ? '<span class="es-live">' + esc(t("on_air")) + "</span>" : "") +
            '<b dir="auto" data-tr="' + esc(r.title) + '" data-from="' + esc(r.lang) + '" data-show-orig="no"></b>' +
            (r.about ? '<span class="es-about" dir="auto" data-tr="' + esc(r.about) + '" data-from="' + esc(r.lang) + '" data-show-orig="no"></span>' : "") +
            '<small class="muted">' + esc(flag(r.lang)) + " " + esc(t("members", { n: r.members })) + " · " + esc(t("by", { n: r.owner_name || "?" })) + "</small></a>";
        }).join("");
        fillTr(list);
      });
    }).catch(function (e) { if (cur && cur.token === tok) fail(root.querySelector("#esList"), e, function () { roomsList(root, kind); }); });
  }

  // ---------- Un salon (communauté ou direct) ----------
  function room(root, kind, id) {
    var tok = cur.token;
    busy(root);
    Promise.all([sb(), account()]).then(function (r) {
      var c = r[0], me = r[1];
      if (!me) { noAccount(root); return; }
      return Promise.all([
        c.from("ow_rooms").select("*").eq("id", id).maybeSingle(),
        c.from("ow_room_members").select("room_id").eq("room_id", id).eq("user_id", me.id).maybeSingle(),
        c.from("ow_room_msgs").select("*").eq("room_id", id).order("id", { ascending: false }).limit(60)
      ]).then(function (res) {
        if (!cur || cur.token !== tok) return;
        if (res[0].error) throw res[0].error;
        if (!res[0].data) { location.replace("#/" + kind); return; }
        cur.c = c; cur.me = me; cur.room = res[0].data; cur.member = !!res[1].data; cur.lastId = 0;
        paintRoom(root, kind, (res[2].data || []).slice().reverse());
      });
    }).catch(function (e) { if (cur && cur.token === tok) fail(root, e, function () { room(root, kind, id); }); });
  }
  function paintRoom(root, kind, msgs) {
    var rm = cur.room, owner = rm.owner_id === cur.me.id, live = kind === "live";
    root.innerHTML = '<a class="tr-back" href="#/' + kind + '">' + esc(t(live ? "back_l" : "back_c")) + "</a>" +
      '<div class="card es-roomhead"><h1 id="h-es" dir="auto" data-tr="' + esc(rm.title) + '" data-from="' + esc(rm.lang) + '"></h1>' +
      (rm.about ? '<p class="muted" dir="auto" data-tr="' + esc(rm.about) + '" data-from="' + esc(rm.lang) + '"></p>' : "") +
      '<p class="muted"><span id="esLiveBadge">' + (rm.live_on ? esc(t("on_air")) + " · " : "") + "</span>" + esc(t("members", { n: rm.members })) + " · " + esc(t("by", { n: rm.owner_name || "?" })) + "</p>" +
      '<div class="es-row">' + (owner ? "" : '<button type="button" class="btn' + (cur.member ? "" : " primary") + '" id="esJoin">' + esc(t(cur.member ? "leave" : "join")) + "</button>") +
      (owner ? '<button type="button" class="btn es-danger" id="esDel">' + esc(t("delete_room")) + "</button>" : "") + "</div></div>" +
      (live ? liveHtml(owner) : "") +
      '<div class="card es-chat"><div class="es-msgs" id="esMsgs" aria-live="polite"></div>' +
      (cur.member ? '<form class="es-compose" id="esCompose"><input id="esInput" dir="auto" maxlength="1000" autocomplete="off" placeholder="' + esc(t("write_ph")) + '"><button class="btn primary" type="submit">' + esc(t("send")) + "</button></form>" +
        '<p class="tr-err" id="esErr"></p>'
        : '<p class="muted">' + esc(t(live ? "live_watch" : "join_to_write")) + "</p>") +
      '<p class="muted es-small">' + esc(t("auto_tr")) + "</p></div>";
    fillTr(root.querySelector(".es-roomhead"));
    msgs.forEach(function (m) { addMsg(m); });
    if (!msgs.filter(function (m) { return m.kind !== "caption"; }).length) root.querySelector("#esMsgs").innerHTML = '<p class="muted es-empty-msg">' + esc(t("empty_room")) + "</p>";
    var join = root.querySelector("#esJoin");
    if (join) join.addEventListener("click", function () {
      join.disabled = true;
      var q = cur.member ? cur.c.from("ow_room_members").delete().eq("room_id", rm.id).eq("user_id", cur.me.id)
        : cur.c.from("ow_room_members").insert({ room_id: rm.id, user_id: cur.me.id });
      q.then(function (res) { if (res.error) throw res.error; room(root, kind, rm.id); }).catch(function (e) { join.disabled = false; alert(errText(e)); });
    });
    var del = root.querySelector("#esDel");
    if (del) del.addEventListener("click", function () {
      if (!confirm(t("delete_room_q", { t: rm.title }))) return;
      stopLive();
      cur.c.from("ow_rooms").delete().eq("id", rm.id).then(function (res) { if (res.error) throw res.error; location.hash = "#/" + kind; }).catch(function (e) { alert(errText(e)); });
    });
    var form = root.querySelector("#esCompose");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inp = root.querySelector("#esInput"), body = inp.value.trim();
      if (!body) return;
      inp.value = "";
      post(body, "text").catch(function (err) { inp.value = body; root.querySelector("#esErr").textContent = errText(err); });
    });
    // Nouveaux messages : temps réel, et relève toutes les 10 s au cas où le temps réel serait coupé.
    var tok = cur.token;
    try {
      cur.rt = cur.c.channel("ow-room-" + rm.id).on("postgres_changes", { event: "INSERT", schema: "public", table: "ow_room_msgs", filter: "room_id=eq." + rm.id },
        function (p) { if (cur && cur.token === tok && p && p.new) addMsg(p.new); }).subscribe();
    } catch (e) { cur.rt = null; }
    cur.poll = setInterval(function () {
      if (!cur || cur.token !== tok) return;
      cur.c.from("ow_room_msgs").select("*").eq("room_id", rm.id).gt("id", cur.lastId).order("id", { ascending: true }).limit(50)
        .then(function (res) { if (cur && cur.token === tok && res.data) res.data.forEach(addMsg); });
    }, 10000);
    if (live) bindLive(root, owner);
  }
  function post(body, kind) {
    return cur.c.from("ow_room_msgs").insert({ room_id: cur.room.id, body: body.slice(0, 1000), lang: cur.me.lang, kind: kind }).select("*").single()
      .then(function (res) { if (res.error) throw res.error; addMsg(res.data); });
  }
  function addMsg(m) {
    if (!cur || !cur.room || !m || m.room_id !== cur.room.id) return;
    cur.seen = cur.seen || {};
    if (cur.seen[m.id]) return;
    cur.seen[m.id] = true;
    if (m.id > cur.lastId) cur.lastId = m.id;
    if (m.kind === "caption") { onCaption(m); return; }
    var box = document.getElementById("esMsgs");
    if (!box) return;
    var empty = box.querySelector(".es-empty-msg");
    if (empty) empty.remove();
    var mine = cur.me && m.sender_id === cur.me.id;
    var div = document.createElement("div");
    div.className = "es-msg" + (mine ? " me" : "");
    div.innerHTML = '<span class="es-who">' + esc(mine ? "" : (m.sender_name || "?")) + ' <small class="muted">' + esc(when(m.created_at)) + "</small></span>" +
      '<span class="es-body" dir="auto" ' + (mine ? ">" + esc(m.body) : 'data-tr="' + esc(m.body) + '" data-from="' + esc(m.lang) + '">') + "</span>";
    box.appendChild(div);
    if (!mine) fillTr(div);
    box.scrollTop = box.scrollHeight;
  }

  // ---------- LIVE : sous-titres traduits, voix traduite, caméra de l'animateur ----------
  function liveHtml(owner) {
    return '<div class="card es-livebox"><div class="es-stage" id="esStage"><video id="esVideo" autoplay playsinline muted hidden></video>' +
      '<div class="es-caption" id="esCaption" dir="auto">' + esc(owner ? t("live_host_hint") : (cur.room.live_on ? "" : t("live_wait"))) + "</div></div>" +
      '<p class="muted es-small" id="esInterim" dir="auto"></p>' +
      '<div class="es-row">' + (owner
        ? '<button type="button" class="btn primary" id="esLiveGo">' + esc(t(cur.room.live_on ? "live_stop" : "live_start")) + '</button><button type="button" class="btn" id="esCam">' + esc(t("cam")) + "</button>"
        : '<button type="button" class="btn" id="esVoice">' + esc(t("live_voice")) + "</button>") + "</div>" +
      (owner ? '<form class="es-compose" id="esCapForm"><input id="esCapInput" dir="auto" maxlength="300" autocomplete="off" placeholder="' + esc(t("caption_ph")) + '"><button class="btn" type="submit">' + esc(t("send")) + "</button></form>" : "") +
      '<p class="muted es-small" id="esLiveMsg"></p></div>';
  }
  function onCaption(m) {
    var el = document.getElementById("esCaption");
    if (!el) return;
    var mine = cur.me && m.sender_id === cur.me.id;
    if (mine) { el.textContent = m.body; return; }
    var tok = cur.token;
    tr(m.body, m.lang).then(function (out) {
      if (!cur || cur.token !== tok) return;
      el.textContent = out;
      if (cur.voice && window.EWMoteur) window.EWMoteur.speak(out, myLang || ui, 1);
    });
    if (cur.room && !cur.room.live_on) { cur.room.live_on = true; var b = document.getElementById("esLiveBadge"); if (b) b.textContent = t("on_air") + " · "; }
  }
  function bindLive(root, owner) {
    var msg = root.querySelector("#esLiveMsg");
    if (owner) {
      var go = root.querySelector("#esLiveGo"), cam = root.querySelector("#esCam");
      go.addEventListener("click", function () {
        var on = !cur.room.live_on;
        go.disabled = true;
        cur.c.from("ow_rooms").update({ live_on: on }).eq("id", cur.room.id).then(function (res) {
          go.disabled = false;
          if (res.error) throw res.error;
          cur.room.live_on = on;
          go.textContent = t(on ? "live_stop" : "live_start");
          root.querySelector("#esLiveBadge").textContent = on ? t("on_air") + " · " : "";
          if (on) startCaptions(root); else stopCaptions();
          signal({ t: on ? "live" : "end" });
        }).catch(function (e) { go.disabled = false; msg.textContent = errText(e); });
      });
      cam.addEventListener("click", function () { toggleHostCam(root); });
      root.querySelector("#esCapForm").addEventListener("submit", function (e) {
        e.preventDefault();
        var inp = root.querySelector("#esCapInput"), v = inp.value.trim();
        if (!v) return;
        inp.value = "";
        post(v, "caption").catch(function (err) { msg.textContent = errText(err); });
      });
      if (cur.room.live_on) startCaptions(root);
    } else {
      var vb = root.querySelector("#esVoice");
      vb.addEventListener("click", function () {
        cur.voice = !cur.voice;
        vb.textContent = t(cur.voice ? "live_voice_off" : "live_voice");
        if (!cur.voice && window.EWMoteur) window.EWMoteur.stopSpeaking();
      });
    }
    if (cur.member) openSignal(owner);
  }
  // Sous-titres de l'animateur : le micro écoute phrase par phrase, chaque phrase part aux spectateurs.
  function startCaptions(root) {
    if (cur.cap || !window.EWMoteur || !window.EWMoteur.canListen) {
      if (!window.EWMoteur || !window.EWMoteur.canListen) root.querySelector("#esLiveMsg").textContent = t("live_no_mic");
      return;
    }
    var tok = cur.token;
    cur.cap = { on: true, l: null };
    function next() {
      if (!cur || cur.token !== tok || !cur.cap || !cur.cap.on) return;
      cur.cap.l = window.EWMoteur.listen(cur.me.lang, {
        interim: function (x) { var el = document.getElementById("esInterim"); if (el) el.textContent = x; },
        final: function (x) {
          var el = document.getElementById("esInterim"); if (el) el.textContent = "";
          post(x, "caption").catch(function () { /* phrase perdue : la suivante repart */ });
          setTimeout(next, 120);
        },
        error: function (code) {
          if (code === "DENIED") { cur.cap.on = false; var m = document.getElementById("esLiveMsg"); if (m) m.textContent = t("live_mic_denied"); }
        },
        end: function () { setTimeout(next, 300); }
      });
      if (!cur.cap.l) setTimeout(next, 1500);
    }
    window.EWMoteur.askMic().then(function (ok) {
      if (!ok) { cur.cap.on = false; root.querySelector("#esLiveMsg").textContent = t("live_mic_denied"); return; }
      if (window.EWEcoute) window.EWEcoute.keepAwake("live");
      next();
    });
  }
  function stopCaptions() {
    if (!cur || !cur.cap) return;
    cur.cap.on = false;
    try { if (cur.cap.l) cur.cap.l.stop(); } catch (e) { /* déjà arrêté */ }
    cur.cap = null;
    if (window.EWEcoute) window.EWEcoute.release("live");
  }
  // Vidéo : canal privé « room:<id> » (membres du salon) ; l'animateur envoie sa caméra à chaque spectateur (un lien par spectateur).
  function openSignal(owner) {
    var tok = cur.token;
    cur.peers = {};
    try {
      cur.sig = cur.c.channel("room:" + cur.room.id, { config: { private: true } })
        .on("broadcast", { event: "sig" }, function (p) { if (cur && cur.token === tok) onSig(p && p.payload, owner); })
        .subscribe(function (st) { if (st === "SUBSCRIBED" && !owner && cur && cur.token === tok) signal({ t: "hello" }); });
    } catch (e) { cur.sig = null; }
  }
  function signal(p) {
    if (!cur || !cur.sig) return;
    p.from = cur.me.id;
    try { cur.sig.send({ type: "broadcast", event: "sig", payload: p }); } catch (e) { /* ignoré */ }
  }
  function onSig(p, owner) {
    if (!p || !p.from || p.from === cur.me.id) return;
    if (p.to && p.to !== cur.me.id) return;
    if (owner) {
      if (p.t === "hello" && cur.camStream) offerTo(p.from);
      else if (p.t === "answer" && cur.peers[p.from]) cur.peers[p.from].setRemoteDescription(p.sdp).catch(function () {});
      else if (p.t === "ice" && cur.peers[p.from]) cur.peers[p.from].addIceCandidate(p.ice).catch(function () {});
      else if (p.t === "bye" && cur.peers[p.from]) { try { cur.peers[p.from].close(); } catch (e) {} delete cur.peers[p.from]; countViewers(); }
    } else {
      if (p.t === "live" || p.t === "cam") signal({ t: "hello" });
      else if (p.t === "camoff" || p.t === "end") closeViewer();
      else if (p.t === "offer") answerOffer(p);
      else if (p.t === "ice" && cur.vpc) cur.vpc.addIceCandidate(p.ice).catch(function () {});
    }
  }
  function offerTo(viewer) {
    if (cur.peers[viewer]) { try { cur.peers[viewer].close(); } catch (e) {} delete cur.peers[viewer]; }
    if (Object.keys(cur.peers).length >= MAX_VIEWERS) return;
    var pc = new RTCPeerConnection({ iceServers: ICE });
    cur.peers[viewer] = pc;
    cur.camStream.getTracks().forEach(function (tr) { pc.addTrack(tr, cur.camStream); });
    pc.onicecandidate = function (e) { if (e.candidate) signal({ t: "ice", to: viewer, ice: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    pc.onconnectionstatechange = function () {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") { if (cur && cur.peers && cur.peers[viewer] === pc) { delete cur.peers[viewer]; countViewers(); } }
      else if (pc.connectionState === "connected") countViewers();
    };
    pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }).then(function () {
      signal({ t: "offer", to: viewer, sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
    }).catch(function () {});
  }
  function countViewers() {
    var el = document.getElementById("esLiveMsg");
    if (!el || !cur || !cur.peers) return;
    var n = Object.keys(cur.peers).filter(function (k) { return cur.peers[k].connectionState === "connected"; }).length;
    el.textContent = cur.camStream ? t("live_viewers", { n: n }) : "";
  }
  function answerOffer(p) {
    closeViewer();
    var pc = new RTCPeerConnection({ iceServers: ICE });
    cur.vpc = pc;
    pc.onicecandidate = function (e) { if (e.candidate) signal({ t: "ice", to: p.from, ice: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    pc.ontrack = function (e) {
      var v = document.getElementById("esVideo");
      if (!v) return;
      v.srcObject = (e.streams && e.streams[0]) || new MediaStream([e.track]);
      v.hidden = false;
      document.getElementById("esStage").classList.add("has-video");
      var pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
    };
    pc.setRemoteDescription(p.sdp).then(function () { return pc.createAnswer(); }).then(function (a) { return pc.setLocalDescription(a); }).then(function () {
      signal({ t: "answer", to: p.from, sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
    }).catch(function () {});
  }
  function closeViewer() {
    if (cur && cur.vpc) { try { cur.vpc.close(); } catch (e) {} cur.vpc = null; }
    var v = document.getElementById("esVideo");
    if (v) { v.srcObject = null; v.hidden = true; }
    var st = document.getElementById("esStage");
    if (st) st.classList.remove("has-video");
  }
  function toggleHostCam(root) {
    var btn = root.querySelector("#esCam"), v = root.querySelector("#esVideo"), msg = root.querySelector("#esLiveMsg");
    if (cur.camStream) {
      cur.camStream.getTracks().forEach(function (tr) { tr.stop(); });
      cur.camStream = null;
      Object.keys(cur.peers || {}).forEach(function (k) { try { cur.peers[k].close(); } catch (e) {} });
      cur.peers = {};
      v.srcObject = null; v.hidden = true;
      root.querySelector("#esStage").classList.remove("has-video");
      btn.textContent = t("cam");
      msg.textContent = "";
      signal({ t: "camoff" });
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } }).then(function (st) {
      if (!cur || !cur.room) { st.getTracks().forEach(function (tr) { tr.stop(); }); return; }
      cur.camStream = st;
      v.srcObject = st; v.hidden = false;
      root.querySelector("#esStage").classList.add("has-video", "mine");
      var pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
      btn.textContent = t("cam_off");
      countViewers();
      signal({ t: "cam" });
    }).catch(function () { msg.textContent = t("cam_fail"); });
  }
  function stopLive() {
    if (!cur) return;
    stopCaptions();
    if (cur.camStream) { cur.camStream.getTracks().forEach(function (tr) { tr.stop(); }); cur.camStream = null; signal({ t: "camoff" }); }
    Object.keys(cur.peers || {}).forEach(function (k) { try { cur.peers[k].close(); } catch (e) {} });
    cur.peers = {};
    if (cur.vpc) signal({ t: "bye" });
    closeViewer();
    if (window.EWMoteur) window.EWMoteur.stopSpeaking();
  }

  // ---------- BUSINESS : petites annonces ----------
  function price(l) {
    if (l.price == null) return "";
    try { return new Intl.NumberFormat(ui, { style: "currency", currency: l.currency, maximumFractionDigits: 2 }).format(l.price); } catch (e) { return l.price + " " + l.currency; }
  }
  function business(root, filter) {
    var tok = cur.token;
    filter = filter || "all";
    root.innerHTML = head("business") +
      '<a class="tr-big es-new business" href="#/business/new"><span class="tr-big-ic">＋</span><span><b>' + esc(t("b_new").replace(/^＋ /, "")) + "</b></span></a>" +
      '<div class="es-chips" role="tablist">' + ["all", "sell", "buy", "wholesale", "sourcing", "service", "partner"].map(function (k) {
        return '<button type="button" role="tab" class="es-chip" data-f="' + k + '" aria-selected="' + (k === filter) + '">' + esc(t("b_" + k)) + "</button>";
      }).join("") + "</div>" +
      '<div id="esList" class="es-list"><p class="muted">' + esc(t("loading")) + '</p></div>' +
      '<div class="card es-markets"><h2 class="tr-h2">' + esc(t("mk_t")) + '</h2><p class="muted">' + esc(t("mk_d")) + '</p><div class="es-row"><a class="btn" href="#/community">' + esc(t("mk_c")) + '</a><a class="btn" href="#/learn">' + esc(t("mk_l")) + "</a></div></div>" +
      '<p class="muted es-small">' + esc(t("b_safety")) + "</p>";
    root.querySelectorAll(".es-chip").forEach(function (b) { b.addEventListener("click", function () { business(root, b.getAttribute("data-f")); }); });
    Promise.all([sb(), account()]).then(function (r) {
      if (!r[1]) { noAccount(root.querySelector("#esList")); return; }
      var q = r[0].from("ow_listings").select("*").eq("status", "open");
      if (filter !== "all") q = q.eq("kind", filter);
      return q.order("created_at", { ascending: false }).limit(80).then(function (res) {
        if (!cur || cur.token !== tok) return;
        if (res.error) throw res.error;
        var list = root.querySelector("#esList"), me = r[1];
        if (!res.data.length) { list.innerHTML = '<div class="card es-empty"><p>' + esc(t("b_none")) + "</p></div>"; return; }
        list.innerHTML = res.data.map(function (l) {
          var mine = l.seller_id === me.id;
          return '<div class="card es-ad" data-id="' + esc(l.id) + '"><span class="es-kind ' + esc(l.kind) + '">' + esc(t("b_" + l.kind)) + "</span>" +
            (l.price != null ? '<span class="es-price">' + esc(price(l)) + "</span>" : "") +
            '<b dir="auto" data-tr="' + esc(l.title) + '" data-from="' + esc(l.lang) + '" data-show-orig="no"></b>' +
            (l.body ? '<p dir="auto" data-tr="' + esc(l.body) + '" data-from="' + esc(l.lang) + '"></p>' : "") +
            '<small class="muted">' + esc([flag(l.lang), l.place, l.seller_name, when(l.created_at)].filter(Boolean).join(" · ")) + "</small>" +
            '<div class="es-row">' + (mine ? '<span class="muted">' + esc(t("b_mine")) + '</span><button type="button" class="btn es-close">' + esc(t("b_close")) + "</button>"
              : (l.seller_pseudo ? '<a class="btn primary" href="../index.html?ajouter=' + encodeURIComponent(l.seller_pseudo) + '">' + esc(t("b_contact")) + "</a>" : "")) + "</div></div>";
        }).join("");
        fillTr(list);
        list.querySelectorAll(".es-close").forEach(function (b) {
          b.addEventListener("click", function () {
            var id = b.closest(".es-ad").getAttribute("data-id");
            b.disabled = true;
            r[0].from("ow_listings").update({ status: "closed" }).eq("id", id).then(function (res) { if (res.error) throw res.error; business(root, filter); })
              .catch(function (e) { b.disabled = false; alert(errText(e)); });
          });
        });
      });
    }).catch(function (e) { if (cur && cur.token === tok) fail(root.querySelector("#esList"), e, function () { business(root, filter); }); });
  }
  function businessNew(root) {
    var defCur = "EUR";
    try { var loc = (navigator.language || "").split("-")[1]; var m = { US: "USD", GB: "GBP", CH: "CHF", CA: "CAD", AU: "AUD", JP: "JPY", CN: "CNY", IN: "INR", BR: "BRL", MX: "MXN", MG: "MGA", MU: "MUR", SN: "XOF", CI: "XOF", CM: "XAF", MA: "MAD", ID: "IDR", TH: "THB", AE: "AED", RU: "RUB" }; if (m[loc]) defCur = m[loc]; } catch (e) { /* euro par défaut */ }
    root.innerHTML = '<a class="tr-back" href="#/business">' + esc(t("back_b")) + "</a>" +
      '<form class="card es-form" id="esAd"><h1 id="h-es">' + esc(t("b_new").replace(/^＋ /, "")) + "</h1>" +
      '<label class="tr-field">' + esc(t("b_kind")) + '<select id="adKind"><option value="sell">' + esc(t("b_sell")) + '</option><option value="buy">' + esc(t("b_buy")) + '</option><option value="wholesale">' + esc(t("b_kind_wholesale")) + '</option><option value="sourcing">' + esc(t("b_kind_sourcing")) + '</option><option value="service">' + esc(t("b_service")) + '</option><option value="partner">' + esc(t("b_kind_partner")) + "</option></select></label>" +
      '<label class="tr-field">' + esc(t("b_ttl")) + '<input id="adTitle" required minlength="3" maxlength="90" placeholder="' + esc(t("b_ttl_ph")) + '"></label>' +
      '<label class="tr-field">' + esc(t("b_body")) + '<textarea id="adBody" maxlength="1500" rows="4"></textarea></label>' +
      '<div class="es-row"><label class="tr-field es-grow">' + esc(t("b_price")) + '<input id="adPrice" type="number" inputmode="decimal" min="0" step="0.01"></label>' +
      '<label class="tr-field">' + esc(t("b_cur")) + '<select id="adCur">' + CUR.map(function (c) { return "<option" + (c === defCur ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></label></div>" +
      '<label class="tr-field">' + esc(t("b_place")) + '<input id="adPlace" maxlength="80" placeholder="' + esc(t("b_place_ph")) + '"></label>' +
      '<p class="tr-err" id="esErr"></p><button class="btn primary" type="submit">' + esc(t("b_publish")) + '</button><p class="muted es-small">' + esc(t("b_safety")) + "</p></form>";
    var form = root.querySelector("#esAd");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var title = root.querySelector("#adTitle").value.trim();
      if (title.length < 3) return;
      var p = root.querySelector("#adPrice").value;
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      Promise.all([sb(), account()]).then(function (r) {
        if (!r[1]) throw new Error("ACCOUNT");
        return r[0].from("ow_listings").insert({ kind: root.querySelector("#adKind").value, title: title, body: root.querySelector("#adBody").value.trim(),
          price: p === "" ? null : Math.max(0, Number(p)), currency: root.querySelector("#adCur").value, place: root.querySelector("#adPlace").value.trim(), lang: r[1].lang });
      }).then(function (res) {
        if (res.error) throw res.error;
        location.hash = "#/business";
      }).catch(function (err) { btn.disabled = false; root.querySelector("#esErr").textContent = errText(err); });
    });
  }

  // ---------- Avantages : partenaires et parrainage ----------
  function avantages(root) {
    var parts = window.EW_PARTNERS || [];
    var vy = (window.EW_SCREEN_STR && window.EW_SCREEN_STR.voyage) || {};
    function vt(k) { return (vy[ui] && vy[ui][k]) || (vy.en && vy.en[k]) || k; }
    root.innerHTML = head("avantages") +
      '<div class="card"><h2 class="tr-h2">' + esc(t("av_invite")) + '</h2><p class="muted">' + esc(t("av_invite_sub")) + "</p>" +
      '<button type="button" class="btn primary" id="esInvite">' + esc(t("av_invite_btn")) + '</button><p class="tr-ok" id="esInvOk"></p></div>' +
      (parts.length ? '<div class="card"><h2 class="tr-h2">' + esc(t("av_partners")) + '</h2><p class="muted">' + esc(t("av_partners_sub")) + '</p><div class="vy-bk-grid">' +
        parts.map(function (p) {
          var href = p.url || p.site, name = vt("bk_" + p.id);
          return '<a class="vy-bk" href="' + esc(href) + '" target="_blank" rel="sponsored noopener" aria-label="' + esc(t("open_new", { b: p.brand })) + '">' +
            '<span class="vy-bk-ic" aria-hidden="true">' + esc(p.icon) + "</span><b>" + esc(name === "bk_" + p.id ? p.brand : name) + '</b><small class="muted">' + esc(vt("bk_" + p.id + "_d").indexOf("bk_") === 0 ? "" : vt("bk_" + p.id + "_d")) +
            '</small><span class="vy-bk-br">' + esc(p.brand) + " ↗</span></a>";
        }).join("") + '</div><p class="muted es-small">' + esc(t("av_note")) + "</p></div>" : "") +
      '<div class="card"><p class="muted">' + esc(t("av_soon")) + "</p></div>";
    root.querySelector("#esInvite").addEventListener("click", function () {
      account().then(function (me) {
        if (!me) { location.href = "../index.html?b=msg"; return; }
        var link = new URL("../?ajouter=" + encodeURIComponent(me.pseudo) + "&i=5", location.href).href;
        if (navigator.share) return navigator.share({ url: link }).catch(function (e) { if (!(e && e.name === "AbortError")) copy(link); });
        copy(link);
      }).catch(function () { location.href = "../index.html?b=msg"; });
    });
    function copy(link) {
      var ok = root.querySelector("#esInvOk");
      (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { ok.textContent = t("av_copied"); }, function () { ok.textContent = link; });
    }
  }

  // ---------- Entrée ----------
  function leave() {
    if (!cur) return;
    stopLive();
    if (cur.poll) clearInterval(cur.poll);
    try { if (cur.rt && cur.c) cur.c.removeChannel(cur.rt); } catch (e) { /* ignoré */ }
    try { if (cur.sig && cur.c) cur.c.removeChannel(cur.sig); } catch (e) { /* ignoré */ }
    cur.token = -1;
    cur = null;
  }
  function show(root, parts, uiLang) {
    leave();
    ui = uiLang || "fr";
    cur = { token: Date.now() + Math.random() };
    var kind = parts[0], sub = parts[1];
    if (!myLang) myLang = ui;
    if (kind === "community" || kind === "live") { if (sub) room(root, kind, sub); else roomsList(root, kind); }
    else if (kind === "business") { if (sub === "new") businessNew(root); else business(root); }
    else avantages(root);
    return t(kind === "avantages" ? "avantages" : kind);
  }
  window.EWEspaces = { show: show, leave: leave, _str: STR };
})();

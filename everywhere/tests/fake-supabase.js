/* Faux client Supabase, UNIQUEMENT pour les tests automatiques (jamais chargé par le site).
   Aucun accès réseau. Par défaut : compte déjà inscrit (@sebtest, français), anonyme, un seul appareil.
   CONNECT : l'état (e-mail, appareils) est gardé dans localStorage « fake_sb » ; le bon code est 123456,
   et seul connu@exemple.fr est un compte existant. */
(function () {
  var PROFILE = { id: "00000000-0000-4000-8000-0000000000aa", pseudo: "sebtest", lang: "fr" };
  var UA_PC = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem("fake_sb") || "null"); } catch (e) { s = null; }
    return s || { session: true, email: "", new_email: "", anon: true, pending: "",
      devices: [{ id: "11111111-1111-4111-8111-111111111111", appareil: navigator.userAgent, depuis: new Date().toISOString(), vu: new Date().toISOString(), actuel: true },
        { id: "22222222-2222-4222-8222-222222222222", appareil: UA_PC, depuis: new Date(Date.now() - 864e5).toISOString(), vu: new Date(Date.now() - 3 * 36e5).toISOString(), actuel: false }] };
  }
  function save(s) { try { localStorage.setItem("fake_sb", JSON.stringify(s)); localStorage.setItem("lc_net_auth", s.session ? "fake" : ""); } catch (e) {} }
  function user(s) { return { id: PROFILE.id, email: s.email, new_email: s.new_email, is_anonymous: s.anon, email_confirmed_at: s.email ? "2026-10-19T00:00:00Z" : null }; }
  function err(message, code, status) { return { data: null, error: { message: message, code: code, status: status || 400 } }; }
  // EVERYWHERE (appeler sur TALK) : avec localStorage « fake_contacts » = "1", deux contacts déjà en discussion (@kenji, @maria).
  var KENJI = { id: "00000000-0000-4000-8000-0000000000b1", pseudo: "kenji", lang: "ja" };
  var MARIA = { id: "00000000-0000-4000-8000-0000000000b2", pseudo: "maria", lang: "es" };
  var C1 = "aaaaaaaa-0000-4000-8000-000000000001", C2 = "aaaaaaaa-0000-4000-8000-000000000002";
  function contactsOn() { try { return localStorage.getItem("fake_contacts") === "1"; } catch (e) { return false; } }
  function rows(table) {
    if (!contactsOn()) return [];
    var t0 = new Date(Date.now() - 36e5).toISOString();
    if (table === "members") return [
      { conversation_id: C1, user_id: PROFILE.id, last_read: t0, cleared_at: null }, { conversation_id: C1, user_id: KENJI.id, last_read: t0, cleared_at: null },
      { conversation_id: C2, user_id: PROFILE.id, last_read: t0, cleared_at: null }, { conversation_id: C2, user_id: MARIA.id, last_read: t0, cleared_at: null }];
    if (table === "profiles") return [KENJI, MARIA];
    // Un message reçu de @kenji (en français, pour ne pas dépendre du service de traduction).
    if (table === "messages") return [{ id: "bbbbbbbb-0000-4000-8000-000000000001", conversation_id: C1, sender_id: KENJI.id, body: "Bonjour depuis Tokyo",
      lang: "fr", kind: "text", created_at: new Date(Date.now() - 6e5).toISOString() }];
    return [];
  }
  // Profil linguistique : la ligne du compte est gardée dans localStorage « fake_lp » ; chaque écriture est notée dans « fake_lp_log ».
  function lpGet() { try { return JSON.parse(localStorage.getItem("fake_lp") || "null"); } catch (e) { return null; } }
  function lpLog(op, row) { try { var l = JSON.parse(localStorage.getItem("fake_lp_log") || "[]"); l.push({ op: op, row: row || null }); localStorage.setItem("fake_lp_log", JSON.stringify(l)); } catch (e) {} }
  // Espaces COMMUNITY, LIVE, BUSINESS (tables ow_*) : petite base en mémoire gardée dans localStorage « fake_ow »,
  // avec ce que font les déclencheurs du vrai serveur (nom affiché, propriétaire, compteur de membres).
  function owLoad() { try { return JSON.parse(localStorage.getItem("fake_ow") || "null") || { ow_rooms: [], ow_room_members: [], ow_room_msgs: [], ow_listings: [], seq: 0 }; } catch (e) { return { ow_rooms: [], ow_room_members: [], ow_room_msgs: [], ow_listings: [], seq: 0 }; } }
  function owSave(d) { try { localStorage.setItem("fake_ow", JSON.stringify(d)); } catch (e) {} }
  function owRun(table, op, payload, filters, single) {
    var d = owLoad(), rows = d[table] || [], now = new Date().toISOString();
    function match(r) { return filters.every(function (f) { return f[0] === "eq" ? String(r[f[1]]) === String(f[2]) : f[0] === "gt" ? r[f[1]] > f[2] : true; }); }
    var out;
    if (op === "insert") {
      var r = Object.assign({}, payload);
      if (table === "ow_rooms") Object.assign(r, { id: "cccccccc-0000-4000-8000-" + String(1e11 + (++d.seq)).slice(1), owner_id: PROFILE.id, owner_name: PROFILE.pseudo, members: 1, live_on: false, created_at: now, last_at: now });
      if (table === "ow_room_msgs") Object.assign(r, { id: ++d.seq, sender_id: PROFILE.id, sender_name: PROFILE.pseudo, kind: r.kind || "text", created_at: now });
      if (table === "ow_listings") Object.assign(r, { id: "dddddddd-0000-4000-8000-" + String(1e11 + (++d.seq)).slice(1), seller_id: PROFILE.id, seller_name: PROFILE.pseudo, seller_pseudo: PROFILE.pseudo, status: "open", created_at: now });
      rows.push(r);
      if (table === "ow_rooms") d.ow_room_members.push({ room_id: r.id, user_id: PROFILE.id });
      if (table === "ow_room_members") d.ow_rooms.forEach(function (x) { if (x.id === r.room_id) x.members++; });
      out = [r];
    } else if (op === "update") {
      out = rows.filter(match); out.forEach(function (r) { Object.assign(r, payload); });
    } else if (op === "delete") {
      out = rows.filter(match);
      d[table] = rows.filter(function (r) { return !match(r); });
      if (table === "ow_room_members") out.forEach(function (m) { d.ow_rooms.forEach(function (x) { if (x.id === m.room_id) x.members--; }); });
    } else {
      out = rows.filter(match).slice().reverse();
    }
    d[table] = d[table] || rows;
    owSave(d);
    return single ? (out[0] || null) : out;
  }
  function builder(table) {
    var single = false, op = "select", payload = null, filters = [];
    var b = {
      then: function (ok, ko) {
        var data;
        if (table.indexOf("ow_") === 0) {
          if (localStorage.getItem("fake_ow_fail") === "1") return Promise.resolve({ data: null, error: { message: "Failed to fetch" } }).then(ok, ko);
          return Promise.resolve({ data: owRun(table, op, payload, filters, single), error: null }).then(ok, ko);
        }
        if (table === "language_profiles") {
          if (localStorage.getItem("fake_lp_fail") === "1" && op !== "select") return Promise.resolve({ data: null, error: { message: "permission denied", code: "42501" } }).then(ok, ko);
          if (op === "upsert") { localStorage.setItem("fake_lp", JSON.stringify(Object.assign({ updated_at: new Date().toISOString() }, payload))); lpLog("upsert", payload); data = null; }
          else if (op === "delete") { localStorage.removeItem("fake_lp"); lpLog("delete"); data = null; }
          else data = single ? lpGet() : (lpGet() ? [lpGet()] : []);
        } else if (table === "profiles" && op === "delete") { localStorage.setItem("fake_prof_del", "1"); data = null; }
        else data = table === "profiles" && single ? (load().session ? PROFILE : null) : rows(table);
        return Promise.resolve({ data: data, error: null }).then(ok, ko);
      },
      upsert: function (p) { op = "upsert"; payload = p; return b; },
      delete: function () { op = "delete"; return b; },
      maybeSingle: function () { single = true; return b; },
      single: function () { single = true; return b; }
    };
    ["select", "eq", "neq", "in", "or", "order", "limit", "gt", "lt", "gte", "lte", "is", "insert", "update", "upsert", "delete", "match", "range", "not", "filter"]
      .forEach(function (m) { if (!b[m]) b[m] = function () { return b; }; });
    // Les ajouts sont notés (window.__inserts) pour que les tests puissent les vérifier.
    b.insert = function (v) { (window.__inserts = window.__inserts || []).push({ table: table, row: v }); op = "insert"; payload = v; return b; };
    b.update = function (v) { op = "update"; payload = v; return b; };
    b.eq = function (k, v) { filters.push(["eq", k, v]); return b; };
    b.gt = function (k, v) { filters.push(["gt", k, v]); return b; };
    b.select = function () { return b; };
    return b;
  }
  function channel() {
    var c = {
      on: function () { return c; },
      subscribe: function (cb) { setTimeout(function () { cb && cb("SUBSCRIBED"); }, 10); return c; },
      send: function () { return Promise.resolve("ok"); },
      track: function () { return Promise.resolve("ok"); },
      untrack: function () { return Promise.resolve("ok"); },
      presenceState: function () { return {}; },
      unsubscribe: function () { return Promise.resolve("ok"); }
    };
    return c;
  }
  var R = function (v) { return Promise.resolve(v); };
  window.supabase = {
    createClient: function () {
      return {
        auth: {
          getSession: function () { var s = load(); return R({ data: { session: s.session ? { user: user(s), access_token: "x" } : null }, error: null }); },
          getUser: function () { var s = load(); return R({ data: { user: s.session ? user(s) : null }, error: null }); },
          signInAnonymously: function () { var s = load(); s.session = true; save(s); return R({ data: { user: user(s) }, error: null }); },
          refreshSession: function () { return R({ data: {}, error: null }); },
          onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; },
          updateUser: function (a, o) {
            var s = load();
            try { localStorage.setItem("fake_redirect", (o && o.emailRedirectTo) || ""); } catch (e) {}
            if (a.email === "pris@exemple.fr") return R(err("A user with this email address has already been registered", "email_exists", 422));
            s.new_email = a.email; save(s); return R({ data: { user: user(s) }, error: null });
          },
          signInWithOtp: function (a) {
            try { localStorage.setItem("fake_redirect", (a.options && a.options.emailRedirectTo) || ""); } catch (e) {}
            if (a.email !== "connu@exemple.fr") return R(err("Signups not allowed for otp", "otp_disabled", 422));
            var s = load(); s.pending = a.email; save(s); return R({ data: {}, error: null });
          },
          verifyOtp: function (a) {
            if (a.token !== "123456") return R(err("Token has expired or is invalid", "otp_expired", 403));
            var s = load();
            if (a.type === "email_change") { s.email = s.new_email; s.new_email = ""; s.anon = false; }
            else { s.session = true; s.email = a.email; s.anon = false; }
            save(s); return R({ data: { user: user(s), session: {} }, error: null });
          },
          setSession: function (t) {
            if (!t.access_token || !t.refresh_token) return R(err("Auth session missing!", "session_missing", 400));
            var s = load(); s.session = true; s.anon = false; s.email = s.email || "connu@exemple.fr"; save(s); return R({ data: { session: {}, user: user(s) }, error: null });
          },
          signOut: function (o) {
            var s = load();
            if (o && o.scope === "others") s.devices = s.devices.filter(function (d) { return d.actuel; }); else s.session = false;
            save(s); return R({ error: null });
          }
        },
        from: builder,
        rpc: function (name, args) {
          var s = load();
          if (name === "mes_appareils") return R({ data: s.devices, error: null });
          if (name === "deconnecter_appareil") {
            // Comme le vrai serveur : seul un appareil de CE compte peut être déconnecté (sinon « false », rien ne change).
            var had = s.devices.some(function (d) { return d.id === args.sid && !d.actuel; });
            s.devices = s.devices.filter(function (d) { return d.id !== args.sid || d.actuel; }); save(s); return R({ data: had, error: null });
          }
          if (name === "supprimer_mon_compte") {
            // localStorage « fake_del_fail » : "net" = coupure réseau, "auth" = session révoquée (le serveur refuse, rien n'est effacé),
            // "missing" = ancien serveur sans cette fonction (TALK se replie alors sur l'effacement du profil, noté dans « fake_prof_del »).
            var f = localStorage.getItem("fake_del_fail");
            if (f === "net") return Promise.reject(new TypeError("Failed to fetch"));
            if (f === "auth") return R({ data: null, error: { message: "AUTH", code: "P0001" } });
            if (f === "missing") return R({ data: null, error: { message: "Could not find the function public.supprimer_mon_compte without parameters in the schema cache", code: "PGRST202" } });
            if (!s.session) return R({ data: null, error: { message: "AUTH", code: "P0001" } });
            s.session = false; s.deleted = true; s.email = ""; s.devices = []; localStorage.removeItem("fake_lp"); save(s);
            return R({ data: null, error: null });
          }
          // @maria a choisi « visible par mes contacts » (langues parlées : français, anglais) ; @kenji est resté privé.
          if (name === "langues_de_mes_contacts") return R({ data: contactsOn() ? [{ user_id: MARIA.id, display_name: "Maria", native_lang: "es", spoken: [{ code: "fr", level: "B2" }, { code: "en", level: "C1" }] }] : [], error: null });
          return R({ data: null, error: null });
        },
        channel: channel,
        removeChannel: function () { return Promise.resolve("ok"); },
        realtime: { setAuth: function () {} },
        functions: { invoke: function () { return Promise.resolve({ data: null, error: { message: "test" } }); } }
      };
    }
  };
})();

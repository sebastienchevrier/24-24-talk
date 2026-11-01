/* 24/24 ONE WORLD — essais du gardien d'identité OWIdentite (OW-012, lot 4, étape A). © 2026 Sébastien Chevrier.
   Un faux client Supabase (en mémoire) pilote les sessions, profils, événements et pannes ; rien ne sort sur Internet.
   Lancer : node everywhere/tests/identite.js */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const SITE = path.resolve(__dirname, "..", ".."), BASE = "/24-24-talk/";
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (!u.pathname.startsWith(BASE)) { res.writeHead(404); return res.end(); }
  const p = path.join(SITE, decodeURIComponent(u.pathname.slice(BASE.length)));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": p.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8" });
  fs.createReadStream(p).pipe(res);
});
const results = [];
function rec(n, ok, d) { results.push(ok); console.log((ok ? "OK   " : "ÉCHEC") + "  " + n + (d ? "  — " + d : "")); }
async function step(n, fn) { try { const r = await fn(); rec(n, r.ok, r.detail); } catch (e) { rec(n, false, String(e.message || e).split("\n")[0]); } }

// Faux client supabase-js, installé dans la page.
const MOCK = () => {
  const A = { id: "aaaaaaaa-0000-4000-8000-00000000000a", email: "a@exemple.org", email_confirmed_at: "2026-10-19T08:00:00Z", is_anonymous: false };
  const B = { id: "bbbbbbbb-0000-4000-8000-00000000000b", email: "b@exemple.org", email_confirmed_at: "2026-10-20T08:00:00Z", is_anonymous: false };
  const PROFILS = { [A.id]: { id: A.id, pseudo: "anna", nom: "Anna", lang: "fr" }, [B.id]: { id: B.id, pseudo: "bilal", nom: "Bilal", lang: "ar" } };
  const M = window.__mock = { A, B, PROFILS, user: null, cb: null, lectures: 0, delai: 0, signOutErreur: null, rpcErreur: null, getSessionErreur: null, rpcAppels: 0 };
  M.connecter = (u) => { M.user = u; localStorage.setItem("lc_net_auth", JSON.stringify({ user: u })); };
  M.emettre = (ev) => M.cb && M.cb(ev, M.user ? { user: M.user } : null);
  const attendre = (v) => new Promise((ok) => setTimeout(() => ok(v), M.delai));
  window.__client = {
    auth: {
      onAuthStateChange(cb) { M.cb = cb; return { data: { subscription: { unsubscribe() {} } } }; },
      getSession() {
        if (M.getSessionErreur) return Promise.reject(new Error(M.getSessionErreur));
        return Promise.resolve({ data: { session: M.user ? { user: M.user } : null }, error: null });
      },
      signOut() {
        if (M.signOutErreur) return Promise.resolve({ error: new Error(M.signOutErreur) });
        M.user = null; localStorage.removeItem("lc_net_auth"); setTimeout(() => M.emettre("SIGNED_OUT"), 0);
        return Promise.resolve({ error: null });
      }
    },
    from(t) {
      let id = null;
      const q = { select() { return q; }, eq(k, v) { id = v; return q; },
        maybeSingle() { M.lectures++; const who = M.user && M.user.id; return attendre({ data: (t === "profiles" && PROFILS[id]) || null, error: null }); } };
      return q;
    },
    rpc(n) { M.rpcAppels++; return Promise.resolve(M.rpcErreur ? { error: new Error(M.rpcErreur) } : { data: null, error: null }); }
  };
  window.__evts = [];
};
// Données d'un compte sur le téléphone + réglages de l'appareil.
const REMPLIR = () => {
  const L = { lc_net_joined: "1", lc_home_name: "Anna", lc_signup: '{"email":"a@exemple.org"}', lc_net_pending: "{}", lc_hidden_msgs: "[1]",
    lc_photos_v1: "{}", lc_pres_hidden: "1", lc_push: "1", lc_history: "[]", lc_favorites: "[]", ow_profile_v1: "{}", ew_learn_v1: "{}", ew_voyage_v1: "{}",
    lc_callhist_x: "[]", lc_cleared_c1: "1", lc_convlang_c1: "{}",
    lc_uilang: "fr", ew_prefs: '{"theme":"dark"}', lc_speaker: "1", ew_tr_v1: "{}", ew_voyage_tr_ja: "{}", ew_lang_recent: "[]" };
  Object.entries(L).forEach(([k, v]) => localStorage.setItem(k, v));
  ["ew_voice_call", "ew_voice_next", "ew_face_other", "ew_connect_login"].forEach((k) => sessionStorage.setItem(k, "x"));
  sessionStorage.setItem("ew_shell", "garde");
};
const PERSO = ["lc_net_joined", "lc_home_name", "lc_signup", "lc_net_pending", "lc_hidden_msgs", "lc_photos_v1", "lc_pres_hidden", "lc_push", "lc_history",
  "lc_favorites", "ow_profile_v1", "ew_learn_v1", "ew_voyage_v1", "lc_callhist_x", "lc_cleared_c1", "lc_convlang_c1"];
const APPAREIL = ["lc_uilang", "ew_prefs", "lc_speaker", "ew_tr_v1", "ew_voyage_tr_ja", "ew_lang_recent"];
const etatStockage = (page) => page.evaluate(([P, D]) => ({
  persoRestant: P.filter((k) => localStorage.getItem(k) !== null),
  appareilPerdu: D.filter((k) => localStorage.getItem(k) === null),
  session: localStorage.getItem("lc_net_auth") !== null,
  ssPerso: ["ew_voice_call", "ew_voice_next", "ew_face_other", "ew_connect_login"].filter((k) => sessionStorage.getItem(k) !== null),
  ssGarde: sessionStorage.getItem("ew_shell") === "garde"
}), [PERSO, APPAREIL]);

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const URL_ = "http://localhost:" + server.address().port + BASE + "everywhere/tests/identite.html";
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const errs = [];
  async function page0(adopt = true) {
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(String(e.message)));
    await page.goto(URL_);
    await page.evaluate(MOCK);
    await page.evaluate(() => OWIdentite.ecouter((ev, m) => window.__evts.push(ev + (m ? ":" + m.pseudo : ""))));
    if (adopt) await page.evaluate(() => OWIdentite.adopter(window.__client));
    return page;
  }
  let page = await page0();

  await step("Étape B : seul le portail (everywhere/index.html, pour les Espaces) charge le gardien ; Messagerie, site et admin inchangés", async () => {
    const pages = ["index.html", "everywhere/index.html", "monde/index.html", "gestion/index.html"].filter((f) => fs.existsSync(path.join(SITE, f)) && /ow-identite\.js/.test(fs.readFileSync(path.join(SITE, f), "utf8")));
    return { ok: pages.join(",") === "everywhere/index.html", detail: "chargé dans " + (pages.join(", ") || "aucune page") };
  });
  await step("Sans session : moi() = null, état « deconnecte »", async () => {
    const r = await page.evaluate(async () => [await OWIdentite.moi(), OWIdentite.etat()]);
    return { ok: r[0] === null && r[1] === "deconnecte", detail: JSON.stringify(r) };
  });
  await step("Première connexion : événement « connexion », moi() = Anna (nom, langue maternelle, e-mail confirmé)", async () => {
    const r = await page.evaluate(async () => { __mock.connecter(__mock.A); __mock.emettre("SIGNED_IN"); const m = await OWIdentite.moi(); return { m, etat: OWIdentite.etat(), evts: __evts.slice() }; });
    return { ok: r.m && r.m.pseudo === "anna" && r.m.nom === "Anna" && r.m.langue === "fr" && r.m.emailConfirme && r.etat === "connecte" && r.evts.includes("connexion"), detail: JSON.stringify(r) };
  });
  await step("Plusieurs modules demandent moi() en même temps : une seule lecture de profiles, puis mémoire", async () => {
    const r = await page.evaluate(async () => { OWIdentite.profilModifie(); __mock.lectures = 0; __mock.delai = 50;
      const t = await Promise.all([OWIdentite.moi(), OWIdentite.moi(), OWIdentite.moi(), OWIdentite.moi()]); await OWIdentite.moi(); __mock.delai = 0;
      return { n: __mock.lectures, memes: t.every((x) => x && x.id === t[0].id) }; });
    return { ok: r.n === 1 && r.memes, detail: r.n + " lecture(s) pour 5 demandes" };
  });
  await step("Profil modifié (nom ou langue) : relu au prochain moi(), événement « profil-modifie »", async () => {
    const r = await page.evaluate(async () => { __mock.lectures = 0; __mock.PROFILS[__mock.A.id].nom = "Anna M."; OWIdentite.profilModifie(); const m = await OWIdentite.moi(); return { nom: m.nom, n: __mock.lectures, ev: __evts.includes("profil-modifie") }; });
    return { ok: r.nom === "Anna M." && r.n === 1 && r.ev, detail: JSON.stringify(r) };
  });
  await step("Opération en cours protégée : une réponse pour Anna arrivée après le passage à Bilal est ignorée", async () => {
    const r = await page.evaluate(async () => {
      const lente = new Promise((ok) => setTimeout(() => ok("messages d'Anna"), 80));
      const p = OWIdentite.proteger(lente).then((v) => "affiché : " + v, (e) => "ignoré : " + e.message);
      __mock.connecter(__mock.B); __mock.emettre("SIGNED_IN");
      return p;
    });
    return { ok: r === "ignoré : OW_COMPTE_CHANGE", detail: r };
  });
  await step("Changement de compte sur le même téléphone : événement, données d'Anna effacées, session de Bilal et réglages gardés, moi() = Bilal", async () => {
    await page.evaluate(() => { __mock.connecter(__mock.A); __mock.emettre("SIGNED_IN"); });
    await page.evaluate(REMPLIR);
    const r = await page.evaluate(async () => { __evts.length = 0; __mock.connecter(__mock.B); __mock.emettre("SIGNED_IN"); const m = await OWIdentite.moi(); return { m: m && m.pseudo, evts: __evts.slice() }; });
    const s = await etatStockage(page);
    return { ok: r.m === "bilal" && r.evts.includes("changement-de-compte") && !s.persoRestant.length && !s.appareilPerdu.length && s.session && !s.ssPerso.length && s.ssGarde,
      detail: "moi=" + r.m + " · reste perso : " + (s.persoRestant.join(",") || "rien") + " · réglages perdus : " + (s.appareilPerdu.join(",") || "aucun") };
  });
  await step("Sans profil (compte sans pseudo) : moi() = null, état « sans-profil »", async () => {
    const r = await page.evaluate(async () => { const C = { id: "cccccccc-0000-4000-8000-00000000000c", email: "", is_anonymous: true }; __mock.connecter(C); __mock.emettre("SIGNED_IN"); return [await OWIdentite.moi(), OWIdentite.etat()]; });
    await page.evaluate(() => { __mock.connecter(__mock.A); __mock.emettre("SIGNED_IN"); });
    return { ok: r[0] === null && r[1] === "sans-profil", detail: JSON.stringify(r) };
  });
  await step("E-mail confirmé : vrai indicateur Supabase (email_confirmed_at) → emailConfirme = true", async () => {
    const r = await page.evaluate(async () => { const U = { id: "dddddddd-0000-4000-8000-00000000000d", email: "d@exemple.org", email_confirmed_at: "2026-10-30T10:00:00Z", is_anonymous: false };
      __mock.PROFILS[U.id] = { id: U.id, pseudo: "dina", nom: "Dina", lang: "es" }; __mock.connecter(U); __mock.emettre("SIGNED_IN"); const m = await OWIdentite.moi(); return m && [m.email, m.emailConfirme]; });
    return { ok: r && r[0] === "d@exemple.org" && r[1] === true, detail: JSON.stringify(r) };
  });
  await step("E-mail présent mais NON confirmé (email_confirmed_at vide) → emailConfirme = false", async () => {
    const r = await page.evaluate(async () => { const U = { id: "eeeeeeee-0000-4000-8000-00000000000e", email: "e@exemple.org", email_confirmed_at: null, is_anonymous: false };
      __mock.PROFILS[U.id] = { id: U.id, pseudo: "eli", nom: "Eli", lang: "en" }; __mock.connecter(U); __mock.emettre("SIGNED_IN"); const m = await OWIdentite.moi(); return m && [m.email, m.emailConfirme]; });
    return { ok: r && r[0] === "e@exemple.org" && r[1] === false, detail: JSON.stringify(r) };
  });
  await step("Compte anonyme (adresse en attente, même avec une date) → emailConfirme = false", async () => {
    const r = await page.evaluate(async () => { const U = { id: "ffffffff-0000-4000-8000-00000000000f", email: "", new_email: "f@exemple.org", email_confirmed_at: "2026-10-30T10:00:00Z", is_anonymous: true };
      __mock.PROFILS[U.id] = { id: U.id, pseudo: "fred", nom: "Fred", lang: "de" }; __mock.connecter(U); __mock.emettre("SIGNED_IN"); const m = await OWIdentite.moi(); return m && [m.email, m.emailConfirme]; });
    await page.evaluate(() => { __mock.connecter(__mock.A); __mock.emettre("SIGNED_IN"); });
    return { ok: r && r[0] === "" && r[1] === false, detail: JSON.stringify(r) };
  });
  await step("Déconnexion qui échoue (réseau) : RIEN n'est effacé, la session reste", async () => {
    await page.evaluate(REMPLIR);
    const r = await page.evaluate(async () => { __mock.signOutErreur = "Failed to fetch"; let e = ""; try { await OWIdentite.seDeconnecter(); } catch (x) { e = x.message; } __mock.signOutErreur = null; return e; });
    const s = await etatStockage(page);
    return { ok: /fetch/.test(r) && s.persoRestant.length === PERSO.length && s.session, detail: "erreur « " + r + " », " + s.persoRestant.length + "/" + PERSO.length + " données gardées" };
  });
  await step("Signal de fin de session mais session toujours là (simple erreur réseau) : RIEN n'est effacé", async () => {
    await page.evaluate(REMPLIR);
    await page.evaluate(() => { __mock.cb("SIGNED_OUT", null); }); // la clé lc_net_auth est toujours sur le téléphone
    await page.waitForTimeout(100);
    const s = await etatStockage(page);
    return { ok: s.persoRestant.length === PERSO.length && s.session, detail: s.persoRestant.length + "/" + PERSO.length + " données gardées" };
  });
  await step("Vérification de session impossible (getSession en panne) : RIEN n'est effacé", async () => {
    await page.evaluate(() => { localStorage.removeItem("lc_net_auth"); __mock.getSessionErreur = "NetworkError"; __mock.cb("SIGNED_OUT", null); });
    await page.waitForTimeout(100);
    const s = await etatStockage(page);
    await page.evaluate(() => { __mock.getSessionErreur = null; __mock.connecter(__mock.A); });
    return { ok: s.persoRestant.length === PERSO.length, detail: s.persoRestant.length + "/" + PERSO.length + " données gardées" };
  });
  await step("Déconnexion réelle : données personnelles effacées (local + session d'onglet), langue de l'interface, thème et réglages gardés, IndexedDB et caches intacts", async () => {
    await page.evaluate(REMPLIR);
    await page.evaluate(async () => { await new Promise((ok) => { const r = indexedDB.open("essai_appareil", 1); r.onupgradeneeded = () => r.result.createObjectStore("x"); r.onsuccess = () => { r.result.close(); ok(); }; });
      if (window.caches) await (await caches.open("essai-cache")).put("/x", new Response("x")); });
    const r = await page.evaluate(async () => { __evts.length = 0; const ok = await OWIdentite.seDeconnecter(); await new Promise((x) => setTimeout(x, 50)); return { ok, evts: __evts.slice(), etat: OWIdentite.etat(), moi: await OWIdentite.moi() }; });
    const s = await etatStockage(page);
    const idb = await page.evaluate(async () => (indexedDB.databases ? (await indexedDB.databases()).map((d) => d.name) : ["?"]).includes("essai_appareil"));
    const cache = await page.evaluate(async () => !window.caches || (await caches.keys()).includes("essai-cache"));
    return { ok: r.ok && r.evts.filter((e) => e === "deconnexion").length === 1 && r.moi === null && !s.persoRestant.length && !s.session && !s.ssPerso.length && !s.appareilPerdu.length && s.ssGarde && idb && cache,
      detail: "événements " + r.evts.join(",") + " · reste perso : " + (s.persoRestant.join(",") || "rien") + " · réglages perdus : " + (s.appareilPerdu.join(",") || "aucun") + " · IndexedDB " + (idb ? "intact" : "TOUCHÉ") + " · cache " + (cache ? "intact" : "TOUCHÉ") };
  });
  await step("Reconnexion après déconnexion : événement « connexion », moi() = Anna", async () => {
    const r = await page.evaluate(async () => { __evts.length = 0; __mock.connecter(__mock.A); __mock.emettre("SIGNED_IN"); return { m: (await OWIdentite.moi()).pseudo, evts: __evts.slice() }; });
    return { ok: r.m === "anna" && r.evts.includes("connexion"), detail: JSON.stringify(r) };
  });
  await step("Expiration ou révocation à distance (session vraiment partie) : ménage, état « expire », événement « expiration »", async () => {
    await page.evaluate(REMPLIR);
    await page.evaluate(() => { __evts.length = 0; __mock.user = null; localStorage.removeItem("lc_net_auth"); __mock.emettre("SIGNED_OUT"); });
    await page.waitForTimeout(100);
    const s = await etatStockage(page);
    const r = await page.evaluate(() => ({ etat: OWIdentite.etat(), evts: __evts.slice() }));
    return { ok: r.etat === "expire" && r.evts.includes("expiration") && !s.persoRestant.length && !s.appareilPerdu.length, detail: JSON.stringify(r) + " · reste perso : " + (s.persoRestant.join(",") || "rien") };
  });
  await step("Déconnexion dans un autre onglet du téléphone : cet onglet le voit, fait le ménage et annonce « expiration »", async () => {
    await page.evaluate(() => { __mock.connecter(__mock.A); __mock.emettre("SIGNED_IN"); });
    await page.evaluate(REMPLIR);
    await page.evaluate(() => { __evts.length = 0; });
    const autre = await ctx.newPage();
    await autre.goto(URL_);
    await page.evaluate(() => { __mock.user = null; }); // même session pour les deux onglets
    await autre.evaluate(() => localStorage.removeItem("lc_net_auth"));
    await page.waitForTimeout(300);
    await autre.close();
    const s = await etatStockage(page);
    const r = await page.evaluate(() => __evts.slice());
    return { ok: r.includes("expiration") && !s.persoRestant.length, detail: "événements " + r.join(",") + " · reste perso : " + (s.persoRestant.join(",") || "rien") };
  });
  await step("Suppression du compte refusée par le serveur : RIEN n'est effacé, la session reste", async () => {
    await page.evaluate(() => { __mock.connecter(__mock.A); __mock.emettre("SIGNED_IN"); });
    await page.evaluate(REMPLIR);
    const r = await page.evaluate(async () => { __mock.rpcErreur = "JWT expired"; let e = ""; try { await OWIdentite.supprimerLeCompte(); } catch (x) { e = x.message; } __mock.rpcErreur = null; return e; });
    const s = await etatStockage(page);
    return { ok: /JWT/.test(r) && s.persoRestant.length === PERSO.length && s.session, detail: "erreur « " + r + " », données gardées" };
  });
  await step("Suppression du compte acceptée : appel serveur supprimer_mon_compte, ménage, événement « deconnexion »", async () => {
    const r = await page.evaluate(async () => { __evts.length = 0; __mock.rpcAppels = 0; const ok = await OWIdentite.supprimerLeCompte(); await new Promise((x) => setTimeout(x, 50)); return { ok, rpc: __mock.rpcAppels, evts: __evts.slice() }; });
    const s = await etatStockage(page);
    return { ok: r.ok && r.rpc === 1 && r.evts.filter((e) => e === "deconnexion").length === 1 && !s.persoRestant.length && !s.session && !s.appareilPerdu.length, detail: JSON.stringify(r) };
  });
  await step("Réseau coupé puis revenu : états « hors-ligne » puis retour, événements annoncés, aucune donnée effacée", async () => {
    await page.evaluate(() => { __mock.connecter(__mock.A); __mock.emettre("SIGNED_IN"); });
    await page.evaluate(async () => { await OWIdentite.moi(); });
    await page.evaluate(REMPLIR);
    await page.evaluate(() => { __evts.length = 0; });
    await ctx.setOffline(true); await page.waitForTimeout(150);
    const e1 = await page.evaluate(() => OWIdentite.etat());
    await ctx.setOffline(false); await page.waitForTimeout(150);
    const r = await page.evaluate(() => ({ etat: OWIdentite.etat(), evts: __evts.slice() }));
    const s = await etatStockage(page);
    return { ok: e1 === "hors-ligne" && r.etat === "connecte" && r.evts.some((e) => e.startsWith("hors-ligne")) && r.evts.some((e) => e.startsWith("en-ligne")) && s.persoRestant.length === PERSO.length, detail: e1 + " → " + r.etat + " · " + r.evts.join(",") };
  });
  await step("Gardien chargé avant le client : moi() attend que l'écran confie son client, un seul client gardé", async () => {
    const p2 = await page0(false);
    const r = await p2.evaluate(async () => { __mock.connecter(__mock.A); const pm = OWIdentite.moi(); setTimeout(() => OWIdentite.adopter(window.__client), 50);
      const m = await pm; const autre = { auth: { onAuthStateChange() {}, getSession() {} } }; OWIdentite.adopter(autre); return { m: m && m.pseudo, meme: (await OWIdentite.client()) === window.__client }; });
    await p2.close();
    return { ok: r.m === "anna" && r.meme, detail: JSON.stringify(r) };
  });
  await step("Aucune erreur JavaScript", async () => ({ ok: !errs.length, detail: errs.join(" | ").slice(0, 200) || "aucune" }));
  await browser.close(); server.close();
  const ok = results.filter(Boolean).length;
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  process.exitCode = ok === results.length ? 0 : 1;
})();

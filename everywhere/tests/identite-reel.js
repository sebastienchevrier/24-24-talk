/* 24/24 ONE WORLD — essais du gardien OWIdentite avec la VRAIE bibliothèque supabase-js 2.117.2 (OW-012, lot 4). © 2026 Sébastien Chevrier.
   Deux modes :
   - local (par défaut) : vrai supabase-js, serveur d'authentification imité dans le test (aucune sortie sur Internet).
       SB_SDK=/chemin/package/dist/umd/supabase.js node everywhere/tests/identite-reel.js
       (fichier obtenu par « npm pack @supabase/supabase-js@2.117.2 » ; son empreinte doit être celle de la page, sinon le navigateur le refuse)
   - TEST : vrai supabase-js contre la base TEST tbynnefrrxzxufcptijc (jamais la PROD, refusée par la page et par ce script).
       OW_REEL=TEST SB_SDK=... node everywhere/tests/identite-reel.js
       Crée 1 compte ANONYME sur TEST à chaque passage (déconnecté à la fin). Ne touche à aucune table. Ne crée aucun profil.
       Les essais qui demandent une fausse panne serveur ne tournent qu'en mode local (signalés « NON EXÉCUTÉ » sur TEST). */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const SITE = path.resolve(__dirname, "..", ".."), BASE = "/24-24-talk/";
const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js";
const SDK_FILE = process.env.SB_SDK || "";
const MODE = process.env.OW_REEL === "TEST" ? "TEST" : "local";
const TEST_URL = "https://tbynnefrrxzxufcptijc.supabase.co", TEST_KEY = "sb_publishable_zNyy7HYlbwtdNjewaxcKdA_uF_vlskR";
const LOCAL_URL = "https://essai-local.supabase.co", LOCAL_KEY = "sb_publishable_essai_local";
if (!SDK_FILE || !fs.existsSync(SDK_FILE)) { console.log("NON EXÉCUTÉ : indiquer le vrai fichier supabase.js dans SB_SDK (npm pack @supabase/supabase-js@2.117.2)."); process.exit(2); }
const SDK = fs.readFileSync(SDK_FILE);

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (!u.pathname.startsWith(BASE)) { res.writeHead(404); return res.end(); }
  const p = path.join(SITE, decodeURIComponent(u.pathname.slice(BASE.length)));
  if (!p.startsWith(SITE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": p.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8" });
  fs.createReadStream(p).pipe(res);
});
const results = [];
function rec(n, ok, d) { results.push(ok); console.log((ok ? "OK   " : "ÉCHEC") + "  " + n + (d ? "  — " + d : "")); }
async function step(n, fn, seulementLocal) {
  if (seulementLocal && MODE !== "local") { console.log("NON EXÉCUTÉ  " + n + "  — mode local seulement"); return; }
  try { const r = await fn(); rec(n, r.ok, r.detail); } catch (e) { rec(n, false, String(e.message || e).split("\n")[0]); }
}

// ---- Serveur d'authentification imité (mode local) : réponses au format GoTrue / PostgREST ----
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const F = { users: {}, profils: {}, refresh: {}, panne: null, n: 0 };
function jeton(u) { const exp = Math.floor(Date.now() / 1000) + 3600;
  return b64({ alg: "HS256", typ: "JWT" }) + "." + b64({ sub: u.id, exp, iat: exp - 3600, role: "authenticated", aud: "authenticated", is_anonymous: u.is_anonymous, session_id: "s" + (++F.n) }) + ".x"; }
function session(u) { const r = "r" + (++F.n); F.refresh[r] = u.id; const at = jeton(u);
  return { access_token: at, refresh_token: r, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: u }; }
function nouvelUtilisateur(o) { const id = "00000000-0000-4000-8000-" + String(++F.n).padStart(12, "0");
  const u = Object.assign({ id, aud: "authenticated", role: "authenticated", email: "", phone: "", is_anonymous: true, email_confirmed_at: null,
    app_metadata: {}, user_metadata: {}, identities: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, o || {});
  F.users[id] = u; return u; }
async function imiter(route) {
  const req = route.request(), u = new URL(req.url()), m = req.method();
  const json = (status, body) => route.fulfill({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === undefined ? "" : JSON.stringify(body) });
  if (m === "OPTIONS") return route.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*" } });
  if (F.panne === "reseau") return route.abort("internetdisconnected");
  const p = u.pathname;
  if (p === "/auth/v1/signup" && m === "POST") return json(200, session(nouvelUtilisateur()));
  if (p === "/auth/v1/token") {
    const corps = JSON.parse(req.postData() || "{}");
    if (u.searchParams.get("grant_type") === "refresh_token") {
      if (F.panne === "revoque" || !F.refresh[corps.refresh_token]) return json(400, { code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token: Refresh Token Not Found" });
      const id = F.refresh[corps.refresh_token]; delete F.refresh[corps.refresh_token]; return json(200, session(F.users[id]));
    }
    if (u.searchParams.get("grant_type") === "password") { const x = Object.values(F.users).find((v) => v.email === corps.email); return x ? json(200, session(x)) : json(400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" }); }
  }
  if (p === "/auth/v1/logout") return route.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
  if (p === "/auth/v1/user" && m === "GET") { const id = JSON.parse(Buffer.from((req.headers()["authorization"] || "").split(".")[1] || "", "base64url").toString() || "{}").sub; return F.users[id] ? json(200, F.users[id]) : json(401, { msg: "invalid JWT" }); }
  if (p === "/rest/v1/profiles" && m === "GET") {
    const id = (u.searchParams.get("id") || "").replace(/^eq\./, ""), row = F.profils[id];
    const unObjet = /vnd\.pgrst\.object/.test(req.headers()["accept"] || "");
    if (unObjet) return row ? json(200, row) : json(406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: "The result contains 0 rows" });
    return json(200, row ? [row] : []);
  }
  return json(404, { msg: "non imité : " + m + " " + p });
}

const PERSO = ["lc_net_joined", "lc_home_name", "lc_signup", "lc_photos_v1", "lc_hidden_msgs", "ow_profile_v1", "lc_cleared_c1"];
const APPAREIL = ["lc_uilang", "ew_prefs", "ew_tr_v1"];
const REMPLIR = (cles) => { cles.forEach((k) => localStorage.setItem(k, "x")); };
const ETAT = (cles) => ({ perso: cles[0].filter((k) => localStorage.getItem(k) !== null), appareil: cles[1].filter((k) => localStorage.getItem(k) !== null), session: !!localStorage.getItem("lc_net_auth") });

(async () => {
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  const port = server.address().port, URL_ = MODE === "TEST" ? TEST_URL : LOCAL_URL, KEY = MODE === "TEST" ? TEST_KEY : LOCAL_KEY;
  if (/wsgcumnaltdinchsdovs/.test(URL_)) throw new Error("PROD refusée");
  console.log("Mode : " + MODE + " · base : " + URL_ + " · supabase-js : " + SDK_FILE);
  const browser = await chromium.launch(), ctx = await browser.newContext();
  await ctx.route(SDK_URL, (r) => r.fulfill({ status: 200, contentType: "text/javascript", headers: { "Access-Control-Allow-Origin": "*" }, body: SDK }));
  if (MODE === "local") await ctx.route(LOCAL_URL + "/**", imiter);
  const errs = [];
  const ouvrir = async () => { const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
    await p.goto("http://127.0.0.1:" + port + BASE + "everywhere/tests/identite-reel.html?url=" + encodeURIComponent(URL_) + "&key=" + encodeURIComponent(KEY));
    await p.waitForFunction(() => window.OWIdentite && window.__client); return p; };
  const page = await ouvrir();
  const cles = [PERSO, APPAREIL];

  await step("Vraie bibliothèque chargée (empreinte SRI acceptée) et adoptée par le gardien", async () => {
    const r = await page.evaluate(async () => ({ lib: typeof window.supabase.createClient, meme: (await OWIdentite.client()) === window.__client }));
    return { ok: r.lib === "function" && r.meme, detail: JSON.stringify(r) };
  });
  await step("Page d'essai : une adresse PROD est refusée", async () => {
    const p = await ctx.newPage(); await p.goto("http://127.0.0.1:" + port + BASE + "everywhere/tests/identite-reel.html?url=" + encodeURIComponent("https://wsgcumnaltdinchsdovs.supabase.co") + "&key=x");
    const r = await p.evaluate(() => ({ refus: !!document.getElementById("refus"), client: !!window.__client })); await p.close();
    return { ok: r.refus && !r.client, detail: JSON.stringify(r) };
  });
  await step("Sans session (événement INITIAL_SESSION réel) : moi() = null, état « deconnecte »", async () => {
    const r = await page.evaluate(async () => [await OWIdentite.moi(), OWIdentite.etat()]);
    return { ok: r[0] === null && r[1] === "deconnecte", detail: JSON.stringify(r) };
  });
  await step("Compte anonyme réel (signInAnonymously) : événement « connexion », pas de profil → « sans-profil », jamais e-mail confirmé", async () => {
    const r = await page.evaluate(async () => { __evts.length = 0; const x = await __client.auth.signInAnonymously(); if (x.error) throw x.error;
      await new Promise((ok) => setTimeout(ok, 50)); const m = await OWIdentite.moi(); const s = (await __client.auth.getSession()).data.session;
      return { m, etat: OWIdentite.etat(), evts: __evts.slice(), anonyme: s && s.user.is_anonymous, confirme: !!(s && s.user.email_confirmed_at) }; });
    return { ok: r.m === null && r.etat === "sans-profil" && r.evts.includes("connexion") && r.anonyme === true && !r.confirme, detail: JSON.stringify(r) };
  });
  await step("Jeton renouvelé (TOKEN_REFRESHED réel) : aucun ménage, aucun événement de compte", async () => {
    await page.evaluate(REMPLIR, PERSO.concat(APPAREIL));
    const r = await page.evaluate(async () => { __evts.length = 0; const x = await __client.auth.refreshSession(); if (x.error) throw x.error; await new Promise((ok) => setTimeout(ok, 50)); return __evts.slice(); });
    const s = await page.evaluate(ETAT, cles);
    return { ok: !r.length && s.perso.length === PERSO.length && s.session, detail: "événements : " + (r.join(",") || "aucun") + " · perso gardé " + s.perso.length + "/" + PERSO.length };
  });
  await step("Renouvellement impossible faute de réseau : session et données gardées (pas de ménage sur une simple erreur réseau)", async () => {
    F.panne = "reseau";
    const r = await page.evaluate(async () => { __evts.length = 0; const x = await __client.auth.refreshSession(); await new Promise((ok) => setTimeout(ok, 100)); return { err: x.error && (x.error.name || x.error.message), evts: __evts.slice() }; });
    F.panne = null;
    const s = await page.evaluate(ETAT, cles);
    return { ok: !!r.err && !r.evts.includes("expiration") && s.perso.length === PERSO.length && s.session, detail: JSON.stringify(r) + " · perso " + s.perso.length + "/" + PERSO.length + " · session " + s.session };
  }, true);
  await step("Session révoquée par le serveur, vue à l'ouverture (jeton expiré + refresh_token_not_found réel) : supabase-js efface la session → aucun compte affiché, ménage, réglages gardés", async () => {
    await page.evaluate(async () => { const x = await __client.auth.signInAnonymously(); if (x.error) throw x.error; await OWIdentite.moi(); });
    await page.evaluate(REMPLIR, PERSO.concat(APPAREIL));
    // Jeton marqué expiré sur le téléphone, serveur qui refuse le renouvellement (session révoquée ailleurs).
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("lc_net_auth")); s.expires_at = Math.floor(Date.now() / 1000) - 60; localStorage.setItem("lc_net_auth", JSON.stringify(s)); });
    F.panne = "revoque";
    const p2 = await ouvrir();
    await p2.evaluate(async () => { await OWIdentite.moi().catch(() => null); });
    await p2.waitForTimeout(300);
    const r = await p2.evaluate(() => ({ evts: __evts.slice(), etat: OWIdentite.etat() }));
    F.panne = null;
    const s = await p2.evaluate(ETAT, cles); await p2.close();
    return { ok: r.etat !== "connecte" && r.etat !== "sans-profil" && !s.perso.length && s.appareil.length === APPAREIL.length && !s.session, detail: JSON.stringify(r) + " · perso restant : " + (s.perso.join(",") || "rien") + " · session " + s.session };
  }, true);
  await step("Renouvellement refusé sur demande explicite (refreshSession) : supabase-js GARDE la session → le gardien n'efface rien (constat sur la vraie bibliothèque)", async () => {
    await page.evaluate(async () => { const x = await __client.auth.signInAnonymously(); if (x.error) throw x.error; await OWIdentite.moi(); });
    await page.evaluate(REMPLIR, PERSO.concat(APPAREIL));
    F.panne = "revoque";
    const r = await page.evaluate(async () => { __evts.length = 0; const x = await __client.auth.refreshSession(); await new Promise((ok) => setTimeout(ok, 150)); return { evts: __evts.slice(), err: x.error && x.error.code }; });
    F.panne = null;
    const s = await page.evaluate(ETAT, cles);
    return { ok: r.err === "refresh_token_not_found" && !r.evts.length && s.session && s.perso.length === PERSO.length, detail: JSON.stringify(r) + " · session " + s.session };
  }, true);
  await step("E-mail confirmé (email_confirmed_at réel dans la session) : emailConfirme = true", async () => {
    const U = nouvelUtilisateur({ email: "d@exemple.org", is_anonymous: false, email_confirmed_at: "2026-10-30T10:00:00Z" }); F.profils[U.id] = { id: U.id, pseudo: "dina", nom: "Dina", lang: "es" };
    const r = await page.evaluate(async () => { const x = await __client.auth.signInWithPassword({ email: "d@exemple.org", password: "essai" }); if (x.error) throw x.error; const m = await OWIdentite.moi(); return m && [m.pseudo, m.email, m.emailConfirme]; });
    return { ok: r && r[0] === "dina" && r[2] === true, detail: JSON.stringify(r) };
  }, true);
  await step("E-mail présent mais NON confirmé (email_confirmed_at vide) : emailConfirme = false", async () => {
    const U = nouvelUtilisateur({ email: "e@exemple.org", is_anonymous: false, email_confirmed_at: null }); F.profils[U.id] = { id: U.id, pseudo: "eli", nom: "Eli", lang: "en" };
    const r = await page.evaluate(async () => { __evts.length = 0; const x = await __client.auth.signInWithPassword({ email: "e@exemple.org", password: "essai" }); if (x.error) throw x.error; await new Promise((ok) => setTimeout(ok, 50)); const m = await OWIdentite.moi(); return { m: m && [m.pseudo, m.emailConfirme], evts: __evts.slice() }; });
    return { ok: r.m && r.m[0] === "eli" && r.m[1] === false && r.evts.includes("changement-de-compte"), detail: JSON.stringify(r) };
  }, true);
  await step("Déconnexion dans un AUTRE onglet (vrai signOut) : cet onglet voit la fin, fait le ménage, annonce « expiration »", async () => {
    if (MODE === "TEST") await page.evaluate(async () => { if (!(await __client.auth.getSession()).data.session) { const x = await __client.auth.signInAnonymously(); if (x.error) throw x.error; } });
    const p2 = await ouvrir();
    await page.evaluate(async () => { await OWIdentite.moi(); __evts.length = 0; });
    await page.evaluate(REMPLIR, PERSO.concat(APPAREIL));
    const out = await p2.evaluate(async () => { const x = await __client.auth.signOut(); return x.error ? String(x.error.message) : "ok"; });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ evts: __evts.slice(), etat: OWIdentite.etat() }));
    const s = await page.evaluate(ETAT, cles); await p2.close();
    return { ok: out === "ok" && r.evts.includes("expiration") && !s.perso.length && s.appareil.length === APPAREIL.length && !s.session, detail: out + " · " + JSON.stringify(r) + " · perso restant : " + (s.perso.join(",") || "rien") };
  });
  await step("Aucune erreur JavaScript", async () => ({ ok: !errs.length, detail: errs.join(" | ").slice(0, 200) || "aucune" }));
  await browser.close(); server.close();
  const ok = results.filter(Boolean).length;
  console.log("\n" + ok + " / " + results.length + " tests réussis (mode " + MODE + ")");
  process.exitCode = ok === results.length ? 0 : 1;
})();

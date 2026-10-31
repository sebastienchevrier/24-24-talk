/* 24/24 ONE WORLD 0.7.0 — tests automatiques : profil linguistique, parcours Voyage, AI LAB, contraste de TALK.
   Playwright + Chromium, site servi en local, Supabase remplacé par tests/fake-supabase.js, service de traduction imité.
   Aucun accès Internet. Lancement : node everywhere/tests/profil-voyage.js   (axe-core facultatif : AXE=<chemin>/axe.min.js) */
const path = require("path");
const fs = require("fs");
const http = require("http");
let pw;
try { pw = require("playwright"); } catch (e) { pw = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright"); }
const { chromium } = pw;

const SITE = path.resolve(__dirname, "../..");
const BASE = "/24-24-talk/";
const OUT = process.env.EW_OUT || path.join(__dirname, "resultats");
const FAKE = fs.readFileSync(path.join(__dirname, "fake-supabase.js"), "utf8");
let AXE = process.env.AXE || null;
if (!AXE) { try { AXE = require.resolve("axe-core/axe.min.js"); } catch (e) { AXE = null; } }
const AXE_SRC = AXE ? fs.readFileSync(AXE, "utf8") : null;
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".webmanifest": "application/manifest+json" };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (!u.pathname.startsWith(BASE)) { res.writeHead(404); return res.end(); }
  let p = path.join(SITE, decodeURIComponent(u.pathname.slice(BASE.length)));
  if (!p.startsWith(SITE)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!fs.existsSync(p)) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});

const results = [];
function rec(name, ok, detail) { results.push({ name, ok: !!ok, detail: detail || "" }); console.log((ok ? "OK   " : "ÉCHEC") + "  " + name + (detail ? "  — " + detail : "")); }
async function step(name, fn) { try { const r = await fn(); rec(name, r === undefined ? true : r.ok, r && r.detail); } catch (e) { rec(name, false, String(e && e.message || e).split("\n")[0]); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port;
  const URL_EW = ORIGIN + BASE + "everywhere/";
  const browser = await chromium.launch();
  { const nc = browser.newContext.bind(browser); browser.newContext = async (o) => { const c = await nc(o); await c.addInitScript(() => { window.EW_PORTAL_HOME = true; try { if (!localStorage.getItem("e2e_seeded")) { localStorage.setItem("e2e_seeded", "1"); if (localStorage.getItem("lc_net_auth") === null) localStorage.setItem("lc_net_auth", "fake"); } } catch (e) {} }); return c; }; } // ancien accueil du portail, encore testé
  const PHONE = { viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR" };

  // mm : "ok" (traduction imitée « [ja] texte »), "quota" (quota atteint après 3 phrases), "down"
  async function ctxFor(o) {
    o = o || {};
    const ctx = await browser.newContext(Object.assign({}, PHONE, o.ctx || {}));
    // Le faux serveur remplace la vraie bibliothèque Supabase : son empreinte (SRI) ne peut pas correspondre.
    await ctx.addInitScript(() => { window.__EW_NO_SRI = true; });
    ctx._mm = { mode: o.mm || "ok", n: 0, calls: [] };
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => {
      const url = r.request().url();
      if (/supabase-js/.test(url)) return r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE });
      if (/api\.mymemory\.translated\.net/.test(url)) {
        const u = new URL(url), q = u.searchParams.get("q"), lp = u.searchParams.get("langpair");
        ctx._mm.calls.push(lp); ctx._mm.n++;
        if (ctx._mm.mode === "down") return r.fulfill({ status: 500, body: "x" });
        if (ctx._mm.mode === "quota" && ctx._mm.n > 3) return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ quotaFinished: true, responseData: { translatedText: "" } }) });
        return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ responseData: { translatedText: "[" + lp.split("|")[1] + "] " + q } }) });
      }
      return r.abort();
    });
    await ctx.addInitScript((init) => {
      if (init && !sessionStorage.getItem("__init")) {
        sessionStorage.setItem("__init", "1");
        Object.keys(init).forEach((k) => { try { localStorage.setItem(k, init[k]); } catch (e) {} });
      }
      window.__spoken = [];
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      if (window.speechSynthesis) {
        const syn = window.speechSynthesis;
        syn.getVoices = function () { return [{ name: "Google français", lang: "fr-FR", voiceURI: "g-fr" }, { name: "Google US English", lang: "en-US", voiceURI: "g-en" }]; };
        syn.speak = function (u) { window.__spoken.push({ t: u.text, l: u.lang }); setTimeout(function () { u.onend && u.onend(); }, 30); };
        syn.cancel = function () {};
      }
      window.SpeechRecognition = window.webkitSpeechRecognition = undefined;
    }, o.init || null);
    return ctx;
  }
  async function open(ctx, hash) {
    const page = await ctx.newPage();
    page._errors = [];
    page.on("pageerror", (e) => page._errors.push(String(e).split("\n")[0]));
    await page.goto(URL_EW + (hash || "#/accueil"));
    await page.waitForSelector(".view.active");
    await sleep(300);
    return page;
  }
  const ls = (page, k) => page.evaluate((k) => localStorage.getItem(k), k);
  async function axe(page) {
    if (!AXE_SRC) return null;
    await page.addScriptTag({ content: AXE_SRC });
    return page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }, resultTypes: ["violations"] });
      return r.violations.filter((v) => v.impact === "critical" || v.impact === "serious").map((v) => v.id + " " + v.nodes.slice(0, 2).map((x) => x.target.join(" ")).join(" | "));
    });
  }
  async function overflow(page) { return page.evaluate(() => document.documentElement.scrollWidth - innerWidth); }

  // =============== AI LAB ===============
  let ctx = await ctxFor({ init: { lc_net_auth: "fake" } });
  let page = await open(ctx);
  await step("AI LAB : page « Bientôt » (ouverte depuis Applications), page d'information sans aucune fonction simulée", async () => {
    await page.goto(URL_EW + "#/applications");
    await page.waitForSelector('#appList a[href="#/ailab"]');
    await page.tap('#appList a[href="#/ailab"]');
    await page.waitForSelector("#view-ailab.active");
    const r = await page.evaluate(() => ({ h: document.getElementById("h-ailab").textContent, forms: document.querySelectorAll("#view-ailab input, #view-ailab textarea, #view-ailab form").length,
      txt: document.getElementById("view-ailab").textContent }));
    return { ok: /BIENTÔT/.test(r.h) && r.forms === 0 && /Rien n'y fonctionne encore/.test(r.txt) && /propositions, non développées/.test(r.txt), detail: r.h.trim() + ", " + r.forms + " champ de saisie" };
  });
  await step("AI LAB : dans Applications avec le badge BIENTÔT ; l'ancienne adresse #/app/ailab mène à sa page", async () => {
    await page.goto(URL_EW + "#/applications");
    await page.waitForSelector("#view-applications.active");
    const card = await page.$eval('#appList a[href="#/ailab"]', (a) => a.textContent);
    await page.goto(URL_EW + "#/app/ailab");
    await page.waitForSelector("#view-ailab.active");
    return { ok: /BIENTÔT/.test(card), detail: card.replace(/\s+/g, " ").trim().slice(0, 80) };
  });
  await page.screenshot({ path: path.join(OUT, "ailab.png") });

  // =============== Profil linguistique ===============
  await step("Profil : résumé « Profil linguistique » en tête, invitation à le créer (rien n'existe encore)", async () => {
    await page.goto(URL_EW + "#/profil");
    await page.waitForSelector("#lpSummary #lpOpen");
    const first = await page.evaluate(() => document.querySelector("#profileMain .card").id);
    const txt = await page.textContent("#lpSummary");
    return { ok: first === "lpSummary" && /Créer mon profil linguistique/.test(txt), detail: txt.replace(/\s+/g, " ").trim().slice(0, 90) };
  });
  await step("Profil linguistique : privé par défaut (sauvegarde sur le compte désactivée, personne ne voit mes langues)", async () => {
    await page.tap("#lpSummary #lpOpen");
    await page.waitForSelector("#lpSave");
    const r = await page.evaluate(() => ({ sync: document.getElementById("lpSync").getAttribute("aria-checked"), priv: document.querySelector('input[name="lpVis"][value="private"]').checked,
      contactsDisabled: document.querySelector('input[name="lpVis"][value="contacts"]').disabled, native: document.getElementById("lpNative").value, title: document.title }));
    return { ok: r.sync === "false" && r.priv && r.contactsDisabled && r.native === "fr" && /Profil linguistique/.test(r.title), detail: JSON.stringify(r) };
  });
  await step("Profil linguistique : langues parlées et niveaux, favorites, voix, lecture, accessibilité, communication, puis Enregistrer", async () => {
    await page.selectOption("#lpAddSel", "en"); await page.tap("#lpAddBtn");
    await page.selectOption('[data-level="0"]', "B1");
    await page.selectOption("#lpAddSel", "es"); await page.tap("#lpAddBtn");
    await page.selectOption('[data-level="1"]', "A2");
    await page.selectOption("#lpAddSel", "es"); await page.tap("#lpAddBtn"); // doublon refusé
    const dup = await page.textContent("#lpLangMsg");
    await page.tap('[data-fav="en"]');
    await page.selectOption("#lpFavAdd", "ja");
    await page.$eval("#lpRate", (r) => { r.value = "90"; r.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.tap('[data-seg="Ma vitesse de lecture"][data-v="slow"]');
    await page.tap('[data-seg="Taille du texte"][data-v="1"]');
    await page.tap("#lpContrast");
    await page.tap('[data-seg="Je préfère"][data-v="text"]');
    await page.tap("#lpHands");
    await page.fill("#lpName", "Seb");
    await page.tap("#lpSave");
    await page.waitForSelector("#lpMsg .cx-msg");
    const msg = await page.textContent("#lpMsg");
    const p = JSON.parse(await ls(page, "ow_profile_v1"));
    const prefs = JSON.parse(await ls(page, "ew_prefs"));
    const tr = JSON.parse(await ls(page, "ew_tr_v1"));
    const log = await ls(page, "fake_lp_log");
    const ok = /Enregistré sur cet appareil\./.test(msg) && p.native === "fr" && p.spoken.length === 2 && p.spoken[0].code === "en" && p.spoken[0].level === "B1" && p.spoken[1].level === "A2" &&
      p.favorites.join() === "en,ja" && p.rate === 0.9 && p.reading === "slow" && p.prefer === "text" && p.name === "Seb" && p.sync === false && p.visibility === "private" &&
      prefs.text === 1 && prefs.contrast === true && tr.me === "fr" && tr.rate === 0.9 && tr.hands === true && /déjà dans la liste/.test(dup) && !log;
    return { ok, detail: msg.trim() + " · rien envoyé au serveur : " + !log };
  });
  await step("Profil linguistique : résumé à jour et gardé après rechargement", async () => {
    await page.goto(URL_EW + "#/accueil");
    await page.reload();
    await page.goto(URL_EW + "#/profil");
    await page.waitForSelector("#lpSummary .lp-priv");
    const txt = (await page.textContent("#lpSummary")).replace(/\s+/g, " ");
    return { ok: /Langue maternelle : 🇫🇷 Français/.test(txt) && /Anglais B1, Espagnol A2/.test(txt) && /Privé : sur cet appareil seulement/.test(txt), detail: txt.trim().slice(0, 140) };
  });
  await step("Appliqué dans EVERYWHERE : favorites en tête des listes de langues, claviers ouverts (« Écrire »), 2 phrases visibles (lecture lente)", async () => {
    await page.goto(URL_EW + "#/everywhere/langues");
    await page.waitForSelector("#trOther");
    const groups = await page.$$eval("#trOther optgroup", (g) => g.map((x) => x.label + ":" + [...x.querySelectorAll("option")].map((o) => o.value).join(",")));
    await page.goto(URL_EW + "#/everywhere/face");
    await page.waitForSelector("#trFace");
    const kb = await page.$$eval("form.tr-type", (f) => f.map((x) => x.hidden));
    for (const w of ["Un", "Deux", "Trois"]) { await page.fill('[data-input="1"]', w); await page.press('[data-input="1"]', "Enter"); await sleep(150); }
    await sleep(400);
    const lines = await page.$$eval('[data-log="1"] .tr-line', (n) => n.length);
    return { ok: groups[0] === "★ Favorites:en,ja" && kb.every((h) => h === false) && lines === 2, detail: groups[0] + " · claviers ouverts : " + kb.join("/") + " · lignes : " + lines };
  });
  await step("Accessibilité du profil appliquée à tout ONE WORLD (taille du texte, contraste)", async () => {
    const r = await page.evaluate(() => ({ ts: document.documentElement.getAttribute("data-ts"), hc: document.documentElement.classList.contains("contrast-high") }));
    return { ok: r.ts === "1" && r.hc, detail: JSON.stringify(r) };
  });
  await step("Saisie hostile : nom affiché avec < > refusé avec un message ; rien n'est enregistré", async () => {
    await page.goto(URL_EW + "#/profil/linguistique");
    await page.waitForSelector("#lpSave");
    await page.fill("#lpName", "<img src=x onerror=window.__xss=1>");
    await page.tap("#lpSave");
    await page.waitForSelector("#lpMsg .cx-msg.err");
    const p = JSON.parse(await ls(page, "ow_profile_v1"));
    return { ok: p.name === "Seb" && !(await page.evaluate(() => window.__xss)), detail: (await page.textContent("#lpMsg")).trim() };
  });
  await step("Effacer mon profil linguistique : deux appuis, effacé de l'appareil", async () => {
    await page.goto(URL_EW + "#/profil/linguistique");
    await page.waitForSelector("#lpErase");
    await page.tap("#lpErase");
    const first = await ls(page, "ow_profile_v1");
    await page.tap("#lpErase");
    await page.waitForSelector("#lpMsgTop .cx-msg");
    return { ok: !!first && !(await ls(page, "ow_profile_v1")), detail: (await page.textContent("#lpMsgTop")).trim() };
  });
  await ctx.close();

  await step("Sauvegarde sur le compte (choix explicite + case d'accord obligatoire) : envoyée au serveur ; visible par mes contacts seulement si je le choisis ; arrêt = copie du compte supprimée", async () => {
    const c = await ctxFor({ init: { lc_net_auth: "fake" } });
    const pg = await open(c, "#/profil/linguistique");
    await pg.waitForSelector("#lpSave");
    await pg.tap("#lpSync");
    const enabled = await pg.$eval('input[name="lpVis"][value="contacts"]', (r) => !r.disabled);
    await pg.check('input[name="lpVis"][value="contacts"]');
    // Sans la case d'accord cochée : refusé, rien n'est envoyé.
    await pg.tap("#lpSave");
    await pg.waitForSelector("#lpMsg .cx-msg.err");
    const refused = /Cochez la case/.test(await pg.textContent("#lpMsg")) && !(await ls(pg, "fake_lp"));
    await pg.check("#lpConsent");
    await pg.tap("#lpSave");
    await pg.waitForSelector("#lpMsg .cx-msg.ok");
    const msg1 = await pg.textContent("#lpMsg");
    const row = JSON.parse(await ls(pg, "fake_lp"));
    await pg.goto(URL_EW + "#/profil/linguistique");
    await pg.waitForSelector("#lpSave");
    await pg.tap("#lpSync");
    const fallback = await pg.$eval('input[name="lpVis"][value="private"]', (r) => r.checked);
    await pg.tap("#lpSave");
    await sleep(400);
    const log = JSON.parse(await ls(pg, "fake_lp_log")).map((x) => x.op).join(",");
    const left = await ls(pg, "fake_lp");
    await c.close();
    const ok = refused && enabled && /et sur votre compte/.test(msg1) && row.visibility === "contacts" && row.native_lang === "fr" && row.user_id && !("email" in row) &&
      fallback && log === "upsert,delete" && !left;
    return { ok, detail: "refus sans accord : " + refused + " · ligne envoyée : " + Object.keys(row).filter((k) => k !== "updated_at").join(",") + " · journal : " + log };
  });
  // Depuis le 19 oct. 2026 (« tout avec compte »), sans compte le portail n'ouvre que l'inscription : plus de profil sans compte.
  await step("Sans compte : le profil linguistique renvoie vers l'inscription (tout avec compte)", async () => {
    const c = await ctxFor({});
    const pg = await open(c, "#/accueil");
    await pg.evaluate(() => { localStorage.setItem("fake_sb", JSON.stringify({ session: false, email: "", new_email: "", anon: true, pending: "", devices: [] })); localStorage.setItem("lc_net_auth", ""); });
    await pg.goto(URL_EW + "#/profil/linguistique");
    await pg.waitForURL(/24-24-talk\/index\.html/, { timeout: 15000 });
    await pg.waitForSelector("#net.view.active", { timeout: 15000 });
    await c.close();
    return { ok: true, detail: "renvoyé vers l'inscription" };
  });
  await step("Nouvel appareil : le profil sauvegardé sur le compte est retrouvé", async () => {
    const row = { user_id: "00000000-0000-4000-8000-0000000000aa", display_name: "Seb", native_lang: "fr", spoken: [{ code: "de", level: "B2" }], ui_lang: "auto", favorites: ["de"],
      prefs: { rate: 1.1, reading: "fast", prefer: "voice" }, visibility: "private", updated_at: "2026-10-04T10:00:00Z" };
    const c = await ctxFor({ init: { lc_net_auth: "fake", fake_lp: JSON.stringify(row) } });
    const pg = await open(c, "#/profil/linguistique");
    await pg.waitForSelector("#lpMsgTop .cx-msg", { timeout: 8000 });
    const p = JSON.parse(await ls(pg, "ow_profile_v1"));
    await c.close();
    return { ok: p.native === "fr" && p.spoken[0].code === "de" && p.sync === true && p.reading === "fast", detail: "allemand B2, lecture rapide, sauvegarde activée" };
  });
  await step("Compte injoignable pendant la sauvegarde : gardé sur l'appareil, message clair", async () => {
    const c = await ctxFor({ init: { lc_net_auth: "fake", fake_lp_fail: "1" } });
    const pg = await open(c, "#/profil/linguistique");
    await pg.waitForSelector("#lpSave");
    await pg.tap("#lpSync");
    await pg.check("#lpConsent");
    await pg.tap("#lpSave");
    await pg.waitForSelector("#lpMsg .cx-msg.err");
    const m = await pg.textContent("#lpMsg");
    const saved = !!(await ls(pg, "ow_profile_v1"));
    await c.close();
    return { ok: saved && /Enregistré sur cet appareil\. Le compte n'a pas pu/.test(m), detail: m.trim() };
  });
  await step("Profil abîmé ou piégé dans le stockage : tous les écrans s'ouvrent, rien ne s'exécute", async () => {
    const bad = ["{pas du json", "null", "[1,2]", JSON.stringify({ native: "<script>", spoken: [{ code: "en", level: "<b>" }, "x", null, { code: "zz" }], favorites: ["en", "<img src=x onerror=window.__xss=1>"], name: "<img src=x onerror=window.__xss=1>", rate: "vite", reading: 5 })];
    const errs = [];
    for (const b of bad) {
      const c = await ctxFor({ init: { ow_profile_v1: b, lc_net_auth: "fake" } });
      const pg = await open(c, "#/profil");
      for (const h of ["#/profil", "#/profil/linguistique", "#/everywhere/langues", "#/everywhere/voyage", "#/everywhere/face"]) { await pg.goto(URL_EW + h); await sleep(250); }
      if (pg._errors.length) errs.push(b.slice(0, 20) + " : " + pg._errors.join(" | "));
      if (await pg.evaluate(() => window.__xss)) errs.push("XSS");
      await c.close();
    }
    return { ok: !errs.length, detail: errs.join(" ; ") || "4 réglages abîmés, aucune erreur" };
  });

  // =============== EVERYWHERE : langues visibles des contacts ===============
  await step("Appeler sur TALK : les langues qu'un contact a choisi de montrer s'affichent (@maria), rien pour un contact privé (@kenji)", async () => {
    const c = await ctxFor({ init: { lc_net_auth: "fake", fake_contacts: "1" } });
    const pg = await open(c, "#/everywhere/appel");
    await pg.waitForSelector(".tr-ct");
    const rows = await pg.$$eval(".tr-ct", (n) => n.map((x) => x.textContent.replace(/\s+/g, " ").trim()));
    await c.close();
    const maria = rows.find((r) => /@?maria/.test(r)) || "", kenji = rows.find((r) => /@?kenji/.test(r)) || ""; // noms sans @ depuis le 20 oct. 2026
    return { ok: /Parle aussi Français, Anglais/.test(maria) && !/Parle aussi/.test(kenji), detail: maria + " | " + kenji };
  });

  // =============== Voyage ===============
  ctx = await ctxFor({ init: { lc_net_auth: "fake" } });
  page = await open(ctx, "#/everywhere");
  await step("EVERYWHERE : entrée « Voyage » à l'accueil, écran Voyage avec préparation, situations et limites hors connexion", async () => {
    await page.tap("#trGoTrip");
    await page.waitForSelector("#vyDest");
    const r = await page.evaluate(() => ({ dest: document.getElementById("vyDest").value, st: document.getElementById("vyStatus").textContent, cats: document.querySelectorAll("[data-cat]").length,
      ph: document.querySelectorAll(".vy-ph").length, low: document.querySelector(".vy-low").textContent }));
    return { ok: r.dest === "en" && /Phrases intégrées/.test(r.st) && r.cats === 7 && r.ph === 7 && /Besoin d'Internet : traduire une phrase nouvelle/.test(r.low), detail: r.cats + " situations, " + r.ph + " phrases (Essentiel)" };
  });
  await page.screenshot({ path: path.join(OUT, "voyage.png") });
  await step("TRAVEL : « Réserver mon voyage » avec 4 partenaires (hôtel, eSIM, assurance, activités), liens sûrs et signalés", async () => {
    const r = await page.evaluate(() => [...document.querySelectorAll(".vy-bk")].map((a) => ({ id: a.dataset.partner, href: a.href, rel: a.rel, tgt: a.target })));
    const note = await page.textContent(".vy-book .note");
    await page.locator(".vy-book").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUT, "travel.png") });
    const ok = r.length === 4 && r.every((x) => /^https:\/\//.test(x.href) && /sponsored/.test(x.rel) && /noopener/.test(x.rel) && x.tgt === "_blank") && /commission/.test(note);
    return { ok, detail: r.map((x) => x.id).join(", ") };
  });
  await step("Voyage : changer de situation (Restaurant), écouter une phrase dans la langue du pays", async () => {
    await page.tap('[data-cat="resto"]');
    const first = (await page.textContent(".vy-ph .vy-there")).trim();
    await page.tap(".vy-ph [data-say]");
    await sleep(150);
    const spoken = await page.evaluate(() => window.__spoken.slice(-1)[0]);
    return { ok: first === "A table for two, please" && spoken && spoken.t === first && /^en/.test(spoken.l), detail: first + " → voix " + (spoken && spoken.l) };
  });
  await step("Voyage : « Montrer » affiche la phrase en très grand ; Échap ferme et rend le focus", async () => {
    await page.tap(".vy-ph [data-big]");
    await page.waitForSelector("#vyBig");
    const r = await page.evaluate(() => ({ txt: document.getElementById("vyBigTxt").textContent, fs: parseFloat(getComputedStyle(document.getElementById("vyBigTxt")).fontSize), modal: document.getElementById("vyBig").getAttribute("aria-modal") }));
    await page.keyboard.press("Escape");
    const back = await page.evaluate(() => !document.getElementById("vyBig") && document.activeElement && document.activeElement.hasAttribute("data-big"));
    return { ok: r.fs >= 30 && r.modal === "true" && back, detail: r.txt + " · " + r.fs + " px" };
  });
  await step("Voyage, hors connexion : les phrases intégrées restent affichées, l'état « Hors connexion » est annoncé", async () => {
    await ctx.setOffline(true);
    await page.goto(URL_EW + "#/everywhere/voyage");
    await page.waitForSelector(".vy-ph");
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    const r = await page.evaluate(() => ({ net: document.getElementById("vyNet").textContent, n: document.querySelectorAll(".vy-ph .vy-there").length, t: document.querySelector(".vy-there").textContent }));
    await ctx.setOffline(false);
    return { ok: /Hors connexion/.test(r.net) && r.n > 0 && !/Pas encore traduite/.test(r.t), detail: r.net + " · " + r.t };
  });
  await step("Voyage, japonais (non intégré) : avec Internet, les phrases se traduisent toutes seules (sans appuyer sur « Préparer ») puis restent hors connexion", async () => {
    await page.selectOption("#vyDest", "ja");
    await page.waitForFunction(() => /phrases préparées le/.test(document.getElementById("vyStatus").textContent), null, { timeout: 15000 });
    const saved = JSON.parse(await ls(page, "ew_voyage_tr_ja"));
    const n = Object.keys(saved.items).length;
    const total = await page.evaluate(() => window.EW_PHRASES.list.length);
    await ctx.setOffline(true);
    await page.goto(URL_EW + "#/everywhere/voyage");
    await page.waitForSelector(".vy-ph");
    const off = await page.textContent(".vy-there");
    await ctx.setOffline(false);
    return { ok: n === total && /^\[ja\] /.test(off.trim()), detail: n + "/" + total + " phrases gardées ; hors connexion : " + off.trim() };
  });
  await step("Voyage : « Parler avec quelqu'un sur place » ouvre le côte à côte avec la langue du pays", async () => {
    await page.goto(URL_EW + "#/everywhere/voyage");
    await page.waitForSelector("#vyTalk");
    await page.tap("#vyTalk");
    await page.waitForSelector("#trFace");
    const v = await page.$eval('[data-lang-of="2"]', (s) => s.value);
    return { ok: v === "ja", detail: "personne en face : " + v };
  });
  await step("Voyage : « Ajouter aux favorites » met la langue du pays dans le profil linguistique", async () => {
    await page.goto(URL_EW + "#/everywhere/voyage");
    await page.waitForSelector("#vyFav");
    await page.tap("#vyFav");
    await sleep(150);
    const p = JSON.parse(await ls(page, "ow_profile_v1"));
    return { ok: p.favorites.indexOf("ja") !== -1 && !(await page.$("#vyFav")), detail: "favorites : " + p.favorites.join(",") };
  });
  await ctx.close();
  await step("Voyage, quota du service gratuit atteint pendant la préparation : message clair, phrases déjà traduites gardées", async () => {
    const c = await ctxFor({ mm: "quota", init: { ew_voyage_v1: JSON.stringify({ dest: "ko" }) } });
    const pg = await open(c, "#/everywhere/voyage");
    await pg.waitForSelector("#vyPrep");
    await pg.tap("#vyPrep");
    await pg.waitForFunction(() => /Limite quotidienne/.test((document.getElementById("vyMsg") || {}).textContent || ""), null, { timeout: 10000 });
    const m = await pg.textContent("#vyMsg");
    const n = Object.keys(JSON.parse(await ls(pg, "ew_voyage_tr_ko")).items).length;
    await c.close();
    return { ok: n === 3, detail: m.trim() };
  });
  await step("Voyage en arabe : texte de droite à gauche pris en charge (dir=auto), sans débordement", async () => {
    const c = await ctxFor({ init: { ew_voyage_v1: JSON.stringify({ dest: "ar" }), ew_voyage_tr_ar: JSON.stringify({ ts: "2026-10-04T00:00:00Z", items: { b1: "مرحبا", b2: "شكرا جزيلا" } }) } });
    const pg = await open(c, "#/everywhere/voyage");
    await pg.waitForSelector(".vy-there");
    const r = await pg.evaluate(() => { const e = document.querySelector(".vy-there"); return { dir: e.getAttribute("dir"), cdir: getComputedStyle(e).direction, t: e.textContent }; });
    const ov = await overflow(pg);
    await c.close();
    return { ok: r.dir === "auto" && r.cdir === "rtl" && ov <= 1, detail: r.t + " · " + r.cdir };
  });

  // =============== Voyage : recherche, phrases favorites, langue source ===============
  await step("Voyage, recherche : sans accents ni majuscules, dans toutes les situations ; aucun résultat = message clair ; Effacer rend les situations", async () => {
    const c = await ctxFor({});
    const pg = await open(c, "#/everywhere/voyage");
    await pg.waitForSelector("#vySearch");
    await pg.fill("#vySearch", "A QUELLE heure");
    await sleep(150);
    const r1 = await pg.evaluate(() => ({ n: document.querySelectorAll(".vy-ph").length, f: document.getElementById("vyFound").textContent, tabs: document.querySelector(".vy-cats").hidden,
      t: [...document.querySelectorAll(".vy-there")].map((e) => e.textContent).join(" | ") }));
    await pg.fill("#vySearch", "pharmacy");
    await sleep(100);
    const r2 = await pg.evaluate(() => document.querySelectorAll(".vy-ph").length);
    await pg.fill("#vySearch", "zzzz");
    await sleep(100);
    const r3 = await pg.evaluate(() => ({ n: document.querySelectorAll(".vy-ph").length, f: document.getElementById("vyFound").textContent }));
    await pg.tap("#vyClear");
    const r4 = await pg.evaluate(() => ({ q: document.getElementById("vySearch").value, tabs: document.querySelector(".vy-cats").hidden, n: document.querySelectorAll(".vy-ph").length, foc: document.activeElement.id }));
    await c.close();
    return { ok: r1.n === 2 && /2 phrase/.test(r1.f) && r1.tabs === true && r2 === 1 && r3.n === 0 && /Aucune phrase ne correspond/.test(r3.f) && r4.q === "" && r4.tabs === false && r4.n === 7 && r4.foc === "vySearch",
      detail: "« A QUELLE heure » → " + r1.t + " · « zzzz » → " + r3.f };
  });
  await step("Voyage, recherche piégée (<img onerror>, 500 caractères) : affichée comme du texte, rien ne s'exécute, limitée à 60 caractères", async () => {
    const c = await ctxFor({});
    const pg = await open(c, "#/everywhere/voyage");
    await pg.waitForSelector("#vySearch");
    await pg.fill("#vySearch", "<img src=x onerror=window.__xss=1>" + "a".repeat(500));
    await sleep(150);
    const r = await pg.evaluate(() => ({ xss: !!window.__xss, img: !!document.querySelector("#vyFound img, #vyList img"), len: document.getElementById("vySearch").value.length, f: document.getElementById("vyFound").textContent }));
    await c.close();
    return { ok: !r.xss && !r.img && r.len <= 60 && /<img/.test(r.f) && !pg._errors.length, detail: "longueur gardée " + r.len + " · " + r.f.slice(0, 60) };
  });
  await step("Voyage, phrases favorites : ☆ → ★, onglet « Favorites », gardées après rechargement, retirées = message d'aide", async () => {
    const c = await ctxFor({});
    const pg = await open(c, "#/everywhere/voyage");
    await pg.waitForSelector('[data-fav="b2"]');
    await pg.tap('[data-fav="b2"]');
    await pg.tap('[data-cat="urgence"]');
    await pg.tap('[data-fav="u4"]');
    const pressed = await pg.getAttribute('[data-fav="u4"]', "aria-pressed");
    await pg.reload(); await pg.waitForSelector(".vy-ph");
    await pg.tap('[data-cat="fav"]');
    const list = await pg.$$eval("#vyList .vy-there", (n) => n.map((x) => x.textContent));
    await pg.tap('[data-fav="b2"]'); await pg.tap('[data-fav="u4"]');
    const empty = (await pg.textContent("#vyList")).trim();
    const st = JSON.parse(await ls(pg, "ew_voyage_v1"));
    await c.close();
    return { ok: pressed === "true" && list.join("|") === "Thank you very much|I need a doctor" && /Aucune phrase favorite/.test(empty) && Array.isArray(st.fav) && st.fav.length === 0,
      detail: "favorites : " + list.join(", ") };
  });
  await step("Voyage, favorites abîmées dans le stockage (ids inconnus, doublons, pas un tableau) : nettoyées, l'écran s'ouvre", async () => {
    const bad = [JSON.stringify({ fav: ["b1", "b1", "<x>", 5, "zz"], cat: "fav" }), JSON.stringify({ fav: "b1", cat: "<script>" }), "{oops"];
    const out = [];
    for (const b of bad) {
      const c = await ctxFor({ init: { ew_voyage_v1: b } });
      const pg = await open(c, "#/everywhere/voyage");
      await pg.waitForSelector("#vyList");
      out.push((await pg.$$eval("#vyList [data-fav]", (n) => n.length)) + (pg._errors.length ? " ERREUR" : ""));
      await c.close();
    }
    return { ok: out[0] === "1" && !out.join("").includes("ERREUR") && out[1] === "7" && out[2] === "7", detail: out.join(" / ") + " phrases affichées" };
  });
  await step("Voyage, langue source et langue cible au choix : espagnol → allemand, puis « Inverser » ; même langue des deux côtés = inversion", async () => {
    const c = await ctxFor({});
    const pg = await open(c, "#/everywhere/voyage");
    await pg.waitForSelector("#vySrc");
    await pg.selectOption("#vySrc", "es");
    await pg.selectOption("#vyDest", "de");
    const a = await pg.evaluate(() => [document.querySelector(".vy-there").textContent, document.querySelector(".vy-mine").textContent]);
    await pg.tap("#vySwap");
    const b = await pg.evaluate(() => [document.getElementById("vySrc").value, document.getElementById("vyDest").value, document.querySelector(".vy-there").textContent]);
    await pg.selectOption("#vySrc", "es");
    const d = await pg.evaluate(() => [document.getElementById("vySrc").value, document.getElementById("vyDest").value]);
    const tr = JSON.parse(await ls(pg, "ew_tr_v1") || "{}");
    await c.close();
    return { ok: a[0] === "Guten Tag" && a[1] === "Hola" && b.join() === "de,es,Hola" && d.join() === "es,de" && tr.me !== "es",
      detail: "es→de : " + a.join(" / ") + " · inversé : " + b.join(",") + " · réglages EVERYWHERE inchangés" };
  });

  // =============== CONNECT : se déconnecter de ce téléphone (audit du 31 oct. 2026) ===============
  await step("CONNECT, se déconnecter de ce téléphone : deux appuis, compte gardé, écran « J'ai déjà un compte » ; absent si le compte n'a pas d'e-mail", async () => {
    const sb = JSON.stringify({ session: true, email: "moi@exemple.fr", new_email: "", anon: false, pending: "", devices: [{ id: "11111111-1111-4111-8111-111111111111", appareil: "Android", depuis: new Date().toISOString(), vu: new Date().toISOString(), actuel: true }] });
    const c = await ctxFor({ init: { lc_net_auth: "fake", lc_net_joined: "1", fake_sb: sb } });
    const pg = await open(c, "#/profil");
    await pg.waitForSelector("#cxLogout", { timeout: 15000 });
    await pg.tap("#cxLogout");
    const first = { auth: await ls(pg, "lc_net_auth"), txt: (await pg.textContent("#cxLogout")).trim() };
    await pg.tap("#cxLogout");
    await pg.waitForSelector("#cxHave", { timeout: 8000 });
    const note = (await pg.textContent(".cx-msg.ok")).trim();
    const after = { auth: await ls(pg, "lc_net_auth"), joined: await ls(pg, "lc_net_joined"), st: JSON.parse(await ls(pg, "fake_sb") || "{}") };
    await c.close();
    const c2 = await ctxFor({ init: { lc_net_auth: "fake" } });
    const p2 = await open(c2, "#/profil");
    await p2.waitForSelector("#cxDelOpen", { timeout: 15000 });
    const anonBtn = await p2.$("#cxLogout");
    await c2.close();
    return { ok: first.auth === "fake" && !!first.txt && !after.auth && !after.joined && after.st.session === false && after.st.deleted !== true && /gardé/.test(note) && !anonBtn,
      detail: "1er appui : « " + first.txt + " » · après : " + note + " · sans e-mail : " + (anonBtn ? "bouton présent" : "pas de bouton") };
  });

  // =============== CONNECT : supprimer mon compte ===============
  await step("CONNECT, supprimer mon compte : explication claire, pseudo à recopier (mauvais pseudo refusé), Annuler ne fait rien", async () => {
    const c = await ctxFor({ init: { lc_net_auth: "fake" } });
    const pg = await open(c, "#/profil");
    await pg.waitForSelector("#cxDelOpen", { timeout: 15000 });
    await pg.tap("#cxDelOpen");
    const txt = await pg.textContent("#cxDelForm .cx-warn");
    await pg.fill("#cxDelName", "quelquun");
    await pg.tap("#cxDelGo");
    await pg.waitForSelector("#cxDelMsg .cx-msg");
    const wrong = await pg.textContent("#cxDelMsg");
    await pg.tap("#cxDelNo");
    const after = await pg.evaluate(() => ({ form: document.getElementById("cxDelForm").innerHTML, btn: !document.getElementById("cxDelOpen").hidden, foc: document.activeElement.id }));
    const still = JSON.parse(await ls(pg, "fake_sb") || "{}").deleted !== true && (await ls(pg, "lc_net_auth")) === "fake";
    await c.close();
    return { ok: /définitif/.test(txt) && /sebtest/.test(txt) && /ne correspond pas/.test(wrong) && after.form === "" && after.btn && after.foc === "cxDelOpen" && still, detail: wrong.trim() };
  });
  await step("CONNECT, supprimer mon compte, coupure réseau puis session révoquée : rien n'est supprimé, message clair à chaque fois", async () => {
    const out = [];
    for (const f of ["net", "auth"]) {
      const c = await ctxFor({ init: { lc_net_auth: "fake", fake_del_fail: f } });
      const pg = await open(c, "#/profil");
      await pg.waitForSelector("#cxDelOpen", { timeout: 15000 });
      await pg.tap("#cxDelOpen");
      await pg.fill("#cxDelName", "@SebTest");
      await pg.tap("#cxDelGo");
      await pg.waitForSelector("#cxDelMsg .cx-msg.err", { timeout: 8000 });
      out.push({ m: (await pg.textContent("#cxDelMsg")).trim(), auth: await ls(pg, "lc_net_auth"), en: await pg.isEnabled("#cxDelGo") });
      await c.close();
    }
    return { ok: /Pas de connexion : rien n'a été supprimé/.test(out[0].m) && /session a expiré.*rien n'a été supprimé.*Reconnectez-vous/.test(out[1].m) && out.every((o) => o.auth === "fake" && o.en),
      detail: out.map((o) => o.m).join(" | ") };
  });
  await step("CONNECT, supprimer mon compte confirmé : effacé du serveur, cet appareil déconnecté, sauvegarde du profil linguistique coupée", async () => {
    const c = await ctxFor({ init: { lc_net_auth: "fake", lc_net_joined: "1", lc_callhist_x: "[]", fake_lp: JSON.stringify({ user_id: "x", native_lang: "fr" }),
      ow_profile_v1: JSON.stringify({ native: "fr", sync: true, consent: "2026-10-04T10:00:00Z" }) } });
    const pg = await open(c, "#/profil");
    await pg.waitForSelector("#cxDelOpen", { timeout: 15000 });
    await pg.tap("#cxDelOpen");
    await pg.fill("#cxDelName", "sebtest");
    await pg.tap("#cxDelGo");
    await pg.waitForSelector("#cxCreate", { timeout: 8000 });
    const r = await pg.evaluate(() => ({ note: document.querySelector("#profileCard .cx-msg").textContent, auth: localStorage.getItem("lc_net_auth"), joined: localStorage.getItem("lc_net_joined"),
      hist: localStorage.getItem("lc_callhist_x"), lp: localStorage.getItem("fake_lp"), sync: JSON.parse(localStorage.getItem("ow_profile_v1")).sync, del: JSON.parse(localStorage.getItem("fake_sb")).deleted }));
    await c.close();
    return { ok: /a été supprimé du serveur/.test(r.note) && !r.auth && !r.joined && r.hist === null && r.lp === null && r.sync === false && r.del === true && !pg._errors.length, detail: r.note.trim() };
  });
  await step("CONNECT : déconnecter un appareil déjà retiré ailleurs → le serveur répond « rien changé », c'est dit (pas de faux succès)", async () => {
    const now = new Date().toISOString();
    const sb = { session: true, email: "", new_email: "", anon: true, pending: "", devices: [{ id: "11111111-1111-4111-8111-111111111111", appareil: "Android Chrome", depuis: now, vu: now, actuel: true },
      { id: "22222222-2222-4222-8222-222222222222", appareil: "Windows Chrome", depuis: now, vu: now, actuel: false }] };
    const c = await ctxFor({ init: { lc_net_auth: "fake", fake_sb: JSON.stringify(sb) } });
    const pg = await open(c, "#/profil");
    await pg.waitForSelector("#cxDevices [data-out]", { timeout: 15000 });
    await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem("fake_sb") || "null"); if (s) { s.devices = s.devices.filter((d) => d.actuel); localStorage.setItem("fake_sb", JSON.stringify(s)); } });
    await pg.tap("#cxDevices [data-out]"); await pg.tap("#cxDevices [data-out]");
    await pg.waitForSelector("#cxDevices .cx-msg");
    const m = (await pg.textContent("#cxDevices .cx-msg")).trim();
    await c.close();
    return { ok: /n'est plus dans votre liste : rien n'a été modifié/.test(m), detail: m };
  });

  // =============== Profil : dates, avatar à initiales, Annuler ===============
  await step("Profil linguistique : avatar à initiales (aucune photo), dates de création et de modification, Annuler n'enregistre rien", async () => {
    const c = await ctxFor({});
    const pg = await open(c, "#/profil/linguistique");
    await pg.waitForSelector("#lpSave");
    const before = await pg.textContent("#lpDates");
    await pg.fill("#lpName", "Jean Dupont");
    const av = await pg.textContent("#lpAv");
    await pg.tap("#lpCancel");
    await pg.waitForSelector("#profileMain:not([hidden])");
    const none = await ls(pg, "ow_profile_v1");
    await pg.goto(URL_EW + "#/profil/linguistique"); await pg.waitForSelector("#lpSave");
    await pg.fill("#lpName", "Jean Dupont");
    await pg.tap("#lpSave"); await pg.waitForSelector("#lpMsg .cx-msg");
    const dates = await pg.textContent("#lpDates");
    const p = JSON.parse(await ls(pg, "ow_profile_v1"));
    await pg.goto(URL_EW + "#/profil"); await sleep(300);
    const sum = await pg.textContent("#lpSummary");
    await c.close();
    return { ok: /Pas encore enregistré/.test(before) && av === "JD" && none === null && /^Créé le .+ · modifié le /.test(dates) && !!p.created && !!p.updated && /JD/.test(sum) && /Créé le/.test(sum),
      detail: "avatar " + av + " · " + dates.trim() };
  });

  // =============== 320 px, sombre, anglais, accessibilité automatique ===============
  const VARS = [
    ["320 px clair", { viewport: { width: 320, height: 640 } }, {}],
    ["393 px sombre", {}, { ew_prefs: JSON.stringify({ theme: "dark" }) }],
    ["393 px contraste renforcé + très grand texte", {}, { ew_prefs: JSON.stringify({ theme: "light", contrast: true, text: 2 }) }],
    ["anglais 360 px", { viewport: { width: 360, height: 760 }, locale: "en-US" }, {}]
  ];
  const axeFound = [];
  for (const [name, o, init] of VARS) {
    await step("Nouveaux écrans (profil linguistique, Voyage, AI LAB) — " + name + " : sans erreur ni débordement", async () => {
      const c = await ctxFor({ ctx: o, init: Object.assign({ lc_net_auth: "fake" }, init) });
      const pg = await open(c, "#/accueil");
      const bad = [];
      for (const h of ["#/accueil", "#/profil", "#/profil/linguistique", "#/everywhere", "#/everywhere/voyage", "#/ailab"]) {
        pg._errors.length = 0;
        await pg.goto(URL_EW + h); await sleep(350);
        const ov = await overflow(pg);
        if (ov > 1) bad.push(h + " déborde de " + ov + " px");
        if (pg._errors.length) bad.push(h + " : " + pg._errors.join(" | "));
        if (/sombre|320/.test(name)) { const a = await axe(pg); if (a && a.length) axeFound.push(name + " " + h + " : " + a.join(" ; ")); }
      }
      if (name === "anglais 360 px") {
        await pg.goto(URL_EW + "#/profil/linguistique"); await sleep(300);
        const h1 = await pg.textContent("#lpEdit h1");
        if (h1.trim() !== "Language profile") bad.push("titre : " + h1);
      }
      await pg.screenshot({ path: path.join(OUT, "voyage-" + name.replace(/[^a-z0-9]+/gi, "-") + ".png") });
      await c.close();
      return { ok: !bad.length, detail: bad.join(" ; ").slice(0, 300) || "6 écrans OK" };
    });
  }
  await step("Accessibilité automatique (axe-core, WCAG 2.1 AA) des nouveaux écrans : aucune violation grave ou critique", async () => {
    if (!AXE_SRC) return { ok: false, detail: "axe-core introuvable (variable AXE)" };
    return { ok: !axeFound.length, detail: axeFound.join(" ; ").slice(0, 400) || "aucune" };
  });
  await step("TALK : plus aucun texte trop pâle (axe, contraste des couleurs) en clair et en sombre, seul ou dans la coquille", async () => {
    if (!AXE_SRC) return { ok: false, detail: "axe-core introuvable (variable AXE)" };
    const found = [];
    for (const scheme of ["light", "dark"]) {
      const c = await ctxFor({ ctx: { colorScheme: scheme }, init: { lc_net_auth: "fake", lc_net_joined: "1", fake_contacts: "1" } });
      const pg = await c.newPage();
      for (const u of [ORIGIN + BASE + "index.html", ORIGIN + BASE + "index.html?ew=1"]) {
        await pg.goto(u); await sleep(1500);
        for (const v of ["home", "net", "settings"]) {
          await pg.evaluate((v) => { const x = document.querySelector('nav.tabs button[data-view="' + v + '"]') || document.getElementById(v === "settings" ? "settingsBtn" : "tileMsg"); x && x.click(); }, v);
          await sleep(700);
          await pg.addScriptTag({ content: AXE_SRC });
          const r = await pg.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "rule", values: ["color-contrast"] } })).violations.flatMap((x) => x.nodes.map((n) => n.target.join(" "))));
          r.forEach((x) => found.push(scheme + " " + v + " " + x));
        }
      }
      await c.close();
    }
    return { ok: !found.length, detail: found.slice(0, 4).join(" ; ") || "0 défaut (12 écrans vérifiés)" };
  });
  await step("Code : aucune clé secrète dans les nouveaux fichiers ; aucune appel à un service d'IA", async () => {
    const files = ["everywhere/profil/profil.js", "everywhere/traduction/voyage.js", "everywhere/traduction/phrases.js", "everywhere/ailab/ailab.js", "everywhere/connect.js", "supabase/test/10-profil-linguistique.sql"];
    const bad = files.filter((f) => /sb_secret_|service_role|sk-[A-Za-z0-9]{10}|api\.openai|anthropic\.com\/v1|generativelanguage/.test(fs.readFileSync(path.join(SITE, f), "utf8")));
    return { ok: !bad.length, detail: files.length + " fichiers vérifiés" + (bad.length ? " : " + bad.join(",") : "") };
  });

  await browser.close();
  server.close();
  const ok = results.filter((r) => r.ok).length;
  fs.writeFileSync(path.join(OUT, "resultats-profil-voyage.json"), JSON.stringify({ date: new Date().toISOString(), reussis: ok, total: results.length, tests: results }, null, 2));
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  process.exit(ok === results.length ? 0 : 1);
})().catch((e) => { console.error(e); server.close(); process.exit(2); });

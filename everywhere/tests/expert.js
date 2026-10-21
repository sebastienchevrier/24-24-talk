/* 24/24 ONE WORLD — campagne de tests « expert » (Playwright + Chromium + axe-core).
   Complète e2e.js : tous les écrans × petits téléphones × thèmes × langues, accessibilité automatique (axe-core),
   pannes (hors ligne, service en panne, données abîmées, touches répétées), sécurité (texte piégé, pseudo hostile),
   et TALK seul dans ses 31 langues. Aucun accès Internet : site servi en local, Supabase remplacé par tests/fake-supabase.js.
   Lancement : node everywhere/tests/expert.js   (axe-core : variable AXE = chemin de axe.min.js, sinon require.resolve) */
const path = require("path");
const fs = require("fs");
const http = require("http");
let pw;
try { pw = require("playwright"); } catch (e) { pw = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright"); }
const { chromium } = pw;
let AXE = process.env.AXE;
if (!AXE) { try { AXE = require.resolve("axe-core/axe.min.js"); } catch (e) { AXE = null; } }
const AXE_SRC = AXE ? fs.readFileSync(AXE, "utf8") : null;

const SITE = path.resolve(__dirname, "../..");
const BASE = "/24-24-talk/";
const OUT = process.env.EW_OUT || path.join(__dirname, "resultats", "expert");
const FAKE = fs.readFileSync(path.join(__dirname, "fake-supabase.js"), "utf8");
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
const findings = []; // constats détaillés (accessibilité, mise en page) pour le rapport
function rec(name, ok, detail) { results.push({ name, ok: !!ok, detail: detail || "" }); console.log((ok ? "OK   " : "ÉCHEC") + "  " + name + (detail ? "  — " + detail : "")); }
async function step(name, fn) { try { const r = await fn(); rec(name, r === undefined ? true : r.ok, r && r.detail); } catch (e) { rec(name, false, String(e && e.message || e).split("\n")[0]); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROUTES = ["#/accueil", "#/applications", "#/profil", "#/parametres", "#/everywhere", "#/everywhere/face", "#/everywhere/appel", "#/everywhere/langues",
  "#/everywhere/reglages", "#/learn", "#/learn/apprendre", "#/learn/lecon/es-deb-1", "#/learn/reviser", "#/learn/defi", "#/learn/progression",
  "#/learn/conversation", "#/learn/cultures", "#/introuvable",
  // 0.7.0 : profil linguistique, Voyage, AI LAB
  "#/profil/linguistique", "#/everywhere/voyage", "#/ailab"];
const DICT = { "fr|en": { "Bonjour": "Hello", "Où est la gare ?": "Where is the train station?" }, "en|fr": { "It's straight ahead.": "C'est tout droit." } };

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port;
  const URL_EW = ORIGIN + BASE + "everywhere/";
  const browser = await chromium.launch();
  { const nc = browser.newContext.bind(browser); browser.newContext = async (o) => { const c = await nc(o); await c.addInitScript(() => { window.EW_PORTAL_HOME = true; try { if (!localStorage.getItem("e2e_seeded")) { localStorage.setItem("e2e_seeded", "1"); if (localStorage.getItem("lc_net_auth") === null) localStorage.setItem("lc_net_auth", "fake"); } } catch (e) {} }); return c; }; } // ancien accueil du portail, encore testé
  const PHONE = (w, h) => ({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR" });

  // opts.fake : faux Supabase ; opts.mm : "down" | "quota" | "html" | fonction ; opts.speech : "mock" | "real" ; opts.fakeSrc : variante du faux client ; opts.init : localStorage initial
  async function ctxFor(opts) {
    opts = opts || {};
    const ctx = await browser.newContext(Object.assign(PHONE(393, 851), opts.ctx || {}));
    // Le faux serveur remplace la vraie bibliothèque Supabase : son empreinte (SRI) ne peut pas correspondre.
    await ctx.addInitScript(() => { window.__EW_NO_SRI = true; });
    const fakeSrc = opts.fakeSrc || FAKE;
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => {
      const url = r.request().url();
      if (opts.fake && /supabase-js/.test(url)) return r.fulfill({ status: 200, contentType: "text/javascript", body: fakeSrc });
      if (/api\.mymemory\.translated\.net/.test(url)) {
        const u = new URL(url), q = u.searchParams.get("q"), lp = u.searchParams.get("langpair");
        if (opts.mm === "down") return r.fulfill({ status: 500, body: "x" });
        if (opts.mm === "quota") return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ quotaFinished: true, responseData: { translatedText: "" } }) });
        if (opts.mm === "html") return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ responseData: { translatedText: '<img src=x onerror="window.__xss=1"><b>gras</b>' } }) });
        if (opts.mm === "slow") return setTimeout(() => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ responseData: { translatedText: "[" + q + "]" } }) }), 3000);
        const tr = (DICT[lp] || {})[q] || "[" + q + "]";
        return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ responseData: { translatedText: tr } }) });
      }
      return r.abort();
    });
    await ctx.addInitScript((o) => {
      if (o.init && !sessionStorage.getItem("__init")) {
        sessionStorage.setItem("__init", "1");
        Object.keys(o.init).forEach((k) => { try { localStorage.setItem(k, o.init[k]); } catch (e) {} });
      }
      window.__spoken = []; window.__srLangs = []; window.__srDelay = 150; window.__sayQ = null; window.__say = "Bonjour"; window.__srActive = 0; window.__srMax = 0;
      window.SpeechRecognition = window.webkitSpeechRecognition = function () {
        const r = this;
        r.start = function () {
          window.__srLangs.push(r.lang); window.__srActive++; window.__srMax = Math.max(window.__srMax, window.__srActive);
          r._t = setTimeout(function () {
            const txt = (window.__sayQ && window.__sayQ.length) ? window.__sayQ.shift() : window.__say;
            if (txt === "__nospeech") { r.onerror && r.onerror({ error: "no-speech" }); window.__srActive--; r.onend && r.onend(); return; }
            r.onresult && r.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: txt || "" }], { isFinal: true })] });
            window.__srActive--; r.onend && r.onend();
          }, window.__srDelay);
        };
        r.stop = function () { if (r._t) { clearTimeout(r._t); r._t = null; window.__srActive--; r.onend && r.onend(); } };
        r.abort = function () { if (r._t) { clearTimeout(r._t); r._t = null; window.__srActive--; } };
      };
      try { navigator.mediaDevices.getUserMedia = function () { return Promise.resolve({ getTracks: function () { return []; } }); }; } catch (e) {}
      if (o.speech !== "real" && window.speechSynthesis) {
        window.SpeechSynthesisUtterance = function (t) { this.text = t; };
        const syn = window.speechSynthesis;
        syn.getVoices = function () { return [{ name: "Google français", lang: "fr-FR", voiceURI: "g-fr" }, { name: "Google US English", lang: "en-US", voiceURI: "g-en" }]; };
        syn.speak = function (u) { window.__spoken.push({ t: u.text, l: u.lang }); setTimeout(function () { u.onend && u.onend(); }, 50); };
        syn.cancel = function () {};
      } else if (window.speechSynthesis) {
        const real = window.speechSynthesis.speak.bind(window.speechSynthesis);
        window.speechSynthesis.speak = function (u) { window.__spoken.push({ t: u.text, l: u.lang }); return real(u); };
      }
      navigator.share = function (d) { window.__shared = d; return Promise.resolve(); };
    }, { init: opts.init || null, speech: opts.speech || "mock" });
    return ctx;
  }
  async function open(ctx, url) {
    const page = await ctx.newPage();
    page._errors = [];
    page.on("pageerror", (e) => page._errors.push(String(e).split("\n")[0]));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|net::ERR|ERR_FAILED|status of 404/.test(m.text())) page._errors.push("console: " + m.text().slice(0, 140)); });
    if (url) await page.goto(url);
    return page;
  }
  async function settle(page) { await page.waitForSelector(".view.active", { timeout: 10000 }); await sleep(450); }
  async function layoutCheck(page) {
    return page.evaluate(() => {
      const v = document.querySelector(".view.active");
      const over = document.documentElement.scrollWidth - innerWidth;
      // Éléments visibles qui dépassent à droite de l'écran (hors zones qui défilent exprès)
      const wide = [...document.querySelectorAll(".view.active *")].filter((e) => {
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false;
        let p = e.parentElement; while (p && p !== document.body) { const s = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(s.overflowX)) return false; p = p.parentElement; }
        return r.right > innerWidth + 1;
      }).slice(0, 3).map((e) => e.tagName.toLowerCase() + (e.id ? "#" + e.id : e.className ? "." + String(e.className).split(" ")[0] : ""));
      const ids = [...document.querySelectorAll("[id]")].map((e) => e.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      const small = [...document.querySelectorAll(".view.active button, .view.active a, .view.active select, .view.active input:not([type=hidden]), #mainnav a, #topSettings")]
        .filter((e) => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; if (e.closest("p, li small, [aria-hidden=\"true\"]")) return false; return Math.min(r.width, r.height) < 40 && !(e.tagName === "INPUT" && /radio|checkbox/.test(e.type)); })
        .map((e) => (e.id || e.textContent.trim().slice(0, 18) || e.tagName) + " " + Math.round(e.getBoundingClientRect().width) + "×" + Math.round(e.getBoundingClientRect().height));
      return { over, wide, dup: [...new Set(dup)], small: small.slice(0, 6), view: v && v.id };
    });
  }
  async function axe(page) {
    if (!AXE_SRC) return null;
    await page.addScriptTag({ content: AXE_SRC });
    return page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }, resultTypes: ["violations"] });
      return r.violations.filter((v) => v.impact === "critical" || v.impact === "serious").map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes.slice(0, 2).map((x) => x.target.join(" ")).join(" | ") }));
    });
  }

  // =============== 1. Tous les écrans × variantes ===============
  const VARIANTS = [
    { name: "petit téléphone 320 px, clair", ctx: PHONE(320, 640), init: {} },
    { name: "téléphone 393 px, sombre", ctx: PHONE(393, 851), init: { ew_prefs: JSON.stringify({ theme: "dark" }) } },
    { name: "téléphone 393 px, contraste renforcé + très grand texte", ctx: PHONE(393, 851), init: { ew_prefs: JSON.stringify({ theme: "light", contrast: true, text: 2 }) } },
    { name: "anglais 360 px", ctx: Object.assign(PHONE(360, 760), { locale: "en-US" }), init: {} }
  ];
  const axeAll = {};
  for (const V of VARIANTS) {
    const ctx = await ctxFor({ fake: true, ctx: V.ctx, init: Object.assign({ fake_contacts: "1", lc_net_auth: "fake" }, V.init) });
    const page = await open(ctx, URL_EW + "#/accueil");
    const bad = [], layout = [], small = new Set();
    for (const r of ROUTES) {
      page._errors.length = 0;
      await page.goto(URL_EW + r);
      try { await settle(page); } catch (e) { bad.push(r + " : écran non affiché"); continue; }
      const L = await layoutCheck(page);
      if (L.over > 1 || L.wide.length) layout.push(r + " déborde de " + L.over + " px (" + L.wide.join(", ") + ")");
      if (L.dup.length) layout.push(r + " : id en double " + L.dup.join(","));
      L.small.forEach((s) => small.add(r + " " + s));
      if (page._errors.length) bad.push(r + " : " + page._errors.join(" | "));
      if (V.name.startsWith("téléphone 393 px, sombre") || V.name.startsWith("petit")) {
        const a = await axe(page);
        if (a && a.length) a.forEach((v) => { const k = v.id + " (" + v.impact + ")"; (axeAll[k] = axeAll[k] || new Set()).add(r + " [" + V.name.split(",")[0] + "] " + v.ex); });
      }
      if (r === "#/everywhere/face" || r === "#/accueil" || r === "#/everywhere/reglages") await page.screenshot({ path: path.join(OUT, (V.name.replace(/[^a-z0-9]+/gi, "-") + r.replace(/[#/]+/g, "-")).toLowerCase() + ".png") });
    }
    await step("Écrans (" + ROUTES.length + ") — " + V.name + " : aucune erreur JavaScript", async () => ({ ok: !bad.length, detail: bad.join(" ; ").slice(0, 400) || "aucune" }));
    await step("Écrans (" + ROUTES.length + ") — " + V.name + " : rien ne dépasse de l'écran, aucun id en double", async () => ({ ok: !layout.length, detail: layout.join(" ; ").slice(0, 400) || "OK" }));
    if (small.size) findings.push({ sujet: "Zones tactiles < 40 px — " + V.name, liste: [...small] });
    await ctx.close();
  }
  await step("Accessibilité automatique (axe-core, WCAG 2.1 AA) : aucune violation grave ou critique", async () => {
    if (!AXE_SRC) return { ok: false, detail: "axe-core introuvable" };
    const keys = Object.keys(axeAll);
    keys.forEach((k) => findings.push({ sujet: "axe : " + k, liste: [...axeAll[k]] }));
    return { ok: !keys.length, detail: keys.map((k) => k + " ×" + axeAll[k].size).join(" ; ") || "aucune" };
  });

  // =============== 2. Données abîmées sur l'appareil ===============
  for (const [label, val] of [["texte illisible", "{{{pas du json"], ["null", "null"], ["tableau", "[1,2,3]"], ["valeurs piégées", JSON.stringify({ me: "<img src=x onerror=window.__xss=1>", other: 42, theme: "<b>", text: 99, sound: "oui", volume: "fort", size: -3, out: "laser", rate: 9, voices: "x", hands: "1", langs: {}, done: "x" })]]) {
    const init = { ew_prefs: val, ew_tr_v1: val, ew_learn_v1: val, lc_uilang: label === "valeurs piégées" ? "<x>" : "fr", fake_sb: label === "null" ? "null" : "{}" };
    const ctx = await ctxFor({ fake: true, init });
    const page = await open(ctx, URL_EW + "#/accueil");
    const bad = [];
    for (const r of ROUTES) {
      page._errors.length = 0;
      await page.goto(URL_EW + r);
      try { await settle(page); } catch (e) { bad.push(r + " non affiché"); continue; }
      if (page._errors.length) bad.push(r + " : " + page._errors.join(" | "));
    }
    const xss = await page.evaluate(() => window.__xss);
    await step("Réglages abîmés (" + label + ") : tous les écrans s'ouvrent quand même, sans erreur", async () => ({ ok: !bad.length && !xss, detail: bad.join(" ; ").slice(0, 400) || "OK" }));
    await ctx.close();
  }

  // =============== 3. EVERYWHERE : pannes et cas limites ===============
  let ctx = await ctxFor({ mm: "html" });
  let page = await open(ctx, URL_EW + "#/everywhere/face");
  await step("Sécurité : une traduction piégée (HTML) s'affiche en texte, rien ne s'exécute", async () => {
    await page.waitForSelector("#trFace");
    await page.tap('[data-mic="1"]');
    await page.waitForFunction(() => document.querySelector('[data-log="2"] .tr-big-txt') && /gras/.test(document.querySelector('[data-log="2"] .tr-big-txt').textContent), null, { timeout: 5000 });
    const r = await page.evaluate(() => ({ xss: window.__xss, img: document.querySelectorAll(".tr-log img, .tr-log b").length, txt: document.querySelector('[data-log="2"] .tr-big-txt').textContent }));
    return { ok: !r.xss && !r.img && /<img/.test(r.txt), detail: "affiché : " + r.txt.slice(0, 40) };
  });
  await ctx.close();

  ctx = await ctxFor({ mm: "down", init: { ew_tr_v1: JSON.stringify({ hands: true }) } });
  page = await open(ctx, URL_EW + "#/everywhere/face");
  await step("Mains libres + service de traduction en panne : message clair, l'enchaînement s'arrête (pas de boucle)", async () => {
    await page.waitForSelector("#trFace");
    await page.tap('[data-mic="1"]');
    await page.waitForSelector('[data-log="2"] .tr-err', { timeout: 5000 });
    await sleep(1500);
    const r = await page.evaluate(() => ({ sr: window.__srLangs.length, sp: window.__spoken.length, e: document.querySelector('[data-log="2"] .tr-err').textContent }));
    return { ok: r.sr === 1 && r.sp === 0 && /Traduction impossible/.test(r.e), detail: r.sr + " écoute, " + r.e };
  });
  await ctx.close();

  for (const [mm, re, label] of [["quota", /Limite quotidienne/, "quota du service gratuit atteint"], ["offline", /Pas de connexion/, "téléphone hors ligne"]]) {
    ctx = await ctxFor({ mm: mm === "quota" ? "quota" : null });
    page = await open(ctx, URL_EW + "#/everywhere/face");
    await step("Côte à côte, " + label + " : message clair, rien n'est lu", async () => {
      await page.waitForSelector("#trFace");
      if (mm === "offline") await ctx.setOffline(true);
      await page.tap('[data-kb="1"]');
      await page.fill('[data-input="1"]', "Bonjour");
      await page.press('[data-input="1"]', "Enter");
      await page.waitForSelector('[data-log="2"] .tr-err', { timeout: 10000 });
      const e = await page.textContent('[data-log="2"] .tr-err');
      return { ok: re.test(e) && (await page.evaluate(() => window.__spoken.length)) === 0 && !page._errors.length, detail: e };
    });
    await ctx.close();
  }

  ctx = await ctxFor({ init: { ew_tr_v1: JSON.stringify({ hands: true }) } });
  page = await open(ctx, URL_EW + "#/everywhere/face");
  await step("Mains libres : quitter l'écran pendant l'enchaînement → aucun micro ne s'ouvre ensuite", async () => {
    await page.waitForSelector("#trFace");
    await page.evaluate(() => { window.__sayQ = ["Bonjour"]; });
    await page.tap('[data-mic="1"]');
    await page.waitForFunction(() => window.__spoken.length === 1, null, { timeout: 5000 });
    await page.tap('#mainnav a[data-nav="learn"]');
    await sleep(1500);
    const r = await page.evaluate(() => ({ sr: window.__srLangs.length, act: window.__srActive }));
    return { ok: r.sr === 1 && r.act <= 0 && !page._errors.length, detail: r.sr + " écoute en tout" };
  });
  await step("Mains libres : rien entendu → réécoute silencieuse limitée (20 s, ici 1,5 s), puis pause annoncée, pas de relance en boucle", async () => {
    await page.goto(URL_EW + "#/everywhere/face");
    await page.waitForSelector("#trFace");
    const n0 = await page.evaluate(() => { window.EW_STT_RETRY_MS = 1500; window.__sayQ = ["Bonjour", "__nospeech", "__nospeech", "__nospeech", "__nospeech", "__nospeech", "__nospeech", "__nospeech", "__nospeech"]; return window.__srLangs.length; });
    await page.tap('[data-mic="1"]');
    await page.waitForFunction(() => /pause/.test((document.querySelector('[data-msg="2"]') || {}).textContent || ""), null, { timeout: 6000 });
    const n1 = await page.evaluate((k) => window.__srLangs.length - k, n0);
    await sleep(1200);
    const n = await page.evaluate((k) => window.__srLangs.length - k, n0);
    await page.evaluate(() => { delete window.EW_STT_RETRY_MS; });
    return { ok: n >= 3 && n === n1, detail: n + " écoutes (1 + réécoutes silencieuses), puis pause, plus rien ensuite" };
  });
  await step("Mains libres : toucher le micro allumé arrête l'enchaînement", async () => {
    const n0 = await page.evaluate(() => { window.__srDelay = 1500; window.__sayQ = ["Bonjour", "It's straight ahead."]; return window.__srLangs.length; });
    await page.tap('[data-mic="1"]');
    await page.waitForSelector('[data-mic="1"].on');
    await page.tap('[data-mic="1"]');
    await sleep(2000);
    const n = await page.evaluate((k) => window.__srLangs.length - k, n0);
    await page.evaluate(() => { window.__srDelay = 150; });
    return { ok: n === 1, detail: n + " écoute (aucune relance)" };
  });
  await step("Touches répétées (20 appuis rapides sur les deux micros) : jamais deux micros en même temps, aucune erreur", async () => {
    await page.evaluate(() => { window.__srMax = 0; window.__srActive = 0; window.__srDelay = 400; window.__sayQ = null; window.__say = "Bonjour"; });
    for (let i = 0; i < 20; i++) await page.tap('[data-mic="' + (1 + (i % 2)) + '"]');
    await sleep(2500);
    const r = await page.evaluate(() => ({ max: window.__srMax, on: document.querySelectorAll(".tr-mic.on").length }));
    await page.evaluate(() => { window.__srDelay = 150; });
    return { ok: r.max <= 1 && !page._errors.length, detail: "au plus " + r.max + " micro ouvert à la fois" };
  });
  await step("Texte très long (2 000 caractères) : affiché sans casser l'écran", async () => {
    await page.tap('[data-kb="2"]');
    await page.fill('[data-input="2"]', "Lorem ipsum ".repeat(170));
    await page.press('[data-input="2"]', "Enter");
    await page.waitForFunction(() => /\[Lorem/.test(document.querySelector('[data-log="1"]').textContent), null, { timeout: 5000 });
    const L = await layoutCheck(page);
    return { ok: L.over <= 1 && !page._errors.length, detail: "débordement " + L.over + " px" };
  });
  await step("Langues inversées puis changées pendant que la traduction arrive (service lent) : pas d'erreur", async () => {
    await page.tap("#trSwap");
    await page.tap("#trSwap");
    await page.selectOption('[data-lang-of="2"]', "es");
    await page.selectOption('[data-lang-of="2"]', "en");
    return { ok: !page._errors.length };
  });
  await ctx.close();

  ctx = await ctxFor({ speech: "real", init: { ew_tr_v1: JSON.stringify({ hands: true }) } });
  page = await open(ctx, URL_EW + "#/everywhere/face");
  await step("Vraie voix du navigateur (sans imitation) : la fin de lecture est détectée et le micro passe à l'autre personne", async () => {
    await page.waitForSelector("#trFace");
    await page.evaluate(() => { window.__sayQ = ["Bonjour", ""]; });
    await page.tap('[data-mic="1"]');
    await page.waitForFunction(() => window.__srLangs.length >= 2, null, { timeout: 8000 });
    const r = await page.evaluate(() => window.__srLangs.slice(0, 2).join());
    return { ok: r === "fr-FR,en-US" && !page._errors.length, detail: r };
  });
  await ctx.close();

  // Contacts avec pseudo hostile (le serveur l'interdit, mais l'appli ne doit pas lui faire confiance)
  const HOSTILE = FAKE.replace('pseudo: "kenji"', 'pseudo: "<img src=x onerror=window.__xss=1>"').replace('lang: "ja"', 'lang: "\\"><svg onload=window.__xss=2>"');
  ctx = await ctxFor({ fake: true, fakeSrc: HOSTILE, init: { fake_contacts: "1" } });
  page = await open(ctx, URL_EW + "#/everywhere/appel");
  await step("Sécurité : un pseudo et une langue piégés dans les contacts s'affichent en texte, rien ne s'exécute", async () => {
    await page.waitForSelector(".tr-ct", { timeout: 15000 });
    await page.fill("#trSearch", "<img");
    await page.fill("#trSearch", "");
    const btn = await page.$$(".tr-callbtn");
    if (btn[0]) { await btn[0].tap(); await page.waitForSelector("#trSheet"); }
    const r = await page.evaluate(() => ({ xss: window.__xss, imgs: document.querySelectorAll(".tr-contacts img, .tr-contacts svg:not([aria-hidden]), #trSheet img").length,
      txt: document.querySelector(".tr-contacts").textContent }));
    return { ok: !r.xss && !r.imgs && /<img/.test(r.txt), detail: r.txt.replace(/\s+/g, " ").slice(0, 70) };
  });
  await ctx.close();

  // =============== 4. LEARN et navigation ===============
  ctx = await ctxFor({});
  page = await open(ctx, URL_EW + "#/learn");
  await step("Navigation affolée : 60 changements d'écran en rafale, le dernier écran demandé est bien affiché", async () => {
    await settle(page);
    for (let i = 0; i < 60; i++) await page.evaluate((h) => { location.hash = h; }, ROUTES[i % ROUTES.length]);
    await page.evaluate(() => { location.hash = "#/learn/progression"; });
    await sleep(1500);
    const r = await page.evaluate(() => ({ v: document.querySelector(".view.active").id, h: location.hash, txt: document.querySelector(".view.active").textContent.slice(0, 60) }));
    return { ok: r.v === "view-learn" && !page._errors.length, detail: r.v + " " + page._errors.join(" | ").slice(0, 160) };
  });
  await step("Bouton retour du téléphone : revient à l'écran précédent", async () => {
    await page.goto(URL_EW + "#/everywhere");
    await settle(page);
    await page.goto(URL_EW + "#/everywhere/reglages");
    await settle(page);
    await page.goBack();
    await sleep(500);
    return { ok: (await page.evaluate(() => location.hash)) === "#/everywhere" && (await page.$("#trGoFace")) !== null };
  });
  await step("LEARN : leçon terminée en entier (toutes les réponses au hasard), résultat affiché, progression gardée après rechargement", async () => {
    await page.goto(URL_EW + "#/learn/lecon/en-deb-1");
    await page.waitForSelector("#lxGo", { timeout: 10000 });
    await page.click("#lxGo");
    for (let i = 0; i < 40; i++) {
      if (await page.$(".lx-result, #lxResult")) break;
      if (await page.$("#lxEx .lx-match")) {
        // Associer : chaque mot de gauche avec sa traduction (même numéro), comme le ferait un élève.
        for (const l of await page.$$('#lxEx .lx-m[data-side="l"]:not([disabled])')) {
          const i = await l.getAttribute("data-i");
          await l.click();
          await page.click('#lxEx .lx-m[data-side="r"][data-i="' + i + '"]');
        }
      } else {
        const opt = await page.$("#lxEx .lx-opt:not([disabled])");
        if (opt) await opt.click();
      }
      const nx = await page.$("#lxNext:not([hidden])");
      if (nx) await nx.click();
      await sleep(80);
    }
    const done = !!(await page.$(".lx-result, #lxResult"));
    const before = await page.evaluate(() => localStorage.getItem("ew_learn_v1"));
    await page.reload();
    await sleep(500);
    const after = await page.evaluate(() => localStorage.getItem("ew_learn_v1"));
    return { ok: done && !!before && before === after && !page._errors.length, detail: done ? "résultat affiché, progression gardée" : "résultat non atteint" };
  });
  await ctx.close();

  // =============== 5. CONNECT (Profil) : saisies hostiles ===============
  ctx = await ctxFor({ fake: true, init: { lc_net_auth: "fake" } });
  page = await open(ctx, URL_EW + "#/profil");
  await step("CONNECT : e-mail invalide ou piégé refusé avec un message, mauvais code refusé, aucune erreur", async () => {
    await page.waitForSelector("#cxSecure", { timeout: 15000 });
    await page.tap("#cxSecure");
    await page.waitForSelector("#cxEmail");
    const msgs = [];
    for (const v of ["", "pas-un-email", "<script>alert(1)</script>@x.fr", "a@b"]) {
      await page.fill("#cxEmail", v);
      await page.tap("#cxSend");
      await sleep(250);
      msgs.push((await page.textContent("#cxMsg")).trim());
    }
    await page.fill("#cxEmail", "moi@exemple.fr");
    await page.tap("#cxSend");
    await page.waitForSelector("#cxCode", { timeout: 5000 });
    await page.fill("#cxCode", "000000");
    await page.tap("#cxVerify");
    await sleep(500);
    const wrong = (await page.textContent("#cxMsg")).trim();
    const linked = await page.evaluate(() => (JSON.parse(localStorage.getItem("fake_sb") || "{}").email || ""));
    return { ok: msgs.every((m) => m.length > 0) && wrong.length > 0 && !linked && !page._errors.length && !(await page.evaluate(() => window.__xss)),
      detail: "refus : " + msgs.map((m) => m.slice(0, 30)).join(" / ") + " ; code faux : " + wrong.slice(0, 40) };
  });
  await ctx.close();

  // =============== 6. TALK seul : 31 langues ===============
  const packs = fs.readdirSync(path.join(SITE, "i18n")).map((f) => f.replace(/\.js$/, ""));
  const LANGS = ["fr", "en", "es", "pt", "de", "it", "zh", "ja", "ar", "ru", "mg"].concat(packs);
  const talkBad = [];
  for (const L of LANGS) {
    const c = await ctxFor({ init: { lc_uilang: L } });
    const p = await open(c, ORIGIN + BASE);
    try { await p.waitForSelector("#tilePhone", { timeout: 10000 }); } catch (e) { talkBad.push(L + " : accueil non affiché"); }
    await sleep(400);
    const r = await p.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, over: document.documentElement.scrollWidth - innerWidth,
      raw: (document.body.innerText.match(/\b[a-z]+_[a-z_]+\b/g) || []).filter((w) => /^(net|ui|btn|lbl|err|msg|call|tile)_/.test(w)).slice(0, 3) }));
    if (p._errors.length) talkBad.push(L + " : " + p._errors.join(" | ").slice(0, 120));
    if (r.over > 1) talkBad.push(L + " : déborde de " + r.over + " px");
    if (r.raw.length) talkBad.push(L + " : clés non traduites " + r.raw.join(","));
    if (["ar", "he", "fa", "ur"].includes(L) && r.dir !== "rtl") talkBad.push(L + " : sens de lecture " + (r.dir || "ltr") + " au lieu de rtl");
    if (L === "ar" || L === "ja") await p.screenshot({ path: path.join(OUT, "talk-" + L + ".png") });
    await c.close();
  }
  await step("TALK seul dans ses " + LANGS.length + " langues : s'ouvre sans erreur, rien ne déborde, droite-à-gauche respecté", async () => ({ ok: !talkBad.length, detail: talkBad.join(" ; ").slice(0, 500) || LANGS.length + " langues OK" }));

  ctx = await ctxFor({});
  page = await open(ctx, ORIGIN + BASE + "?ajouter=%3Cimg%20src=x%20onerror=window.__xss=1%3E&i=5");
  await step("Sécurité TALK : lien d'invitation piégé ignoré, rien ne s'exécute", async () => {
    await page.waitForSelector("#tilePhone", { timeout: 10000 });
    await sleep(800);
    return { ok: !(await page.evaluate(() => window.__xss)) && !page._errors.length, detail: page._errors.join(" | ").slice(0, 120) || "ignoré" };
  });
  await ctx.close();

  // =============== 7. Code source ===============
  await step("Code : aucune clé secrète dans tout le site (seule la clé publique Supabase est autorisée)", async () => {
    const files = [];
    (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (/node_modules|\.git$|resultats/.test(p)) continue; if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(js|html|json|css|md)$/.test(f)) files.push(p); } })(SITE);
    const hits = files.filter((f) => !/tests\//.test(f)).filter((f) => /sk-ant-|sk-[A-Za-z0-9]{24}|service_role\s*[:=]|sb_secret_|eyJhbGciOi[\w-]{20,}\.[\w-]{40,}\.[\w-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY/.test(fs.readFileSync(f, "utf8")));
    return { ok: !hits.length, detail: hits.map((h) => path.relative(SITE, h)).join(", ") || files.length + " fichiers vérifiés" };
  });

  await browser.close();
  server.close();
  const ok = results.filter((r) => r.ok).length;
  fs.writeFileSync(path.join(OUT, "resultats-expert.json"), JSON.stringify({ date: new Date().toISOString(), reussis: ok, total: results.length, tests: results, constats: findings }, null, 2));
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  if (findings.length) { console.log("\nConstats :"); findings.forEach((f) => console.log("- " + f.sujet + "\n    " + f.liste.slice(0, 8).join("\n    "))); }
  process.exit(ok === results.length ? 0 : 1);
})().catch((e) => { console.error(e); server.close(); process.exit(2); });

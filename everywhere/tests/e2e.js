/* 24/24 EVERYWHERE — tests automatiques de bout en bout (Playwright + Chromium).
   Lancement : voir everywhere/README.md (« Lancer les tests »). Aucun accès réseau extérieur n'est nécessaire :
   le site est servi en local, et le serveur Supabase est soit absent, soit remplacé par tests/fake-supabase.js. */
const path = require("path");
const fs = require("fs");
const http = require("http");
let pw;
try { pw = require("playwright"); } catch (e) { pw = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright"); }
const { chromium } = pw;

const SITE = path.resolve(__dirname, "../..");             // racine du dépôt (index.html de TALK)
const BASE = "/24-24-talk/";                                // même chemin que sur GitHub Pages
const OUT = process.env.EW_OUT || path.join(__dirname, "resultats");
const FAKE = fs.readFileSync(path.join(__dirname, "fake-supabase.js"), "utf8");
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".webmanifest": "application/manifest+json" };
let blockTalk = false;
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (!u.pathname.startsWith(BASE)) { res.writeHead(404); return res.end(); }
  let p = path.join(SITE, decodeURIComponent(u.pathname.slice(BASE.length)));
  if (!p.startsWith(SITE)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (blockTalk && p === path.join(SITE, "index.html")) { req.socket.destroy(); return; }
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
  // Compte pour tout (19 oct. 2026) : sans compte, l'appli renvoie vers l'inscription. Les tests partent donc d'un appareil déjà
  // inscrit (une seule fois par contexte : un test qui retire le compte le garde retiré), sauf quand SEED_AUTH est faux.
  let SEED_AUTH = true;
  { const nc = browser.newContext.bind(browser); browser.newContext = async (o) => { const c = await nc(o); await c.addInitScript((seed) => { window.EW_PORTAL_HOME = true; try { if (seed && !localStorage.getItem("e2e_seeded")) { localStorage.setItem("e2e_seeded", "1"); if (localStorage.getItem("lc_net_auth") === null) localStorage.setItem("lc_net_auth", "fake"); } } catch (e) {} }, SEED_AUTH); return c; }; } // ancien accueil du portail, encore testé
  const MOBILE = { viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR" };

  async function newCtx(opts, fake) {
    const ctx = await browser.newContext(Object.assign({}, MOBILE, opts || {}));
    // Le faux serveur remplace la vraie bibliothèque Supabase : son empreinte (SRI) ne peut pas correspondre.
    await ctx.addInitScript(() => { window.__EW_NO_SRI = true; });
    // Rien ne sort vers Internet ; le kit Supabase est remplacé par le faux client si demandé.
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => (fake && /supabase-js/.test(r.request().url()))
      ? r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE }) : r.abort());
    return ctx;
  }
  async function openPortal(ctx, hash) {
    const page = await ctx.newPage();
    page._errors = [];
    page.on("pageerror", (e) => page._errors.push(String(e)));
    await page.goto(URL_EW + (hash || ""));
    return page;
  }
  const talkFrame = (page) => page.frames().find((f) => /index\.html\?embed=1/.test(f.url()));
  async function waitTalkReady(page) {
    await page.waitForFunction(() => window.EW && EW.frames.talk && EW.frames.talk.ready, null, { timeout: 20000 });
    return talkFrame(page);
  }

  // ---------- Compte pour tout ----------
  SEED_AUTH = false;
  {
    const gctx = await newCtx(); // serveur injoignable : aucun compte possible, l'écran reste celui de l'inscription
    SEED_AUTH = true;
    const gp = await openPortal(gctx);
    await step("Compte pour tout : sans compte, le portail ouvre l'inscription de TALK, sans barre du bas", async () => {
      await gp.waitForURL(/24-24-talk\/index\.html/, { timeout: 15000 });
      await gp.waitForSelector("#net.view.active", { timeout: 20000 });
      const r = await gp.evaluate(() => { const b = document.querySelector(".bbar"); return { gate: document.documentElement.classList.contains("ow-gate"), bar: b ? getComputedStyle(b).display : "none" }; });
      return { ok: r.gate && r.bar === "none", detail: "Messagerie (inscription) seule, barre du bas : " + r.bar };
    });
    await step("Compte pour tout : « J'ai déjà un compte » reste accessible (portail #/profil)", async () => {
      await gp.goto(URL_EW + "#/profil");
      await gp.waitForTimeout(800);
      if (!/everywhere\/#\/profil/.test(gp.url())) throw new Error("renvoyé vers " + gp.url());
      return { ok: true, detail: "connexion possible" };
    });
    await step("Compte pour tout : un autre écran du portail sans compte renvoie vers l'inscription", async () => {
      await gp.goto(URL_EW + "#/learn");
      await gp.waitForURL(/24-24-talk\/index\.html/, { timeout: 15000 });
      return { ok: true, detail: "renvoyé vers l'inscription" };
    });
    await gctx.close();
  }

  // ---------- Téléphone ----------
  let ctx = await newCtx();
  let page = await openPortal(ctx);
  await step("Accueil (0.8.0) : « One world. Every voice. », phrase d'accueil, quatre tuiles TALK, EVERYWHERE, VOYAGE, APPRENDRE", async () => {
    await page.waitForSelector("#view-accueil.active");
    const h1 = await page.$eval("#h-accueil", (e) => e.innerText.replace(/\s+/g, " ").trim());
    const lead = (await page.textContent("#view-accueil .lead")).trim();
    const cards = await page.$$eval("#view-accueil a.duo-card", (n) => n.map((x) => ({ t: x.querySelector("b").textContent, d: x.textContent, href: x.getAttribute("href"), w: x.getBoundingClientRect().width, h: x.getBoundingClientRect().height })));
    const want = [["TALK", /Messages et appels traduits/], ["EVERYWHERE", /Conversation côte à côte/], ["VOYAGE", /Phrases utiles hors ligne/], ["APPRENDRE", /Leçons et révisions/]];
    const ok = h1 === "One world. Every voice." && lead === "Le monde se parle. Enfin." && cards.length === 4 &&
      want.every((w, i) => cards[i].t === w[0] && w[1].test(cards[i].d)) && cards.every((c) => c.w >= 330 && c.h >= 72);
    return { ok, detail: cards.map((c) => c.t + " → " + c.href + " (" + Math.round(c.w) + "×" + Math.round(c.h) + " px)").join(" · ") };
  });
  await step("Tuiles : TALK en pleine page (index.html?ew=1, pas de cadre), EVERYWHERE #/everywhere, VOYAGE #/everywhere/voyage, APPRENDRE #/learn", async () => {
    const r = await page.evaluate(() => ({ talk: document.getElementById("cardTalk").href, ew: document.getElementById("cardEverywhere").getAttribute("href"),
      trip: document.getElementById("cardTrip").getAttribute("href"), learn: document.getElementById("cardLearn").getAttribute("href"), frames: document.querySelectorAll("iframe").length }));
    const u = new URL(r.talk);
    return { ok: u.pathname === BASE + "index.html" && u.search === "?ew=1" && r.ew === "#/everywhere" && r.trip === "#/everywhere/voyage" && r.learn === "#/learn" && r.frames === 0,
      detail: u.pathname + u.search + " · " + r.ew + " · " + r.trip + " · " + r.learn };
  });
  await step("Accueil bleu nuit, planète dessinée en CSS (sans image), icônes en dégradé, barre du bas bleu nuit avec onglet actif cyan", async () => {
    const c = await page.evaluate(() => ({ home: getComputedStyle(document.getElementById("view-accueil")).backgroundColor,
      sky: getComputedStyle(document.querySelector("#view-accueil .home-head")).backgroundImage,
      talk: getComputedStyle(document.querySelector("#cardTalk .duo-ic")).backgroundImage, nav: getComputedStyle(document.getElementById("mainnav")).backgroundColor,
      act: getComputedStyle(document.querySelector('#mainnav a[aria-current="page"]') || document.querySelector("#mainnav a")).color }));
    return { ok: c.home === "rgb(8, 17, 31)" && /radial-gradient/.test(c.sky) && /63, 169, 245/.test(c.sky) && !/url\(/.test(c.sky) && /26, 115, 232/.test(c.talk) && c.nav === "rgb(11, 21, 38)",
      detail: "fond " + c.home + " · barre du bas " + c.nav };
  });
  await step("Accueil : aucune mention de prix, ni compte à rebours ni date de fin (17 oct. 2026)", async () => {
    const r = await page.evaluate(() => ({ txt: document.body.innerText, cd: !!document.getElementById("countdown"), api: !!window.EWCountdown }));
    const prix = /gratuit|tarif|abonnement|€|\$/i.test(r.txt);
    return { ok: !prix && !r.cd && !r.api, detail: prix ? "mention de prix trouvée" : "aucune mention de prix" };
  });
  await step("Barre basse commune : 5 entrées Accueil, Messagerie, Téléphone, Traduire, Apprendre", async () => {
    const labels = await page.$$eval("#mainnav a", (n) => n.map((a) => a.textContent.trim()));
    const pos = await page.$eval("#mainnav", (n) => { const r = n.getBoundingClientRect(); return { bottom: Math.round(r.bottom), h: innerHeight, dir: getComputedStyle(n).flexDirection }; });
    return { ok: labels.length === 5 && labels.join(",") === "Accueil,Messagerie,Téléphone,Traduire,Apprendre" && pos.bottom === pos.h && pos.dir === "row", detail: labels.join(", ") + " · collée en bas" };
  });
  await step("Zones tactiles ≥ 44 px (barre basse, roue dentée)", async () => {
    const sizes = await page.$$eval("#mainnav a, #topSettings", (n) => n.map((a) => { const r = a.getBoundingClientRect(); return Math.min(r.width, r.height); }));
    return { ok: sizes.every((s) => s >= 44), detail: "plus petite : " + Math.round(Math.min.apply(null, sizes)) + " px" };
  });
  await step("Navigation : Apprendre (barre du bas)", async () => {
    await page.click('#mainnav a[href="#/learn"]');
    await page.waitForSelector("#view-learn.active");
    const cur = await page.$eval('#mainnav a[href="#/learn"]', (a) => a.getAttribute("aria-current"));
    return { ok: (await page.evaluate(() => location.hash)) === "#/learn" && cur === "page" };
  });
  await step("Navigation : Profil (bouton du haut)", async () => {
    await page.click("#topProfile");
    await page.waitForSelector("#view-profil.active");
    return { ok: (await page.evaluate(() => location.hash)) === "#/profil" };
  });
  await step("Paramètres par la roue dentée", async () => {
    await page.click("#topSettings");
    await page.waitForSelector("#view-parametres.active");
    const push = await page.textContent("#pushState");
    return { ok: !!push, detail: "état des appels affiché : « " + push + " »" };
  });
  await page.screenshot({ path: path.join(OUT, "telephone-parametres.png") });
  await page.goto(URL_EW + "#/accueil");
  await page.waitForSelector("#view-accueil.active");
  await page.screenshot({ path: path.join(OUT, "telephone-accueil.png") });

  await step("Accueil → carte TALK : TALK s'ouvre en pleine page et répond au toucher", async () => {
    await page.tap("#cardTalk");
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 10000 });
    await page.waitForSelector("#tileMsg");
    const emb = await page.evaluate(() => document.documentElement.classList.contains("embedded"));
    await page.waitForSelector(".bbar");
    await page.tap("#tileMsg");
    await page.waitForSelector("#net.view.active", { timeout: 5000 });
    await page.screenshot({ path: path.join(OUT, "telephone-talk.png") });
    return { ok: !emb, detail: "adresse " + page.url().replace(ORIGIN, "") + ", Messagerie ouverte" };
  });
  await step("TALK dans la coquille : la même barre du bas (Messagerie active), barre du haut, une seule barre", async () => {
    const r = await page.evaluate(() => {
      const nav = document.querySelector(".bbar");
      const labels = [...nav.querySelectorAll("button > span")].map((a) => a.textContent.trim()).join(",");
      const cur = nav.querySelector('[aria-current="page"]');
      const nr = nav.getBoundingClientRect();
      return { shell: document.documentElement.classList.contains("ew-shell"), labels, cur: cur && cur.dataset.b, other: !!document.getElementById("ewsNav"),
        bottom: Math.round(nr.bottom) === innerHeight, top: !!document.getElementById("ewsTop"),
        sizes: [...nav.querySelectorAll("button")].every((a) => a.getBoundingClientRect().height >= 44) };
    });
    return { ok: r.shell && r.labels === "Accueil,Messagerie,Téléphone,Traduire,Apprendre" && r.cur === "msg" && !r.other && r.bottom && r.top && r.sizes, detail: r.labels + " · actif : " + r.cur };
  });
  await step("Roue dentée de la coquille dans TALK : ouvre les réglages de TALK", async () => {
    await page.tap("#ewsSettings");
    await page.waitForSelector("#settings.view.active", { timeout: 5000 });
    return { ok: true };
  });
  await step("Depuis TALK, Apprendre ouvre LEARN, puis Messagerie ramène dans TALK", async () => {
    await page.tap('.bbar button[data-b="learn"]');
    await page.waitForSelector("#view-learn.active", { timeout: 10000 });
    await page.tap('#mainnav a[data-nav="msg"]');
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 10000 });
    await page.waitForSelector("#net.view.active", { timeout: 10000 });
    return { ok: true, detail: "TALK, puis LEARN, puis la messagerie" };
  });
  await step("Retour arrière : LEARN puis TALK", async () => {
    await page.goBack();
    await page.waitForFunction(() => /everywhere/.test(location.pathname), null, { timeout: 10000 });
    await page.goBack();
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 10000 });
    return { ok: true };
  });
  await step("Ancienne adresse #/app/talk → TALK en pleine page", async () => {
    await page.goto(URL_EW + "#/app/talk");
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 10000 });
    return { ok: true };
  });
  await page.goto(URL_EW + "#/accueil");
  await page.waitForSelector("#view-accueil.active");
  await step("Profil sans compte : invitation à créer son profil dans TALK", async () => {
    await page.evaluate(() => localStorage.removeItem("lc_net_auth")); // appareil sans compte : seul #/profil reste ouvert
    await page.click("#topProfile");
    await page.waitForSelector("#profileCard #cxCreate", { timeout: 20000 });
    const txt = await page.textContent("#profileCard");
    return { ok: /pas encore de profil/.test(txt), detail: txt.trim().slice(0, 60) };
  });
  await step("« Créer mon profil » ouvre la messagerie de TALK", async () => {
    await page.click("#profileCard #cxCreate");
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 10000 });
    await page.evaluate(() => localStorage.setItem("lc_net_auth", "fake")); // de nouveau inscrit pour la suite
    await page.goto(URL_EW + "#/accueil");
    return { ok: true };
  });
  await step("Sécurité du pont : message d'une autre origine ignoré", async () => {
    await page.goto(URL_EW + "#/accueil");
    await page.waitForSelector("#view-accueil.active");
    await page.evaluate(() => window.dispatchEvent(new MessageEvent("message", { data: { t: "ew:ring" }, origin: "https://pirate.example" })));
    await sleep(300);
    return { ok: (await page.evaluate(() => location.hash)) === "#/accueil" };
  });
  await step("Adresse inconnue → page « introuvable »", async () => {
    await page.goto(URL_EW + "#/nimporte-quoi");
    await page.waitForSelector("#view-404.active");
    await page.goto(URL_EW + "#/app/inconnue");
    await page.waitForSelector("#view-404.active");
    return { ok: true };
  });
  await step("Page Applications : TALK, EVERYWHERE, LEARN et AI LAB ; #/app/everywhere mène à EVERYWHERE", async () => {
    await page.goto(URL_EW + "#/applications");
    await page.waitForSelector("#view-applications.active");
    const names = await page.$$eval("#appList .app-card b", (n) => n.map((b) => b.textContent));
    await page.goto(URL_EW + "#/app/everywhere");
    await page.waitForSelector("#view-everywhere.active");
    return { ok: names.join(",") === "24/24 TALK,24/24 EVERYWHERE,24/24 LEARN,24/24 AI LAB" && (await page.evaluate(() => location.hash)) === "#/everywhere", detail: names.join(", ") };
  });
  await step("Pas de défilement horizontal (téléphone, tous les écrans)", async () => {
    const bad = [];
    for (const r of ["#/accueil", "#/applications", "#/profil", "#/parametres", "#/everywhere", "#/everywhere/face", "#/everywhere/appel", "#/everywhere/langues", "#/everywhere/reglages",
      "#/learn", "#/learn/apprendre", "#/learn/lecon/en-deb-1", "#/learn/progression", "#/learn/conversation"]) {
      await page.goto(URL_EW + r);
      await page.waitForSelector(".view.active");
      await sleep(250);
      const w = await page.evaluate(() => { const v = document.querySelector(".view.active"); return [document.documentElement.scrollWidth, innerWidth, v.scrollWidth, v.clientWidth]; });
      if (w[0] > w[1] || w[2] > w[3]) bad.push(r + " " + w.join("/"));
    }
    return { ok: !bad.length, detail: bad.join("; ") || "14 écrans vérifiés à 393 px" };
  });
  await step("Aucune erreur JavaScript dans le portail", async () => ({ ok: page._errors.length === 0, detail: page._errors.join(" | ").slice(0, 200) }));

  // ---------- PWA ----------
  await step("Manifeste valide (nom, start_url, standalone, icônes 192/512/maskable)", async () => {
    const m = await page.evaluate(async () => (await fetch("manifest.webmanifest")).json());
    const sizes = m.icons.map((i) => i.sizes + ":" + (i.purpose || "any"));
    return { ok: m.scope === "../" && m.display === "standalone" && !!m.start_url && sizes.includes("192x192:any") && sizes.includes("512x512:any") && sizes.includes("512x512:maskable"), detail: m.name };
  });
  await step("Icônes : fichiers présents et aux bonnes dimensions", async () => {
    const dims = await page.evaluate(async () => {
      const out = [];
      for (const [src, s] of [["icons/icon-192.png", 192], ["icons/icon-512.png", 512], ["icons/maskable-512.png", 512], ["icons/apple-touch-icon.png", 180]]) {
        const img = new Image(); img.src = src; await img.decode(); out.push(img.naturalWidth === s && img.naturalHeight === s);
      }
      return out;
    });
    return { ok: dims.every(Boolean) };
  });
  await step("Service worker du portail actif, coquille mise en cache", async () => {
    await page.goto(URL_EW);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await sleep(500);
    const cacheName = /var CACHE = "([^"]+)"/.exec(fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8"))[1];
    const keys = await page.evaluate(async (n) => { const c = await caches.open(n); return (await c.keys()).map((r) => new URL(r.url).pathname); }, cacheName);
    const priv = keys.filter((k) => !/everywhere\/|terre-tech/.test(k));
    return { ok: keys.length >= 10 && !priv.length, detail: keys.length + " fichiers publics en cache, aucun hors du portail" };
  });
  await step("Hors ligne : le portail s'ouvre quand même, avec un bandeau", async () => {
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForSelector("#view-accueil.active");
    const off = await page.isVisible("#offline");
    await ctx.setOffline(false);
    return { ok: off };
  });
  await step("Liens et ressources du portail : tous accessibles", async () => {
    await page.goto(URL_EW);
    const urls = await page.evaluate(() => [...document.querySelectorAll("a[href], img[src], link[href]:not([rel=preconnect]), script[src]")]
      .map((e) => e.href || e.src).filter((u) => u && !u.includes("#")));
    const bad = [];
    for (const u of [...new Set(urls)]) { const r = await page.request.get(u); if (r.status() !== 200) bad.push(r.status() + " " + u); }
    return { ok: !bad.length, detail: bad.join(", ") || urls.length + " ressources" };
  });
  await ctx.close();

  // ---------- Compte connecté (faux client Supabase, aucune donnée réelle) ----------
  ctx = await newCtx({}, true);
  await ctx.addInitScript(() => { try { localStorage.setItem("lc_net_joined", "1"); if (localStorage.getItem("lc_net_auth") === null) localStorage.setItem("lc_net_auth", "fake"); } catch (e) {} });
  page = await openPortal(ctx, "#/profil");
  await step("Profil connecté : pseudo et langue lus dans TALK (pas de copie)", async () => {
    await page.waitForFunction(() => /@sebtest/.test(document.querySelector("#profileCard").textContent), null, { timeout: 25000 });
    const txt = (await page.textContent("#profileCard")).trim();
    const keys = await page.evaluate(() => Object.keys(localStorage));
    const copies = keys.filter((k) => /^ew/i.test(k));
    return { ok: /Français/.test(txt) && !copies.length, detail: txt.replace(/\s+/g, " ").slice(0, 70) + " · aucune donnée recopiée par le portail" };
  });
  await page.screenshot({ path: path.join(OUT, "telephone-profil.png") });

  // ---------- CONNECT (faux serveur : le bon code est 123456) ----------
  const card = (p) => p.textContent("#profileCard");
  await step("CONNECT : compte sans e-mail signalé honnêtement, appareils listés", async () => {
    await page.waitForSelector("#cxDevices .cx-dev", { timeout: 15000 });
    const txt = await card(page);
    const devs = await page.$$eval("#cxDevices .cx-dev", (n) => n.map((d) => d.textContent.replace(/\s+/g, " ").trim()));
    const honest = /n'est relié à aucune adresse e-mail/.test(txt) && /ne pourra pas être retrouvé/.test(txt) && !/entièrement récupérable/.test(txt);
    return { ok: honest && devs.length === 2 && /Cet appareil/.test(devs[0]) && /Windows · Chrome/.test(devs[1]) && /restent sur cet appareil/.test(txt), detail: devs.join(" | ") };
  });
  await step("CONNECT : « Sécuriser mon compte » refuse une adresse invalide et une adresse déjà prise", async () => {
    await page.click("#cxSecure");
    await page.fill("#cxEmail", "pas-une-adresse");
    await page.click("#cxSend");
    const a = await page.textContent("#cxMsg");
    await page.fill("#cxEmail", "pris@exemple.fr");
    await page.click("#cxSend");
    await page.waitForFunction(() => /déjà reliée/.test(document.querySelector("#cxMsg").textContent));
    return { ok: /invalide/.test(a), detail: (await page.textContent("#cxMsg")).trim().slice(0, 60) };
  });
  await step("CONNECT : code faux refusé, bon code accepté, compte sécurisé", async () => {
    await page.fill("#cxEmail", "sebastien@exemple.fr");
    await page.click("#cxSend");
    await page.waitForSelector("#cxCode");
    await page.fill("#cxCode", "000000");
    await page.click("#cxVerify");
    await page.waitForFunction(() => /incorrect ou expiré/.test(document.querySelector("#cxMsg").textContent));
    await page.fill("#cxCode", "123456");
    await page.click("#cxVerify");
    await page.waitForSelector("#profileCard .cx-ok", { timeout: 10000 });
    const txt = await card(page);
    return { ok: /relié à se•••@exemple\.fr/.test(txt) && /Compte sécurisé/.test(txt) && !(await page.$("#cxSecure")), detail: (await page.textContent("#profileCard .cx-ok")).trim() };
  });
  await page.screenshot({ path: path.join(OUT, "connect-securise.png") });
  await step("CONNECT : déconnecter l'autre appareil (deux appuis)", async () => {
    await page.waitForSelector("#cxDevices [data-out]");
    await page.click("#cxDevices [data-out]");
    const sure = await page.textContent("#cxDevices [data-out]");
    await page.click("#cxDevices [data-out]");
    await page.waitForFunction(() => /Aucun autre appareil/.test(document.querySelector("#cxDevices").textContent));
    const n = await page.$$eval("#cxDevices .cx-dev", (x) => x.length);
    return { ok: /Confirmer/.test(sure) && n === 1, detail: (await page.textContent("#cxDevices .cx-msg")).trim().slice(0, 70) };
  });
  await step("CONNECT : aucune erreur JavaScript dans le portail", async () => ({ ok: !page._errors.length, detail: page._errors.join(" | ").slice(0, 160) || "aucune" }));
  await ctx.close();

  // ---------- CONNECT : nouvel appareil (aucune session enregistrée) ----------
  SEED_AUTH = false;
  ctx = await newCtx({}, true);
  SEED_AUTH = true;
  page = await openPortal(ctx, "#/profil");
  await step("Nouvel appareil : invitation affichée sans attendre le serveur", async () => {
    await page.waitForSelector("#cxHave", { timeout: 5000 });
    return { ok: /pas encore de profil/.test(await card(page)) };
  });
  await step("Nouvel appareil : adresse inconnue refusée, adresse reliée + code → compte retrouvé", async () => {
    await page.click("#cxHave");
    await page.fill("#cxEmail", "inconnu@exemple.fr");
    await page.click("#cxSend");
    await page.waitForFunction(() => /Aucun compte/.test(document.querySelector("#cxMsg").textContent));
    await page.fill("#cxEmail", "connu@exemple.fr");
    await page.click("#cxSend");
    await page.waitForSelector("#cxCode");
    await page.fill("#cxCode", "123456");
    await page.click("#cxVerify");
    await page.waitForFunction(() => /Connecté : bienvenue @sebtest/.test(document.querySelector("#profileCard").textContent), null, { timeout: 10000 });
    const joined = await page.evaluate(() => localStorage.getItem("lc_net_joined"));
    return { ok: joined === "1" && /Compte sécurisé/.test(await card(page)), detail: "TALK se reconnectera à ce compte" };
  });
  await page.screenshot({ path: path.join(OUT, "connect-nouvel-appareil.png") });
  await step("Lien de l'e-mail : l'e-mail renvoie vers le portail (Profil)", async () => {
    const r = await page.evaluate(() => localStorage.getItem("fake_redirect"));
    return { ok: r === URL_EW, detail: r };
  });
  await step("Lien « J'ai déjà un compte » de TALK : ouvre directement la connexion", async () => {
    await page.evaluate(() => { localStorage.removeItem("fake_sb"); localStorage.removeItem("lc_net_auth"); sessionStorage.setItem("ew_connect_login", "1"); });
    await page.goto("about:blank"); // sans compte, #/accueil renverrait vers l'inscription : on recharge directement sur #/profil
    await page.goto(URL_EW + "#/profil");
    await page.waitForSelector("#cxEmail", { timeout: 5000 });
    const left = await page.evaluate(() => sessionStorage.getItem("ew_connect_login"));
    const src = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
    return { ok: left === null && /id="netHaveAccount"/.test(src) && /ew_connect_login/.test(src) };
  });
  await ctx.close();

  // ---------- CONNECT : retour par le lien de l'e-mail ----------
  ctx = await newCtx({}, true);
  page = await openPortal(ctx, "#access_token=aaa.bbb.ccc&expires_in=3600&refresh_token=rrr&token_type=bearer&type=magiclink");
  await step("Lien de l'e-mail (nouvel appareil) : compte retrouvé, jeton effacé de l'adresse", async () => {
    await page.waitForFunction(() => /Connecté : bienvenue @sebtest/.test(document.querySelector("#profileCard").textContent), null, { timeout: 10000 });
    const r = await page.evaluate(() => ({ h: location.hash, j: localStorage.getItem("lc_net_joined") }));
    return { ok: r.h === "#/profil" && r.j === "1" && !page._errors.length, detail: "adresse : " + r.h };
  });
  await ctx.close();
  ctx = await newCtx({}, true);
  page = await openPortal(ctx, "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
  await step("Lien de l'e-mail périmé : message clair, rien d'autre ne change", async () => {
    await page.waitForFunction(() => /n'a pas fonctionné/.test(document.querySelector("#profileCard").textContent), null, { timeout: 10000 });
    const txt = await page.textContent("#profileCard .cx-msg");
    return { ok: /expired/.test(txt) && (await page.evaluate(() => location.hash)) === "#/profil", detail: txt.trim().slice(0, 80) };
  });
  await step("Lien de confirmation (email_change) arrivé sur l'adresse principale : reste dans TALK, Messagerie ouverte", async () => {
    await page.goto(ORIGIN + BASE + "#access_token=aaa.bbb.ccc&refresh_token=rrr&type=email_change");
    await page.waitForFunction(() => !/access_token/.test(location.hash) && document.querySelector('button[data-b="msg"].on, button[data-b="msg"][aria-current], button[data-b="msg"][aria-selected="true"]'), null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const u = new URL(page.url());
    return { ok: !/everywhere/.test(u.pathname) && !/access_token/.test(u.hash), detail: u.pathname + u.hash };
  });
  await step("Lien de connexion (autre type) arrivé sur l'adresse principale : renvoyé vers Profil", async () => {
    await page.goto("about:blank");
    await page.goto(ORIGIN + BASE + "#access_token=aaa.bbb.ccc&refresh_token=rrr&type=magiclink");
    await page.waitForFunction(() => /everywhere/.test(location.pathname), null, { timeout: 15000 });
    return { ok: /everywhere\/$/.test(new URL(page.url()).pathname), detail: new URL(page.url()).pathname + new URL(page.url()).hash };
  });
  await ctx.close();

  // ---------- EVERYWHERE : apprendre (phase 1 + MVP de la phase 2) ----------
  const CONTENT = path.join(__dirname, "..", "learn", "content");
  const CAT = JSON.parse(fs.readFileSync(path.join(CONTENT, "catalogue.json"), "utf8"));
  const LESSONS = {};
  CAT.languages.filter((l) => l.status === "available").forEach((l) => { LESSONS[l.id] = JSON.parse(fs.readFileSync(path.join(CONTENT, l.file), "utf8")).lessons; });
  await step("Contenus : chaque exercice a une réponse parmi ses choix, chaque langue a des leçons aux 3 niveaux", async () => {
    const bad = [];
    let nLessons = 0, nEx = 0;
    for (const [code, ls] of Object.entries(LESSONS)) {
      for (const lv of CAT.levels) if (!ls.some((l) => l.level === lv.id)) bad.push(code + " sans leçon " + lv.id);
      for (const l of ls) {
        nLessons++;
        if (!l.id.startsWith(code + "-") || !l.vocab.length || !l.exercises.length) bad.push(l.id + " incomplète");
        for (const ex of l.exercises) {
          nEx++;
          if (ex.type === "match") { if (ex.pairs.length < 3) bad.push(l.id + " paires"); continue; }
          if (!ex.options.includes(ex.answer) || new Set(ex.options).size !== ex.options.length) bad.push(l.id + " : " + ex.answer);
          if (ex.type === "complete" && ex.sentence.split("___").length !== 2) bad.push(l.id + " phrase à trou");
        }
      }
    }
    return { ok: !bad.length, detail: bad.join(", ") || Object.keys(LESSONS).length + " langues, " + nLessons + " leçons, " + nEx + " exercices" };
  });

  ctx = await newCtx();
  page = await openPortal(ctx);
  // Répond à l'exercice affiché. wrong = true : choisit volontairement une mauvaise réponse.
  async function answer(p, ex, wrong) {
    if (ex.type === "match") {
      for (let i = 0; i < ex.pairs.length; i++) {
        await p.tap('#lxEx .lx-m[data-side="l"][data-i="' + i + '"]');
        await p.tap('#lxEx .lx-m[data-side="r"][data-i="' + i + '"]');
      }
      return;
    }
    const target = wrong ? ex.options.find((o) => o !== ex.answer) : ex.answer;
    const opts = await p.$$("#lxEx .lx-opt");
    for (const o of opts) if ((await o.textContent()).trim() === target) { await o.tap(); return; }
    throw new Error("option introuvable : " + target);
  }
  await step("Hub EVERYWHERE → « Apprendre une langue » → tableau de bord LEARN (modules, invitation à choisir une langue)", async () => {
    await page.tap("#cardEverywhere");
    await page.waitForSelector("#view-everywhere.active #ewGoLearn");
    await page.tap("#ewGoLearn");
    await page.waitForSelector("#view-learn.active #lxStart", { timeout: 10000 });
    const mods = await page.$$eval("#view-learn .lx-mod", (n) => n.map((m) => m.textContent.replace(/\s+/g, " ").trim()));
    const soon = mods.filter((m) => /Bientôt/.test(m));
    const cur = await page.$eval('#mainnav a[data-nav="learn"]', (a) => a.getAttribute("aria-current"));
    await page.screenshot({ path: path.join(OUT, "learn-tableau-de-bord.png") });
    return { ok: mods.length === 6 && soon.length === 2 && /Conversation avec l'IA/.test(soon[0]) && /Cultures du monde/.test(soon[1]) && cur === "page" && (await page.evaluate(() => location.hash)) === "#/learn",
      detail: "6 modules, dont 2 marqués « Bientôt » (IA, cultures)" };
  });
  await step("Choix de la langue (anglais) et du niveau (débutant) : leçons du niveau affichées", async () => {
    await page.tap("#lxStart");
    await page.waitForSelector("#view-learn [data-lang]");
    const soonLangs = await page.$$eval("#view-learn [data-lang]:disabled", (n) => n.length);
    await page.tap('#view-learn [data-lang="en"]');
    await page.waitForSelector("#lxLessons .lx-lesson");
    const checked = await page.$eval('#view-learn [data-lang="en"]', (b) => b.getAttribute("aria-checked"));
    const lvl = await page.$eval('#view-learn [data-level="debutant"]', (b) => b.getAttribute("aria-checked"));
    const n = await page.$$eval("#lxLessons .lx-lesson", (x) => x.length);
    await page.tap('#view-learn [data-level="avance"]');
    await page.waitForFunction(() => /Expressions idiomatiques/.test(document.querySelector("#lxLessons").textContent));
    await page.tap('#view-learn [data-level="debutant"]');
    await page.waitForFunction(() => document.querySelectorAll("#lxLessons .lx-lesson").length === 3);
    await page.screenshot({ path: path.join(OUT, "learn-apprendre.png") });
    const want = LESSONS.en.filter((l) => l.level === "debutant").length;
    return { ok: checked === "true" && lvl === "true" && n === want && soonLangs === 2, detail: n + " leçons débutant, niveau avancé vérifié, 2 langues « Bientôt » non sélectionnables" };
  });
  const L1 = LESSONS.en[0];
  await step("Leçon : vocabulaire, expressions courantes, boutons d'écoute, puis exercices", async () => {
    await page.tap('#lxLessons a[href="#/learn/lecon/' + L1.id + '"]');
    await page.waitForSelector("#lxGo");
    const words = await page.$$eval("#view-learn .lx-word", (n) => n.length);
    const says = await page.$$eval("#view-learn .lx-word [data-say]", (n) => n.length);
    const h1 = await page.textContent("#view-learn h1");
    await page.screenshot({ path: path.join(OUT, "learn-lecon.png") });
    return { ok: words === L1.vocab.length + L1.phrases.length && says === words && h1.includes(L1.title), detail: words + " mots et phrases, chacun avec son bouton d'écoute" };
  });
  await step("Exercice : une mauvaise réponse est signalée en texte, avec la bonne réponse", async () => {
    await page.tap("#lxGo");
    await page.waitForSelector("#lxEx .lx-opt");
    await answer(page, L1.exercises[0], true);
    await page.waitForSelector("#lxNext:not([hidden])");
    const fb = (await page.textContent("#lxFb")).trim();
    const good = await page.$eval("#lxEx .lx-opt.good", (b) => b.textContent.trim());
    const dis = await page.$$eval("#lxEx .lx-opt", (n) => n.every((b) => b.disabled));
    await page.screenshot({ path: path.join(OUT, "learn-exercice-faux.png") });
    return { ok: fb.includes("La bonne réponse : " + L1.exercises[0].answer) && good.startsWith(L1.exercises[0].answer) && dis, detail: fb };
  });
  await step("Exercices suivants (associer, compléter, écouter, expression) : réussis, puis résultat affiché", async () => {
    const types = [];
    for (let i = 1; i < L1.exercises.length; i++) {
      await page.tap("#lxNext");
      await page.waitForFunction((n) => document.querySelector(".lx-count") && document.querySelector(".lx-count").textContent.includes(String(n)), i + 1);
      const ex = L1.exercises[i];
      types.push(ex.type);
      await answer(page, ex, false);
      await page.waitForSelector("#lxNext:not([hidden])");
      const fb = await page.$eval("#lxFb", (f) => f.className);
      if (!/ok/.test(fb)) throw new Error("exercice " + (i + 1) + " non validé");
      if (i === 1) await page.screenshot({ path: path.join(OUT, "learn-exercice-associer.png") });
    }
    await page.tap("#lxNext");
    await page.waitForSelector("#lxScore");
    const score = (await page.textContent("#lxScore")).trim();
    const stars = await page.$eval(".lx-stars", (s) => s.getAttribute("aria-label"));
    await page.screenshot({ path: path.join(OUT, "learn-resultat.png") });
    const n = L1.exercises.length;
    return { ok: score === (n - 1) + " bonnes réponses sur " + n && stars === "2 / 3" && !!(await page.$("#lxNextLesson")), detail: score + " · types : " + [...new Set(types)].join(", ") };
  });
  await step("Progression consultable : XP, leçon terminée, exercices, historique", async () => {
    await page.goto(URL_EW + "#/learn/progression");
    await page.waitForSelector("#lxStXp");
    const r = await page.evaluate(() => ({ xp: document.querySelector("#lxStXp b").textContent, les: document.querySelector("#lxStLessons b").textContent,
      ex: document.querySelector("#lxStEx b").textContent, hist: document.querySelector("#lxHist") && document.querySelector("#lxHist").textContent }));
    await page.screenshot({ path: path.join(OUT, "learn-progression.png"), fullPage: true });
    const n = L1.exercises.length, xp = (n - 1) * 10 + 20;
    return { ok: r.xp === String(xp) && r.les === "1" && r.ex === String(n) && r.hist && r.hist.includes(L1.title), detail: r.xp + " XP, " + r.les + " leçon, " + r.ex + " exercices, historique à jour" };
  });
  await step("Progression gardée après fermeture et réouverture de la page", async () => {
    await page.reload();
    await page.waitForSelector("#lxStXp");
    await page.goto(URL_EW + "#/learn/apprendre");
    await page.waitForSelector("#lxLessons .badge.ok");
    const b = await page.textContent("#lxLessons .badge.ok");
    return { ok: /Terminée · 5\/6/.test(b), detail: b.trim() };
  });
  await step("Tableau de bord : leçon suivante proposée, objectif du jour", async () => {
    await page.goto(URL_EW + "#/learn");
    await page.waitForSelector("#lxContinue");
    const href = await page.getAttribute("#lxContinue", "href");
    const bar = await page.$eval("#view-learn .lx-today [role=progressbar]", (b) => b.getAttribute("aria-valuenow"));
    return { ok: href === "#/learn/lecon/" + LESSONS.en[1].id && +bar > 0, detail: "suivante : " + LESSONS.en[1].title };
  });
  await step("Réviser : questions tirées de la leçon terminée (dont le mot raté)", async () => {
    await page.goto(URL_EW + "#/learn/reviser");
    await page.tap("#lxGo");
    await page.waitForSelector("#lxEx .lx-q");
    const pool = L1.vocab.map((v) => v.w).concat(L1.vocab.map((v) => v.t));
    let seenMissed = false, n = 0;
    for (;;) {
      n++;
      const q = await page.evaluate(() => ({ q: document.querySelector("#lxEx .lx-q").textContent, e: (document.querySelector("#lxEx .lx-expr span") || {}).textContent || "", o: [...document.querySelectorAll("#lxEx .lx-opt")].map((b) => b.textContent.trim()) }));
      if (/Thank you|Merci/.test(q.q + q.e + q.o.join())) seenMissed = true;
      if (!q.o.every((o) => pool.includes(o))) throw new Error("choix hors leçon : " + q.o.join(" | "));
      await page.tap("#lxEx .lx-opt");
      await page.waitForSelector("#lxNext:not([hidden])");
      const last = /résultat/.test(await page.textContent("#lxNext"));
      await page.tap("#lxNext");
      if (last) break;
      await page.waitForFunction((k) => document.querySelector(".lx-count") && document.querySelector(".lx-count").textContent.startsWith("Exercice " + k), n + 1);
    }
    await page.waitForSelector("#lxScore");
    return { ok: n === 6 && seenMissed, detail: n + " questions, le mot raté (« Thank you ») revient en révision" };
  });
  await step("Défi rapide : 8 questions, résultat affiché", async () => {
    await page.goto(URL_EW + "#/learn/defi");
    await page.tap("#lxGo");
    for (let i = 0; i < 8; i++) {
      await page.waitForSelector("#lxEx .lx-opt:not([disabled])");
      await page.tap("#lxEx .lx-opt");
      await page.waitForSelector("#lxNext:not([hidden])");
      await page.tap("#lxNext");
    }
    await page.waitForSelector("#lxScore");
    return { ok: /sur 8$/.test((await page.textContent("#lxScore")).trim()) };
  });
  await step("Conversation avec l'IA et Cultures : annoncées « Bientôt », sans fausse IA ni clé dans le site", async () => {
    await page.goto(URL_EW + "#/learn/conversation");
    await page.waitForSelector("#view-learn .lx-soon");
    const txt = await page.textContent("#view-learn");
    const inputs = await page.$$eval("#view-learn input, #view-learn textarea", (n) => n.length);
    const src = ["learn/learn.js", "learn/exercises.js", "learn/progress.js", "app.js", "config.js"].map((f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8")).join("\n");
    const secret = /sk-ant-|sk-[A-Za-z0-9]{20}|service_role|api[_-]?key\s*[:=]/i.test(src);
    await page.goto(URL_EW + "#/learn/cultures");
    await page.waitForSelector("#view-learn .lx-soon");
    return { ok: /Bientôt/.test(txt) && /clé doit rester secrète/.test(txt) && inputs === 0 && !secret, detail: "aucune zone de saisie simulée, aucune clé dans le code" };
  });
  await step("Clavier : un exercice se fait entièrement au clavier (Tab, Entrée)", async () => {
    await page.goto(URL_EW + "#/learn/lecon/" + L1.id);
    await page.waitForSelector("#lxGo");
    await page.focus("#lxGo");
    await page.keyboard.press("Enter");
    await page.waitForSelector("#lxEx .lx-opt");
    const focusedQ = await page.evaluate(() => document.activeElement.classList.contains("lx-q"));
    await page.keyboard.press("Tab");
    const onOpt = await page.evaluate(() => document.activeElement.classList.contains("lx-opt"));
    await page.keyboard.press("Enter");
    await page.waitForSelector("#lxNext:not([hidden])");
    const onNext = await page.evaluate(() => document.activeElement.id === "lxNext");
    const live = await page.$eval("#lxFb", (f) => f.getAttribute("aria-live"));
    return { ok: focusedQ && onOpt && onNext && live === "polite", detail: "question annoncée, choix au clavier, résultat lu par le lecteur d'écran" };
  });
  await step("Accessibilité : taille du texte, contraste renforcé et thème sombre (Paramètres)", async () => {
    await page.goto(URL_EW + "#/parametres");
    await page.waitForSelector("#view-parametres.active");
    await page.tap('button[data-ts="2"]');
    await page.tap("#contrastToggle");
    await page.tap('button[data-theme="dark"]');
    const r = await page.evaluate(() => ({ ts: document.documentElement.getAttribute("data-ts"), c: document.documentElement.classList.contains("contrast-high"),
      dark: document.documentElement.classList.contains("theme-dark"), zoom: getComputedStyle(document.querySelector("#view-parametres .pad")).zoom, bg: getComputedStyle(document.body).backgroundColor }));
    await page.screenshot({ path: path.join(OUT, "parametres-accessibilite.png") });
    await page.goto(URL_EW + "#/learn");
    await page.reload();
    await page.waitForSelector("#view-learn .lx-mods");
    const kept = await page.evaluate(() => document.documentElement.getAttribute("data-ts") === "2" && document.documentElement.classList.contains("theme-dark"));
    const sw = await page.evaluate(() => { const v = document.querySelector(".view.active"); return v.scrollWidth <= v.clientWidth && document.documentElement.scrollWidth <= innerWidth; });
    await page.screenshot({ path: path.join(OUT, "learn-grand-texte-sombre.png") });
    await page.evaluate(() => { localStorage.removeItem("ew_prefs"); });
    return { ok: r.ts === "2" && r.c && r.dark && +r.zoom > 1.2 && r.bg === "rgb(7, 11, 28)" && kept && sw, detail: "texte ×" + r.zoom + ", réglages gardés après rechargement, pas de défilement horizontal" };
  });
  await step("LEARN : aucune erreur JavaScript", async () => ({ ok: !page._errors.length, detail: page._errors.join(" | ").slice(0, 200) || "aucune" }));
  await ctx.close();

  // ---------- EVERYWHERE : conversation côte à côte et appel traduit via TALK ----------
  // Micro, voix et traduction simulés : reconnaissance vocale factice (dit window.__say), voix enregistrée dans window.__spoken,
  // service de traduction MyMemory remplacé par un petit dictionnaire (aucun accès Internet).
  const DICT = { "fr|en": { "Où est la gare ?": "Where is the train station?", "Bonjour": "Hello" }, "en|fr": { "It's straight ahead.": "C'est tout droit." } };
  async function ewCtx(opts, fake, mm) {
    const c = await newCtx(opts, fake);
    await c.route(/api\.mymemory\.translated\.net/, (r) => {
      const u = new URL(r.request().url());
      if (mm === "down") return r.fulfill({ status: 500, body: "x" });
      const tr = (DICT[u.searchParams.get("langpair")] || {})[u.searchParams.get("q")] || "[" + u.searchParams.get("q") + "]";
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ responseData: { translatedText: tr } }) });
    });
    await c.addInitScript((noStt) => {
      window.__spoken = [];
      window.__srLangs = [];
      window.__srDelay = 150;
      if (noStt) { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; }
      else {
        window.SpeechRecognition = window.webkitSpeechRecognition = function () {
          const r = this;
          r.start = function () {
            window.__srLangs.push(r.lang);
            r._t = setTimeout(function () {
              const txt = (window.__sayQ && window.__sayQ.length) ? window.__sayQ.shift() : (window.__say || "");
              r.onresult && r.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: txt }], { isFinal: true })] });
              r.onend && r.onend();
            }, window.__srDelay);
          };
          r.stop = function () { clearTimeout(r._t); r.onend && r.onend(); };
          r.abort = function () { clearTimeout(r._t); };
        };
      }
      try { navigator.mediaDevices.getUserMedia = function () { return Promise.resolve({ getTracks: function () { return []; } }); }; } catch (e) {}
      const syn = window.speechSynthesis;
      // Voix factices (comme sur un téléphone) ; la fin de chaque phrase est annoncée 50 ms plus tard.
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      const VOICES = [{ name: "Voix locale", lang: "fr-FR", voiceURI: "l-fr" }, { name: "Google français", lang: "fr-FR", voiceURI: "g-fr" }, { name: "Google US English", lang: "en-US", voiceURI: "g-en" }];
      if (syn) {
        syn.getVoices = function () { return VOICES; };
        syn.speak = function (u) { window.__spoken.push({ t: u.text, l: u.lang, v: u.volume, r: u.rate, voice: u.voice && u.voice.voiceURI }); setTimeout(function () { u.onend && u.onend(); }, 50); };
        syn.cancel = function () {};
      }
      window.__shared = null;
      navigator.share = function (d) { window.__shared = d; return Promise.resolve(); };
    }, !!(opts && opts.noStt));
    return c;
  }
  ctx = await ewCtx();
  page = await openPortal(ctx, "#/accueil");
  const ewLog = (p, who) => p.$$eval('[data-log="' + who + '"] .tr-line', (n) => n.map((l) => ({ big: l.querySelector(".tr-big-txt").textContent, small: (l.querySelector(".tr-small-txt") || {}).textContent || "" })));
  await step("Tuile EVERYWHERE de l'accueil → hub EVERYWHERE : traduction (côte à côte, appeler sur TALK, mes langues, configurations) ET accès à LEARN", async () => {
    await page.tap("#cardEverywhere");
    await page.waitForSelector("#view-everywhere.active #trGoFace");
    const txt = (await page.textContent("#view-everywhere")).replace(/\s+/g, " ");
    const cur = "page"; // la barre du bas n'a plus d'entrée EVERYWHERE : on y va par la tuile de l'accueil
    const learnBits = await page.$$eval("#view-everywhere .lx-mod, #view-everywhere .lx-lesson", (n) => n.length);
    const links = await page.$$eval("#view-everywhere a[href]", (n) => n.map((a) => a.getAttribute("href")));
    await page.screenshot({ path: path.join(OUT, "everywhere-accueil.png") });
    return { ok: /Conversation côte à côte/.test(txt) && /Appeler sur TALK/.test(txt) && /Mes langues/.test(txt) && /Configurations/.test(txt) && /Apprendre une langue/.test(txt) && cur === "page" && learnBits === 0 &&
      ["#/everywhere/face", "#/everywhere/appel", "#/learn"].every((h) => links.includes(h)),
      detail: "liens : " + links.join(", ") };
  });
  await step("Hub EVERYWHERE : le lien LEARN disparaît dans la conversation côte à côte et revient au retour", async () => {
    await page.goto(URL_EW + "#/everywhere/langues");
    await page.waitForSelector("#view-everywhere.active h1");
    const inSub = await page.$("#ewGoLearn");
    await page.goto(URL_EW + "#/everywhere");
    await page.waitForSelector("#view-everywhere.active #ewGoLearn");
    const n = await page.$$eval("#ewGoLearn", (x) => x.length);
    return { ok: !inSub && n === 1, detail: "un seul lien LEARN, seulement sur le hub" };
  });
  await step("Mode A : écran coupé en deux, personne 1 en haut, personne 2 en bas, même sens de lecture, un micro chacun", async () => {
    await page.tap("#trGoFace");
    await page.waitForSelector("#trFace");
    const r = await page.evaluate(() => {
      const h2 = document.querySelector(".tr-half.p2"), h1 = document.querySelector(".tr-half.p1"), a = h1.getBoundingClientRect(), b = h2.getBoundingClientRect();
      const tr = [h2, h1, document.getElementById("trFace")].map((x) => getComputedStyle(x).transform);
      return { top: a.top < b.top, sameW: Math.abs(a.width - b.width) < 1, halfH: [Math.round(a.height), Math.round(b.height)], rot: tr.filter((x) => x !== "none").length,
        mics: document.querySelectorAll(".tr-half [data-mic]").length, l2: h2.querySelector("select").value, l1: h1.querySelector("select").value,
        who: [h1.querySelector(".tr-who").textContent, h2.querySelector(".tr-who").textContent], vh: innerHeight, sw: document.documentElement.scrollWidth <= innerWidth };
    });
    await page.screenshot({ path: path.join(OUT, "everywhere-cote-a-cote.png") });
    return { ok: r.top && r.sameW && r.rot === 0 && r.mics === 2 && r.l1 === "fr" && r.l2 === "en" && /Personne 1/.test(r.who[0]) && /Personne 2/.test(r.who[1]) && r.halfH[0] > 150 && r.halfH[1] > 150 && r.sw,
      detail: "haut " + r.halfH[0] + " px, bas " + r.halfH[1] + " px, aucune rotation, français en haut, anglais en bas" };
  });
  await step("Mode A : la personne 1 parle français → traduit en anglais en bas, lu à voix haute en anglais", async () => {
    await page.evaluate(() => { window.__say = "Où est la gare ?"; });
    await page.tap('[data-mic="1"]');
    await page.waitForFunction(() => window.__spoken.length === 1, null, { timeout: 5000 });
    const top = await ewLog(page, 2), bottom = await ewLog(page, 1);
    const sp = await page.evaluate(() => ({ s: window.__spoken[0], l: window.__srLangs[0] }));
    return { ok: top[0].big === "Where is the train station?" && top[0].small === "Où est la gare ?" && bottom[0].big === "Où est la gare ?" && bottom[0].small === "Where is the train station?" &&
      sp.l === "fr-FR" && sp.s.t === "Where is the train station?" && /^en/.test(sp.s.l), detail: "écoute en " + sp.l + ", voix " + sp.s.l };
  });
  await step("Mode A : la personne 2 répond en anglais → traduit en français en bas", async () => {
    await page.evaluate(() => { window.__say = "It's straight ahead."; });
    await page.tap('[data-mic="2"]');
    await page.waitForFunction(() => window.__spoken.length === 2, null, { timeout: 5000 });
    const bottom = await ewLog(page, 1);
    const sp = await page.evaluate(() => ({ s: window.__spoken[1], l: window.__srLangs[1] }));
    await page.screenshot({ path: path.join(OUT, "everywhere-cote-a-cote-conversation.png") });
    return { ok: bottom[1].big === "C'est tout droit." && bottom[1].small === "It's straight ahead." && sp.l === "en-US" && /^fr/.test(sp.s.l), detail: "« C'est tout droit. » lu en " + sp.s.l };
  });
  await step("Mode A : un seul micro à la fois (l'autre bouton l'explique)", async () => {
    await page.evaluate(() => { window.__srDelay = 1500; window.__say = "Bonjour"; });
    await page.tap('[data-mic="1"]');
    await page.waitForSelector('[data-mic="1"].on');
    await page.tap('[data-mic="2"]');
    const m = await page.textContent('[data-msg="2"]');
    await page.waitForFunction(() => window.__spoken.length === 3, null, { timeout: 5000 });
    await page.evaluate(() => { window.__srDelay = 150; });
    return { ok: /Un seul micro à la fois/.test(m), detail: m };
  });
  await step("Mode A : écrire au clavier (sans micro) est traduit aussi", async () => {
    await page.tap('[data-kb="1"]');
    await page.fill('[data-input="1"]', "Bonjour");
    await page.press('[data-input="1"]', "Enter");
    await page.waitForFunction(() => window.__spoken.length === 4, null, { timeout: 5000 });
    const top = await ewLog(page, 2);
    return { ok: top[top.length - 1].big === "Hello" };
  });
  await step("Mode A : son coupé (rien n'est lu), taille du texte agrandie, langues inversées", async () => {
    await page.tap("#trSound");
    await page.evaluate(() => { window.__say = "Bonjour"; });
    await page.tap('[data-mic="1"]');
    await page.waitForFunction(() => { const l = document.querySelectorAll('[data-log="2"] .tr-line'); return l.length && l[l.length - 1].querySelector(".tr-big-txt").textContent === "Hello"; }, null, { timeout: 5000 });
    await sleep(200);
    const n = await page.evaluate(() => window.__spoken.length);
    const f0 = await page.$eval('[data-log="2"] .tr-big-txt', (e) => parseFloat(getComputedStyle(e).fontSize));
    await page.tap("#trSize");
    const f1 = await page.$eval('[data-log="2"] .tr-big-txt', (e) => parseFloat(getComputedStyle(e).fontSize));
    await page.tap("#trSwap");
    const langs = await page.evaluate(() => [document.querySelector('[data-lang-of="1"]').value, document.querySelector('[data-lang-of="2"]').value]);
    await page.tap("#trSwap");
    await page.tap("#trSound");
    const p = await page.evaluate(() => JSON.parse(localStorage.getItem("ew_tr_v1")));
    return { ok: n === 4 && f1 > f0 && langs.join() === "en,fr" && p.sound === true && p.size === 1, detail: "texte " + f0 + " → " + f1 + " px, réglages gardés sur l'appareil" };
  });
  await step("Mes langues : choix enregistré et repris en côte à côte ; Configurations : volume appliqué à la voix", async () => {
    await page.goto(URL_EW + "#/everywhere/langues");
    await page.waitForSelector("#trOther");
    await page.selectOption("#trOther", "es");
    await page.goto(URL_EW + "#/everywhere/reglages");
    await page.waitForSelector("#trVol");
    await page.$eval("#trVol", (e) => { e.value = "40"; e.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.screenshot({ path: path.join(OUT, "everywhere-configurations.png") });
    await page.goto(URL_EW + "#/everywhere/face");
    await page.waitForSelector("#trFace");
    const l2 = await page.$eval('[data-lang-of="2"]', (e) => e.value);
    const n0 = await page.evaluate(() => { window.__say = "Bonjour"; return window.__spoken.length; });
    await page.tap('[data-mic="1"]');
    await page.waitForFunction((n) => window.__spoken.length > n, n0, { timeout: 5000 });
    const s = await page.evaluate(() => window.__spoken[window.__spoken.length - 1]);
    await page.evaluate(() => { localStorage.removeItem("ew_tr_v1"); });
    return { ok: l2 === "es" && /^es/.test(s.l) && Math.abs(s.v - 0.4) < 0.01, detail: "espagnol en haut, volume " + s.v };
  });
  await step("Écouteurs Bluetooth : seule la traduction destinée à la personne 1 est lue ; la personne 2 lit la sienne en haut", async () => {
    await page.goto(URL_EW + "#/everywhere/face");
    await page.reload(); // réglages par défaut (français en bas, anglais en haut)
    await page.waitForSelector("#trFace");
    await page.tap("#trOut");
    const note = await page.textContent('[data-msg="1"]');
    const out = await page.$eval("#trFace", (e) => e.getAttribute("data-out"));
    const n0 = await page.evaluate(() => { window.__say = "Où est la gare ?"; return window.__spoken.length; });
    await page.tap('[data-mic="1"]');
    await page.waitForFunction(() => { const l = document.querySelectorAll('[data-log="2"] .tr-big-txt'); return l.length && l[l.length - 1].textContent === "Where is the train station?"; }, null, { timeout: 5000 });
    await sleep(500);
    const n1 = await page.evaluate(() => window.__spoken.length);
    await page.evaluate(() => { window.__say = "It's straight ahead."; });
    await page.tap('[data-mic="2"]');
    await page.waitForFunction((n) => window.__spoken.length > n, n1, { timeout: 5000 });
    const s = await page.evaluate(() => window.__spoken[window.__spoken.length - 1]);
    await page.screenshot({ path: path.join(OUT, "everywhere-ecouteurs.png") });
    return { ok: out === "earbuds" && /Écouteurs/.test(note) && n1 === n0 && s.t === "C'est tout droit." && /^fr/.test(s.l),
      detail: "phrase de la personne 1 affichée sans être lue ; réponse lue en " + s.l };
  });
  await step("Répéter : relit la dernière traduction destinée à la personne 1", async () => {
    const n = await page.evaluate(() => window.__spoken.length);
    await page.tap('[data-replay="1"]');
    await page.waitForFunction((k) => window.__spoken.length > k, n, { timeout: 3000 });
    const s = await page.evaluate(() => window.__spoken[window.__spoken.length - 1]);
    return { ok: s.t === "C'est tout droit." && /^fr/.test(s.l), detail: s.t };
  });
  await step("Mains libres (haut-parleur) : après chaque phrase lue, le micro s'ouvre tout seul pour l'autre personne", async () => {
    await page.tap("#trOut");
    await page.tap("#trHands");
    const note = await page.textContent('[data-msg="1"]');
    const k = await page.evaluate(() => { window.__sayQ = ["Où est la gare ?", "It's straight ahead."]; window.__say = ""; return { sr: window.__srLangs.length, sp: window.__spoken.length }; });
    await page.tap('[data-mic="1"]');
    await page.waitForFunction((k) => window.__srLangs.length >= k.sr + 3 && window.__spoken.length >= k.sp + 2, k, { timeout: 8000 });
    const r = await page.evaluate((k) => ({ sr: window.__srLangs.slice(k.sr, k.sr + 3), sp: window.__spoken.slice(k.sp).map((x) => x.t) }), k);
    await page.tap("#trHands");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ew_tr_v1")));
    return { ok: /Mains libres/.test(note) && r.sr.join() === "fr-FR,en-US,fr-FR" && r.sp[0] === "Where is the train station?" && r.sp[1] === "C'est tout droit." && saved.hands === false && saved.out === "speaker",
      detail: "micros enchaînés : " + r.sr.join(" → ") };
  });
  await step("Configurations audio : haut-parleur ou écouteurs, vitesse et voix choisies appliquées, bouton Essayer", async () => {
    await page.goto(URL_EW + "#/everywhere/reglages");
    await page.waitForSelector("#trRate");
    const txt = (await page.textContent("#view-everywhere")).replace(/\s+/g, " ");
    await page.check('input[name="trOut"][value="earbuds"]');
    await page.$eval("#trRate", (e) => { e.value = "120"; e.dispatchEvent(new Event("input", { bubbles: true })); });
    const opts = await page.$$eval('[data-voice="fr"] option', (n) => n.map((o) => o.value));
    await page.selectOption('[data-voice="fr"]', "l-fr");
    const n = await page.evaluate(() => window.__spoken.length);
    await page.tap('[data-try="fr"]');
    await page.waitForFunction((k) => window.__spoken.length > k, n, { timeout: 3000 });
    const s = await page.evaluate(() => window.__spoken[window.__spoken.length - 1]);
    await page.screenshot({ path: path.join(OUT, "everywhere-configurations-audio.png"), fullPage: true });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ew_tr_v1")));
    await page.goto(URL_EW + "#/everywhere/face");
    await page.waitForSelector("#trFace");
    const out = await page.$eval("#trOut", (e) => e.textContent);
    await page.evaluate(() => { localStorage.removeItem("ew_tr_v1"); });
    return { ok: /Haut-parleur du téléphone/.test(txt) && /Écouteurs Bluetooth/.test(txt) && /ne pilote pas/.test(txt) && opts.join() === ",l-fr,g-fr" &&
      s.voice === "l-fr" && Math.abs(s.r - 1.2) < 0.01 && /24\/24 ONE WORLD/.test(s.t) && saved.out === "earbuds" && /Écouteurs/.test(out),
      detail: "voix " + s.voice + ", vitesse " + s.r + ", sortie gardée : " + saved.out };
  });
  await step("Voix automatique : la plus naturelle du téléphone est choisie", async () => {
    await page.reload();
    await page.waitForSelector("#trFace");
    const n = await page.evaluate(() => { window.__say = "It's straight ahead."; return window.__spoken.length; });
    await page.tap('[data-mic="2"]');
    await page.waitForFunction((k) => window.__spoken.length > k, n, { timeout: 5000 });
    const s = await page.evaluate(() => window.__spoken[window.__spoken.length - 1]);
    return { ok: s.voice === "g-fr" && s.r === 1, detail: s.voice };
  });
  await step("Mode A : quitter l'écran coupe le micro ; aucune erreur JavaScript", async () => {
    await page.goto(URL_EW + "#/accueil");
    await page.waitForSelector("#view-accueil.active");
    return { ok: !page._errors.length && !(await page.$("#trFace")), detail: page._errors.join(" | ").slice(0, 160) || "aucune" };
  });
  await ctx.close();

  ctx = await ewCtx(null, false, "down");
  page = await openPortal(ctx, "#/everywhere/face");
  await step("Mode A : service de traduction en panne → message clair, rien n'est lu", async () => {
    await page.waitForSelector("#trFace");
    await page.evaluate(() => { window.__say = "Bonjour"; });
    await page.tap('[data-mic="1"]');
    await page.waitForSelector('[data-log="2"] .tr-err', { timeout: 5000 });
    const e = await page.textContent('[data-log="2"] .tr-err');
    return { ok: /Traduction impossible/.test(e) && (await page.evaluate(() => window.__spoken.length)) === 0, detail: e };
  });
  await ctx.close();

  ctx = await ewCtx({ noStt: true });
  page = await openPortal(ctx, "#/everywhere/face");
  await step("Mode A : navigateur sans micro → explication et clavier proposé", async () => {
    await page.waitForSelector("#trFace");
    await page.tap('[data-mic="2"]');
    const m = await page.textContent('[data-msg="2"]');
    const open = await page.$eval('[data-type="2"]', (f) => !f.hidden);
    return { ok: /utilisez « Écrire »/.test(m) && open, detail: m.slice(0, 80) };
  });
  await ctx.close();

  ctx = await ewCtx();
  page = await openPortal(ctx, "#/everywhere/appel");
  await step("Appeler sur TALK sans accès au serveur : message et bouton Réessayer (pas de liste inventée)", async () => {
    await page.waitForSelector("#trRetry", { timeout: 10000 });
    return { ok: !(await page.$(".tr-ct")) };
  });
  await ctx.close();

  ctx = await ewCtx(null, true);
  await ctx.addInitScript(() => { localStorage.setItem("fake_contacts", "1"); localStorage.setItem("lc_net_joined", "1"); });
  page = await openPortal(ctx, "#/everywhere");
  await step("Appeler sur TALK : contacts TALK autorisés listés (@kenji, @maria) avec « Appeler », recherche", async () => {
    await page.tap("#trGoCall");
    await page.waitForSelector(".tr-ct", { timeout: 10000 });
    const names = await page.$$eval(".tr-ct b", (n) => n.map((b) => b.textContent));
    await page.screenshot({ path: path.join(OUT, "everywhere-appeler-sur-talk.png") });
    await page.fill("#trSearch", "mar");
    const filtered = await page.$$eval(".tr-ct b", (n) => n.map((b) => b.textContent));
    await page.fill("#trSearch", "");
    return { ok: names.join() === "@kenji,@maria" && filtered.join() === "@maria", detail: names.join(", ") + " ; recherche « mar » → " + filtered.join(", ") };
  });
  await step("Inviter un contact : le lien TALK (?ajouter=<mon pseudo>) part par le partage du téléphone", async () => {
    await page.tap("#trInvite");
    await page.waitForFunction(() => !!window.__shared, null, { timeout: 3000 });
    const u = await page.evaluate(() => window.__shared.url);
    const talkLink = new URL(u);
    return { ok: talkLink.pathname === BASE && talkLink.searchParams.get("ajouter") === "sebtest" && talkLink.searchParams.get("i") === "5", detail: talkLink.pathname + talkLink.search };
  });
  await step("Avant l'appel : langues réglables, enregistrées pour TALK (même réglage que dans TALK)", async () => {
    await page.tap('[data-call="aaaaaaaa-0000-4000-8000-000000000001"]');
    await page.waitForSelector("#trSheet");
    await page.selectOption("#trCSpeak", "fr");
    await page.selectOption("#trCRead", "en");
    await page.screenshot({ path: path.join(OUT, "everywhere-avant-appel.png") });
    const href = await page.$eval("#trCGo", (a) => a.getAttribute("href"));
    return { ok: /index\.html\?ew=1&ew_appel=aaaaaaaa-0000-4000-8000-000000000001$/.test(href), detail: href };
  });
  await step("Appeler : TALK s'ouvre et lance son appel traduit habituel vers @kenji", async () => {
    await page.tap("#trCGo");
    await page.waitForURL((u) => /\/index\.html$/.test(u.pathname), { timeout: 10000 });
    await page.waitForSelector("#netHangup", { timeout: 15000 });
    const txt = (await page.textContent("body")).replace(/\s+/g, " ");
    const cl = await page.evaluate(() => localStorage.getItem("lc_convlang_aaaaaaaa-0000-4000-8000-000000000001"));
    const url = page.url();
    await page.screenshot({ path: path.join(OUT, "everywhere-appel-dans-talk.png") });
    return { ok: /Sonnerie chez @kenji/.test(txt) && JSON.parse(cl).read === "en" && !/ew_appel/.test(url), detail: "« Sonnerie chez @kenji… », langue de lecture : anglais, adresse nettoyée" };
  });
  await step("Fin de l'appel : retour dans EVERYWHERE (Appeler sur TALK)", async () => {
    await page.tap("#netHangup");
    await page.waitForURL((u) => /\/everywhere\/$/.test(u.pathname) && u.hash === "#/everywhere/appel", { timeout: 10000 });
    await page.waitForSelector(".tr-ct", { timeout: 10000 });
    return { ok: true };
  });
  await step("EVERYWHERE : aucune erreur JavaScript, aucune fonction de LEARN, aucune clé secrète dans le code", async () => {
    const src = ["traduction/everywhere.js", "traduction/moteur.js"].map((f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8")).join("\n");
    const learn = /EWLearn|EWProgress|EWExercises|ew_learn_v1/.test(src);
    const secret = /sk-ant-|sk-[A-Za-z0-9]{20}|service_role|api[_-]?key\s*[:=]/i.test(src);
    return { ok: !page._errors.length && !learn && !secret, detail: page._errors.join(" | ").slice(0, 160) || "aucune erreur" };
  });
  await ctx.close();

  // ---------- Anglais ----------
  ctx = await newCtx({ locale: "en-US" });
  page = await openPortal(ctx);
  await step("Interface en anglais selon la langue du téléphone", async () => {
    const labels = await page.$$eval("#mainnav a", (n) => n.map((a) => a.textContent.trim()));
    const ew = await page.textContent("#cardEverywhere .duo-d");
    return { ok: labels.join(",") === "Home,Messages,Phone,Translate,Learn" && /Side-by-side conversation/.test(ew), detail: labels.join(", ") + " · " + ew };
  });
  await ctx.close();

  // ---------- Autres langues de TALK (0.8.2) : accueil, barres et compte à rebours traduits, arabe de droite à gauche ----------
  for (const [loc, lead, nav, rtl] of [["es-ES", "El mundo conversa. Por fin.", "Inicio,Mensajes,Teléfono,Traducir,Aprender", false],
    ["ar", "العالم يتحاور. أخيرًا.", "الرئيسية,الرسائل,الهاتف,ترجمة,تعلّم", true], ["ko-KR", "The world speaks. At last.", "Home,Messages,Phone,Translate,Learn", false]]) {
    ctx = await newCtx({ locale: loc });
    page = await openPortal(ctx);
    await step("Accueil en " + loc + " : phrase, barre du bas et sens d'écriture", async () => {
      await page.waitForSelector("#view-accueil.active");
      const r = await page.evaluate(() => ({ lead: document.querySelector("#view-accueil .lead").textContent.trim(), dir: document.documentElement.dir,
        nav: [...document.querySelectorAll("#mainnav a")].map((a) => a.textContent.trim()).join(","), sw: document.documentElement.scrollWidth <= innerWidth }));
      return { ok: r.lead === lead && r.nav === nav && r.dir === (rtl ? "rtl" : "ltr") && r.sw, detail: r.lead + " · " + r.nav + " · " + r.dir };
    });
    await ctx.close();
  }

  // ---------- EVERYWHERE, Voyage, Apprendre et Profil linguistique dans les langues de l'interface (0.8.3) ----------
  ctx = await newCtx();
  page = await openPortal(ctx);
  await step("Écrans traduits : chaque langue a tous les textes, avec les mêmes {repères} et listes", async () => {
    const bad = await page.evaluate(() => {
      const mods = { everywhere: window.EWEverywhere._strings, voyage: window.EWVoyage._strings, learn: window.EWLearn._strings, profil: window.EWProfil._strings, connect: window.EWConnect._strings };
      const marks = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join("") + "|" + String(s).split("|").length;
      const out = [];
      Object.keys(mods).forEach((m) => ["es", "pt", "de", "it", "zh", "ja", "ar", "ru", "mg"].forEach((l) => Object.keys(mods[m].en).forEach((k) => {
        const v = mods[m][l] && mods[m][l][k];
        if (!v || marks(v) !== marks(mods[m].en[k])) out.push(m + "." + l + "." + k);
      })));
      return out;
    });
    return { ok: bad.length === 0, detail: bad.length ? bad.slice(0, 6).join(", ") : "5 écrans × 9 langues complets" };
  });
  await ctx.close();
  for (const choice of ["es", "ko"]) {
    ctx = await newCtx();
    page = await openPortal(ctx);
    await step("Profil linguistique : « Enregistrer » garde la langue choisie dans TALK (" + choice + ")", async () => {
      await page.evaluate((c) => localStorage.setItem("lc_uilang", c), choice);
      await page.goto(URL_EW + "#/profil/linguistique");
      await page.reload();
      await page.waitForSelector("#lpUi");
      const shown = await page.$eval("#lpUi", (s) => s.value);
      await page.click("#lpSave");
      await page.waitForTimeout(300);
      const kept = await page.evaluate(() => localStorage.getItem("lc_uilang"));
      return { ok: shown === choice && kept === choice, detail: "menu " + shown + ", réglage après enregistrement " + kept };
    });
    await ctx.close();
  }
  for (const [loc, ui] of [["es-ES", "es"], ["ar", "ar"], ["ja-JP", "ja"]]) {
    ctx = await newCtx({ locale: loc });
    page = await openPortal(ctx);
    for (const [route, mod, key, sel] of [["#/everywhere", "EWEverywhere", "face", "#ewTr"], ["#/everywhere/voyage", "EWVoyage", "sub", "#ewTr"],
      ["#/learn", "EWLearn", "sub", "#ewLearn"], ["#/profil/linguistique", "EWProfil", "s_langs", "#lpEdit"]]) {
      await step("En " + loc + " : " + route + " dans la langue de l'interface", async () => {
        await page.goto(URL_EW + route);
        await page.waitForFunction((s) => document.querySelector(s) && document.querySelector(s).textContent.trim().length > 20, sel);
        const r = await page.evaluate(([mod, key, sel, ui]) => {
          const want = window[mod]._strings[ui][key], fr = window[mod]._strings.fr[key], txt = document.querySelector(sel).textContent;
          return { has: txt.indexOf(want) !== -1, fr: want !== fr && txt.indexOf(fr) !== -1, want, sw: document.documentElement.scrollWidth <= innerWidth };
        }, [mod, key, sel, ui]);
        if (route === "#/everywhere/voyage") await page.screenshot({ path: path.join(OUT, "voyage-" + ui + ".png") });
        return { ok: r.has && !r.fr && r.sw, detail: r.want };
      });
    }
    await step("En " + loc + " : noms des langues dans la langue de l'interface", async () => {
      await page.goto(URL_EW + "#/profil/linguistique");
      await page.waitForSelector("#lpNative");
      const r = await page.evaluate(() => [...document.querySelectorAll("#lpNative option")].map((o) => o.textContent).find((x) => /🇬🇧/.test(x)) || "");
      return { ok: !!r && !/Anglais/.test(r), detail: r };
    });
    await ctx.close();
  }

  // ---------- Tablette et ordinateur ----------
  for (const [name, vp, mobile] of [["tablette", { width: 820, height: 1180 }, true], ["ordinateur", { width: 1366, height: 900 }, false]]) {
    ctx = await newCtx({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    page = await openPortal(ctx);
    await step("Mise en page " + name + " (" + vp.width + " px)", async () => {
      await page.waitForSelector("#view-accueil.active");
      const r = await page.evaluate(() => ({ dir: getComputedStyle(document.getElementById("mainnav")).flexDirection, sw: document.documentElement.scrollWidth, w: innerWidth,
        cols: getComputedStyle(document.getElementById("homeDuo")).gridTemplateColumns.split(" ").length }));
      await page.screenshot({ path: path.join(OUT, name + "-accueil.png") });
      const want = name === "ordinateur" ? "column" : "row";
      return { ok: r.dir === want && r.sw <= r.w && r.cols === (name === "ordinateur" ? 4 : 2), detail: "menu " + (r.dir === "column" ? "latéral" : "bas") + ", " + r.cols + " colonnes" };
    });
    await step("LEARN sur " + name + " : leçon et exercice utilisables, sans défilement horizontal", async () => {
      await page.goto(URL_EW + "#/learn/lecon/es-deb-1");
      await page.waitForSelector("#lxGo");
      await page.click("#lxGo");
      await page.waitForSelector("#lxEx .lx-opt");
      await page.click("#lxEx .lx-opt");
      await page.waitForSelector("#lxNext:not([hidden])");
      const r = await page.evaluate(() => { const v = document.querySelector(".view.active"); return { ok: v.scrollWidth <= v.clientWidth && document.documentElement.scrollWidth <= innerWidth,
        cols: getComputedStyle(document.querySelector(".lx-opts")).gridTemplateColumns.split(" ").length }; });
      await page.screenshot({ path: path.join(OUT, name + "-learn-exercice.png") });
      return { ok: r.ok, detail: "espagnol, choix sur " + r.cols + " colonnes" };
    });
    await ctx.close();
  }

  // ---------- Non-régression : TALK seul, comme aujourd'hui ----------
  ctx = await newCtx();
  page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await step("Non-régression : TALK ouvert seul garde son en-tête, son bandeau et ses touches", async () => {
    await page.goto(ORIGIN + BASE);
    await page.waitForSelector("#tilePhone");
    await sleep(800);
    const r = await page.evaluate(() => ({ emb: document.documentElement.classList.contains("embedded") || document.documentElement.classList.contains("ew-shell") || !!document.getElementById("ewsNav"),
      hero: getComputedStyle(document.querySelector("header.hero-earth")).display !== "none", banner: !!document.querySelector(".test-banner") && getComputedStyle(document.querySelector(".test-banner")).display !== "none" }));
    // Bandeau « SITE DE TEST » attendu sur le test seulement, jamais sur la production.
    const prod = /env:\s*"production"/.test(fs.readFileSync(path.join(__dirname, "..", "config.js"), "utf8"));
    return { ok: !r.emb && r.hero && r.banner === !prod && !errs.length, detail: errs.join(" | ").slice(0, 160) || "aucune erreur" };
  });
  await page.screenshot({ path: path.join(OUT, "talk-seul.png") });
  await ctx.close();

  await browser.close();
  server.close();
  const ok = results.filter((r) => r.ok).length;
  fs.writeFileSync(path.join(OUT, "resultats.json"), JSON.stringify({ date: new Date().toISOString(), reussis: ok, total: results.length, tests: results }, null, 2));
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  process.exit(ok === results.length ? 0 : 1);
})().catch((e) => { console.error(e); server.close(); process.exit(2); });

/* 24/24 ONE WORLD — essais des espaces COMMUNITY, LIVE, BUSINESS et Avantages (26 oct. 2026).
   Faux serveur (tests/fake-supabase.js, tables ow_* en mémoire) ; la traduction (MyMemory) est simulée : « [fr] texte ».
   Lancer : node everywhere/tests/espaces.js */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const SITE = path.resolve(__dirname, "..", ".."), BASE = "/24-24-talk/", OUT = path.join(__dirname, "resultats");
const FAKE = fs.readFileSync(path.join(__dirname, "fake-supabase.js"), "utf8");
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".webmanifest": "application/manifest+json" };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (!u.pathname.startsWith(BASE)) { res.writeHead(404); return res.end(); }
  let p = path.join(SITE, decodeURIComponent(u.pathname.slice(BASE.length)));
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!fs.existsSync(p)) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
const results = [];
function rec(n, ok, d) { results.push(ok); console.log((ok ? "OK   " : "ÉCHEC") + "  " + n + (d ? "  — " + d : "")); }
async function step(n, fn) { try { const r = await fn(); rec(n, r.ok, r.detail); } catch (e) { rec(n, false, String(e.message || e).split("\n")[0]); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const KENJI = "00000000-0000-4000-8000-0000000000b1";

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port, EW = ORIGIN + BASE + "everywhere/";
  const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR", permissions: ["camera", "microphone"] });
  await ctx.addInitScript(() => { window.__EW_NO_SRI = true; try { if (!localStorage.getItem("lc_net_auth")) localStorage.setItem("lc_net_auth", "fake"); } catch (e) {} });
  let trCalls = 0;
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => {
    const u = r.request().url();
    if (/supabase-js/.test(u)) return r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE });
    if (/mymemory/.test(u)) {
      trCalls++;
      const q = new URL(u).searchParams, pair = q.get("langpair") || "";
      return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ responseStatus: 200, responseData: { translatedText: "[" + pair.split("|")[1] + "] " + q.get("q"), match: 1 } }) });
    }
    return r.abort();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  // Un message d'une autre personne (@kenji, en japonais), comme s'il arrivait du serveur.
  const kenjiSays = (roomId, body, kind) => page.evaluate(([rid, b, k, kid]) => {
    const d = JSON.parse(localStorage.getItem("fake_ow"));
    d.seq++;
    d.ow_room_msgs.push({ id: d.seq, room_id: rid, sender_id: kid, sender_name: "kenji", body: b, lang: "ja", kind: k || "text", created_at: new Date().toISOString() });
    localStorage.setItem("fake_ow", JSON.stringify(d));
  }, [roomId, body, kind, KENJI]);

  await step("Accueil : tuiles Community, Live, Business, Avantages", async () => {
    await page.goto(ORIGIN + BASE + "index.html");
    await page.waitForSelector("#tileCom", { timeout: 10000 });
    const names = await page.$$eval("#tileCom, #tileLive, #tileBiz, #tileAdv", (n) => n.map((a) => a.querySelector(".home-tile-name").textContent + "→" + a.getAttribute("href")));
    await page.screenshot({ path: path.join(OUT, "espaces-accueil.png"), fullPage: true });
    return { ok: names.length === 4 && /#\/community$/.test(names[0]) && /#\/avantages$/.test(names[3]), detail: names.join(", ") };
  });
  let roomId;
  await step("Community : liste vide, puis création de « Cuisine du monde »", async () => {
    await page.goto(EW + "#/community");
    await page.waitForSelector(".es-empty", { timeout: 10000 });
    await page.tap("#esNewBtn");
    await page.fill("#esTitle", "Cuisine du monde");
    await page.fill("#esAbout", "Recettes de partout");
    await page.tap("#esNew button[type=submit]");
    await page.waitForSelector("#esCompose", { timeout: 10000 });
    roomId = page.url().split("/").pop();
    const h = await page.textContent("#h-es");
    return { ok: h === "Cuisine du monde" && /^cccccccc/.test(roomId), detail: h };
  });
  await step("Community : j'écris, mon message s'affiche ; le message japonais de Kenji arrive traduit en français, original dessous", async () => {
    await page.fill("#esInput", "Bonjour à tous !");
    await page.tap("#esCompose button");
    await page.waitForSelector(".es-msg.me", { timeout: 5000 });
    await kenjiSays(roomId, "こんにちは、みなさん");
    await page.waitForFunction(() => /\[fr\] こんにちは/.test(document.querySelector("#esMsgs").textContent), null, { timeout: 15000 });
    const orig = await page.textContent(".es-msg:not(.me) .es-orig");
    await page.screenshot({ path: path.join(OUT, "espaces-community.png") });
    return { ok: /こんにちは/.test(orig), detail: "traduit + original « " + orig.trim() + " »" };
  });
  await step("Community : la liste montre la communauté (1 membre, par sebtest)", async () => {
    await page.goto(EW + "#/community");
    await page.waitForSelector(".es-room", { timeout: 10000 });
    const txt = (await page.textContent(".es-room")).replace(/\s+/g, " ");
    return { ok: /Cuisine du monde/.test(txt) && /1 membre/.test(txt) && /sebtest/.test(txt), detail: txt.trim() };
  });
  let liveId;
  await step("Live : je lance un direct, sous-titre envoyé, caméra allumée", async () => {
    await page.goto(EW + "#/live");
    await page.waitForSelector("#esNewBtn", { timeout: 10000 });
    await page.tap("#esNewBtn");
    await page.fill("#esTitle", "Bali en direct");
    await page.tap("#esNew button[type=submit]");
    await page.waitForSelector("#esLiveGo", { timeout: 10000 });
    liveId = page.url().split("/").pop();
    await page.tap("#esLiveGo");
    await page.waitForFunction(() => /Arrêter/.test(document.querySelector("#esLiveGo").textContent), null, { timeout: 5000 });
    await page.fill("#esCapInput", "Voici la plage de Kuta");
    await page.tap("#esCapForm button");
    await page.waitForFunction(() => /Kuta/.test(document.querySelector("#esCaption").textContent), null, { timeout: 5000 });
    await page.tap("#esCam");
    await page.waitForFunction(() => { const v = document.querySelector("#esVideo"); return v && !v.hidden && v.videoWidth > 0; }, null, { timeout: 10000 });
    await page.screenshot({ path: path.join(OUT, "espaces-live-animateur.png") });
    const d = await page.evaluate(() => JSON.parse(localStorage.getItem("fake_ow")));
    const room = d.ow_rooms.find((r) => r.kind === "live");
    return { ok: room.live_on === true && d.ow_room_msgs.some((m) => m.kind === "caption"), detail: "direct « en direct », sous-titre enregistré, caméra visible" };
  });
  await step("Live (spectateur) : le sous-titre japonais de l'animateur s'affiche traduit en français", async () => {
    // Le direct appartient maintenant à Kenji : je deviens spectateur.
    await page.evaluate(([lid, kid]) => { const d = JSON.parse(localStorage.getItem("fake_ow")); d.ow_rooms.forEach((r) => { if (r.id === lid) { r.owner_id = kid; r.owner_name = "kenji"; r.lang = "ja"; } }); localStorage.setItem("fake_ow", JSON.stringify(d)); }, [liveId, KENJI]);
    await page.goto(EW + "#/live");
    await page.goto(EW + "#/live/" + liveId);
    await page.waitForSelector("#esVoice", { timeout: 10000 });
    await kenjiSays(liveId, "クタのビーチです", "caption");
    await page.waitForFunction(() => /\[fr\] クタのビーチです/.test(document.querySelector("#esCaption").textContent), null, { timeout: 15000 });
    await page.screenshot({ path: path.join(OUT, "espaces-live-spectateur.png") });
    return { ok: true, detail: (await page.textContent("#esCaption")).trim() };
  });
  await step("Business : publier une annonce de gros (vanille), elle s'affiche avec son prix", async () => {
    await page.goto(EW + "#/business");
    await page.waitForSelector(".es-empty", { timeout: 10000 });
    await page.goto(EW + "#/business/new");
    await page.waitForSelector("#esAd");
    await page.selectOption("#adKind", "wholesale");
    await page.fill("#adTitle", "Vanille de Madagascar en gros");
    await page.fill("#adBody", "Gousses grade A, 10 kg minimum");
    await page.fill("#adPrice", "120");
    await page.selectOption("#adCur", "EUR");
    await page.fill("#adPlace", "Antananarivo");
    await page.tap("#esAd button[type=submit]");
    await page.waitForSelector(".es-ad", { timeout: 10000 });
    const txt = (await page.textContent(".es-ad")).replace(/\s+/g, " ");
    await page.screenshot({ path: path.join(OUT, "espaces-business.png"), fullPage: true });
    return { ok: /Vanille/.test(txt) && /120/.test(txt) && /Gros/.test(txt) && /Votre annonce/.test(txt), detail: txt.trim().slice(0, 110) };
  });
  await step("Business : filtres (Sourcing vide, Gros trouve l'annonce), bloc Marchés présent", async () => {
    await page.tap('.es-chip[data-f="sourcing"]');
    await page.waitForSelector(".es-empty", { timeout: 5000 });
    await page.tap('.es-chip[data-f="wholesale"]');
    await page.waitForSelector(".es-ad", { timeout: 5000 });
    return { ok: !!(await page.$(".es-markets")), detail: "filtres OK" };
  });
  await step("Business : l'annonce d'un autre vendeur montre « Contacter » (lien d'ajout dans la Messagerie)", async () => {
    await page.evaluate(() => { const d = JSON.parse(localStorage.getItem("fake_ow")); d.ow_listings.push({ id: "dddddddd-0000-4000-8000-000000000999", seller_id: "00000000-0000-4000-8000-0000000000b2", seller_name: "maria", seller_pseudo: "maria", kind: "sell", title: "Bicicleta urbana", body: "Muy buen estado", lang: "es", price: 80, currency: "EUR", place: "Madrid", status: "open", created_at: new Date().toISOString() }); localStorage.setItem("fake_ow", JSON.stringify(d)); });
    await page.tap('.es-chip[data-f="all"]');
    await page.waitForFunction(() => /\[fr\] Bicicleta urbana/.test(document.querySelector("#esList").textContent), null, { timeout: 10000 });
    const href = await page.$eval('.es-ad a.btn.primary', (a) => a.getAttribute("href"));
    return { ok: href === "../index.html?ajouter=maria", detail: href };
  });
  await step("Avantages : partenaires (liens partenaires) et partage de mon lien d'invitation", async () => {
    await page.evaluate(() => { navigator.share = (d) => { window.__shared = d; return Promise.resolve(); }; });
    await page.goto(EW + "#/avantages");
    await page.waitForSelector("#esInvite", { timeout: 10000 });
    await page.evaluate(() => { navigator.share = (d) => { window.__shared = d; return Promise.resolve(); }; });
    const n = await page.$$eval(".vy-bk", (a) => a.filter((x) => x.rel === "sponsored noopener").length);
    await page.tap("#esInvite");
    await page.waitForFunction(() => !!window.__shared, null, { timeout: 5000 });
    const url = await page.evaluate(() => window.__shared.url);
    await page.screenshot({ path: path.join(OUT, "espaces-avantages.png"), fullPage: true });
    return { ok: n === 4 && /\/24-24-talk\/\?ajouter=sebtest&i=5$/.test(url), detail: n + " partenaires, lien " + url.replace(ORIGIN, "") };
  });
  await step("Sans serveur : message d'erreur et bouton Réessayer (rien d'inventé)", async () => {
    await page.evaluate(() => localStorage.setItem("fake_ow_fail", "1"));
    await page.goto(EW + "#/community");
    await page.waitForSelector("#esRetry", { timeout: 10000 });
    await page.evaluate(() => localStorage.removeItem("fake_ow_fail"));
    await page.tap("#esRetry");
    await page.waitForSelector(".es-room", { timeout: 10000 });
    return { ok: true };
  });
  await step("Aucune erreur JavaScript, pas de défilement horizontal", async () => {
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    return { ok: errors.length === 0 && !wide, detail: errors.join(" | ") || "aucune erreur" };
  });
  console.log("\n" + results.filter(Boolean).length + " / " + results.length + " tests réussis (" + trCalls + " traductions simulées)");
  await browser.close(); server.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})();

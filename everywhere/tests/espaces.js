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
    // Faux widget TradingView : écrit ce qu'il voit, pour prouver qu'il tourne isolé (pas d'accès au stockage de l'appli).
    if (/s3\.tradingview\.com/.test(u)) return r.fulfill({ status: 200, contentType: "text/javascript", body: "var ok='ISOLE';try{localStorage.getItem('lc_net_auth');ok='OUVERT';}catch(e){}try{if(parent.document)ok='OUVERT';}catch(e){}document.body.setAttribute('data-tv',ok);document.body.appendChild(document.createTextNode('TV '+ok));" });
    return r.abort();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("dialog", (d) => d.accept().catch(() => {})); // « Bloquer ? » puis « bloqué(e) »
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
    await page.tap("#esCompose button[type=submit]");
    await page.waitForSelector(".es-msg.me", { timeout: 5000 });
    await kenjiSays(roomId, "こんにちは、みなさん");
    await page.waitForFunction(() => /\[fr\] こんにちは/.test(document.querySelector("#esMsgs").textContent), null, { timeout: 15000 });
    const orig = await page.textContent(".es-msg:not(.me) .es-orig");
    await page.screenshot({ path: path.join(OUT, "espaces-community.png") });
    return { ok: /こんにちは/.test(orig), detail: "traduit + original « " + orig.trim() + " »" };
  });
  await step("Sécurité : sous le message de Kenji, Écouter, Signaler (copie envoyée à la modération) et Bloquer (ses messages disparaissent)", async () => {
    await page.tap('.es-msg:not(.me) .es-act[data-a="report"]');
    await page.waitForFunction(() => /Merci/.test(document.querySelector('.es-msg:not(.me) .es-act[data-a="report"]').textContent), null, { timeout: 5000 });
    const rep = await page.evaluate(() => JSON.parse(localStorage.getItem("fake_ow")).ow_reports[0]);
    await page.tap('.es-msg:not(.me) .es-act[data-a="block"]');
    await page.waitForFunction(() => !document.querySelector(".es-msg:not(.me)"), null, { timeout: 5000 });
    const blk = await page.evaluate(() => (window.__inserts || []).find((x) => x.table === "blocks"));
    return { ok: rep.target_kind === "msg" && /こんにちは/.test(rep.body_copy) && blk && blk.row.blocked === "00000000-0000-4000-8000-0000000000b1", detail: "signalement + blocage de kenji" };
  });
  await step("Community : thème « Femmes » à la création, filtre par thème", async () => {
    await page.goto(EW + "#/community");
    await page.waitForSelector("#esNewBtn", { timeout: 10000 });
    await page.tap("#esNewBtn");
    await page.fill("#esTitle", "Femmes entrepreneures du monde");
    await page.selectOption("#esTopic", "women");
    await page.tap("#esNew button[type=submit]");
    await page.waitForSelector("#esCompose", { timeout: 10000 });
    await page.goto(EW + "#/community");
    await page.waitForSelector(".es-room", { timeout: 10000 });
    await page.tap('.es-chip[data-f="women"]');
    await page.waitForFunction(() => document.querySelectorAll(".es-room").length === 1, null, { timeout: 5000 });
    const txt = await page.textContent(".es-room");
    await page.tap('.es-chip[data-f="all"]');
    await page.waitForFunction(() => document.querySelectorAll(".es-room").length === 2, null, { timeout: 5000 });
    return { ok: /Femmes entrepreneures/.test(txt) && /Femmes ·/.test(txt), detail: txt.replace(/\s+/g, " ").trim() };
  });
  await step("Community : la liste montre la communauté (1 membre, par sebtest)", async () => {
    await page.goto(EW + "#/community");
    await page.waitForSelector(".es-room", { timeout: 10000 });
    const txt = (await page.$$eval(".es-room", (a) => a.map((x) => x.textContent).find((x) => /Cuisine/.test(x)) || "")).replace(/\s+/g, " ");
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
  await step("Business : filtres (Sourcing vide, Gros trouve l'annonce), tuiles Argent, Dropshipping, Bourse présentes", async () => {
    await page.tap('.es-chip[data-f="sourcing"]');
    await page.waitForSelector(".es-empty", { timeout: 5000 });
    await page.tap('.es-chip[data-f="wholesale"]');
    await page.waitForSelector(".es-ad", { timeout: 5000 });
    return { ok: (await page.$$("a.es-customs[href=\"#/business/argent\"], a.es-customs[href=\"#/business/dropshipping\"], a.es-customs[href=\"#/business/bourse\"]")).length === 3, detail: "filtres OK, 3 tuiles" };
  });
  await step("Business : l'annonce d'un autre vendeur montre « Contacter » (lien d'ajout dans la Messagerie)", async () => {
    await page.evaluate(() => { const d = JSON.parse(localStorage.getItem("fake_ow")); d.ow_listings.push({ id: "dddddddd-0000-4000-8000-000000000999", seller_id: "00000000-0000-4000-8000-0000000000b2", seller_name: "maria", seller_pseudo: "maria", kind: "sell", title: "Bicicleta urbana", body: "Muy buen estado", lang: "es", price: 80, currency: "EUR", place: "Madrid", status: "open", created_at: new Date().toISOString() }); localStorage.setItem("fake_ow", JSON.stringify(d)); });
    await page.tap('.es-chip[data-f="all"]');
    await page.waitForFunction(() => /\[fr\] Bicicleta urbana/.test(document.querySelector("#esList").textContent), null, { timeout: 10000 });
    const href = await page.$eval('.es-ad a.btn.primary', (a) => a.getAttribute("href"));
    return { ok: href === "../index.html?ajouter=maria", detail: href };
  });
  await step("Business : publier une mission à distance, rangée sous « Mission à distance »", async () => {
    await page.goto(EW + "#/business/new");
    await page.waitForSelector("#esAd", { timeout: 10000 });
    await page.selectOption("#adKind", "mission");
    await page.fill("#adTitle", "Traduction de site web, travail à distance");
    await page.tap("#esAd button[type=submit]");
    await page.waitForSelector(".es-ad", { timeout: 10000 });
    await page.tap('.es-chip[data-f="mission"]');
    await page.waitForFunction(() => document.querySelectorAll("#esList .es-ad").length === 1, null, { timeout: 5000 });
    const txt = (await page.textContent("#esList")).replace(/\s+/g, " ");
    const job = await page.$('.es-chip[data-f="job"]');
    return { ok: /Mission à distance/.test(txt) && /Traduction de site/.test(txt) && !!job, detail: txt.trim().slice(0, 80) };
  });
  await step("Business : guide Douane et import-export (outils officiels, documents, Incoterms) et transitaires", async () => {
    await page.goto(EW + "#/business");
    await page.waitForSelector(".es-customs", { timeout: 10000 });
    await page.tap(".es-customs");
    await page.waitForSelector(".es-cu-link", { timeout: 5000 });
    const links = await page.$$eval(".es-cu-link", (a) => a.map((x) => x.href));
    const txt = await page.textContent("#ewEspaces");
    await page.screenshot({ path: path.join(OUT, "espaces-douane.png"), fullPage: true });
    await page.tap("#cuFind");
    await page.waitForSelector('.es-chip[data-f="customs"][aria-selected="true"]', { timeout: 5000 });
    return { ok: links.length === 4 && /macmap/.test(links[0]) && /DDP/.test(txt) && /EORI/.test(txt) && /CITES/.test(txt), detail: links.length + " outils officiels, Incoterms, filtre Douane" };
  });
  await step("Business : règles pays par pays (France → bloc UE ; Japon → pas de bloc UE ; liens propres au pays ; retour direct)", async () => {
    await page.goto(EW + "#/business");
    await page.waitForSelector('a.es-customs[href="#/business/regles"]', { timeout: 10000 });
    await page.tap('a.es-customs[href="#/business/regles"]');
    await page.waitForSelector(".es-rg-cc", { timeout: 5000 });
    const fr = await page.textContent(".es-rg-cc"), euFR = !!(await page.$(".es-rg-eu"));
    const n = await page.$$eval("#rgCc option", (o) => o.length);
    await page.screenshot({ path: path.join(OUT, "espaces-regles.png"), fullPage: true });
    await page.selectOption("#rgCc", "JP");
    await page.waitForFunction(() => /Japon/.test(document.querySelector(".es-rg-cc") ? document.querySelector(".es-rg-cc").textContent : ""), null, { timeout: 5000 });
    const euJP = !!(await page.$(".es-rg-eu")), links = await page.$$eval(".es-cu-link", (a) => a.map((x) => new URL(x.href).hostname));
    // Les liens du pays changent avec le pays choisi (Banque mondiale JP, OEC jpn, recherche « … Japon »).
    const cty = await page.$$eval(".es-rg-cty .es-cu-link", (a) => a.map((x) => x.href));
    const own = cty.length === 3 && /\/country\/JP$/.test(cty[0]) && /\/country\/jpn$/.test(cty[1]) && /Japon/.test(decodeURIComponent(cty[2]));
    // Changer de pays ne remplit pas l'historique : la flèche retour ramène directement à BUSINESS.
    await page.selectOption("#rgCc", "SN");
    await page.waitForFunction(() => /\/SN$/.test(location.hash), null, { timeout: 5000 });
    await page.goBack(); await page.waitForTimeout(400);
    const back = await page.evaluate(() => location.hash);
    return { ok: fr === "France" && euFR && !euJP && n > 190 && own && back === "#/business" && links.join() === "data.worldbank.org,oec.world,www.google.com,globaltradehelpdesk.org,www.macmap.org,www.epingalert.org,www.worldbank.org,www.iosco.org", detail: (n - 1) + " pays ; Japon : " + links.join(" ") + " ; retour → " + back };
  });
  await step("Business : envoyer de l'argent (comparateur Banque mondiale + 7 services), dropshipping, Bourse isolée", async () => {
    await page.goto(EW + "#/business");
    await page.waitForSelector('a.es-customs[href="#/business/argent"]', { timeout: 10000 });
    await page.tap('a.es-customs[href="#/business/argent"]');
    await page.waitForSelector(".es-cu-link", { timeout: 5000 });
    const mt = await page.$$eval(".es-cu-link", (a) => a.map((x) => new URL(x.href).hostname));
    const mtTxt = await page.textContent("#ewEspaces");
    const noAff = (await page.$$("a[rel~=sponsored]")).length === 0 && /ne touche rien/.test(mtTxt);
    await page.screenshot({ path: path.join(OUT, "espaces-argent.png"), fullPage: true });
    // Lien de parrainage renseigné : seul ce service devient « sponsored » avec la mention 🤝, et le chapeau ne dit plus « ne touche rien »
    await page.evaluate(() => { window.EW_MONEY_AFF = { Wise: "https://wise.com/invite/essai" }; location.hash = "#/business"; });
    await page.waitForSelector('a.es-customs[href="#/business/argent"]', { timeout: 5000 });
    await page.tap('a.es-customs[href="#/business/argent"]');
    await page.waitForSelector(".es-cu-link", { timeout: 5000 });
    const sp = await page.$$eval("a[rel~=sponsored]", (a) => a.map((x) => x.href + "|" + (x.querySelector(".es-aff") ? 1 : 0)));
    const affTxt = await page.textContent("#ewEspaces");
    const withAff = sp.length === 1 && sp[0] === "https://wise.com/invite/essai|1" && !/ne touche rien/.test(affTxt) && /Partenaire/.test(affTxt);
    await page.screenshot({ path: path.join(OUT, "espaces-argent-partenaire.png"), fullPage: true });
    await page.evaluate(() => { window.EW_MONEY_AFF = { Wise: "", Remitly: "" }; });
    await page.goto(EW + "#/business/dropshipping");
    await page.waitForSelector("ol.es-cu-list li", { timeout: 5000 });
    const ds = await page.$$eval("ol.es-cu-list li", (l) => l.length);
    await page.screenshot({ path: path.join(OUT, "espaces-dropshipping.png"), fullPage: true });
    await page.goto(EW + "#/business/bourse");
    await page.waitForSelector("#boLoad", { timeout: 5000 });
    const before = await page.$$eval("iframe.es-tv", (f) => f.length);
    await page.tap("#boLoad");
    await page.waitForSelector("iframe.es-tv", { timeout: 5000 });
    const sb = await page.$$eval("iframe.es-tv", (f) => f.map((x) => x.getAttribute("sandbox")));
    let seen = [];
    for (let i = 0; i < 40 && seen.length < 2; i++) { await sleep(150); seen = []; for (const f of page.frames()) { try { const v = await f.evaluate(() => document.body && document.body.getAttribute("data-tv")); if (v) seen.push(v); } catch (e) {} } }
    await page.screenshot({ path: path.join(OUT, "espaces-bourse.png"), fullPage: true });
    return { ok: mt[0] === "remittanceprices.worldbank.org" && mt.length === 8 && /arnaque/.test(mtTxt) && noAff && withAff && ds === 6 && before === 0 &&
      sb.length === 2 && sb.every((x) => !/allow-same-origin/.test(x)) && seen.length === 2 && seen.every((v) => v === "ISOLE"), detail: mt.length + " liens argent ; parrainage " + (noAff && withAff ? "OK (1 lien 🤝)" : "KO " + sp.join()) + " ; " + ds + " étapes ; Bourse chargée sur demande, widgets " + seen.join(",") };
  });
  await step("Entraide : demander de l'aide (sans prix), l'annonce n'apparaît que dans Entraide, pas dans Business", async () => {
    await page.goto(EW + "#/entraide/new");
    await page.waitForSelector("#esAd", { timeout: 10000 });
    const priceHidden = await page.$eval("#adPrice", (i) => !i.offsetParent);
    await page.selectOption("#adKind", "help_need");
    await page.fill("#adTitle", "Aide pour remplir un papier en anglais");
    await page.tap("#esAd button[type=submit]");
    await page.waitForSelector(".es-ad", { timeout: 10000 });
    const txt = (await page.textContent("#esList")).replace(/\s+/g, " ");
    await page.screenshot({ path: path.join(OUT, "espaces-entraide.png"), fullPage: true });
    await page.goto(EW + "#/business");
    await page.waitForSelector(".es-ad", { timeout: 10000 });
    const biz = await page.textContent("#esList");
    return { ok: priceHidden && /Besoin d'aide/.test(txt) && !/papier en anglais/.test(biz), detail: "prix caché, rangée dans Entraide seulement" };
  });
  await step("SOS (France) : 112, 15, 17, 18, 3919 (violences femmes), 114 par SMS ; phrases traduites, dont le soignant", async () => {
    await page.goto(EW + "#/sos");
    await page.waitForSelector(".es-sosnum", { timeout: 10000 });
    const nums = await page.$$eval(".es-sosnum", (a) => a.map((x) => x.getAttribute("href")));
    await page.selectOption("#sosLang", "ja");
    await page.waitForFunction(() => /\[ja\]/.test(document.querySelector("#sosPhr").textContent), null, { timeout: 10000 });
    await page.screenshot({ path: path.join(OUT, "espaces-sos.png"), fullPage: true });
    await page.selectOption("#sosCc", "JP");
    await page.waitForFunction(() => [...document.querySelectorAll(".es-sosnum")].some((a) => a.getAttribute("href") === "tel:119"), null, { timeout: 5000 });
    const med = await page.$$eval("#sosPhr .es-sosph", (a) => a.length);
    const medTitle = !!(await page.$(".es-sosmed"));
    return { ok: nums.join() === "tel:112,tel:17,tel:15,tel:18,tel:3919,sms:114" && med === 12 && medTitle, detail: nums.join(" ") + " ; Japon → 110 / 119 ; " + med + " phrases dont 6 pour le soignant" };
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

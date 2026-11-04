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
  await step("Accueil : tuile « Tout comprendre » juste après Face à face, ouvre la photo à traduire", async () => {
    const order = await page.$$eval("#homeTiles .home-tile", (n) => n.map((a) => a.id));
    const r = [await page.textContent("#tilePaper .home-tile-name"), await page.getAttribute("#tilePaper", "href")];
    return { ok: order.indexOf("tilePaper") === order.indexOf("tileEw") + 1 && r[0] === "Tout comprendre" && /#\/everywhere\/papier$/.test(r[1]), detail: r.join(" → ") };
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
  await step("OW-012-A1 : salon « Femmes » ouvert, la mention « Salon public » est affichée au-dessus des messages", async () => {
    await page.goto(EW + "#/community");
    await page.waitForSelector(".es-room", { timeout: 10000 });
    await page.tap('.es-chip[data-f="women"]');
    await page.waitForFunction(() => document.querySelectorAll(".es-room").length === 1, null, { timeout: 5000 });
    await page.tap(".es-room");
    await page.waitForSelector("#esPublic", { timeout: 10000 });
    const r = await page.evaluate(() => { const n = document.querySelector("#esPublic"), m = document.querySelector("#esMsgs");
      return { txt: n.textContent, vis: n.getBoundingClientRect().height > 0, before: !!(n.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING), role: n.getAttribute("role") }; });
    return { ok: /Salon public/.test(r.txt) && /N'écrivez rien de privé/.test(r.txt) && r.vis && r.before && r.role === "note", detail: r.txt.trim() };
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
  await step("Live (spectateur) : fausse offre vidéo d'un autre membre ignorée, vraie offre de l'animateur acceptée, réponse envoyée par le serveur", async () => {
    await page.waitForFunction((lid) => window.__fakeCh && window.__fakeCh["room:" + lid], liveId, { timeout: 5000 });
    await page.evaluate(() => {
      window.__srd = 0;
      const o = RTCPeerConnection.prototype.setRemoteDescription;
      RTCPeerConnection.prototype.setRemoteDescription = function (d) { window.__srd++; return o.call(this, d); };
      window.__rpc = []; window.__chSent = [];
    });
    // Offre réelle produite par un vrai RTCPeerConnection (vidéo), envoyée d'abord par un usurpateur.
    const offer = await page.evaluate(async () => { const pc = new RTCPeerConnection(); pc.addTransceiver("video"); const o = await pc.createOffer(); pc.close(); return { type: o.type, sdp: o.sdp }; });
    await page.evaluate(([lid, o]) => window.__fakeCh["room:" + lid].emit("sig", { t: "offer", from: "00000000-0000-4000-8000-0000000000e1", sdp: o }), [liveId, offer]);
    await sleep(400);
    const fake = await page.evaluate(() => window.__srd);
    await page.evaluate(([lid, o, kid]) => window.__fakeCh["room:" + lid].emit("sig", { t: "offer", from: kid, sdp: o }), [liveId, offer, KENJI]);
    await page.waitForFunction(() => (window.__rpc || []).some((c) => c.name === "ow_live_signal" && c.args.p_msg.t === "answer"), null, { timeout: 8000 });
    const ans = await page.evaluate(() => window.__rpc.find((c) => c.args.p_msg.t === "answer"));
    const direct = await page.evaluate(() => (window.__chSent || []).filter((x) => /^room:/.test(x.ch)).length);
    return { ok: fake === 0 && ans.args.p_room === liveId && !("from" in ans.args.p_msg) && direct === 0,
      detail: "offre usurpée : " + fake + " prise en compte ; réponse par ow_live_signal sans « from » ; " + direct + " envoi direct sur le canal" };
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
  // ---- OW-012 lot 4 étape B : Espaces branchés sur le gardien d'identité OWIdentite ----
  const AMIRA = "00000000-0000-4000-8000-0000000000ab";
  const auth = (ev, who) => page.evaluate(([e, w]) => { (window.__fakeAuth || []).forEach((cb) => cb(e, w ? { user: { id: w } } : null)); }, [ev, who]);
  await step("OW-012 B : les Espaces lisent le compte par le gardien OWIdentite (chargé une fois, client adopté, « connecte »)", async () => {
    await page.goto(EW + "#/community");
    await page.waitForSelector("#esNewBtn:not([hidden])", { timeout: 10000 });
    const r = await page.evaluate(async () => ({ g: !!window.OWIdentite, n: document.querySelectorAll('script[src$="ow-identite.js"]').length, etat: OWIdentite.etat(), moi: (await OWIdentite.moi() || {}).pseudo,
      meme: (await OWIdentite.client()) === (await EWConnect.client()), abo: (window.__fakeAuth || []).length }));
    return { ok: r.g && r.n === 1 && r.etat === "connecte" && r.moi === "sebtest" && r.meme && r.abo === 1, detail: JSON.stringify(r) };
  });
  let secretId = null;
  await step("OW-012 B : changement de compte PENDANT un direct (A anime, caméra allumée) → direct arrêté, caméra éteinte, canaux fermés, écran redessiné pour B (spectateur), rien de A", async () => {
    await page.goto(EW + "#/live");
    await page.waitForSelector("#esNewBtn:not([hidden])", { timeout: 10000 });
    await page.tap("#esNewBtn");
    await page.fill("#esTitle", "Direct de sebtest");
    await page.tap("#esNew button[type=submit]");
    await page.waitForSelector("#esLiveGo", { timeout: 10000 });
    secretId = page.url().split("/").pop();
    await page.evaluate(() => { const g = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); window.__flux = [];
      navigator.mediaDevices.getUserMedia = (c) => g(c).then((s) => { window.__flux.push(s); return s; }); });
    await page.tap("#esLiveGo");
    await page.waitForFunction(() => /Arrêter/.test(document.querySelector("#esLiveGo").textContent), null, { timeout: 5000 });
    await page.fill("#esCapInput", "Phrase privée de sebtest");
    await page.tap("#esCapForm button");
    await page.waitForFunction(() => /Phrase privée/.test(document.querySelector("#esCaption").textContent), null, { timeout: 5000 });
    await page.tap("#esCam");
    await page.waitForFunction(() => { const v = document.querySelector("#esVideo"); return v && !v.hidden && v.videoWidth > 0; }, null, { timeout: 10000 });
    await page.evaluate(() => { window.__fakeRemoved = 0; localStorage.setItem("lc_photos_v1", '{"x":"photo de A"}'); localStorage.setItem("lc_hidden_msgs", "[1]"); localStorage.setItem("lc_uilang", "fr"); });
    // Sur le même téléphone, le compte devient @amira (connexion depuis Mon compte, ou un autre onglet).
    await page.evaluate(() => localStorage.setItem("fake_who", "b"));
    await auth("SIGNED_IN", AMIRA);
    await page.waitForSelector("#esVoice", { timeout: 10000 });
    const r = await page.evaluate(() => ({
      hote: !!document.querySelector("#esLiveGo, #esCam, #esCapForm"),
      cam: (window.__flux || []).every((s) => s.getTracks().every((t) => t.readyState === "ended")) && (window.__flux || []).length > 0,
      video: (() => { const v = document.querySelector("#esVideo"); return !v || v.hidden || !v.srcObject; })(),
      canaux: window.__fakeRemoved || 0,
      moi: OWIdentite.etat() + ":" + (window.__fakeAuth ? "" : ""),
      photos: localStorage.getItem("lc_photos_v1"), masques: localStorage.getItem("lc_hidden_msgs"), uilang: localStorage.getItem("lc_uilang") }));
    const me = await page.evaluate(async () => (await OWIdentite.moi() || {}).pseudo);
    await page.screenshot({ path: path.join(OUT, "espaces-changement-compte.png") });
    return { ok: !r.hote && r.cam && r.video && r.canaux >= 2 && me === "amira" && r.photos === null && r.masques === null && r.uilang === "fr",
      detail: "commandes de l'animateur : " + (r.hote ? "ENCORE LÀ" : "parties") + " · caméra " + (r.cam ? "éteinte" : "ALLUMÉE") + " · " + r.canaux + " canaux fermés · compte affiché : " + me + " · photos/masqués de A : " + (r.photos === null && r.masques === null ? "effacés" : "RESTÉS") + " · langue de l'écran gardée : " + r.uilang };
  });
  await step("OW-012 B : réponse lente pour l'ancien compte arrivée après le changement → ignorée (l'écran ne montre jamais les données de A)", async () => {
    // Retour à @sebtest, puis la liste est demandée ; le compte change pendant que le serveur répond.
    await page.evaluate(() => localStorage.removeItem("fake_who"));
    await auth("SIGNED_IN", "00000000-0000-4000-8000-0000000000aa");
    await page.goto(EW + "#/community");
    await page.waitForSelector("#esNewBtn:not([hidden])", { timeout: 10000 });
    const r = await page.evaluate(async () => {
      const G = window.OWIdentite; G.profilModifie(); // relecture du profil, rendue lente
      const c = await G.client(), from = c.from.bind(c); let lent = true;
      c.from = (t) => { const q = from(t); if (t !== "profiles" || !lent) return q; const ms = q.maybeSingle.bind(q); q.maybeSingle = () => new Promise((ok) => setTimeout(() => ok(ms()), 300)); return q; };
      location.hash = "#/live"; await new Promise((ok) => setTimeout(ok, 50));
      localStorage.setItem("fake_who", "b"); (window.__fakeAuth || []).forEach((cb) => cb("SIGNED_IN", { user: { id: "00000000-0000-4000-8000-0000000000ab" } }));
      await new Promise((ok) => setTimeout(ok, 700)); lent = false; c.from = from;
      return { moi: (await G.moi() || {}).pseudo, nouveau: !!document.querySelector("#esNewBtn") };
    });
    return { ok: r.moi === "amira" && r.nouveau, detail: JSON.stringify(r) };
  });
  await step("OW-012 B : déconnexion (session vraiment partie) → « Créez d'abord votre compte », plus aucun salon ni message à l'écran", async () => {
    await page.goto(EW + "#/live/" + secretId);
    await page.waitForSelector("#esVoice", { timeout: 10000 });
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("fake_sb") || "null") || { session: true, email: "", new_email: "", anon: true, pending: "", devices: [] };
      s.session = false; localStorage.setItem("fake_sb", JSON.stringify(s)); localStorage.removeItem("lc_net_auth");
      window.__evOW = []; OWIdentite.ecouter((e) => window.__evOW.push(e)); });
    await auth("SIGNED_OUT", null);
    await page.waitForFunction(() => /Créez d'abord votre compte/.test(document.getElementById("ewEspaces").textContent), null, { timeout: 5000 });
    const r = await page.evaluate(() => ({ salon: !!document.querySelector("#esMsgs, #esVoice, #esCaption"), evts: window.__evOW, etat: OWIdentite.etat(), fuite: document.getElementById("ewEspaces").textContent.includes("Direct de sebtest") }));
    return { ok: !r.salon && !r.fuite && r.evts.includes("expiration") && r.etat === "deconnecte", detail: JSON.stringify(r) };
  });
  await step("OW-012 B : connexion faite AILLEURS (autre écran ou onglet) pendant que les Espaces affichent « Créez d'abord votre compte » → le salon revient tout seul, sans recharger", async () => {
    await page.evaluate(() => { localStorage.removeItem("fake_who"); const s = JSON.parse(localStorage.getItem("fake_sb")); s.session = true; localStorage.setItem("fake_sb", JSON.stringify(s)); localStorage.setItem("lc_net_auth", "fake"); window.__evOW = []; });
    const url0 = page.url();
    await auth("SIGNED_IN", "00000000-0000-4000-8000-0000000000aa");
    await page.waitForSelector("#esLiveGo", { timeout: 5000 });
    const r = await page.evaluate(async () => ({ evts: window.__evOW, moi: (await OWIdentite.moi() || {}).pseudo, plus: /Créez d'abord/.test(document.getElementById("ewEspaces").textContent) }));
    return { ok: r.evts.includes("connexion") && r.moi === "sebtest" && !r.plus && page.url() === url0, detail: JSON.stringify(r) + " · même adresse, pas de rechargement" };
  });
  await step("OW-012 B : connexion annoncée pour le compte DÉJÀ affiché (INITIAL_SESSION, SIGNED_IN, jeton renouvelé) → aucun redessin, aucune double initialisation", async () => {
    await page.goto(EW + "#/community");
    await page.waitForSelector("#esNewBtn:not([hidden])", { timeout: 10000 });
    await page.waitForTimeout(200);
    await page.evaluate(() => { document.getElementById("esNewBtn").__marque = 1; window.__nbListes = 0; const L = document.getElementById("esList"); window.__obs = new MutationObserver(() => {}); });
    const avant = await page.evaluate(() => document.getElementById("ewEspaces").innerHTML.length);
    await auth("INITIAL_SESSION", "00000000-0000-4000-8000-0000000000aa");
    await auth("SIGNED_IN", "00000000-0000-4000-8000-0000000000aa");
    await auth("TOKEN_REFRESHED", "00000000-0000-4000-8000-0000000000aa");
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({ meme: (document.getElementById("esNewBtn") || {}).__marque === 1, abo: (window.__fakeAuth || []).length }));
    return { ok: r.meme && r.abo === 1, detail: (r.meme ? "écran intact" : "ÉCRAN REDESSINÉ") + " · " + r.abo + " abonnement aux événements" };
  });
  await step("OW-012 B : « en direct » seulement si l'animateur a donné signe de vie depuis moins de 5 min ; direct abandonné (10 min) plus annoncé, côté liste et côté salon", async () => {
    const ids = await page.evaluate(([kid]) => { const d = JSON.parse(localStorage.getItem("fake_ow")); const now = Date.now();
      const mk = (id, titre, min) => ({ id, kind: "live", title: titre, about: "", lang: "fr", owner_id: kid, owner_name: "kenji", members: 1, live_on: true, topic: "other", created_at: new Date(now - 36e5).toISOString(), last_at: new Date(now - min * 60000).toISOString() });
      d.ow_rooms.push(mk("cccccccc-0000-4000-8000-0000000f0001", "Direct vivant", 1), mk("cccccccc-0000-4000-8000-0000000f0002", "Direct abandonné", 10));
      localStorage.setItem("fake_ow", JSON.stringify(d)); return ["cccccccc-0000-4000-8000-0000000f0001", "cccccccc-0000-4000-8000-0000000f0002"]; }, [KENJI]);
    await page.goto(EW + "#/live");
    await page.waitForSelector('a[href="#/live/' + ids[1] + '"]', { timeout: 10000 });
    const liste = await page.evaluate((ids) => ids.map((id) => !!document.querySelector('a[href="#/live/' + id + '"] .es-live')), ids);
    await page.goto(EW + "#/live/" + ids[1]);
    await page.waitForSelector("#esVoice", { timeout: 10000 });
    const salon = await page.evaluate(() => ({ badge: document.getElementById("esLiveBadge").textContent, attente: document.getElementById("esCaption").textContent }));
    return { ok: liste[0] === true && liste[1] === false && salon.badge === "" && /pas encore commencé|n'a pas encore/i.test(salon.attente),
      detail: "liste : vivant " + liste[0] + ", abandonné " + liste[1] + " · salon abandonné : badge « " + salon.badge + " », « " + salon.attente.trim() + " »" };
  });
  await step("OW-012 B : enDirect() strict : last_at absent, null, invalide, futur anormal → pas en direct ; récent → en direct ; plus de 5 min → pas en direct", async () => {
    const r = await page.evaluate(() => { const f = EWEspaces._enDirect, n = Date.parse("2026-11-01T12:00:00Z"), iso = (ms) => new Date(n + ms).toISOString();
      return {
        absent: f({ live_on: true }, n), nul: f({ live_on: true, last_at: null }, n), vide: f({ live_on: true, last_at: "" }, n),
        invalide: f({ live_on: true, last_at: "pas une date" }, n), nombre: f({ live_on: true, last_at: 12345 }, n),
        futurAnormal: f({ live_on: true, last_at: iso(10 * 60000) }, n), futurHorloge: f({ live_on: true, last_at: iso(60000) }, n),
        recent: f({ live_on: true, last_at: iso(-60000) }, n), limite: f({ live_on: true, last_at: iso(-5 * 60000) }, n), vieux: f({ live_on: true, last_at: iso(-6 * 60000) }, n),
        arrete: f({ live_on: false, last_at: iso(-1000) }, n), liveTexte: f({ live_on: "true", last_at: iso(-1000) }, n) }; });
    const attendu = { absent: false, nul: false, vide: false, invalide: false, nombre: false, futurAnormal: false, futurHorloge: true, recent: true, limite: false, vieux: false, arrete: false, liveTexte: false };
    const faux = Object.keys(attendu).filter((k) => r[k] !== attendu[k]);
    return { ok: !faux.length, detail: faux.length ? "différents : " + faux.join(",") : "12 cas conformes (absent, null, vide, invalide, nombre, futur +10 min, horloge +1 min, récent 1 min, 5 min pile, 6 min, arrêté, live_on texte)" };
  });
  // Animateur qui revient dans SON direct : périmé (10 min) puis actif (1 min).
  const salonHote = async (titre, minutes) => {
    const id = await page.evaluate(([titre, min]) => { const d = JSON.parse(localStorage.getItem("fake_ow")); d.seq++;
      const id = "cccccccc-0000-4000-8000-" + String(1e11 + d.seq).slice(1), now = Date.now();
      d.ow_rooms.push({ id, kind: "live", title: titre, about: "", lang: "fr", owner_id: "00000000-0000-4000-8000-0000000000aa", owner_name: "sebtest", members: 1, live_on: true, topic: "other", created_at: new Date(now - 36e5).toISOString(), last_at: new Date(now - min * 60000).toISOString() });
      d.ow_room_members.push({ room_id: id, user_id: "00000000-0000-4000-8000-0000000000aa" });
      localStorage.setItem("fake_ow", JSON.stringify(d)); return id; }, [titre, minutes]);
    await page.evaluate(() => { window.__pouls = []; window.__cleared = []; window.__subs = 0; const si = window.__siOrig || window.setInterval, ci = window.__ciOrig || window.clearInterval; window.__siOrig = si; window.__ciOrig = ci;
      window.setInterval = function (f, ms) { const x = si.apply(this, arguments); if (ms === 60000) window.__pouls.push(x); return x; };
      window.clearInterval = function (x) { window.__cleared.push(x); return ci.apply(this, arguments); };
      if (window.EWEcoute && !window.__kaOrig) { window.__kaOrig = window.EWEcoute.keepAwake; window.EWEcoute.keepAwake = function (k) { if (k === "live") window.__subs++; return window.__kaOrig.apply(this, arguments); }; } });
    await page.goto(EW + "#/live");
    await page.goto(EW + "#/live/" + id);
    await page.waitForSelector("#esLiveGo", { timeout: 10000 });
    await page.waitForTimeout(300);
    return id;
  };
  const lireSalon = (id) => page.evaluate((id) => JSON.parse(localStorage.getItem("fake_ow")).ow_rooms.find((r) => r.id === id), id);
  await step("OW-012 B : animateur qui revient après 10 min dans son direct périmé → « Démarrer le direct », aucun pouls, aucun sous-titre automatique, rien d'écrit au serveur", async () => {
    const id = await salonHote("Direct périmé", 10);
    const r = await page.evaluate(() => ({ bouton: document.querySelector("#esLiveGo").textContent, badge: document.getElementById("esLiveBadge").textContent, pouls: window.__pouls.length, soustitres: window.__subs }));
    const apres = await lireSalon(id), age = Math.round((Date.now() - Date.parse(apres.last_at)) / 60000);
    return { ok: /Démarrer/.test(r.bouton) && r.badge === "" && r.pouls === 0 && r.soustitres === 0 && age >= 9,
      detail: "bouton « " + r.bouton + " » · badge « " + r.badge + " » · " + r.pouls + " pouls · " + r.soustitres + " sous-titres lancés · last_at toujours vieux de " + age + " min (rien réécrit)" };
  });
  await step("OW-012 B : direct périmé réactivé UNIQUEMENT après le clic « Démarrer » → live_on et last_at réécrits, pouls lancé, bouton « Arrêter »", async () => {
    const id = page.url().split("/").pop();
    await page.tap("#esLiveGo");
    await page.waitForFunction(() => /Arrêter/.test(document.querySelector("#esLiveGo").textContent), null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const s = await lireSalon(id), r = await page.evaluate(() => ({ pouls: window.__pouls.length, soustitres: window.__subs, badge: document.getElementById("esLiveBadge").textContent }));
    const age = Date.now() - Date.parse(s.last_at);
    await page.tap("#esLiveGo"); // on l'arrête pour la suite
    await page.waitForFunction(() => /Démarrer/.test(document.querySelector("#esLiveGo").textContent), null, { timeout: 5000 });
    return { ok: s.live_on === true && age < 5000 && r.pouls === 1 && r.soustitres === 1 && /direct/i.test(r.badge),
      detail: "live_on " + s.live_on + " · last_at il y a " + Math.round(age / 1000) + " s · " + r.pouls + " pouls · " + r.soustitres + " sous-titres · badge « " + r.badge.trim() + " »" };
  });
  await step("OW-012 B : direct ACTIF (signe de vie il y a 1 min) → reste en direct à son retour : « Arrêter », pouls et sous-titres repartent", async () => {
    const id = await salonHote("Direct actif", 1);
    const r = await page.evaluate(() => ({ bouton: document.querySelector("#esLiveGo").textContent, badge: document.getElementById("esLiveBadge").textContent, lances: window.__pouls.length, pouls: window.__pouls.filter((x) => !window.__cleared.includes(x)).length, soustitres: window.__subs }));
    const s = await lireSalon(id);
    await page.tap("#esLiveGo");
    await page.waitForFunction(() => /Démarrer/.test(document.querySelector("#esLiveGo").textContent), null, { timeout: 5000 });
    return { ok: /Arrêter/.test(r.bouton) && /direct/i.test(r.badge) && r.pouls === 1 && r.soustitres === 1 && Date.now() - Date.parse(s.last_at) < 5000,
      detail: "bouton « " + r.bouton + " » · " + r.pouls + " pouls actif (" + r.lances + " lancement(s), jamais deux en même temps) · " + r.soustitres + " sous-titres · last_at renouvelé au retour" };
  });
  await step("OW-012 B : courses — réponse « lancer le direct » arrivée APRÈS le changement de compte : aucun pouls, aucun sous-titre relancé, aucune erreur", async () => {
    await page.goto(EW + "#/live");
    await page.waitForSelector("#esNewBtn:not([hidden])", { timeout: 10000 });
    await page.tap("#esNewBtn");
    await page.fill("#esTitle", "Direct de la course");
    await page.tap("#esNew button[type=submit]");
    await page.waitForSelector("#esLiveGo", { timeout: 10000 });
    await page.evaluate(async () => { window.__pouls = []; window.__cleared = []; const si = window.setInterval, ci = window.clearInterval;
      window.setInterval = function (f, ms) { const id = si.apply(this, arguments); if (ms === 60000) window.__pouls.push(id); return id; };
      window.clearInterval = function (id) { window.__cleared.push(id); return ci.apply(this, arguments); };
      const c = await OWIdentite.client(), from = c.from.bind(c);
      c.from = (t) => { const q = from(t); if (t !== "ow_rooms") return q; const up = q.update.bind(q); q.update = (v) => { const b = up(v); const th = b.then.bind(b); b.then = (a, z) => new Promise((ok) => setTimeout(ok, 400)).then(() => th(a, z)); return b; }; return q; };
      window.__restaurer = () => { c.from = from; }; });
    const errAvant = errors.length;
    await page.tap("#esLiveGo");
    await page.evaluate(() => localStorage.setItem("fake_who", "b"));
    await auth("SIGNED_IN", AMIRA);
    await page.waitForTimeout(900);
    const r = await page.evaluate(() => { window.__restaurer(); return { vivants: window.__pouls.filter((id) => !window.__cleared.includes(id)).length, lances: window.__pouls.length, hote: !!document.querySelector("#esLiveGo") }; });
    await page.evaluate(() => localStorage.removeItem("fake_who"));
    await auth("SIGNED_IN", "00000000-0000-4000-8000-0000000000aa");
    return { ok: r.vivants === 0 && !r.hote && errors.length === errAvant, detail: r.lances + " pouls lancé(s), " + r.vivants + " encore actif(s) · commandes animateur : " + (r.hote ? "ENCORE LÀ" : "parties") + " · erreurs JS : " + (errors.length - errAvant) };
  });
  await step("OW-012 B : l'animateur donne signe de vie au lancement (last_at) et son pouls s'arrête au changement de compte", async () => {
    await page.goto(EW + "#/live");
    await page.waitForSelector("#esNewBtn:not([hidden])", { timeout: 10000 });
    await page.evaluate(() => { window.__pouls = []; const si = window.setInterval, ci = window.clearInterval; window.__cleared = [];
      window.setInterval = function (f, ms) { const id = si.apply(this, arguments); if (ms === 60000) window.__pouls.push(id); return id; };
      window.clearInterval = function (id) { window.__cleared.push(id); return ci.apply(this, arguments); }; });
    await page.tap("#esNewBtn");
    await page.fill("#esTitle", "Direct du pouls");
    await page.tap("#esNew button[type=submit]");
    await page.waitForSelector("#esLiveGo", { timeout: 10000 });
    const rid = page.url().split("/").pop();
    await page.evaluate((id) => { const d = JSON.parse(localStorage.getItem("fake_ow")); d.ow_rooms.forEach((r) => { if (r.id === id) r.last_at = new Date(Date.now() - 36e5).toISOString(); }); localStorage.setItem("fake_ow", JSON.stringify(d)); }, rid);
    await page.tap("#esLiveGo");
    await page.waitForFunction(() => /Arrêter/.test(document.querySelector("#esLiveGo").textContent), null, { timeout: 5000 });
    await page.waitForTimeout(200);
    const age = await page.evaluate((id) => { const r = JSON.parse(localStorage.getItem("fake_ow")).ow_rooms.find((x) => x.id === id); return Date.now() - Date.parse(r.last_at); }, rid);
    await page.evaluate(() => localStorage.setItem("fake_who", "b"));
    await auth("SIGNED_IN", AMIRA);
    await page.waitForSelector("#esVoice", { timeout: 10000 });
    const p = await page.evaluate(() => ({ pouls: window.__pouls.slice(), arretes: window.__pouls.filter((id) => window.__cleared.includes(id)).length }));
    await page.evaluate(() => localStorage.removeItem("fake_who"));
    await auth("SIGNED_IN", "00000000-0000-4000-8000-0000000000aa");
    return { ok: age < 5000 && p.pouls.length >= 1 && p.arretes === p.pouls.length, detail: "signe de vie il y a " + Math.round(age / 1000) + " s · " + p.pouls.length + " pouls lancé(s), " + p.arretes + " arrêté(s)" };
  });
  // ---------- PR 90 : pouls de l'animateur vérifié (erreur Supabase, rejet réseau, 0 ligne, reprise, courses) ----------
  // Le battement (setInterval 60 s) est capturé pour être déclenché à la main ; la réponse du serveur au battement
  // (update { last_at } seul) est pilotée par window.__pm : "ok" (vrai faux serveur), "err" (res.error), "reject" (réseau),
  // "zero" (0 ligne renouvelée), "lentErr" (erreur arrivée 400 ms plus tard).
  const pilotePouls = () => page.evaluate(async () => {
    window.__beats = []; window.__pm = "ok"; window.__beatCalls = 0;
    const si = window.__siP || window.setInterval; window.__siP = si;
    window.setInterval = function (f, ms) { const x = si.apply(this, arguments); if (ms === 60000) window.__beats.push(f); return x; };
    const c = await OWIdentite.client();
    if (!c.__fromP) c.__fromP = c.from.bind(c);
    const from = c.__fromP;
    c.from = (t) => { const q = from(t); if (t !== "ow_rooms") return q; const up = q.update.bind(q);
      q.update = (v) => { const b = up(v); if (Object.keys(v).join() !== "last_at") return b; window.__beatCalls++;
        const th = b.then.bind(b), m = window.__pm;
        b.then = (a, z) => m === "err" ? Promise.resolve({ data: null, error: { message: "permission denied for table ow_rooms", code: "42501" } }).then(a, z)
          : m === "reject" ? Promise.reject(new TypeError("Failed to fetch")).then(a, z)
          : m === "zero" ? Promise.resolve({ data: [], error: null }).then(a, z)
          : m === "lentErr" ? new Promise((ok) => setTimeout(ok, 400)).then(() => ({ data: null, error: { message: "JWT expired", code: "PGRST301" } })).then(a, z)
          : th(a, z);
        return b; };
      return q; };
  });
  const battre = async (mode, attente) => { await page.evaluate((m) => { window.__pm = m; const f = window.__beats[window.__beats.length - 1]; f && f(); }, mode); await page.waitForTimeout(attente || 150); };
  const etatPouls = () => page.evaluate(() => { const m = document.getElementById("esLiveMsg"), b = document.getElementById("esLiveBadge");
    return { msg: m ? m.textContent : null, etat: m ? m.getAttribute("data-pouls") : null, badge: b ? b.textContent.trim() : null }; });
  const directHote = async (titre) => {
    await page.goto(EW + "#/live");
    await page.waitForSelector("#esNewBtn:not([hidden])", { timeout: 10000 });
    await pilotePouls();
    await page.tap("#esNewBtn");
    await page.fill("#esTitle", titre);
    await page.tap("#esNew button[type=submit]");
    await page.waitForSelector("#esLiveGo", { timeout: 10000 });
    await page.tap("#esLiveGo");
    await page.waitForFunction(() => /Arrêter/.test(document.querySelector("#esLiveGo").textContent), null, { timeout: 5000 });
    await page.waitForTimeout(200);
    return page.url().split("/").pop();
  };
  await step("PR 90 pouls : renouvellement réussi → last_at réécrit, état « ok », badge « En direct », aucun avertissement", async () => {
    const id = await directHote("Pouls réussi");
    await page.evaluate((id) => { const d = JSON.parse(localStorage.getItem("fake_ow")); d.ow_rooms.forEach((r) => { if (r.id === id) r.last_at = new Date(Date.now() - 4 * 60000).toISOString(); }); localStorage.setItem("fake_ow", JSON.stringify(d)); }, id);
    await battre("ok");
    const e = await etatPouls(), s = await lireSalon(id), age = Date.now() - Date.parse(s.last_at);
    return { ok: e.etat === "ok" && e.msg === "" && /En direct/.test(e.badge) && !/⚠/.test(e.badge) && age < 5000 && await page.evaluate(() => window.__beats.length) >= 1,
      detail: "état " + e.etat + " · badge « " + e.badge + " » · last_at il y a " + Math.round(age / 1000) + " s" };
  });
  await step("PR 90 pouls : erreur Supabase dans res.error → animateur prévenu, plus de faux « En direct »", async () => {
    await battre("err");
    const e = await etatPouls();
    return { ok: e.etat === "ko" && /plus renouvelé/.test(e.msg) && /permission denied/.test(e.msg) && /non renouvelé/.test(e.badge) && !/En direct/.test(e.badge), detail: "badge « " + e.badge + " » · message « " + e.msg.slice(0, 90) + "… »" };
  });
  await step("PR 90 pouls : reprise après erreur → message effacé, badge « En direct » rétabli", async () => {
    await battre("ok");
    const e = await etatPouls();
    return { ok: e.etat === "ok" && e.msg === "" && /En direct/.test(e.badge) && !/⚠/.test(e.badge), detail: "état " + e.etat + " · badge « " + e.badge + " »" };
  });
  await step("PR 90 pouls : rejet réseau (promesse rejetée) → animateur prévenu « pas de connexion », puis reprise", async () => {
    await battre("reject");
    const e1 = await etatPouls();
    await battre("ok");
    const e2 = await etatPouls();
    return { ok: e1.etat === "ko" && /Pas de connexion/.test(e1.msg) && /non renouvelé/.test(e1.badge) && e2.etat === "ok" && e2.msg === "" && /En direct/.test(e2.badge),
      detail: "pendant : « " + e1.badge + " » · après : « " + e2.badge + " »" };
  });
  await step("PR 90 pouls : 0 ligne renouvelée (session finie ou salon supprimé, sans erreur) → pas de faux « En direct »", async () => {
    await battre("zero");
    const e = await etatPouls();
    await battre("ok");
    return { ok: e.etat === "ko" && /non renouvelé/.test(e.badge) && !/En direct/.test(e.badge), detail: "badge « " + e.badge + " » · message « " + e.msg.slice(0, 70) + "… »" };
  });
  await step("PR 90 pouls : arrêt du direct pendant une erreur → avertissement retiré, aucun pouls actif", async () => {
    await battre("err");
    await page.tap("#esLiveGo");
    await page.waitForFunction(() => /Démarrer/.test(document.querySelector("#esLiveGo").textContent), null, { timeout: 5000 });
    const n = await page.evaluate(() => window.__beatCalls);
    await battre("ok");
    const e = await etatPouls(), n2 = await page.evaluate(() => window.__beatCalls);
    return { ok: e.etat !== "ko" && !/⚠|direct/i.test(e.badge) && n2 === n, detail: "badge « " + e.badge + " » · battement après l'arrêt : " + (n2 - n) };
  });
  await step("PR 90 pouls : changement de compte PENDANT une requête → la réponse tardive de l'ancien compte ne touche pas l'écran actuel", async () => {
    await directHote("Pouls course compte");
    const errAvant = errors.length;
    await battre("lentErr", 0);
    await page.evaluate(() => localStorage.setItem("fake_who", "b"));
    await auth("SIGNED_IN", AMIRA);
    await page.waitForTimeout(800);
    const e = await etatPouls(), hote = await page.evaluate(() => !!document.querySelector("#esLiveGo"));
    await page.evaluate(() => localStorage.removeItem("fake_who"));
    await auth("SIGNED_IN", "00000000-0000-4000-8000-0000000000aa");
    await page.waitForTimeout(300);
    return { ok: e.etat !== "ko" && !/non renouvelé|plus renouvelé/.test((e.msg || "") + (e.badge || "")) && !hote && errors.length === errAvant,
      detail: "écran du nouveau compte : message « " + (e.msg || "") + " », badge « " + (e.badge || "") + " » · commandes animateur : " + (hote ? "ENCORE LÀ" : "parties") + " · erreurs JS : " + (errors.length - errAvant) };
  });
  await step("PR 90 pouls : sortie de l'écran PENDANT une requête → aucune trace sur l'écran suivant, aucune erreur", async () => {
    await directHote("Pouls course écran");
    const errAvant = errors.length;
    await battre("lentErr", 0);
    await page.goto(EW + "#/community");
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => ({ ko: !!document.querySelector("[data-pouls=ko]"), texte: /plus renouvelé|non renouvelé/.test(document.body.textContent) }));
    await page.evaluate(() => { window.__pm = "ok"; });
    await page.goto(EW + "#/live"); // l'essai suivant ouvre #/community : on le quitte pour qu'il soit vraiment rechargé
    return { ok: !r.ko && !r.texte && errors.length === errAvant, detail: "avertissement sur l'écran suivant : " + (r.ko || r.texte ? "OUI" : "non") + " · erreurs JS : " + (errors.length - errAvant) };
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

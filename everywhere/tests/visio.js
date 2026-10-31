/* 24/24 ONE WORLD — essai de la visio (26 oct. 2026) : deux téléphones simulés (@sebtest en français, @kenji en japonais)
   s'appellent par le faux serveur ; les messages de signalisation passent d'un téléphone à l'autre par ce script.
   Caméra et micro : appareils factices de Chromium. Lancer : node everywhere/tests/visio.js */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const SITE = path.resolve(__dirname, "..", ".."), BASE = "/24-24-talk/", OUT = path.join(__dirname, "resultats");
const C1 = "aaaaaaaa-0000-4000-8000-000000000001";
// Faux serveur : le téléphone « kenji » échange son identité avec @sebtest ; les canaux temps réel passent par window.__relaySend.
let FAKE = fs.readFileSync(path.join(__dirname, "fake-supabase.js"), "utf8");
FAKE = FAKE.replace(/var KENJI = (\{[^}]+\});/, "var KENJI = $1; if (localStorage.getItem('fake_me') === 'kenji') { var __p = PROFILE; PROFILE = KENJI; KENJI = __p; }")
  .replace(/(?:\/\/[^\n]*\n  )?function channel\(\w*\) \{[\s\S]*?\n  \}\n  var R =/, `function channel(name) {
    var c = { _h: [],
      on: function (type, f, cb) { c._h.push({ ev: f && f.event, cb: cb }); return c; },
      subscribe: function (cb) { (window.__chs = window.__chs || []).push({ name: name, c: c }); setTimeout(function () { cb && cb("SUBSCRIBED"); }, 10); return c; },
      send: function (m) { window.__relaySend(name, m.event, m.payload); return Promise.resolve("ok"); },
      track: function () { return Promise.resolve("ok"); }, untrack: function () { return Promise.resolve("ok"); },
      presenceState: function () { return {}; }, unsubscribe: function () { return Promise.resolve("ok"); } };
    return c;
  }
  window.__relayIn = function (name, ev, payload) { (window.__chs || []).forEach(function (x) { if (x.name === name) x.c._h.forEach(function (h) { if (!h.ev || h.ev === ev) h.cb({ payload: payload }); }); }); };
  var R =`);
if (!/__relayIn/.test(FAKE) || !/fake_me/.test(FAKE)) throw new Error("faux serveur non adapté");
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

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port;
  const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const pages = {};
  async function phone(who) {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: who === "kenji" ? "ja-JP" : "fr-FR", permissions: ["camera", "microphone"] });
    await ctx.addInitScript((w) => { window.__EW_NO_SRI = true; try { localStorage.setItem("lc_net_auth", "fake"); localStorage.setItem("fake_contacts", "1"); localStorage.setItem("lc_net_joined", "1"); localStorage.setItem("fake_me", w); } catch (e) {} }, who);
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => /supabase-js/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE }) : r.abort());
    await ctx.exposeBinding("__relaySend", async (src, name, ev, payload) => {
      for (const k of Object.keys(pages)) if (pages[k] !== src.page) pages[k].evaluate(([n, e, p]) => window.__relayIn && window.__relayIn(n, e, p), [name, ev, payload]).catch(() => {});
    });
    const page = await ctx.newPage();
    page._errors = [];
    page.on("pageerror", (e) => page._errors.push(String(e)));
    pages[who] = page;
    return page;
  }
  const kenji = await phone("kenji");
  await kenji.goto(ORIGIN + BASE + "index.html?b=msg");
  await sleep(2500);
  const seb = await phone("seb");
  await seb.goto(ORIGIN + BASE + "index.html?ew=1&ew_appel=" + C1);

  // Lot 2 : la caméra de Sébastien passe par un relais d'essai (compte les demandes, simule refus, caméra prise, lenteur).
  const relais = () => seb.evaluate(() => {
    const md = navigator.mediaDevices, real = md.getUserMedia.bind(md);
    window.__gumMode = null; window.__gumCalls = 0; window.__gumTracks = [];
    md.getUserMedia = async (c) => {
      if (c && c.video) {
        window.__gumCalls++;
        if (window.__gumMode === "deny") throw new DOMException("refus", "NotAllowedError");
        if (window.__gumMode === "busy") throw new DOMException("prise", "NotReadableError");
        if (window.__gumMode === "slow") await new Promise((r) => setTimeout(r, 1500));
        // « single » : téléphone qui n'ouvre qu'une caméra à la fois (fréquent sur Android).
        if (window.__gumMode === "single" && window.__gumTracks.some((tr) => tr.readyState === "live")) throw new DOMException("une seule caméra", "NotReadableError");
      }
      const st = await real(c);
      if (c && c.video) st.getTracks().forEach((tr) => {
        window.__gumTracks.push(tr);
        // Arrêt volontaire par l'appli noté (le changement de page coupe aussi les pistes, mais sans appeler stop()).
        const stop = tr.stop.bind(tr);
        const mode = window.__gumMode; // mode au moment où la caméra a été obtenue
        tr.stop = () => { if (mode === "slow" || mode === "rtslow") sessionStorage.setItem("__gumLateStopped", "1"); stop(); };
      });
      return st;
    };
    // Changement de caméra lent (« rtslow ») : la réponse arrive après la fin de l'appel, sans erreur.
    const rt = RTCRtpSender.prototype.replaceTrack;
    RTCRtpSender.prototype.replaceTrack = async function (tr) {
      if (window.__gumMode === "rtslow" && tr) { await new Promise((r) => setTimeout(r, 1500)); try { await rt.call(this, tr); } catch (e) { /* liaison fermée : réponse quand même */ } return; }
      return rt.call(this, tr);
    };
  });
  await relais();
  await step("Appel : la sonnerie arrive chez @kenji, il décroche", async () => {
    await kenji.waitForSelector("#netAccept", { timeout: 15000 });
    await kenji.tap("#netAccept");
    await seb.waitForSelector("#netCam", { timeout: 15000 });
    await kenji.waitForSelector("#netCam", { timeout: 15000 });
    return { ok: true, detail: "bouton Caméra présent des deux côtés (appel traduit français ⇄ japonais)" };
  });
  await step("Visio traduite : Sébastien allume sa caméra, Kenji la voit", async () => {
    await seb.tap("#netCam");
    await kenji.waitForFunction(() => { const v = document.querySelector("#netVideo .net-rvideo"); return v && v.videoWidth > 0 && v.currentTime > 0.3; }, null, { timeout: 20000 });
    const local = await seb.evaluate(() => { const v = document.querySelector("#netVideo .net-lvideo"); return !!(v && v.videoWidth > 0); });
    return { ok: local, detail: "vidéo reçue chez Kenji, aperçu de soi chez Sébastien" };
  });
  await step("Les deux caméras : Kenji allume la sienne, Sébastien la voit", async () => {
    await kenji.tap("#netCam");
    await seb.waitForFunction(() => { const v = document.querySelector("#netVideo .net-rvideo"); return v && v.videoWidth > 0 && v.currentTime > 0.3; }, null, { timeout: 20000 });
    return { ok: true, detail: "vidéo dans les deux sens" };
  });
  await step("Sous-titres : la phrase écrite par Kenji s'affiche sur sa vidéo chez Sébastien", async () => {
    await kenji.fill("#netCallInput", "こんにちは");
    await kenji.tap("#netCallSend");
    await seb.waitForFunction(() => { const s = document.querySelector("#netSub"); return s && s.textContent.trim().length > 0; }, null, { timeout: 15000 });
    const sub = await seb.textContent("#netSub");
    await seb.screenshot({ path: path.join(OUT, "visio-traduite-seb.png") });
    await kenji.screenshot({ path: path.join(OUT, "visio-traduite-kenji.png") });
    return { ok: true, detail: "sous-titre : « " + sub.trim().slice(0, 60) + " »" };
  });
  await step("Caméra éteinte : la vidéo disparaît chez l'autre", async () => {
    await seb.tap("#netCam");
    await kenji.waitForFunction(() => !document.querySelector("#netVideo .net-rvideo"), null, { timeout: 10000 });
    return { ok: true };
  });
  await step("Double appui sur Caméra : une seule demande de caméra", async () => {
    await seb.evaluate(() => { window.__gumCalls = 0; window.__gumTracks = []; const b = document.querySelector("#netCam"); b.click(); b.click(); });
    await seb.waitForFunction(() => { const v = document.querySelector("#netVideo .net-lvideo"); return v && v.videoWidth > 0; }, null, { timeout: 15000 });
    await sleep(500);
    const r = await seb.evaluate(() => [window.__gumCalls, document.querySelectorAll("#netVideo .net-lvideo").length, !!document.querySelector("#netCamFlip")]);
    return { ok: r[0] === 1 && r[1] === 1 && r[2], detail: r[0] + " demande, " + r[1] + " aperçu, bouton Retourner " + (r[2] ? "présent" : "absent") };
  });
  await step("Retourner la caméra : même liaison, ancienne image arrêtée, Kenji voit toujours", async () => {
    await seb.tap("#netCamFlip");
    await seb.waitForFunction(() => window.__gumTracks.length === 2 && window.__gumTracks[0].readyState === "ended", null, { timeout: 10000 });
    const r = await seb.evaluate(() => { const v = document.querySelector("#netVideo .net-lvideo"); return [v && v.classList.contains("back"), v && v.srcObject && v.srcObject.getVideoTracks()[0] === window.__gumTracks[1]]; });
    const t0 = await kenji.evaluate(() => document.querySelector("#netVideo .net-rvideo").currentTime);
    await sleep(1200);
    const t1 = await kenji.evaluate(() => { const v = document.querySelector("#netVideo .net-rvideo"); return v ? v.currentTime : -1; });
    return { ok: r[0] && r[1] && t1 > t0, detail: JSON.stringify(r) + " aperçu mis à jour, vidéo chez Kenji " + t0.toFixed(1) + " s → " + t1.toFixed(1) + " s" };
  });
  await step("Téléphone qui n'ouvre qu'une caméra à la fois : retourner marche quand même", async () => {
    await seb.evaluate(() => { window.__gumMode = "single"; window.__gumCalls = 0; });
    await seb.tap("#netCamFlip");
    await seb.waitForFunction(() => window.__gumCalls === 2 && window.__gumTracks.length === 3 && window.__gumTracks[2].readyState === "live", null, { timeout: 10000 });
    await sleep(300);
    const r = await seb.evaluate(() => { const v = document.querySelector("#netVideo .net-lvideo"); const msg = (document.querySelector("#netCallMsg") || {}).textContent || "";
      return [v && !v.classList.contains("back"), v && v.srcObject && v.srcObject.getVideoTracks()[0] === window.__gumTracks[2], window.__gumTracks[1].readyState, msg.trim()]; });
    const t0 = await kenji.evaluate(() => document.querySelector("#netVideo .net-rvideo").currentTime);
    await sleep(1200);
    const t1 = await kenji.evaluate(() => { const v = document.querySelector("#netVideo .net-rvideo"); return v ? v.currentTime : -1; });
    await seb.evaluate(() => { window.__gumMode = null; });
    return { ok: r[0] && r[1] && r[2] === "ended" && !r[3] && t1 > t0, detail: JSON.stringify(r) + ", vidéo chez Kenji " + t0.toFixed(1) + " s → " + t1.toFixed(1) + " s" };
  });
  await step("Caméra éteinte : toutes les pistes caméra arrêtées", async () => {
    await seb.tap("#netCam");
    await seb.waitForFunction(() => !document.querySelector("#netVideo .net-lvideo"), null, { timeout: 10000 });
    const r = await seb.evaluate(() => [window.__gumTracks.every((tr) => tr.readyState === "ended"), !!document.querySelector("#netCamFlip")]);
    return { ok: r[0] && !r[1], detail: "pistes arrêtées : " + r[0] };
  });
  await step("Caméra refusée : message clair, l'appel continue", async () => {
    await seb.evaluate(() => { window.__gumMode = "deny"; document.querySelector("#netCam").click(); });
    await seb.waitForFunction(() => /refusée/.test((document.querySelector("#netCallMsg") || {}).textContent || ""), null, { timeout: 10000 });
    const r = await seb.evaluate(() => [document.querySelector("#netCam").getAttribute("aria-pressed"), !!document.querySelector("#netHangup"), document.querySelectorAll("#netVideo .net-lvideo").length]);
    return { ok: r[0] === "false" && r[1] && r[2] === 0, detail: JSON.stringify(r) };
  });
  await step("Caméra prise par une autre appli : message clair", async () => {
    await seb.evaluate(() => { window.__gumMode = "busy"; document.querySelector("#netCam").click(); });
    await seb.waitForFunction(() => /autre application/.test((document.querySelector("#netCallMsg") || {}).textContent || ""), null, { timeout: 10000 });
    await seb.evaluate(() => { window.__gumMode = null; });
    return { ok: true };
  });
  await step("Voix réelle + caméra : bascule, la vidéo repart", async () => {
    await seb.tap("#netVoiceMode");
    await seb.waitForSelector("#netCam", { timeout: 10000 });
    await sleep(2500);
    await seb.tap("#netCam");
    await kenji.waitForFunction(() => { const v = document.querySelector("#netVideo .net-rvideo"); return v && v.videoWidth > 0 && v.currentTime > 0.3; }, null, { timeout: 20000 });
    await kenji.screenshot({ path: path.join(OUT, "visio-voix-kenji.png") });
    return { ok: true, detail: "vidéo reçue en voix réelle" };
  });
  await step("Caméra demandée juste avant de raccrocher (caméra lente)", async () => {
    await seb.tap("#netCam");
    await seb.waitForFunction(() => !document.querySelector("#netVideo .net-lvideo"), null, { timeout: 10000 });
    await seb.evaluate(() => { window.__gumMode = "slow"; window.__gumTracks = []; sessionStorage.removeItem("__gumLateStopped"); document.querySelector("#netCam").click(); });
    return { ok: true, detail: "caméra en cours d'activation pendant qu'on raccroche" };
  });
  await step("Raccrocher : caméras coupées, aucune erreur JavaScript", async () => {
    await seb.tap("#netHangup");
    await sleep(1500);
    const live = await seb.evaluate(() => document.querySelectorAll("video").length);
    const errs = seb._errors.concat(kenji._errors);
    return { ok: live === 0 && errs.length === 0, detail: live + " vidéo restante, erreurs : " + (errs.join(" | ") || "aucune") };
  });
  await step("Après raccrocher : la caméra arrivée en retard est arrêtée aussitôt", async () => {
    await sleep(2000);
    const r = await seb.evaluate(() => [sessionStorage.getItem("__gumLateStopped"), document.querySelectorAll("video,audio").length]);
    return { ok: r[0] === "1" && r[1] === 0, detail: "piste arrivée après la fin arrêtée par l'appli : " + (r[0] === "1") + ", éléments audio/vidéo restants : " + r[1] };
  });
  await step("2e appel : retourner la caméra puis raccrocher pendant le changement", async () => {
    await sleep(2500);
    await seb.goto(ORIGIN + BASE + "index.html?ew=1&ew_appel=" + C1);
    await relais();
    await kenji.waitForSelector("#netAccept", { timeout: 20000 });
    await kenji.tap("#netAccept");
    await seb.waitForSelector("#netCam", { timeout: 15000 });
    await seb.tap("#netCam");
    await seb.waitForSelector("#netCamFlip", { timeout: 15000 });
    await seb.evaluate(() => { window.__gumMode = "rtslow"; window.__gumTracks = []; sessionStorage.removeItem("__gumLateStopped"); document.querySelector("#netCamFlip").click(); });
    await seb.waitForFunction(() => window.__gumTracks.length >= 1, null, { timeout: 10000 });
    await seb.tap("#netHangup");
    await sleep(1700);
    const r = await seb.evaluate(() => [sessionStorage.getItem("__gumLateStopped"), document.querySelectorAll("video").length]);
    return { ok: r[0] === "1" && r[1] === 0, detail: "nouvelle caméra arrêtée par l'appli : " + (r[0] === "1") + ", vidéos restantes : " + r[1] };
  });
  console.log("\n" + results.filter(Boolean).length + " / " + results.length + " tests réussis");
  await browser.close(); server.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})();

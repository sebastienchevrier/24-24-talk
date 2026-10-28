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
  .replace(/function channel\(\) \{[\s\S]*?\n  \}\n  var R =/, `function channel(name) {
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
  await step("Voix réelle + caméra : bascule, la vidéo repart", async () => {
    await seb.tap("#netVoiceMode");
    await seb.waitForSelector("#netCam", { timeout: 10000 });
    await sleep(2500);
    await seb.tap("#netCam");
    await kenji.waitForFunction(() => { const v = document.querySelector("#netVideo .net-rvideo"); return v && v.videoWidth > 0 && v.currentTime > 0.3; }, null, { timeout: 20000 });
    await kenji.screenshot({ path: path.join(OUT, "visio-voix-kenji.png") });
    return { ok: true, detail: "vidéo reçue en voix réelle" };
  });
  await step("Raccrocher : caméras coupées, aucune erreur JavaScript", async () => {
    await seb.tap("#netHangup");
    await sleep(1500);
    const live = await seb.evaluate(() => document.querySelectorAll("video").length);
    const errs = seb._errors.concat(kenji._errors);
    return { ok: live === 0 && errs.length === 0, detail: live + " vidéo restante, erreurs : " + (errs.join(" | ") || "aucune") };
  });
  console.log("\n" + results.filter(Boolean).length + " / " + results.length + " tests réussis");
  await browser.close(); server.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})();

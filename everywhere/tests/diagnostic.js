/* 24/24 ONE WORLD — essais de la page Diagnostic /diag/ (lot 1, essais sur appareils réels). © 2026 Sébastien Chevrier.
   Vérifie : la page ne contacte personne au chargement, produit un code complet et copiable, ne demande aucune autorisation
   sans geste, et les essais micro / caméra éteignent tout de suite les appareils. Site servi en local, sans Internet.
   Lancer : node everywhere/tests/diagnostic.js */
const pw = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const SITE = path.resolve(__dirname, "..", ".."), BASE = "/24-24-talk/";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };
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
function rec(n, ok, d) { results.push(ok); console.log((ok ? "OK   " : "ÉCHEC") + "  " + n + (d ? "  — " + d : "")); }
async function step(n, fn) { try { const r = await fn(); rec(n, r.ok, r.detail); } catch (e) { rec(n, false, String(e.message || e).split("\n")[0]); } }

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const URL_DIAG = "http://localhost:" + server.address().port + BASE + "diag/";
  const browser = await pw.chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const externes = [], errors = [];
  const ctx = await browser.newContext({ locale: "fr-FR", viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => { externes.push(r.request().url()); return r.abort(); });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(String(e)));
  // Espion : aucune demande d'autorisation (micro, caméra, notifications) sans geste.
  await p.addInitScript(() => {
    window.__demandes = [];
    if (navigator.mediaDevices) { const g = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = (c) => { window.__demandes.push("media"); return g(c).then((s) => { window.__flux = s; return s; }); }; }
    if (window.Notification) Notification.requestPermission = () => { window.__demandes.push("notif"); return Promise.resolve("default"); };
  });
  await p.goto(URL_DIAG);
  await p.waitForSelector("html[data-pret='1']", { timeout: 10000 });

  await step("Chargement : un seul titre, aucune erreur, aucun appel extérieur", async () => {
    const h1 = await p.locator("h1").count();
    return { ok: h1 === 1 && errors.length === 0 && externes.length === 0, detail: "h1=" + h1 + " erreurs=" + errors.length + " externes=" + externes.join(",") };
  });
  await step("Aucune autorisation demandée sans geste", async () => {
    const d = await p.evaluate(() => window.__demandes.slice());
    return { ok: d.length === 0, detail: d.join(",") };
  });
  await step("Code complet : version, date et toutes les rubriques", async () => {
    const code = await p.inputValue("#code");
    const cles = ["nav", "os", "inst", "ecran", "langue", "fuseau", "reseau", "micro", "camera", "notif", "push", "webrtc", "dictee", "voix", "bt", "partage", "vibre", "scan", "stock", "traducteur"];
    const manque = cles.filter((k) => !new RegExp("\\|" + k + "=[^|]+").test(code));
    return { ok: /^OWDIAG1\|\d{4}-\d\d-\d\dT\d\d:\d\dZ\|/.test(code) && manque.length === 0 && !/…/.test(code), detail: manque.join(",") || code.slice(0, 90) };
  });
  await step("Résultats affichés en clair, un par rubrique", async () => {
    const n = await p.locator("#res li").count();
    return { ok: n >= 20, detail: n + " lignes" };
  });
  await step("Bouton « Copier le code » : le code arrive dans le presse-papiers", async () => {
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
    await p.click("#copier");
    await p.waitForFunction(() => document.getElementById("copie").textContent.length > 0);
    const presse = await p.evaluate(() => navigator.clipboard.readText());
    return { ok: presse === (await p.inputValue("#code")) && /copié/.test(await p.textContent("#copie")), detail: presse.slice(0, 40) };
  });
  await step("Essai micro : autorisé, puis micro éteint aussitôt", async () => {
    await p.click("#b-micro");
    await p.waitForFunction(() => /essai_micro=/.test(document.getElementById("code").value));
    const r = await p.evaluate(() => ({ code: document.getElementById("code").value, eteint: window.__flux.getTracks().every((t) => t.readyState === "ended") }));
    return { ok: /essai_micro=ok/.test(r.code) && r.eteint, detail: (r.code.match(/essai_micro=[^|]+/) || [""])[0] + " éteint=" + r.eteint };
  });
  await step("Essai caméra : autorisée, puis caméra éteinte aussitôt", async () => {
    await p.click("#b-camera");
    await p.waitForFunction(() => /essai_camera=/.test(document.getElementById("code").value));
    const r = await p.evaluate(() => ({ code: document.getElementById("code").value, eteint: window.__flux.getTracks().every((t) => t.readyState === "ended") }));
    return { ok: /essai_camera=ok/.test(r.code) && r.eteint, detail: (r.code.match(/essai_camera=[^|]+/) || [""])[0] };
  });
  await step("Essai réseau d'appel : se termine avec un résultat lisible", async () => {
    await p.click("#b-reseau");
    await p.waitForFunction(() => /essai_reseau=(ok|ko)/.test(document.getElementById("code").value), null, { timeout: 15000 });
    const c = (await p.inputValue("#code")).match(/essai_reseau=[^|]+/)[0];
    return { ok: /^essai_reseau=(ok|ko) direct:\d+ public:\d+ relais:\d+$/.test(c), detail: c };
  });
  await step("Micro refusé : la page le dit, sans planter", async () => {
    const c2 = await browser.newContext({ locale: "fr-FR" });
    const p2 = await c2.newPage();
    await p2.addInitScript(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error("x"), { name: "NotAllowedError" })); });
    await p2.goto(URL_DIAG); await p2.waitForSelector("html[data-pret='1']");
    await p2.click("#b-micro");
    await p2.waitForFunction(() => /essai_micro=/.test(document.getElementById("code").value));
    const c = (await p2.inputValue("#code")).match(/essai_micro=[^|]+/)[0];
    const ko = await p2.locator("#res .v.ko").count();
    await c2.close();
    return { ok: c === "essai_micro=ko NotAllowedError" && ko >= 1, detail: c };
  });
  for (const w of [320, 768, 1280]) {
    await step("Largeur " + w + " px : rien ne dépasse, boutons ≥ 44 px", async () => {
      await p.setViewportSize({ width: w, height: 800 });
      const r = await p.evaluate(() => ({ deb: document.documentElement.scrollWidth - innerWidth,
        petits: [...document.querySelectorAll("button,a")].filter((b) => b.getBoundingClientRect().height < 44 && b.tagName === "BUTTON").length }));
      return { ok: r.deb <= 0 && r.petits === 0, detail: "débord=" + r.deb + " petits=" + r.petits };
    });
  }
  await step("Accessibilité (axe) : aucune faute grave", async () => {
    await p.addScriptTag({ path: process.env.AXE || require.resolve("axe-core/axe.min.js") });
    const v = await p.evaluate(async () => (await axe.run(document, { resultTypes: ["violations"] })).violations
      .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => x.id));
    return { ok: v.length === 0, detail: v.join(",") };
  });
  await step("Toujours aucun appel extérieur (web) après tous les essais", async () => ({ ok: externes.length === 0, detail: externes.join(",") }));

  await browser.close(); server.close();
  const ok = results.filter(Boolean).length;
  console.log("\n" + ok + "/" + results.length + " essais réussis");
  process.exit(ok === results.length ? 0 : 1);
})();

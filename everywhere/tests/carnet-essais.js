/* 24/24 ONE WORLD — essais du carnet d'essais à deux téléphones /diag/essais/ (lot 1). © 2026 Sébastien Chevrier.
   Site servi en local, aucun accès à Internet. Lancer : node everywhere/tests/carnet-essais.js */
const pw = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const SITE = path.resolve(__dirname, "..", ".."), BASE = "/24-24-talk/";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
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
  const URL_C = "http://localhost:" + server.address().port + BASE + "diag/essais/";
  const browser = await pw.chromium.launch();
  const externes = [], errors = [];
  const ctx = await browser.newContext({ locale: "fr-FR", viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => { externes.push(r.request().url()); return r.abort(); });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(String(e)));
  await p.goto(URL_C);
  await p.waitForSelector("html[data-pret='1']");
  const code = () => p.inputValue("#code");

  await step("14 essais affichés, un seul titre, aucune erreur ni appel extérieur", async () => {
    const n = await p.locator(".choix").count(), h1 = await p.locator("h1").count();
    return { ok: n === 14 && h1 === 1 && errors.length === 0 && externes.length === 0, detail: "essais=" + n + " h1=" + h1 + " erreurs=" + errors.length };
  });
  await step("Code vide au départ : 14 rubriques à « - », téléphone A", async () => {
    const c = await code();
    return { ok: /^OWESSAI1\|\d{4}-\d\d-\d\dT\d\d:\d\dZ\|tel=A\|/.test(c) && (c.match(/\|\d+=-/g) || []).length === 14, detail: c.slice(0, 60) };
  });
  await step("OK, Moyen, Raté, nombre et note passent dans le code", async () => {
    await p.click('.choix button[data-id="1"][data-v="ok"]');
    await p.click('.choix button[data-id="8"][data-v="ko"]');
    await p.fill("#n8", "2");
    await p.fill("#m8", "pas de son | coupé");
    await p.click('.choix button[data-id="5"][data-v="partiel"]');
    await p.selectOption("#tel", "B");
    const c = await code();
    return { ok: /\|tel=B\|/.test(c) && /\|1=ok\|/.test(c) && /\|5=partiel\|/.test(c) && /\|8=ko:2\/5:pas de son   coupé\|/.test(c), detail: c };
  });
  await step("Toucher à nouveau le même bouton l'annule", async () => {
    await p.click('.choix button[data-id="1"][data-v="ok"]');
    const pressed = await p.getAttribute('.choix button[data-id="1"][data-v="ok"]', "aria-pressed");
    return { ok: /\|1=-\|/.test(await code()) && pressed === "false", detail: pressed };
  });
  await step("Le compteur d'avancement suit", async () => {
    const t = await p.textContent("#avance");
    return { ok: t === "2 essais sur 14", detail: t };
  });
  await step("Réponses gardées après rechargement de la page", async () => {
    await p.reload(); await p.waitForSelector("html[data-pret='1']");
    const c = await code();
    return { ok: /\|tel=B\|/.test(c) && /\|8=ko:2\/5/.test(c) && (await p.inputValue("#m8")) === "pas de son | coupé", detail: c.slice(0, 80) };
  });
  await step("Bouton « Copier le code » : le code arrive dans le presse-papiers", async () => {
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
    await p.click("#copier");
    await p.waitForFunction(() => document.getElementById("copie").textContent.length > 0);
    return { ok: (await p.evaluate(() => navigator.clipboard.readText())) === (await code()), detail: "" };
  });
  await step("Tout effacer (après confirmation)", async () => {
    p.once("dialog", (d) => d.accept());
    await p.click("#raz");
    const c = await code();
    return { ok: (c.match(/\|\d+=-/g) || []).length === 14 && /\|tel=B\|/.test(c), detail: c.slice(0, 60) };
  });
  await step("Sans mémoire du navigateur (navigation privée bloquée) : la page marche quand même", async () => {
    const c2 = await browser.newContext({ locale: "fr-FR" });
    const p2 = await c2.newPage(); const err2 = [];
    p2.on("pageerror", (e) => err2.push(String(e)));
    await p2.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("bloqué"); } }); });
    await p2.goto(URL_C); await p2.waitForSelector("html[data-pret='1']");
    await p2.click('.choix button[data-id="3"][data-v="ok"]');
    const c = await p2.inputValue("#code"); await c2.close();
    return { ok: err2.length === 0 && /\|3=ok\|/.test(c), detail: err2.join(",") };
  });
  for (const w of [320, 768, 1280]) {
    await step("Largeur " + w + " px : rien ne dépasse, boutons ≥ 44 px", async () => {
      await p.setViewportSize({ width: w, height: 800 });
      const r = await p.evaluate(() => ({ deb: document.documentElement.scrollWidth - innerWidth,
        petits: [...document.querySelectorAll("button,input,select")].filter((b) => b.getBoundingClientRect().height < 44).length }));
      return { ok: r.deb <= 0 && r.petits === 0, detail: "débord=" + r.deb + " petits=" + r.petits };
    });
  }
  await step("Accessibilité (axe) : aucune faute grave", async () => {
    await p.addScriptTag({ path: process.env.AXE || require.resolve("axe-core/axe.min.js") });
    const v = await p.evaluate(async () => (await axe.run(document, { resultTypes: ["violations"] })).violations
      .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => x.id + ":" + x.nodes.length));
    return { ok: v.length === 0, detail: v.join(",") };
  });
  await step("Aucun appel extérieur pendant tous les essais", async () => ({ ok: externes.length === 0, detail: externes.join(",") }));

  await browser.close(); server.close();
  const ok = results.filter(Boolean).length;
  console.log("\n" + ok + "/" + results.length + " essais réussis");
  process.exit(ok === results.length ? 0 : 1);
})();

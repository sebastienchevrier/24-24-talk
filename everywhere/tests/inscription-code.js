/* 24/24 ONE WORLD — essai du code reçu par e-mail à l'inscription (31 oct. 2026).
   Constat réel : la base de TEST envoie un code à 8 chiffres (e-mail reçu le 31 oct.), mais le champ n'acceptait que 6 chiffres.
   Faux serveur : bons codes 123456 et 12345678. Lancer : node everywhere/tests/inscription-code.js */
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

// Inscription en 3 écrans (nom, e-mail, langue) comme sur le téléphone.
async function inscrire(p, nom, mail) {
  await p.fill("#netPseudo", nom); await p.click("#netNext");
  await p.waitForSelector('.ob-step.on[data-k="email"] #netEmail'); await p.fill("#netEmail", mail); await p.click("#netNext");
  await p.waitForSelector('.ob-step.on[data-k="lang"]'); await p.check("#netAge"); await p.click("#netCreate");
}
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, locale: "fr-FR" });
  await ctx.addInitScript(() => { window.__EW_NO_SRI = true; try { localStorage.setItem("lc_uilang", "fr"); if (!sessionStorage.getItem("ic_i")) { sessionStorage.setItem("ic_i", "1"); localStorage.setItem("fake_sb", JSON.stringify({ session: false, email: "", new_email: "", anon: true, pending: "", devices: [] })); } } catch (e) {} });
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => /supabase-js/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE }) : r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await step("Inscription : l'e-mail de confirmation part, écran du code", async () => {
    await page.goto(ORIGIN + BASE + "index.html");
    await page.waitForSelector("#netPseudo", { timeout: 15000 });
    await inscrire(page, "Essai Code", "essai@exemple.fr");
    await page.waitForSelector("#netCode", { timeout: 10000 });
    return { ok: true, detail: "écran « vérifiez vos e-mails » affiché" };
  });
  await step("Code à 8 chiffres : saisi en entier (pas coupé à 6)", async () => {
    await page.fill("#netCode", "");
    await page.type("#netCode", "12345678");
    const v = await page.inputValue("#netCode");
    return { ok: v === "12345678", detail: "valeur : " + v };
  });
  await step("Code à 8 chiffres : accepté, le profil est créé", async () => {
    await page.click("#netCodeOk");
    await page.waitForFunction(() => !document.querySelector("#netCode"), null, { timeout: 10000 });
    const t = await page.evaluate(() => document.body.innerText.slice(0, 200));
    return { ok: !/incorrect/i.test(t), detail: t.replace(/\s+/g, " ").slice(0, 80) };
  });
  await step("Code de 5 chiffres refusé avec un message", async () => {
    const p2 = await ctx.newPage();
    await p2.goto(ORIGIN + BASE + "index.html"); await p2.evaluate(() => { localStorage.clear(); localStorage.setItem("lc_uilang", "fr"); localStorage.setItem("fake_sb", JSON.stringify({ session: false, email: "", new_email: "", anon: true, pending: "", devices: [] })); });
    await p2.goto(ORIGIN + BASE + "index.html"); await p2.waitForSelector("#netPseudo", { timeout: 15000 });
    await inscrire(p2, "Essai Deux", "deux@exemple.fr");
    await p2.waitForSelector("#netCode", { timeout: 10000 });
    await p2.fill("#netCode", "12345"); await p2.click("#netCodeOk");
    await p2.waitForFunction(() => /incorrect|expiré/i.test(document.querySelector("#netVerMsg").textContent), null, { timeout: 5000 });
    const m = (await p2.textContent("#netVerMsg")).trim(); await p2.close();
    return { ok: true, detail: m };
  });
  await step("Aucune erreur JavaScript", async () => ({ ok: errors.length === 0, detail: errors.join(" | ") || "aucune" }));
  console.log("\n" + results.filter(Boolean).length + " / " + results.length + " tests réussis");
  await browser.close(); server.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})();

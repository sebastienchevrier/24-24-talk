/* 24/24 ONE WORLD — essai de « Comprendre un papier » (26 oct. 2026).
   La lecture (Tesseract.js, CDN) et la traduction (MyMemory) sont simulées. Lancer : node everywhere/tests/papier.js */
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
// Fausse bibliothèque de lecture : renvoie un texte connu, note la langue demandée.
const TESS = 'window.Tesseract={createWorker:function(l,o,opt){window.__ocrLang=l;return Promise.resolve({recognize:function(f){opt&&opt.logger&&opt.logger({status:"recognizing text",progress:.5});window.__ocrFile=f&&f.name;return Promise.resolve({data:{text:window.__ocrText==null?"Convocation à la mairie\\nLundi 9 h, apportez votre passeport.":window.__ocrText}})},terminate:function(){window.__ocrDone=(window.__ocrDone||0)+1}})}};';
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port, EW = ORIGIN + BASE + "everywhere/";
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR" });
  await ctx.addInitScript(() => { window.__EW_NO_SRI = true; try { if (!localStorage.getItem("lc_net_auth")) localStorage.setItem("lc_net_auth", "fake"); } catch (e) {} });
  let tessLoads = 0, libOff = false;
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => {
    const u = r.request().url();
    if (/supabase-js/.test(u)) return r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE });
    if (/tesseract/.test(u)) { if (libOff) return r.abort(); tessLoads++; return r.fulfill({ status: 200, contentType: "text/javascript", body: TESS }); }
    if (/mymemory/.test(u)) {
      const q = new URL(u).searchParams, pair = q.get("langpair") || "";
      return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ responseStatus: 200, responseData: { translatedText: "[" + pair.split("|")[1] + "] " + q.get("q"), match: 1 } }) });
    }
    return r.abort();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await step("Traduire : nouvelle tuile « Comprendre un papier »", async () => {
    await page.goto(EW + "#/everywhere");
    await page.waitForSelector("#trGoPaper", { timeout: 10000 });
    await page.tap("#trGoPaper");
    await page.waitForSelector("#ppCam", { state: "attached", timeout: 5000 });
    const cap = await page.$eval("#ppCam", (i) => i.getAttribute("capture"));
    return { ok: cap === "environment" && tessLoads === 0, detail: "appareil photo arrière, bibliothèque pas encore chargée (" + tessLoads + ")" };
  });
  await step("Papier en français lu puis traduit en anglais, écoute possible", async () => {
    await page.selectOption("#ppFrom", "fr");
    await page.selectOption("#ppTo", "en");
    await page.setInputFiles("#ppCam", { name: "lettre.png", mimeType: "image/png", buffer: PNG });
    await page.waitForSelector("#ppRes:not([hidden])", { timeout: 10000 });
    const read = await page.inputValue("#ppText"), tr = await page.textContent("#ppTr");
    const lang = await page.evaluate(() => window.__ocrLang);
    await page.screenshot({ path: path.join(OUT, "papier.png"), fullPage: true });
    return { ok: lang === "fra" && /Convocation/.test(read) && /^\[en\] Convocation/.test(tr) && !!(await page.$("#ppSay")), detail: "lecture " + lang + " → " + tr.slice(0, 50) };
  });
  await step("Texte corrigé à la main puis retraduit ; la langue du papier est gardée", async () => {
    await page.fill("#ppText", "Rendez-vous mardi");
    await page.tap("#ppGo");
    await page.waitForFunction(() => /Rendez-vous mardi/.test(document.querySelector("#ppTr").textContent), null, { timeout: 5000 });
    const kept = await page.evaluate(() => localStorage.getItem("ew_papier_from"));
    return { ok: kept === "fr", detail: "langue gardée : " + kept };
  });
  await step("Papier en japonais : données de lecture japonaises", async () => {
    await page.selectOption("#ppFrom", "ja");
    await page.setInputFiles("#ppPick", { name: "panneau.png", mimeType: "image/png", buffer: PNG });
    await page.waitForFunction(() => window.__ocrLang === "jpn", null, { timeout: 5000 });
    return { ok: tessLoads === 1, detail: "bibliothèque chargée " + tessLoads + " fois" };
  });
  await step("Photo sans texte : message clair, rien d'inventé", async () => {
    await page.evaluate(() => { window.__ocrText = "  "; });
    await page.setInputFiles("#ppPick", { name: "vide.png", mimeType: "image/png", buffer: PNG });
    await page.waitForFunction(() => /Aucun texte/.test(document.querySelector("#ppMsg").textContent), null, { timeout: 5000 });
    return { ok: await page.$eval("#ppOut", (d) => d.hidden), detail: (await page.textContent("#ppMsg")).trim() };
  });
  await step("Sans Internet la première fois : message, pas de plantage", async () => {
    libOff = true;
    const p2 = await ctx.newPage();
    p2.on("pageerror", (e) => errors.push(String(e)));
    await p2.goto(EW + "#/everywhere/papier");
    await p2.waitForSelector("#ppPick", { state: "attached", timeout: 10000 });
    await p2.setInputFiles("#ppPick", { name: "x.png", mimeType: "image/png", buffer: PNG });
    await p2.waitForFunction(() => /Internet/.test(document.querySelector("#ppMsg").textContent), null, { timeout: 8000 });
    const m = (await p2.textContent("#ppMsg")).trim();
    await p2.close();
    return { ok: true, detail: m.slice(0, 70) };
  });
  await step("Aucune erreur JavaScript, pas de défilement horizontal", async () => {
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    return { ok: errors.length === 0 && !wide, detail: errors.join(" | ") || "aucune erreur" };
  });
  console.log("\n" + results.filter(Boolean).length + " / " + results.length + " tests réussis");
  await browser.close(); server.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})();

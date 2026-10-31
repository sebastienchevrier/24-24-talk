/* 24/24 ONE WORLD — essais de la Terre connectée (#/terre, lot 3, 30 oct. 2026).
   Portail servi en local, faux serveur Supabase, aucun réseau extérieur. Lancer : node everywhere/tests/terre.js */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const SITE = path.resolve(__dirname, "..", ".."), BASE = "/24-24-talk/";
const FAKE = fs.readFileSync(path.join(__dirname, "fake-supabase.js"), "utf8");
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
const NOMS = { af: "Afrique", eu: "Europe", as: "Asie", na: "Amérique du Nord", sa: "Amérique du Sud", oc: "Océanie" };

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port;
  const browser = await chromium.launch();
  async function ouvrir(opts) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, locale: "fr-FR" }, opts || {}));
    await ctx.addInitScript(() => {
      window.__EW_NO_SRI = true;
      try { localStorage.setItem("lc_net_auth", "fake"); localStorage.setItem("lc_net_joined", "1"); localStorage.setItem("lc_uilang", "fr"); } catch (e) {}
      // Géolocalisation surveillée : aucun appel attendu.
      window.__geo = 0;
      if (navigator.geolocation) { navigator.geolocation.getCurrentPosition = () => { window.__geo++; }; navigator.geolocation.watchPosition = () => { window.__geo++; return 0; }; }
    });
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => /supabase-js/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE }) : r.abort());
    const page = await ctx.newPage();
    page._errors = [];
    page.on("pageerror", (e) => page._errors.push(String(e)));
    await page.goto(ORIGIN + BASE + "everywhere/index.html#/terre");
    await page.waitForSelector("#earthGlobe", { timeout: 15000 });
    await sleep(400);
    return { ctx, page };
  }
  let { ctx, page } = await ouvrir();
  const dessine = (p) => p.evaluate(() => { const c = document.querySelector("#earthGlobe"), g = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < g.length; i += 40) if (g[i] > 0) n++; return n; });

  await step("Le globe s'affiche (dessiné, titre, six régions)", async () => {
    const n = await dessine(page);
    const r = await page.evaluate(() => [document.querySelector("#h-terre").textContent, document.querySelectorAll(".earth-region").length, document.querySelector("#earthGlobe").getAttribute("role")]);
    return { ok: n > 500 && r[0] === "Terre connectée" && r[1] === 6 && r[2] === "img", detail: n + " points dessinés, " + JSON.stringify(r) };
  });
  await step("La Terre tourne lentement", async () => {
    const a = await page.evaluate(() => EWTerre.rotation); await sleep(700); const b = await page.evaluate(() => EWTerre.rotation);
    return { ok: b > a && b - a < 20 && (await page.evaluate(() => EWTerre.running)), detail: (b - a).toFixed(2) + "° en 0,7 s" };
  });
  await step("Réglage « animations » de l'appli (motion-off) : la Terre s'arrête", async () => {
    await page.evaluate(() => document.documentElement.classList.add("motion-off")); await sleep(150);
    const a = await page.evaluate(() => EWTerre.rotation); await sleep(500); const b = await page.evaluate(() => [EWTerre.rotation, EWTerre.running]);
    await page.evaluate(() => document.documentElement.classList.remove("motion-off")); await sleep(150);
    return { ok: a === b[0] && !b[1] && (await dessine(page)) > 500 && (await page.evaluate(() => EWTerre.running)), detail: "arrêtée, toujours dessinée, repart ensuite" };
  });
  for (const id of Object.keys(NOMS)) {
    await step("Région « " + NOMS[id] + " » : nom, présentation, ses langues, Écrire", async () => {
      await page.tap('.earth-region[data-region="' + id + '"]');
      const r = await page.evaluate((x) => [document.querySelector("#earthInfoH").textContent, document.querySelector(".earth-info-d").textContent.length,
        document.querySelector('.earth-region[data-region="' + x + '"]').getAttribute("aria-pressed"), document.querySelectorAll(".earth-lang").length, !!document.querySelector("#earthWrite"), document.querySelector("#earthLive").textContent], id);
      return { ok: r[0] === NOMS[id] && r[1] > 30 && r[2] === "true" && r[3] >= 4 && r[4] && r[5].indexOf(NOMS[id]) !== -1, detail: r[0] + ", " + r[3] + " langues" };
    });
  }
  await step("Toucher une région sur le globe la choisit", async () => {
    await page.tap('.earth-region[data-region="as"]'); await sleep(200);
    // Le panneau est vidé : seul le toucher sur le globe peut le remplir.
    await page.evaluate(() => { const b = document.querySelector("#earthInfo"); b.innerHTML = ""; b.hidden = true; });
    // L'Asie est maintenant face à soi, au centre du globe : on touche le centre.
    await page.evaluate(() => document.documentElement.classList.add("motion-off")); await sleep(100);
    const b = await page.$eval("#earthGlobe", (c) => { const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 - r.height * 0.36 * Math.sin(32 * Math.PI / 180) }; });
    await page.mouse.click(b.x, b.y);
    const h = await page.textContent("#earthInfoH");
    await page.evaluate(() => document.documentElement.classList.remove("motion-off"));
    return { ok: h === "Asie", detail: h };
  });
  await step("Aucune géolocalisation demandée", async () => ({ ok: (await page.evaluate(() => window.__geo)) === 0 }));
  await step("Clavier : Tab jusqu'à une région, Entrée la choisit", async () => {
    await page.focus('.earth-region[data-region="oc"]'); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
    const f = await page.evaluate(() => document.activeElement.getAttribute("data-region"));
    await page.keyboard.press("Enter");
    const h = await page.textContent("#earthInfoH");
    const o = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    return { ok: f === "oc" && h === "Océanie", detail: "focus " + f + ", contour " + o };
  });
  // 31 oct. 2026 : Sébastien choisissait Asie et tombait sur « Anglais, Espagnol, Italien » (Apprendre). Chaque langue ouvre maintenant ce qui marche pour elle.
  await step("Asie : langues d'Asie (japonais, chinois, hindi…), pas d'italien", async () => {
    await page.tap('.earth-region[data-region="as"]');
    const codes = await page.$$eval(".earth-lang", (b) => b.map((x) => x.getAttribute("data-lang")));
    return { ok: ["ja", "zh", "hi", "ko", "vi", "th"].every((c) => codes.includes(c)) && !codes.includes("it") && !codes.includes("es"), detail: codes.length + " langues : " + codes.slice(0, 8).join(", ") + "…" };
  });
  await step("Japonais : pas de faux cours, « Parler avec quelqu'un en japonais » ouvre Face à face en japonais", async () => {
    await page.tap('.earth-lang[data-lang="ja"]');
    await page.waitForFunction(() => document.querySelector("#earthLearn").textContent.length > 10, null, { timeout: 5000 });
    const r = [await page.textContent("#earthTalk"), await page.textContent("#earthLearn"), !!(await page.$("#earthLearnGo"))];
    await page.screenshot({ path: require("path").join(__dirname, "resultats", "terre-asie-japonais.png"), fullPage: true });
    await page.tap("#earthTalk"); await sleep(600);
    const o = await page.evaluate(() => [location.hash, JSON.parse(localStorage.getItem("ew_tr_v1") || "{}").other]);
    return { ok: /japonais/i.test(r[0]) && /pas encore/.test(r[1]) && !r[2] && o[0] === "#/everywhere/face" && o[1] === "ja", detail: JSON.stringify(o) };
  });
  await step("Japonais : « Phrases de voyage » ouvre Voyage vers le japonais", async () => {
    await page.evaluate(() => { location.hash = "#/terre/as"; }); await page.waitForSelector(".earth-lang", { timeout: 5000 });
    await page.tap('.earth-lang[data-lang="ja"]'); await page.tap("#earthTrip"); await sleep(600);
    const o = await page.evaluate(() => [location.hash, JSON.parse(localStorage.getItem("ew_voyage_v1") || "{}").dest]);
    return { ok: o[0] === "#/everywhere/voyage" && o[1] === "ja", detail: JSON.stringify(o) };
  });
  await step("Europe → Espagnol : vrai cours, « Apprendre » ouvre le cours d'espagnol", async () => {
    await page.evaluate(() => { location.hash = "#/terre/eu"; }); await page.waitForSelector(".earth-lang", { timeout: 5000 });
    await page.tap('.earth-lang[data-lang="es"]');
    await page.waitForSelector("#earthLearnGo", { timeout: 5000 });
    await page.tap("#earthLearnGo"); await sleep(800);
    const r = await page.evaluate(() => [location.hash, JSON.parse(localStorage.getItem("ew_learn_v1") || "{}").lang, EWTerre.running,
      (document.querySelector('[data-lang="es"][aria-checked="true"], [data-lang="es"].on, [data-lang="es"][aria-pressed="true"]') || {}).tagName || ""]);
    return { ok: r[0] === "#/learn/apprendre" && r[1] === "es" && !r[2], detail: JSON.stringify(r) };
  });
  await step("Sans réseau après chargement : la Terre revient et fonctionne", async () => {
    await ctx.setOffline(true);
    await page.evaluate(() => { location.hash = "#/terre"; }); await sleep(500);
    await page.tap('.earth-region[data-region="af"]');
    const r = [await dessine(page), await page.textContent("#earthInfoH")];
    await ctx.setOffline(false);
    return { ok: r[0] > 500 && r[1] === "Afrique", detail: JSON.stringify(r) };
  });
  await step("Hors ligne, rechargement complet de la page : la Terre revient (cache du portail)", async () => {
    const ok = await page.evaluate(async () => { if (!("serviceWorker" in navigator)) return "pas de SW"; await navigator.serviceWorker.ready; return "prêt"; });
    // Un premier rechargement en ligne : la page est alors servie par le cache du portail.
    await page.reload(); await page.waitForSelector("#earthGlobe", { timeout: 15000 });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
    await ctx.setOffline(true);
    let r;
    try {
      await page.reload(); await page.waitForSelector("#earthGlobe", { timeout: 15000 }); await sleep(600);
      await page.tap('.earth-region[data-region="eu"]');
      r = [await dessine(page), await page.textContent("#earthInfoH"), await page.evaluate(() => !!navigator.serviceWorker.controller)];
    } finally { await ctx.setOffline(false); }
    return { ok: ok === "prêt" && r[0] > 500 && r[1] === "Europe" && r[2], detail: "service worker " + ok + ", " + JSON.stringify(r) };
  });
  await step("Bouton « Écrire à quelqu'un » ouvre la messagerie existante", async () => {
    const href = await page.getAttribute("#earthWrite", "href");
    await page.tap("#earthWrite");
    await page.waitForURL(/\/24-24-talk\/index\.html/, { timeout: 10000 });
    await page.waitForFunction(() => document.body && document.body.innerText.trim().length > 20, null, { timeout: 15000 });
    return { ok: href === "../index.html?b=msg" && /\/24-24-talk\/index\.html/.test(page.url()), detail: href + " → " + page.url().replace(ORIGIN, "") };
  });
  await step("Accès depuis l'accueil : tuile Terre connectée", async () => {
    await page.goto(ORIGIN + BASE + "index.html"); await page.waitForSelector("#tileTerre", { timeout: 15000 });
    const r = [await page.getAttribute("#tileTerre", "href"), await page.textContent("#tileTerre .home-tile-name")];
    return { ok: r[0] === "everywhere/#/terre" && r[1] === "Terre connectée", detail: JSON.stringify(r) };
  });
  const errs = page._errors.slice();
  await ctx.close();

  ({ ctx, page } = await ouvrir({ reducedMotion: "reduce", viewport: { width: 340, height: 700 } }));
  await step("Réduire les animations (téléphone) : globe fixe mais dessiné", async () => {
    const a = await page.evaluate(() => EWTerre.rotation); await sleep(600);
    const b = await page.evaluate(() => [EWTerre.rotation, EWTerre.running]);
    return { ok: a === b[0] && !b[1] && (await dessine(page)) > 500 };
  });
  await step("Écran étroit (340 px) : pas de défilement de côté, boutons de 44 px au moins", async () => {
    await page.tap('.earth-region[data-region="sa"]');
    const r = await page.evaluate(() => { const v = document.querySelector("#view-terre"); const hs = [...document.querySelectorAll(".earth-region,.earth-btn")].map((b) => b.getBoundingClientRect().height);
      return [v.scrollWidth <= v.clientWidth + 1, document.documentElement.scrollWidth <= innerWidth + 1, Math.min(...hs)]; });
    return { ok: r[0] && r[1] && r[2] >= 44, detail: "plus petit bouton : " + r[2] + " px" };
  });
  await step("Thème clair : couleurs du globe adaptées et texte lisible", async () => {
    await page.evaluate(() => { document.documentElement.classList.remove("theme-dark", "theme-auto"); document.documentElement.classList.add("theme-light"); window.dispatchEvent(new Event("resize")); });
    await sleep(200);
    const r = await page.evaluate(() => { const e = document.querySelector(".earth"); const c = getComputedStyle(e); return [c.getPropertyValue("--earth-sea").trim(), c.getPropertyValue("--earth-text").trim(), getComputedStyle(document.querySelector(".earth-info-d")).color]; });
    return { ok: r[0] === "#cfdcf7" && r[1] === "#0d1733", detail: JSON.stringify(r) };
  });
  const errs2 = page._errors.slice();
  await step("Aucune erreur JavaScript", async () => ({ ok: errs.length === 0 && errs2.length === 0, detail: errs.concat(errs2).join(" | ") || "aucune" }));
  await ctx.close();
  await browser.close(); server.close();
  console.log("\n" + results.filter(Boolean).length + " / " + results.length + " tests réussis");
  process.exit(results.every(Boolean) ? 0 : 1);
})();

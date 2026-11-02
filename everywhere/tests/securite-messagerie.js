/* 24/24 ONE WORLD — lot 2 (sécurité) : la messagerie résiste aux contenus piégés venus d'un autre compte.
   Un autre compte peut écrire n'importe quoi dans un message (texte, vocal, fiche d'appel) ou dans son pseudo.
   On vérifie qu'aucun code n'est exécuté et qu'aucune balise n'est créée, dans la liste des discussions comme dans la
   discussion ouverte. Faux serveur local (fake-supabase.js), aucun accès à Internet ni à une vraie base.
   Lancer : node everywhere/tests/securite-messagerie.js */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const SITE = path.resolve(__dirname, "..", ".."), BASE = "/24-24-talk/";
const FAKE0 = fs.readFileSync(path.join(__dirname, "fake-supabase.js"), "utf8");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".webmanifest": "application/manifest+json" };
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
const C1 = "aaaaaaaa-0000-4000-8000-000000000001", KENJI = "00000000-0000-4000-8000-0000000000b1";
// Pièges classiques : balise image, SVG, fermeture d'attribut, lien javascript:, script.
const PIEGES = [
  '<img src=x onerror="window.__xss=(window.__xss||0)+1">',
  '"><svg onload="window.__xss=(window.__xss||0)+1">',
  "<script>window.__xss=(window.__xss||0)+1</script>",
  '<a href="javascript:window.__xss=1" id="pieg">clic</a>',
  "' onmouseover='window.__xss=1' x='",
];

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port;
  const browser = await chromium.launch();
  async function open(fake, extra) {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, locale: "fr-FR" });
    await ctx.addInitScript((x) => {
      window.__EW_NO_SRI = true;
      try { localStorage.setItem("lc_net_auth", "fake"); localStorage.setItem("fake_contacts", "1"); localStorage.setItem("lc_net_joined", "1"); } catch (e) {}
      window.__fakeExtraMsgs = x;
    }, extra);
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => /supabase-js/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: "text/javascript", body: fake }) : r.abort());
    const page = await ctx.newPage();
    page._errors = [];
    page.on("pageerror", (e) => page._errors.push(String(e.message)));
    await page.goto(ORIGIN + BASE + "index.html?b=msg");
    return { ctx, page };
  }
  const t0 = Date.now();
  const msg = (i, body, kind) => ({ id: "bbbbbbbb-0000-4000-8000-0000000001" + String(i).padStart(2, "0"), conversation_id: C1, sender_id: KENJI,
    body, lang: "fr", kind: kind || "text", created_at: new Date(t0 - 3e5 + i * 1000).toISOString() });
  const piegés = [];
  PIEGES.forEach((p) => piegés.push(msg(piegés.length, p, "text")));
  PIEGES.forEach((p) => piegés.push(msg(piegés.length, p, "voice")));
  // Fiches d'appel : le corps est du JSON écrit par l'autre téléphone, donc piégeable aussi.
  piegés.push(msg(piegés.length, JSON.stringify({ id: '"><img src=x onerror=window.__xss=1>', s: "<img src=x onerror=window.__xss=1>", d: "<b>9</b>" }), "call"));
  piegés.push(msg(piegés.length, "{pas du json <img src=x onerror=window.__xss=1>", "call"));
  piegés.push(msg(piegés.length, PIEGES[0], "inconnu"));
  // Dernier message de la liste (aperçu dans la liste des discussions) : piégé lui aussi.
  piegés.push(msg(piegés.length, '<img src=x onerror="window.__xss=99">dernier', "text"));

  const sonde = (page) => page.evaluate(() => ({
    xss: window.__xss || 0,
    // Aucune balise dangereuse créée dans la page à partir d'un contenu reçu.
    balises: document.querySelectorAll('img[src="x"], svg[onload], [onerror], [onmouseover], a[href^="javascript:"], #pieg').length,
    scripts: [...document.scripts].filter((s) => /__xss/.test(s.textContent)).length,
  }));

  // Le faux serveur donne comme aperçu son message d'origine : on le piège aussi.
  const FAKE_M = FAKE0.replace('body: "Bonjour depuis Tokyo"', 'body: "<img src=x onerror=window.__xss=99>dernier"');
  let { ctx, page } = await open(FAKE_M, piegés);
  await page.waitForSelector('.net-row.net-conv[data-id="' + C1 + '"]', { timeout: 30000 });
  await page.waitForTimeout(500);
  await step("Liste des discussions : l'aperçu piégé s'affiche comme du texte, rien ne s'exécute", async () => {
    const s = await sonde(page);
    const prev = await page.textContent('.net-row.net-conv[data-id="' + C1 + '"] .net-conv-prev');
    return { ok: !s.xss && !s.balises && !s.scripts && /<img/.test(prev), detail: "xss=" + s.xss + " balises=" + s.balises + " aperçu=" + prev.slice(0, 40) };
  });
  await step("Discussion ouverte : 14 messages piégés (texte, vocal, fiche d'appel, type inconnu), rien ne s'exécute", async () => {
    await page.click('.net-row.net-conv[data-id="' + C1 + '"]');
    await page.waitForSelector("#netInput");
    await page.waitForTimeout(800);
    const s = await sonde(page);
    const texte = (await page.$$eval(".net-log .net-msg", (n) => n.map((x) => x.textContent).join(" ")));
    return { ok: !s.xss && !s.balises && !s.scripts && /<img src=x/.test(texte) && /<script>/.test(texte), detail: "xss=" + s.xss + " balises=" + s.balises + " scripts=" + s.scripts };
  });
  await step("Survol et appui sur chaque bulle : rien ne s'exécute", async () => {
    const bulles = await page.$$(".net-log .net-msg");
    for (const b of bulles.slice(0, 20)) { try { await b.hover({ timeout: 500 }); } catch (e) {} }
    const s = await sonde(page);
    return { ok: !s.xss, detail: bulles.length + " bulles survolées, xss=" + s.xss };
  });
  await step("Aucune erreur JavaScript avec des messages piégés ou abîmés", async () => ({ ok: !page._errors.length, detail: page._errors.join(" | ").slice(0, 200) || "aucune" }));
  await ctx.close();

  // Pseudo et langue piégés chez l'autre compte.
  const FAKE_P = FAKE0.replace('pseudo: "kenji"', 'pseudo: "<img src=x onerror=window.__xss=7>"').replace('lang: "ja"', 'lang: "\\"><svg onload=window.__xss=8>"');
  ({ ctx, page } = await open(FAKE_P, []));
  await page.waitForSelector('.net-row.net-conv[data-id="' + C1 + '"]', { timeout: 30000 });
  await page.waitForTimeout(500);
  await step("Pseudo et langue piégés d'un contact : affichés comme du texte dans la liste, rien ne s'exécute", async () => {
    const s = await sonde(page);
    const nom = await page.textContent('.net-row.net-conv[data-id="' + C1 + '"] b');
    return { ok: !s.xss && !s.balises && /<img/.test(nom), detail: "xss=" + s.xss + " nom=" + nom.slice(0, 40) };
  });
  await step("Pseudo piégé : discussion ouverte, rien ne s'exécute", async () => {
    await page.click('.net-row.net-conv[data-id="' + C1 + '"]');
    await page.waitForSelector("#netInput");
    await page.waitForTimeout(600);
    const s = await sonde(page);
    return { ok: !s.xss && !s.balises, detail: "xss=" + s.xss + " balises=" + s.balises };
  });
  await step("Pseudo piégé : aucune erreur JavaScript", async () => ({ ok: !page._errors.length, detail: page._errors.join(" | ").slice(0, 200) || "aucune" }));
  await ctx.close();

  await browser.close(); server.close();
  const ok = results.filter(Boolean).length;
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  process.exitCode = ok === results.length ? 0 : 1;
})();

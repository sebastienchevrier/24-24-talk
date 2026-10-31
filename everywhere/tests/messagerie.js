/* 24/24 ONE WORLD — essai de la messagerie TALK (audit du 31 oct. 2026), avec le faux serveur (fake-supabase.js).
   1. Un double appui sur « Envoyer » n'envoie le message qu'une fois.
   2. Un message envoyé juste avant de changer de discussion ne s'affiche pas dans l'autre discussion.
   3. Un message supprimé « pour moi » ne réapparaît pas au retour sur l'appli.
   4. Les notifications d appel ne disent plus « Dieu vous appelle » (danois, lituanien, letton).
   Lancer : node everywhere/tests/messagerie.js */
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
const C1 = "aaaaaaaa-0000-4000-8000-000000000001", C2 = "aaaaaaaa-0000-4000-8000-000000000002", M1 = "bbbbbbbb-0000-4000-8000-000000000001";

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port;
  const browser = await chromium.launch();
  async function open(init) {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, locale: "fr-FR" });
    await ctx.addInitScript((i) => { window.__EW_NO_SRI = true; try { localStorage.setItem("lc_net_auth", "fake"); localStorage.setItem("fake_contacts", "1"); localStorage.setItem("lc_net_joined", "1"); for (const k in i) localStorage.setItem(k, i[k]); } catch (e) {} }, init || {});
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => /supabase-js/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE }) : r.abort());
    const page = await ctx.newPage();
    page._errors = [];
    page.on("pageerror", (e) => page._errors.push(String(e.message)));
    await page.goto(ORIGIN + BASE + "index.html?b=msg");
    return { ctx, page };
  }
  const openConv = async (page, id) => { await page.click('.net-row.net-conv[data-id="' + id + '"]'); await page.waitForSelector("#netInput"); };
  const sent = (page) => page.evaluate(() => (window.__inserts || []).filter((x) => x.table === "messages").length);
  const bubbles = (page) => page.$$eval(".net-log .net-msg", (n) => n.map((x) => x.textContent));

  let { ctx, page } = await open({ fake_msg_delay: "400" });
  await page.waitForSelector('.net-row.net-conv[data-id="' + C1 + '"]', { timeout: 30000 });
  await step("Double appui sur « Envoyer » : le message part une seule fois", async () => {
    await openConv(page, C1);
    await page.fill("#netInput", "Un seul envoi");
    await page.click("#netSend"); await page.click("#netSend"); await page.click("#netSend");
    await page.waitForTimeout(900);
    const n = await sent(page), b = (await bubbles(page)).filter((x) => /Un seul envoi/.test(x)).length;
    return { ok: n === 1 && b === 1, detail: n + " envoi(s), " + b + " bulle(s)" };
  });
  await step("Message envoyé puis changement de discussion : il ne s'affiche pas chez l'autre contact", async () => {
    await page.fill("#netInput", "Pour Kenji seulement");
    await page.click("#netSend");
    await page.goBack();
    await openConv(page, C2);
    await page.waitForTimeout(900);
    const b = (await bubbles(page)).filter((x) => /Pour Kenji seulement/.test(x)).length;
    return { ok: b === 0, detail: b + " bulle(s) « Pour Kenji seulement » chez @maria" };
  });
  await step("Messagerie : aucune erreur JavaScript", async () => ({ ok: !page._errors.length, detail: page._errors.join(" | ").slice(0, 200) || "aucune" }));
  await ctx.close();

  ({ ctx, page } = await open({ lc_hidden_msgs: JSON.stringify([M1]) }));
  await page.waitForSelector('.net-row.net-conv[data-id="' + C1 + '"]', { timeout: 30000 });
  await step("Message supprimé pour moi : absent à l'ouverture et toujours absent au retour sur l'appli", async () => {
    await openConv(page, C1);
    await page.waitForTimeout(400);
    const a = (await bubbles(page)).filter((x) => /Bonjour depuis Tokyo/.test(x)).length;
    await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForTimeout(600);
    const b = (await bubbles(page)).filter((x) => /Bonjour depuis Tokyo/.test(x)).length;
    return { ok: a === 0 && b === 0, detail: "à l'ouverture : " + a + ", après retour : " + b };
  });
  await ctx.close();
  await step("Notifications d'appel (sw.js) : « X vous appelle » et plus « Dieu vous appelle » (da, lt, lv) ni « Те призовава. » (bg)", async () => {
    const sw = fs.readFileSync(path.join(SITE, "sw.js"), "utf8");
    const bad = ["Gud kalder", "Dievas", "Dievs", "Те призовава", "Er að kalla"].filter((w) => sw.includes(w));
    const want = ["ringer til dig", "jums skambina", "jums zvana", "ви се обажда"].filter((w) => !sw.includes(w));
    return { ok: !bad.length && !want.length, detail: bad.length || want.length ? "faux : " + bad.join(", ") + " · manque : " + want.join(", ") : "da, lt, lv, bg, et, is, cs, sk, sl corrigés" };
  });
  await browser.close(); server.close();
  const ok = results.filter(Boolean).length;
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  process.exitCode = ok === results.length ? 0 : 1;
})();

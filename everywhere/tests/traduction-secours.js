/* 24/24 ONE WORLD — lot 4 : traduction avec solution de secours (2 nov. 2026).
   Chaîne : phrases vérifiées → MyMemory → traducteur intégré au navigateur (seulement s'il a déjà la paire).
   On simule MyMemory (marche, quota épuisé, panne, sans réseau) et le traducteur du navigateur (disponible, à
   télécharger, absent, en panne). Aucun accès à Internet. Lancer : node everywhere/tests/traduction-secours.js */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const SITE = path.resolve(__dirname, "..", ".."), BASE = "/24-24-talk/";
const FAKE = fs.readFileSync(path.join(__dirname, "fake-supabase.js"), "utf8");
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

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port;
  const browser = await chromium.launch();
  // mm : "ok" | "quota" | "down" ; tr : "available" | "downloadable" | "absent" | "panne"
  async function open(mm, tr) {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, locale: "fr-FR" });
    await ctx.addInitScript((t) => {
      window.__EW_NO_SRI = true;
      try { localStorage.setItem("lc_net_auth", "fake"); localStorage.setItem("lc_net_joined", "1"); } catch (e) {}
      window.__trCalls = { availability: 0, create: 0, translate: 0, pairs: [] };
      try { delete self.Translator; } catch (e) {}
      if (t === "absent") { try { Object.defineProperty(self, "Translator", { value: undefined, configurable: true }); delete self.Translator; } catch (e) {} return; }
      const T = {
        availability: async (o) => { window.__trCalls.availability++; window.__trCalls.pairs.push(o.sourceLanguage + "|" + o.targetLanguage); if (t === "panne") throw new Error("x"); return t; },
        create: async (o) => { window.__trCalls.create++; return { translate: async (s) => { window.__trCalls.translate++; return "[appareil " + o.targetLanguage + "] " + s; } }; },
      };
      Object.defineProperty(self, "Translator", { value: T, configurable: true, writable: true });
    }, tr);
    let mmCalls = 0;
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => {
      const url = r.request().url();
      if (/supabase-js/.test(url)) return r.fulfill({ status: 200, contentType: "text/javascript", body: FAKE });
      if (/api\.mymemory\.translated\.net/.test(url)) {
        mmCalls++;
        const q = new URL(url).searchParams.get("q");
        if (mm === "down") return r.fulfill({ status: 503, body: "x" });
        if (mm === "quota") return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ responseStatus: 429, responseData: { translatedText: "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS" } }) });
        return r.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ responseStatus: 200, responseData: { translatedText: "[mymemory] " + q, match: 1 } }) });
      }
      return r.abort();
    });
    const page = await ctx.newPage();
    page._errors = [];
    page.on("pageerror", (e) => page._errors.push(String(e.message)));
    await page.goto(ORIGIN + BASE + "index.html");
    await page.waitForFunction(() => typeof TranslationProvider === "object", null, { timeout: 30000 });
    return { ctx, page, mm: () => mmCalls };
  }
  const tr = (page, text, s, t) => page.evaluate(async (a) => {
    try { const r = await TranslationProvider.translate(a[0], a[1], a[2]); return { ok: true, text: r.text, source: r.source, provider: r.provider || "" }; }
    catch (e) { return { ok: false, err: e.message }; }
  }, [text, s, t]);
  const calls = (page) => page.evaluate(() => window.__trCalls);
  const PHRASE = "Je voudrais réserver une table pour quatre personnes ce soir";

  let o = await open("ok", "available");
  await step("MyMemory marche : sa traduction est gardée, le traducteur du navigateur n'est pas appelé", async () => {
    const r = await tr(o.page, PHRASE, "fr", "en"); const c = await calls(o.page);
    return { ok: r.ok && /^\[mymemory\]/.test(r.text) && r.source === "engine" && !r.provider && c.availability === 0, detail: JSON.stringify(r).slice(0, 90) };
  });
  await o.ctx.close();

  o = await open("quota", "available");
  await step("Quota MyMemory épuisé + traducteur du navigateur prêt : la traduction arrive quand même", async () => {
    const r = await tr(o.page, PHRASE, "fr", "en");
    return { ok: r.ok && r.text === "[appareil en] " + PHRASE && r.provider === "device", detail: JSON.stringify(r).slice(0, 90) };
  });
  await step("Le quota épuisé n'est jamais affiché comme une traduction", async () => {
    const r = await tr(o.page, "Une autre phrase longue pour éviter le dictionnaire", "fr", "es");
    return { ok: r.ok && !/MYMEMORY|WARNING/i.test(r.text), detail: r.text.slice(0, 60) };
  });
  await step("Le traducteur du navigateur est créé une seule fois par paire de langues", async () => {
    await tr(o.page, "Encore une phrase vers l'anglais pour voir", "fr", "en");
    const c = await calls(o.page);
    return { ok: c.create === 2, detail: "créations=" + c.create + " (fr→en, fr→es)" };
  });
  await o.ctx.close();

  o = await open("down", "available");
  await step("MyMemory en panne (503) + traducteur prêt : secours utilisé", async () => {
    const r = await tr(o.page, PHRASE, "fr", "de");
    return { ok: r.ok && r.provider === "device", detail: JSON.stringify(r).slice(0, 80) };
  });
  await step("Code chinois traditionnel (zh-TW) envoyé au navigateur comme zh-Hant", async () => {
    await tr(o.page, PHRASE, "fr", "zh-TW");
    const c = await calls(o.page);
    return { ok: c.pairs.includes("fr|zh-Hant"), detail: c.pairs.join(",") };
  });
  await o.ctx.close();

  o = await open("down", "downloadable");
  await step("Paire pas encore téléchargée : aucun téléchargement lancé, l'erreur d'avant est rendue (SERVER)", async () => {
    const r = await tr(o.page, PHRASE, "fr", "en"); const c = await calls(o.page);
    return { ok: !r.ok && r.err === "SERVER" && c.create === 0, detail: JSON.stringify(r) + " créations=" + c.create };
  });
  await o.ctx.close();

  o = await open("quota", "absent");
  await step("Téléphone sans traducteur intégré (Android, iPhone) : même erreur qu'avant (QUOTA_PROVIDER)", async () => {
    const r = await tr(o.page, PHRASE, "fr", "en");
    return { ok: !r.ok && r.err === "QUOTA_PROVIDER", detail: JSON.stringify(r) };
  });
  await o.ctx.close();

  o = await open("down", "panne");
  await step("Traducteur intégré en panne : pas de plantage, l'erreur d'avant est rendue", async () => {
    const r = await tr(o.page, PHRASE, "fr", "en");
    return { ok: !r.ok && r.err === "SERVER" && !o.page._errors.length, detail: JSON.stringify(r) };
  });
  await o.ctx.close();

  o = await open("ok", "available");
  await step("Sans réseau + traducteur prêt : traduction faite sur l'appareil, aucun appel à MyMemory", async () => {
    await o.ctx.setOffline(true);
    const before = o.mm();
    const r = await tr(o.page, PHRASE, "fr", "it");
    await o.ctx.setOffline(false);
    return { ok: r.ok && r.provider === "device" && o.mm() === before, detail: JSON.stringify(r).slice(0, 80) };
  });
  await o.ctx.close();

  o = await open("ok", "absent");
  await step("Sans réseau et sans traducteur intégré : erreur OFFLINE, comme avant", async () => {
    await o.ctx.setOffline(true);
    const r = await tr(o.page, PHRASE, "fr", "it");
    await o.ctx.setOffline(false);
    return { ok: !r.ok && r.err === "OFFLINE", detail: JSON.stringify(r) };
  });
  await step("Texte vide : erreur EMPTY, le secours n'est pas sollicité", async () => {
    const r = await tr(o.page, "   ", "fr", "en");
    return { ok: !r.ok && r.err === "EMPTY", detail: JSON.stringify(r) };
  });
  await step("Aucune erreur JavaScript", async () => ({ ok: !o.page._errors.length, detail: o.page._errors.join(" | ").slice(0, 200) || "aucune" }));
  await o.ctx.close();

  await browser.close(); server.close();
  const ok = results.filter(Boolean).length;
  console.log("\n" + ok + " / " + results.length + " tests réussis");
  process.exitCode = ok === results.length ? 0 : 1;
})();

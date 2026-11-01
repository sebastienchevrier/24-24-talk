/* 24/24 ONE WORLD — essais de la vitrine /monde/ et /monde/pro/ (refonte du 1er nov. 2026). © 2026 Sébastien Chevrier.
   Aucun accès à Internet : le site est servi en local, le moteur de traduction de la démo est simulé (et sa panne aussi).
   Navigateur : MOTEUR=chromium (défaut) | firefox | webkit (moteur de Safari). Lancer : node everywhere/tests/vitrine.js */
const pw = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const MOTEUR = ["chromium", "firefox", "webkit"].includes(process.env.MOTEUR) ? process.env.MOTEUR : "chromium";
// CANAL=msedge | chrome : le vrai Edge ou le vrai Chrome installé sur la machine (moteur chromium). ETIQ : nom des captures.
const CANAL = MOTEUR === "chromium" && /^(msedge|chrome)$/.test(process.env.CANAL || "") ? process.env.CANAL : "";
const ETIQ = (process.env.ETIQ || "") + (CANAL || MOTEUR);
const SITE = path.resolve(__dirname, "..", ".."), BASE = "/24-24-talk/", OUT = path.join(__dirname, "resultats");
fs.mkdirSync(OUT, { recursive: true });
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

// K (131 textes historiques) et K2 (textes de la refonte) lus dans le fichier du site.
const SRC = fs.readFileSync(path.join(SITE, "monde", "i18n.js"), "utf8");
const K = eval(SRC.match(/var K = (\[[\s\S]*?\n  \]);/)[1]);
const K2 = eval(SRC.match(/var K2 = (\[[\s\S]*?\]);/)[1]);
const T2 = eval("(" + SRC.match(/var T2 = (\{[\s\S]*?\n    \});/)[1] + ")");

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port, M = ORIGIN + BASE + "monde/";
  console.log("Moteur : " + MOTEUR + (CANAL ? " (" + CANAL + ")" : "") + " · système : " + process.platform);
  const browser = await pw[MOTEUR].launch(CANAL ? { channel: CANAL } : {});
  console.log("Version du navigateur : " + browser.version());
  let panne = false, appels = 0;
  async function ctxFor(opts) {
    const ctx = await browser.newContext(Object.assign({ locale: "fr-FR" }, opts || {}));
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => {
      const u = r.request().url();
      if (/mymemory/.test(u)) {
        appels++;
        if (panne) return r.fulfill({ status: 503, contentType: "application/json", body: "{}" });
        const q = new URL(u).searchParams;
        return r.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ responseStatus: 200, responseData: { translatedText: "[" + q.get("langpair") + "] " + q.get("q") } }) });
      }
      return r.abort(); // Travelpayouts et tout le reste : coupés pendant les essais
    });
    return ctx;
  }
  const errors = [];
  const open = async (ctx, url) => { const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(String(e))); await p.goto(url); await p.waitForFunction(() => window.owT && document.querySelector("#cloud button")); return p; };

  const tel = { viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, hasTouch: true, isMobile: MOTEUR !== "firefox" };
  const ctxTel = await ctxFor(tel);
  const p = await open(ctxTel, M + "?lang=fr");

  await step("Logo officiel everywhere/logo.svg dans le cadre rond, aucun autre logo", async () => {
    const r = await p.evaluate(() => { const img = document.querySelector(".brand .ring img"); const cs = getComputedStyle(img.parentElement);
      return { src: img.getAttribute("src"), rond: cs.borderRadius, anneau: cs.borderTopColor, ok: img.complete && img.naturalWidth > 0, autres: [...document.images].filter((i) => !/logo\.svg$|globe-filigrane\.webp$/.test(i.getAttribute("src") || "")).length }; });
    return { ok: r.src === "../everywhere/logo.svg" && r.ok && /50%|9999|px/.test(r.rond) && r.autres === 0, detail: JSON.stringify(r) };
  });
  await step("Aucune image ni police externe (plus d'Unsplash) ; seul script externe : Travelpayouts", async () => {
    const html = fs.readFileSync(path.join(SITE, "monde", "index.html"), "utf8");
    const ext = (html.match(/(?:src|href)=["']https?:\/\/[^"']+/g) || []).concat(html.match(/src = 'https?:\/\/[^']+/g) || []);
    return { ok: !/unsplash/i.test(html) && ext.every((u) => /tp-em\.com/.test(u)), detail: ext.join(" | ") || "aucun" };
  });
  await step("Français : chaque texte visible vient de K ou K2 (rien d'oublié par la traduction)", async () => {
    const all = new Set(K.concat(K2));
    const orphelins = await p.evaluate((all) => { const s = new Set(all), out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const el = n.parentElement; if (!el || el.closest("script,style,select,.notranslate,[translate=no],#helloWord,#helloLang,#helloCity,#langCode,#cloud,#carnetList,#dChat,svg,[data-k]")) continue; const t = n.nodeValue.trim(); if (t && !s.has(t) && !/^[·⇄]$/.test(t)) out.push(t); } return out; }, [...all]);
    return { ok: orphelins.length === 0, detail: orphelins.length ? orphelins.join(" | ") : K2.length + " nouveaux textes, tous reconnus" };
  });
  await step("K2 écrit à la main en 10 langues (fr + 9), même nombre d'entrées, aucune vide", async () => {
    const l = Object.keys(T2), bad = l.filter((c) => T2[c].length !== K2.length || T2[c].some((x) => !x || !String(x).trim()));
    return { ok: l.length === 9 && !bad.length && ["en", "es", "pt", "de", "it", "zh", "ja", "ar", "ru"].every((c) => l.includes(c)), detail: "langues : fr," + l.join(",") + (bad.length ? " · incomplètes : " + bad : "") };
  });
  await step("Les 110 traductions historiques intactes : chaque monde/lang/*.json a toujours " + K.length + " entrées", async () => {
    const dir = path.join(SITE, "monde", "lang"), f = fs.readdirSync(dir).filter((x) => x.endsWith(".json"));
    const bad = f.filter((x) => { try { const a = JSON.parse(fs.readFileSync(path.join(dir, x), "utf8")); return !Array.isArray(a) || a.length !== K.length; } catch (e) { return true; } });
    return { ok: f.length >= 90 && !bad.length && K.length === 131, detail: f.length + " fichiers · " + (bad.length ? "abîmés : " + bad.join(",") : "tous conformes") };
  });
  await step("Afrikaans (fichier écrit à la main) : anciens textes traduits, nouveaux en anglais, avertissement affiché", async () => {
    const q = await open(ctxTel, M + "?lang=af");
    await q.waitForFunction(() => document.querySelector(".eyebrow").textContent !== "Réseau indépendant, libre");
    const r = await q.evaluate(() => ({ eyebrow: document.querySelector(".eyebrow").textContent, kicker: document.querySelector("#tout .kicker").textContent, avis: !document.getElementById("newLang").hidden, auto: !document.getElementById("autoTr").hidden }));
    await q.close();
    return { ok: r.eyebrow === "Onafhanklike, vrye netwerk" && r.kicker === "All in one, for a world without borders" && r.avis && !r.auto, detail: JSON.stringify(r) };
  });
  for (const [c, attendu] of [["en", "Translation in action"], ["ja", "翻訳を体験"], ["ar", "الترجمة أثناء العمل"], ["de", "Übersetzung in Aktion"]]) {
    await step("Langue « " + c + " » écrite à la main : titre de la démo traduit, pas d'avertissement" + (c === "ar" ? ", page de droite à gauche" : ""), async () => {
      const q = await open(ctxTel, M + "?lang=" + c);
      const r = await q.evaluate(() => ({ t: document.querySelector("#demo h2").textContent, avis: !document.getElementById("newLang").hidden, dir: document.documentElement.dir, large: document.documentElement.scrollWidth > innerWidth + 1 }));
      await q.close();
      return { ok: r.t === attendu && !r.avis && (c !== "ar" || r.dir === "rtl") && !r.large, detail: JSON.stringify(r) };
    });
  }
  await step("Démo sans inscription : une phrase prête est traduite par le moteur (simulé), langue source = langue de la page", async () => {
    appels = 0;
    await p.click("#dPhr button:nth-child(3)");
    await p.waitForSelector("#dChat .bub.them small", { timeout: 8000 });
    const r = await p.evaluate(() => ({ moi: document.querySelector("#dChat .bub.me").firstChild.textContent, lui: document.querySelector("#dChat .bub.them").firstChild.textContent }));
    return { ok: r.moi === "Je t'appelle ce soir ?" && r.lui === "[fr|ja] Je t'appelle ce soir ?" && appels === 1, detail: JSON.stringify(r) };
  });
  await step("Démo : phrase libre, langues échangées (ja → fr), zh envoyé en zh-CN", async () => {
    const etat = () => p.evaluate(() => ({ de: document.getElementById("dFrom").value, vers: document.getElementById("dTo").value,
      chat: document.getElementById("dChat").textContent.slice(0, 120), note: document.getElementById("dNote").textContent.slice(0, 80) }));
    const attend = async (re) => { try { await p.waitForFunction((src) => new RegExp(src).test((document.querySelector("#dChat .bub.them") || {}).textContent || ""), re.source, { timeout: 10000 }); return true; } catch (e) { return false; } };
    await p.click("#dSwap");
    const apresEchange = await etat();
    await p.fill("#dIn", "テスト"); await p.click("#dForm button");
    if (!(await attend(/\[ja\|fr\]/))) return { ok: false, detail: "après ⇄ : " + JSON.stringify(apresEchange) + " · après envoi : " + JSON.stringify(await etat()) + " · appels moteur : " + appels };
    await p.selectOption("#dTo", "zh"); await p.click("#dForm button");
    if (!(await attend(/\[ja\|zh-CN\]/))) return { ok: false, detail: "zh : " + JSON.stringify(await etat()) };
    await p.click("#dSwap");
    return { ok: true, detail: "ja→fr puis ja→zh-CN" };
  });
  await step("Démo : moteur en panne → message honnête, AUCUNE traduction inventée", async () => {
    panne = true;
    await p.click("#dPhr button:nth-child(1)");
    await p.waitForFunction(() => document.getElementById("dNote").classList.contains("err"), null, { timeout: 12000 });
    const r = await p.evaluate(() => ({ note: document.getElementById("dNote").textContent, bulles: document.querySelectorAll("#dChat .bub.them").length }));
    panne = false;
    return { ok: /ne répond pas/.test(r.note) && r.bulles === 0, detail: JSON.stringify(r) };
  });
  await step("Statuts honnêtes : Rencontrer = « Bientôt » (pas de lien), Apprendre = « Débuts », 8 cartes « Disponible »", async () => {
    const r = await p.evaluate(() => { const c = [...document.querySelectorAll(".card")].map((x) => ({ t: x.querySelector("h3").textContent, s: x.querySelector(".st").textContent, lien: x.tagName === "A" }));
      return { rencontrer: c.find((x) => x.t === "Rencontrer"), apprendre: c.find((x) => x.t === "Apprendre"), dispo: c.filter((x) => x.s === "Disponible").length }; });
    return { ok: r.rencontrer.s === "Bientôt" && !r.rencontrer.lien && r.apprendre.s === "Débuts" && r.dispo === 8, detail: JSON.stringify(r) };
  });
  await step("Liens internes : tous mènent à un fichier qui existe (appli, portail, pro/, légal)", async () => {
    const hrefs = await p.evaluate(() => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")))]);
    const bad = [];
    for (const h of hrefs) {
      if (h.startsWith("#")) { if (h.length > 1 && !(await p.$(h))) bad.push(h); continue; }
      const u = new URL(h, M); if (u.origin !== ORIGIN) { bad.push(h); continue; }
      let f = path.join(SITE, decodeURIComponent(u.pathname.slice(BASE.length))); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
      if (!fs.existsSync(f)) bad.push(h);
    }
    return { ok: !bad.length, detail: hrefs.length + " liens · " + (bad.length ? "cassés : " + bad.join(", ") : "tous présents") };
  });
  await step("Invitation ?ajouter= gardée sur les boutons vers l'appli", async () => {
    const q = await open(ctxTel, M + "?lang=fr&ajouter=sebastien");
    const h = await q.$$eval('a[href^="../"]', (as) => as.map((a) => a.getAttribute("href")).filter((x) => x === "../" || x.startsWith("../?")));
    await q.close();
    return { ok: h.length >= 4 && h.every((x) => x === "../?ajouter=sebastien"), detail: h.length + " boutons" };
  });

  // Tailles d'écran : petit téléphone, téléphone, tablette, portable, grand écran.
  for (const [nom, w, hgt] of [["petit téléphone 320", 320, 640], ["téléphone 393", 393, 851], ["tablette 768", 768, 1024], ["portable 1280", 1280, 800], ["grand écran 1920", 1920, 1080]]) {
    await step("Écran " + nom + " : aucun défilement de côté, boutons touchables (≥ 40 px), capture", async () => {
      const ctx = await ctxFor({ viewport: { width: w, height: hgt }, hasTouch: w < 900 });
      const q = await open(ctx, M + "?lang=fr");
      await q.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("on")));
      await q.evaluate(() => document.fonts && document.fonts.ready);
      await q.waitForTimeout(800);
      const r = await q.evaluate(() => ({ large: document.documentElement.scrollWidth - innerWidth,
        qui: [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest(".globe,.box")).slice(-3).map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : "") + ":" + Math.round(e.getBoundingClientRect().right)),
        petits: [...document.querySelectorAll("a.btn,button,.lang")].filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.height && b.height < 40; }).map((e) => e.textContent.trim().slice(0, 20) + " (" + e.getBoundingClientRect().height.toFixed(1) + " px)") }));
      await q.screenshot({ path: path.join(OUT, "vitrine-" + ETIQ + "-" + w + ".png"), fullPage: true });
      await ctx.close();
      return { ok: r.large <= 1 && !r.petits.length, detail: "débord " + r.large + " px" + (r.large > 1 ? " (" + r.qui.join(", ") + ")" : "") + (r.petits.length ? " · petits : " + r.petits.join(",") : "") };
    });
  }
  await step("« Réduire les animations » : globe figé, blocs visibles d'emblée, « Bonjour » ne tourne pas", async () => {
    const ctx = await ctxFor({ viewport: { width: 393, height: 851 }, reducedMotion: "reduce" });
    const q = await open(ctx, M + "?lang=fr");
    const a = await q.evaluate(() => ({ w: document.getElementById("helloWord").textContent, cach: [...document.querySelectorAll(".reveal")].filter((e) => getComputedStyle(e).opacity !== "1").length }));
    await q.waitForTimeout(2300);
    const b = await q.evaluate(() => document.getElementById("helloWord").textContent);
    await ctx.close();
    return { ok: a.cach === 0 && a.w === b, detail: "blocs cachés : " + a.cach + " · Bonjour : " + a.w + " → " + b };
  });
  await step("Accessibilité (axe-core) : aucune violation grave ou critique", async () => {
    const AXE = process.env.AXE || require.resolve("axe-core/axe.min.js");
    await p.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("on")));
    await p.waitForTimeout(800); // fin du fondu d'apparition (.6 s) avant de mesurer les contrastes
    await p.addScriptTag({ path: AXE });
    const v = await p.evaluate(async () => (await axe.run(document, { resultTypes: ["violations"] })).violations.filter((x) => x.impact === "critical" || x.impact === "serious").map((x) => x.id + "×" + x.nodes.length));
    return { ok: !v.length, detail: v.join(", ") || "aucune" };
  });
  // ---- « Le monde vivant » : globe, salutations, langues, carnet ----
  await step("Monde vivant : toucher une ville met la bulle dans sa langue, puis « Essayer » règle la démo sur cette langue", async () => {
    const ctx = await ctxFor(tel); const q = await open(ctx, M + "?lang=fr");
    await q.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await q.tap("#cities button[aria-label^='Le Caire']");
    const a = await q.evaluate(() => ({ mot: document.getElementById("helloWord").textContent, ville: document.getElementById("helloCity").textContent, annonce: document.getElementById("cityLive").textContent }));
    await q.tap("#helloTry"); await q.waitForTimeout(400);
    const b = await q.evaluate(() => ({ vers: document.getElementById("dTo").value, de: document.getElementById("dFrom").value, focus: document.activeElement && document.activeElement.closest("#dPhr") !== null }));
    await ctx.close();
    return { ok: a.mot === "مرحبا" && a.ville === "Le Caire" && /arabe/.test(a.annonce) && b.vers === "ar" && b.de === "fr" && b.focus, detail: JSON.stringify(a) + " " + JSON.stringify(b) };
  });
  await step("Monde vivant : villes atteignables au clavier (vrais boutons nommés), bulle en pause au bouton", async () => {
    const ctx = await ctxFor({ viewport: { width: 1280, height: 800 } }); const q = await open(ctx, M + "?lang=fr");
    const n = await q.evaluate(() => [...document.querySelectorAll("#cities button")].filter((b) => b.getAttribute("aria-label") && b.tabIndex >= 0).length);
    await q.focus("#cities button[aria-label^='Mumbai']"); await q.keyboard.press("Enter");
    const mot = await q.evaluate(() => document.getElementById("helloWord").textContent);
    await q.click("#helloPause"); const p1 = await q.evaluate(() => document.getElementById("helloPause").getAttribute("aria-pressed"));
    await ctx.close();
    return { ok: n === 10 && mot === "नमस्ते" && p1 === "true", detail: n + " villes · " + mot + " · pause=" + p1 };
  });
  await step("Monde vivant : recherche de langue, toucher une langue règle la démo et l'ajoute au carnet (gardé après rechargement, effaçable)", async () => {
    const ctx = await ctxFor(tel); const q = await open(ctx, M + "?lang=fr");
    await q.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await q.reload(); await q.waitForFunction(() => window.owT && document.querySelector("#cloud button"));
    await q.fill("#langFind", "swahili");
    const vis = await q.evaluate(() => [...document.querySelectorAll("#cloud button")].filter((b) => !b.hidden).map((b) => b.dataset.c));
    await q.evaluate(() => document.querySelector("#cloud button[data-c=sw]").click()); await q.waitForTimeout(300);
    const vers = await q.evaluate(() => document.getElementById("dTo").value);
    await q.reload(); await q.waitForFunction(() => window.owT && document.querySelector("#cloud button"));
    const apres = await q.evaluate(() => ({ cache: document.getElementById("carnet").hidden, n: document.querySelectorAll("#carnetList span").length }));
    await q.click("#carnetClear");
    const vide = await q.evaluate(() => document.getElementById("carnet").hidden);
    await ctx.close();
    return { ok: vis.includes("sw") && vis.length < 10 && vers === "sw" && !apres.cache && apres.n === 1 && vide, detail: "trouvées " + vis.join(",") + " · démo vers " + vers + " · carnet après rechargement " + apres.n + " · effacé " + vide };
  });
  await step("Monde vivant : aucun appel au traducteur sans geste du visiteur (globe, bulle, liste)", async () => {
    appels = 0; const ctx = await ctxFor(tel); const q = await open(ctx, M + "?lang=fr");
    await q.tap("#cities button[aria-label^='Paris']"); await q.tap("#helloTry"); await q.waitForTimeout(3000);
    const n = appels; await ctx.close();
    return { ok: n === 0, detail: n + " appel(s)" };
  });
  await step("Monde vivant, « réduire les animations » : la bulle ne tourne pas, mais toucher une ville marche", async () => {
    const ctx = await ctxFor(Object.assign({}, tel, { reducedMotion: "reduce" })); const q = await open(ctx, M + "?lang=fr");
    const a = await q.evaluate(() => document.getElementById("helloWord").textContent); await q.waitForTimeout(3000);
    const b = await q.evaluate(() => document.getElementById("helloWord").textContent);
    await q.tap("#cities button[aria-label^='Moscou']"); const c = await q.evaluate(() => document.getElementById("helloWord").textContent);
    await ctx.close();
    return { ok: a === b && c === "Привет", detail: a + " → " + b + " → " + c };
  });
  // ---- Page Pro /monde/pro/ ----
  const P = M + "pro/";
  const ouvrePro = async (ctx, url) => { const q = await ctx.newPage(); q.on("pageerror", (e) => errors.push("pro: " + e)); await q.goto(url); await q.waitForFunction(() => document.querySelector("#phr li")); return q; };
  await step("Pro : logo officiel dans le cadre rond, sans filtre d'inversion, fond nuit", async () => {
    const q = await ouvrePro(ctxTel, P + "?lang=fr");
    const r = await q.evaluate(() => { const i = document.querySelector(".brand .ring img"); return { src: i && i.getAttribute("src"), filtre: i && getComputedStyle(i).filter, ok: i && i.complete && i.naturalWidth > 0, fond: getComputedStyle(document.body).backgroundColor }; });
    await q.close();
    return { ok: r.src === "../../everywhere/logo.svg" && r.ok && r.filtre === "none" && /rgb\(7, 19, 29\)/.test(r.fond), detail: JSON.stringify(r) };
  });
  for (const [c, mot] of [["fr", "variable"], ["en", "varies"], ["es", "varía"], ["pt", "varia"], ["it", "varia"], ["tr", "değişir"], ["hu", "eltér"], ["th", "แตกต่าง"], ["vi", "thay đổi"]]) {
    await step("Pro « " + c + " » : la qualité variable des 112 langues est dite honnêtement", async () => {
      const q = await ouvrePro(ctxTel, P + "?lang=" + c);
      const r = await q.evaluate(() => ({ h: document.querySelector("[data-k=honest]").textContent, lang: document.documentElement.lang, large: document.documentElement.scrollWidth - innerWidth }));
      await q.close();
      return { ok: r.h.includes(mot) && r.lang === c && r.large <= 1, detail: r.h.slice(0, 70) };
    });
  }
  for (const [w, hgt] of [[320, 640], [393, 851], [768, 1024], [1280, 800]]) {
    await step("Pro, écran " + w + " px : aucun défilement de côté, boutons ≥ 40 px, capture", async () => {
      const ctx = await ctxFor({ viewport: { width: w, height: hgt }, hasTouch: w < 900 });
      const q = await ouvrePro(ctx, P + "?lang=fr");
      const r = await q.evaluate(() => ({ large: document.documentElement.scrollWidth - innerWidth,
        qui: [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest(".globe,.box")).slice(-3).map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : "") + ":" + Math.round(e.getBoundingClientRect().right)),
        petits: [...document.querySelectorAll("a.btn,button,.lang")].filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.height && b.height < 40; }).map((e) => e.textContent.trim().slice(0, 20) + " (" + e.getBoundingClientRect().height.toFixed(1) + " px)") }));
      await q.screenshot({ path: path.join(OUT, "pro-" + ETIQ + "-" + w + ".png"), fullPage: true });
      await ctx.close();
      return { ok: r.large <= 1 && !r.petits.length, detail: "débord " + r.large + " px" + (r.large > 1 ? " (" + r.qui.join(", ") + ")" : "") + (r.petits.length ? " · petits : " + r.petits.join(",") : "") };
    });
  }
  await step("Pro : accessibilité (axe-core), aucune violation grave ou critique", async () => {
    const AXE = process.env.AXE || require.resolve("axe-core/axe.min.js");
    const q = await ouvrePro(ctxTel, P + "?lang=fr");
    await q.addScriptTag({ path: AXE });
    const v = await q.evaluate(async () => (await axe.run(document, { resultTypes: ["violations"] })).violations.filter((x) => x.impact === "critical" || x.impact === "serious").map((x) => x.id + "×" + x.nodes.length));
    await q.close();
    return { ok: !v.length, detail: v.join(", ") || "aucune" };
  });
  await step("Aucune erreur JavaScript", async () => ({ ok: errors.length === 0, detail: errors.join(" | ").slice(0, 300) || "aucune" }));

  console.log("\n" + results.filter(Boolean).length + " / " + results.length + " tests réussis (" + ETIQ + ")");
  await browser.close(); server.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})();

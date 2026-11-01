/* 24/24 ONE WORLD — essais de la vitrine /monde/, /monde/pro/ et /monde/tarifs/ (refonte du 1er nov. 2026). © 2026 Sébastien Chevrier.
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
    return { ok: r.eyebrow === "Onafhanklike, vrye netwerk" && r.kicker === "The ecosystem" && r.avis && !r.auto, detail: JSON.stringify(r) };
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
  await step("Statuts honnêtes : 11 espaces ONE WORLD (LIVE et LEARN « Débuts »), Rencontrer « Bientôt » sans lien, limites dites (FACE TO FACE, SCAN)", async () => {
    const r = await p.evaluate(() => { const e = [...document.querySelectorAll(".card.eco")].map((x) => ({ t: x.querySelector("h3").textContent.replace("ONE WORLD ", ""), s: x.querySelector(".st").textContent, lim: !!x.querySelector(".lim"), h: x.querySelector(".act a").getAttribute("href") }));
      const u = [...document.querySelectorAll(".uses .card")].map((x) => ({ t: x.querySelector("h3").textContent, s: x.querySelector(".st").textContent, lien: x.tagName === "A" }));
      return { e, rencontrer: u.find((x) => x.t === "Rencontrer") }; });
    const noms = r.e.map((x) => x.t).join(","), st = Object.fromEntries(r.e.map((x) => [x.t, x.s]));
    const ok = noms === "CHAT,CALL,VIDEO,FACE TO FACE,SCAN,COMMUNITY,LIVE,LEARN,BUSINESS,SOS,DISCOVERY" && st.LIVE === "Débuts" && st.LEARN === "Débuts" &&
      r.e.filter((x) => x.s === "Disponible").length === 9 && r.e.find((x) => x.t === "SCAN").lim && r.e.find((x) => x.t === "FACE TO FACE").lim &&
      r.rencontrer.s === "Bientôt" && !r.rencontrer.lien;
    return { ok, detail: noms + " · " + JSON.stringify(st) };
  });
  await step("Chaque espace ouvre une vraie route de l'appli (aucune route inventée)", async () => {
    const hs = await p.evaluate(() => [...document.querySelectorAll(".card.eco .act a")].map((a) => a.getAttribute("href")).filter((h) => h.includes("#/")));
    const app = fs.readFileSync(path.join(SITE, "everywhere", "espaces", "espaces.js"), "utf8") + fs.readFileSync(path.join(SITE, "everywhere", "index.html"), "utf8") + fs.readFileSync(path.join(SITE, "everywhere", "traduction", "everywhere.js"), "utf8");
    const bad = hs.filter((h) => { const r = h.split("#/")[1].split("/"); return !(new RegExp('data-route="' + r[0] + '"|kind === "' + r[0] + '"|#/' + r.join("/") + "\\b").test(app)); });
    return { ok: hs.length === 8 && !bad.length, detail: hs.length + " routes" + (bad.length ? " · inconnues : " + bad.join(",") : " · toutes présentes dans l'appli") };
  });
  await step("Liens internes : tous mènent à un fichier qui existe (appli, portail, pro/, légal)", async () => {
    const hrefs = await p.evaluate(() => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")))]);
    const bad = [];
    for (const h of hrefs) {
      if (h.startsWith("#")) { if (h.length > 1 && !(await p.$(h))) bad.push(h); continue; }
      if (h.startsWith("mailto:")) { if (!/^mailto:contact\.2424oneworld@gmail\.com(\?|$)/.test(h)) bad.push(h); continue; }
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
  await step("Lecteur d'écran : un seul h1, titres sans saut de niveau, chaque lien et bouton a un nom, zones de repère présentes", async () => {
    const r = await p.evaluate(() => {
      const hs = [...document.querySelectorAll("h1,h2,h3")].filter((h) => h.offsetParent !== null).map((h) => +h.tagName[1]);
      let saut = 0; for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) saut++;
      const sansNom = [...document.querySelectorAll("a[href],button,input,select")].filter((e) => e.offsetParent !== null && !((e.getAttribute("aria-label") || "").trim() || (e.textContent || "").trim() || (e.labels && e.labels[0] && e.labels[0].textContent.trim()) || e.title || e.placeholder)).map((e) => e.outerHTML.slice(0, 60));
      return { h1: hs.filter((x) => x === 1).length, saut, sansNom, main: !!document.querySelector("main"), header: !!document.querySelector("header"), footer: !!document.querySelector("footer") };
    });
    return { ok: r.h1 === 1 && r.saut === 0 && !r.sansNom.length && r.main && r.header && r.footer, detail: JSON.stringify(r).slice(0, 300) };
  });
  await step("Réseau et confidentialité : au chargement, aucun appel hors du site sauf Travelpayouts ; rien d'autre que le carnet et la langue gardés sur l'appareil", async () => {
    const ctx = await browser.newContext({ locale: "fr-FR" }); const ext = [];
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => { ext.push(new URL(r.request().url()).host); return r.abort(); });
    const q = await ctx.newPage(); await q.goto(M + "?lang=fr"); await q.waitForFunction(() => document.querySelector("#cloud button"));
    await q.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await q.waitForTimeout(1500);
    const cles = await q.evaluate(() => { try { return Object.keys(localStorage).concat(Object.keys(sessionStorage)); } catch (e) { return []; } });
    const cookies = await ctx.cookies(); await ctx.close();
    const autres = [...new Set(ext)].filter((h) => !/tp-em\.com$/.test(h));
    return { ok: !autres.length && !cookies.length && cles.every((k) => /^ow_|^lc_|lang/i.test(k)), detail: "hors site : " + ([...new Set(ext)].join(",") || "aucun") + " · stockage : " + (cles.join(",") || "rien") + " · cookies : " + cookies.length };
  });
  if (MOTEUR === "chromium") await step("Performance (téléphone faible simulé, processeur ÷4) : globe animé sans tâche JavaScript de plus de 50 ms pendant 3 s", async () => {
    const ctx = await ctxFor(tel); const q = await open(ctx, M + "?lang=fr");
    const cdp = await ctx.newCDPSession(q); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const r = await q.evaluate(() => new Promise((res) => { const longues = []; let n = 0;
      const po = new PerformanceObserver((l) => l.getEntries().forEach((e) => longues.push(Math.round(e.duration)))); try { po.observe({ type: "longtask", buffered: false }); } catch (e) {}
      const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else { po.disconnect(); res({ longues, ips: Math.round(n / 3) }); } })(); }));
    await ctx.close();
    return { ok: r.longues.length === 0 && r.ips >= 30, detail: "images/s ≈ " + r.ips + " · tâches longues : " + (r.longues.join(",") || "aucune") };
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
  // ---------- Page Tarifs /monde/tarifs/ (grille proposée, pas encore en vente) ----------
  const TF = M + "tarifs/";
  const ouvreTarifs = async (ctx, url) => { const q = await ctx.newPage(); q.on("pageerror", (e) => errors.push("tarifs: " + String(e))); await q.goto(url); await q.waitForSelector(".plan"); return q; };
  await step("Tarifs : 4 grandes cartes Free, Plus, Pro, Enterprise avec badges, prix et notes demandés", async () => {
    const q = await ouvreTarifs(ctxTel, TF + "?lang=fr");
    const r = await q.evaluate(() => [...document.querySelectorAll(".plan")].map((c) => ({ h: c.querySelector("h2").textContent.trim(), b: c.querySelector(".badge").textContent.trim(), p: [...c.querySelector(".price").children].map((x) => x.textContent.trim()).join(" "), a: c.querySelector(".alt").textContent.trim(), n: (c.querySelector(".note,.close") || {}).textContent || "", f: c.querySelectorAll(".feats li").length, btn: c.querySelector(".act .btn").textContent.trim() })));
    await q.close();
    const want = [["ONE WORLD Free", "GRATUIT À VIE", "0 € / mois", "", 8, "Commencer gratuitement", "Notre porte d'entrée mondiale."],
      ["ONE WORLD Plus", "RECOMMANDÉ AUX PARTICULIERS", "5,99 € / mois", "ou 59,90 € / an", 7, "Découvrir Plus", "deux mois offerts"],
      ["ONE WORLD Pro", "ÉQUIPES ET ENTREPRISES", "14,90 € / utilisateur / mois", "ou 149 € / utilisateur / an", 8, "Choisir Pro", "minimum de sièges à définir"],
      ["ONE WORLD Enterprise", "GRANDS COMPTES", "Sur devis", "", 6, "Contacter notre équipe", "nombre d'utilisateurs"]];
    const bad = want.filter((w, i) => { const c = r[i]; return !c || c.h !== w[0] || c.b !== w[1] || c.p !== w[2] || (w[3] && c.a !== w[3]) || c.f !== w[4] || c.btn !== w[5] || !c.n.includes(w[6]); });
    return { ok: r.length === 4 && !bad.length, detail: bad.length ? JSON.stringify(r) : r.map((c) => c.h.replace("ONE WORLD ", "") + " " + c.p).join(" · ") };
  });
  await step("Tarifs honnêtes : « pas encore en vente », aucun formulaire ni paiement, chaque fonction non livrée marquée, Free entièrement disponible", async () => {
    const q = await ouvreTarifs(ctxTel, TF + "?lang=fr");
    const r = await q.evaluate(() => ({ bandeau: document.querySelector(".notice").textContent, forms: document.querySelectorAll("form,input,iframe,[type=submit]").length,
      payer: /acheter maintenant|payer maintenant|stripe|paypal|carte bancaire\s*:/i.test(document.body.innerText),
      freeSoon: document.querySelectorAll(".plan.free .feats li.soon").length,
      sansStatut: [...document.querySelectorAll(".plan:not(.free) .feats li")].filter((li) => !li.querySelector(".st")).length,
      achat: [...document.querySelectorAll("tbody tr")].find((tr) => /Achat possible/.test(tr.textContent)).textContent }));
    await q.close();
    return { ok: /pas encore en vente/.test(r.bandeau) && /aucun paiement/.test(r.bandeau) && !r.forms && !r.payer && !r.freeSoon && !r.sansStatut && /Plus.*|Pas encore.*Pas encore.*Pas encore/.test(r.achat),
      detail: JSON.stringify({ forms: r.forms, payer: r.payer, freeSoon: r.freeSoon, sansStatut: r.sansStatut }) };
  });
  await step("Tarifs : tableau comparatif (5 colonnes, limites « à définir », communiquer entre utilisateurs inclus en Free)", async () => {
    const q = await ouvreTarifs(ctxTel, TF + "?lang=fr");
    const r = await q.evaluate(() => { const rows = [...document.querySelectorAll("tbody tr")].map((tr) => [...tr.children].map((c) => c.textContent.trim()));
      return { cols: [...document.querySelectorAll("thead th")].map((t) => t.textContent.trim()), rows }; });
    await q.close();
    const essentiels = r.rows.filter((x) => /^(Messages traduits|Appels et visio|Conversation côte)/.test(x[0]));
    const ok = r.cols.join("|") === "Fonctionnalité|Free|Plus|Pro|Enterprise" && r.rows.length >= 15 && r.rows.every((x) => x.length === 5)
      && r.rows.some((x) => x.join(" ").includes("à définir")) && essentiels.length === 3 && essentiels.every((x) => /^Inclus/.test(x[1]));
    return { ok, detail: r.rows.length + " lignes · " + r.cols.join("|") };
  });
  await step("Tarifs : boutons vers de vraies destinations (Free → appli, Plus → comparatif, Pro et Enterprise → e-mail de l'équipe) ; la vitrine mène aux tarifs", async () => {
    const q = await ouvreTarifs(ctxTel, TF + "?lang=fr");
    const r = await q.evaluate(() => ({ btn: [...document.querySelectorAll(".plan .act a")].map((a) => a.href), cmp: !!document.getElementById("comparer"),
      liens: [...document.querySelectorAll("a[href]")].map((a) => a.href).filter((h) => !h.startsWith("mailto:")) }));
    await q.close();
    const mail = r.btn.filter((h) => h.startsWith("mailto:"));
    const app = ORIGIN + BASE;
    const internes = r.liens.map((h) => new URL(h)).filter((u) => u.origin === ORIGIN).map((u) => u.pathname);
    const manquants = internes.filter((pth) => { let f = path.join(SITE, decodeURIComponent(pth.slice(BASE.length))); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html"); return !fs.existsSync(f); });
    const v = await p.evaluate(() => [...document.querySelectorAll('a[href="tarifs/"]')].length);
    const ok = r.btn[0] === app && /\/monde\/tarifs\/[^#]*#comparer$/.test(r.btn[1]) && r.cmp && mail.length === 3 && mail.every((h) => h.startsWith("mailto:contact.2424oneworld@gmail.com?subject=")) && !manquants.length && v >= 3;
    return { ok, detail: "e-mails " + mail.length + " · liens internes " + internes.length + (manquants.length ? " · manquants : " + manquants : "") + " · liens vitrine→tarifs " + v };
  });
  await step("Tarifs en anglais (écrit à la main) ; autre langue → anglais avec avertissement", async () => {
    const q = await ouvreTarifs(ctxTel, TF + "?lang=en");
    const en = await q.evaluate(() => ({ h1: document.querySelector("h1").textContent, lang: document.documentElement.lang, nl: document.getElementById("newLang").hidden, fr: [...document.querySelectorAll("[data-t]")].filter((e) => /[àéèêç]|\b(le|la|les|des|pour|avec)\b/i.test(e.textContent) && !/Sébastien/.test(e.textContent)).map((e) => e.getAttribute("data-t")) }));
    await q.goto(TF + "?lang=ja"); const ja = await q.evaluate(() => ({ h1: document.querySelector("h1").textContent, nl: document.getElementById("newLang").hidden }));
    await q.close();
    return { ok: en.h1 === "Choose your ONE WORLD experience" && en.lang === "en" && en.nl && !en.fr.length && ja.h1 === en.h1 && !ja.nl, detail: en.fr.length ? "restés en français : " + en.fr : "en + ja OK" };
  });
  for (const [w, hgt] of [[320, 640], [393, 851], [768, 1024], [1280, 800], [1920, 1080]]) {
    await step("Tarifs, écran " + w + " px : aucun défilement de côté, grandes cartes non compressées, boutons ≥ 44 px, capture", async () => {
      const ctx = await ctxFor({ viewport: { width: w, height: hgt }, hasTouch: w < 900 });
      const q = await ouvreTarifs(ctx, TF + "?lang=fr");
      const r = await q.evaluate(() => { const cards = [...document.querySelectorAll(".plan")].map((c) => c.getBoundingClientRect());
        return { large: document.documentElement.scrollWidth - innerWidth, cols: new Set(cards.map((b) => Math.round(b.top))).size, minW: Math.round(Math.min(...cards.map((b) => b.width))),
          petits: [...document.querySelectorAll("a.btn,.lang")].filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.height < 44; }).map((e) => e.textContent.trim().slice(0, 20)) }; });
      await q.screenshot({ path: path.join(OUT, "tarifs-" + ETIQ + "-" + w + ".png"), fullPage: true });
      await ctx.close();
      const lignes = w >= 1241 ? 1 : w > 720 ? 2 : 4;
      return { ok: r.large <= 1 && !r.petits.length && r.cols === lignes && r.minW >= Math.min(280, w - 40), detail: "débord " + r.large + " px · " + r.cols + " rangée(s) · carte la plus étroite " + r.minW + " px" + (r.petits.length ? " · petits : " + r.petits : "") };
    });
  }
  await step("Tarifs : clavier (lien d'évitement, focus visible sur les 4 boutons, tableau atteignable) et « réduire les animations »", async () => {
    const ctx = await ctxFor({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
    const q = await ouvreTarifs(ctx, TF + "?lang=fr");
    const vus = [];
    // Safari sur Mac : Tab seul saute les liens (réglage du système) ; Option+Tab les parcourt tous, comme un vrai utilisateur au clavier.
    const TAB = MOTEUR === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";
    for (let i = 0; i < 60; i++) { await q.keyboard.press(TAB); const f = await q.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { t: (a.getAttribute("data-t") || a.className || a.tagName), o: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2 }; }); vus.push(f); }
    const r = await q.evaluate(() => ({ sb: getComputedStyle(document.documentElement).scrollBehavior }));
    await ctx.close();
    const has = (k) => vus.some((v) => v.t === k && v.o);
    const ok = vus[0].t === "skip" && ["btnFree", "btnPlus", "btnPro", "btnEnt"].every(has) && vus.some((v) => v.t === "tbl" && v.o) && r.sb === "auto";
    return { ok, detail: "ordre : " + vus.slice(0, 12).map((v) => v.t).join(",") + "… · défilement " + r.sb };
  });
  await step("Tarifs : accessibilité (axe-core), aucune violation grave ou critique, un seul h1", async () => {
    const AXE = process.env.AXE || require.resolve("axe-core/axe.min.js");
    const q = await ouvreTarifs(ctxTel, TF + "?lang=fr");
    await q.addScriptTag({ path: AXE });
    const v = await q.evaluate(async () => (await axe.run(document, { resultTypes: ["violations"] })).violations.filter((x) => x.impact === "critical" || x.impact === "serious").map((x) => x.id + "×" + x.nodes.length + " [" + x.nodes.slice(0, 4).map((n) => n.target.join(" ") + " " + ((n.any[0] || {}).message || "").slice(0, 90)).join(" ; ") + "]"));
    const h1 = await q.evaluate(() => document.querySelectorAll("h1").length);
    await q.close();
    return { ok: !v.length && h1 === 1, detail: v.join(", ") || "aucune" };
  });
  await step("Aucune erreur JavaScript", async () => ({ ok: errors.length === 0, detail: errors.join(" | ").slice(0, 300) || "aucune" }));

  console.log("\n" + results.filter(Boolean).length + " / " + results.length + " tests réussis (" + ETIQ + ")");
  await browser.close(); server.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})();

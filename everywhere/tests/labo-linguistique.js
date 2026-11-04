/* 24/24 ONE WORLD — essai du labo linguistique (prototype isolé labo/, 2 nov. 2026).
   MyMemory et l'IA de test sont SIMULÉES ici (aucun appel Internet) : cet essai vérifie la logique du moteur et la page,
   pas la qualité réelle des traductions (celle-ci est mesurée par labo/tests/banc-reel.js, workflow « Labo linguistique »).
   Lancer : node everywhere/tests/labo-linguistique.js */
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const SITE = path.resolve(__dirname, "..", ".."), BASE = "/24-24-talk/", OUT = path.join(__dirname, "resultats");
fs.mkdirSync(OUT, { recursive: true });
const S = require(path.join(SITE, "labo", "moteur", "socle.js"));
const D = require(path.join(SITE, "labo", "donnees", "expressions-fr.js"));
const BT = require(path.join(SITE, "labo", "tests", "batterie.js"));
const B4 = require(path.join(SITE, "labo", "tests", "batterie-phase4.js"));
const L112 = require(path.join(SITE, "labo", "donnees", "langues-112.js"));
const BR = require(path.join(SITE, "labo", "tests", "batterie-registres.js"));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json" };
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

(async () => {
  // ---------- Moteur seul (Node)
  await step("Base d'expressions : 51 entrées, motifs valides, aucune entrée marquée « validée » sans relecture native", async () => {
    const bad = D.entrees.filter((e) => { try { new RegExp(e.motif, "iu"); e.pre.forEach((p) => new RegExp(p[0], "iu")); return false; } catch (x) { return true; } });
    return { ok: D.entrees.length === 51 && !bad.length && /non validé/.test(D.statut), detail: D.entrees.length + " entrées · motifs invalides " + bad.length + " · statut « " + D.statut + " »" };
  });
  await step("Phase 5 : types d'erreurs, « non vérifié », décisions et choix du moteur (traduction incertaine)", async () => {
    const F = require(path.join(SITE, "labo", "moteur", "fiabilite.js"));
    const cat = F.categorie("heure en swahili") === "grave" && F.categorie("nom « Marie »") === "grave" && F.categorie("attendu /usted/") === "contexte" && F.categorie("retraduction") === "sens";
    // LOT 1 : contrôles vides = non vérifié ; une phrase en échec ne compte PAS aussi en non vérifié (correction du 4 nov.).
    const r = F.resumer([{ controles: [{ controle: "nombre 3", ok: false }], chrf_retour: 40 }, { controles: [{ controle: "longueur", ok: true }], chrf_retour: null }, { controles: [], chrf_retour: 50 }, { controles: [{ controle: "longueur", ok: true }], chrf_retour: 50 }]);
    const res = r.phrases === 4 && r.graves === 1 && r.non_verifie === 2 && r.sans_probleme === 1;
    const mm = { phrases: 12, taux: 80 };
    const d1 = F.decider({ phrases: 12, taux: 92, graves: 0 }, mm).decision === "autorisée en test";
    const d2 = F.decider({ phrases: 12, taux: 95, graves: 2 }, mm).decision === "exclue";
    const d3 = F.decider({ phrases: 12, taux: 65, graves: 0 }, mm).decision === "exclue";
    const d4 = F.decider({ phrases: 4, taux: 100, graves: 0 }, mm).decision === "à surveiller";
    const ordre = F.ordreMoteurs({ grande: "autorisée en test", petite: "exclue" }).join(",") === "grande,mymemory";
    const ok1 = await F.choisir(["grande", "mymemory"], async (m) => m, async (m) => ({ controles: m === "grande" ? [{ controle: "jour « vendredi »", ok: false }] : [{ controle: "longueur", ok: true }], chrf_retour: 40 }));
    const ok2 = await F.choisir(["mymemory"], async (m) => m, async () => ({ controles: [{ controle: "nombre 6", ok: false }], chrf_retour: 40 }));
    const ch = ok1.moteur === "mymemory" && !ok1.incertaine && ok2.incertaine;
    return { ok: cat && res && d1 && d2 && d3 && d4 && ordre && ch, detail: [cat, res, d1, d2, d3, d4, ordre, ch].map((x) => (x ? "✓" : "✗")).join(" ") + " (catégories, résumé, 4 décisions, ordre, choix/incertaine)" };
  });
  await step("LOT 1 : 27 tests d'acceptation de la fiabilité (labo/tests/lot1-fiabilite.test.js, hors ligne)", async () => {
    const r = require("child_process").spawnSync(process.execPath, [path.join(SITE, "labo", "tests", "lot1-fiabilite.test.js")], { encoding: "utf8" });
    const fin = (r.stdout || "").trim().split("\n").pop();
    return { ok: r.status === 0 && /^27 \/ 27 /.test(fin), detail: fin || (r.stderr || "").slice(0, 200) };
  });
  await step("F-30 : 10 tests d'acceptation « retraduction impossible = non vérifié » (labo/tests/f30-retraduction.test.js, faux réseau)", async () => {
    const r = require("child_process").spawnSync(process.execPath, [path.join(SITE, "labo", "tests", "f30-retraduction.test.js")], { encoding: "utf8", timeout: 300000 });
    const fin = (r.stdout || "").trim().split("\n").pop();
    return { ok: r.status === 0 && /^10 \/ 10 /.test(fin), detail: fin || (r.stderr || "").slice(0, 200) };
  });
  await step("Aucun équivalent inventé : chaque équivalent est marqué « idiome » ou « sens », dans les 5 langues", async () => {
    const manque = [];
    D.entrees.forEach((e) => ["en", "es", "ar", "zh", "sw"].forEach((l) => { const q = e.eq[l]; if (!q || !q.t || !/^(idiome|sens)$/.test(q.type)) manque.push(e.id + ":" + l); }));
    return { ok: !manque.length, detail: manque.length ? manque.slice(0, 5).join(", ") : "255 équivalents typés" };
  });
  await step("Batterie (35 phrases, 15 familles) : expressions, registres, ironie, région, nombres, noms propres et mélange repérés comme attendu", async () => {
    const ko = [];
    BT.cas.forEach((c) => {
      const a = S.comprendre(c.t, "fr", D), A = S.identifier(c.t), ids = a.expressions.map((x) => x.id);
      (c.expressions || []).forEach((e) => { if (!ids.includes(e)) ko.push(c.t + " → manque " + e); });
      ids.forEach((e) => { if (!(c.expressions || []).includes(e)) ko.push(c.t + " → en trop " + e); });
      if (c.registre && !a.registres.includes(c.registre)) ko.push(c.t + " → registre");
      if (c.ironie !== undefined && a.ironie_possible !== c.ironie) ko.push(c.t + " → ironie");
      (c.nombres || []).forEach((n) => { if (!a.nombres.includes(n)) ko.push(c.t + " → nombre " + n); });
      (c.noms || []).forEach((n) => { if (!a.noms_propres.includes(n)) ko.push(c.t + " → nom " + n); });
      if (!!c.melange !== !!A.melange) ko.push(c.t + " → mélange");
      if (A.langue !== "fr") ko.push(c.t + " → langue " + A.langue);
      if (c.ambigu && !a.ambiguites.length) ko.push(c.t + " → ambiguïté");
    });
    return { ok: !ko.length, detail: ko.length ? ko.slice(0, 3).join(" | ") : BT.cas.length + " / " + BT.cas.length + " (cas écrits en même temps que le moteur : ce n'est pas une évaluation indépendante)" };
  });
  await step("Pré-édition : l'image disparaît, la phrase reste grammaticale (exemples de la mission)", async () => {
    const a = S.preediter("Il m'a posé un lapin.", D).texte, b = S.preediter("Ce projet va cartonner !", D).texte, c = S.preediter("Elle est tombée dans les pommes.", D).texte;
    return { ok: a === "Il n'est pas venu à notre rendez-vous." && b === "Ce projet va avoir un très grand succès !" && c === "Elle s'est évanouie.", detail: [a, b, c].join(" · ") };
  });
  await step("Identification : 12 écritures et langues (uk, ru, fa, ur, ar, ja, zh, ko, th, hi, de, pt) + mélange français/anglais", async () => {
    const cas = [["Привіт, як справи?", "uk"], ["Привет, как дела?", "ru"], ["سلام، حالت چطوره؟", "fa"], ["آپ کیسے ہیں؟", "ur"], ["مرحبا كيف حالك", "ar"], ["こんにちは、元気ですか", "ja"], ["你好，你好吗", "zh"], ["안녕하세요", "ko"], ["สวัสดีครับ", "th"], ["नमस्ते, आप कैसे हैं?", "hi"], ["Guten Morgen, wie geht es dir?", "de"], ["Bom dia, tudo bem com você?", "pt"]];
    const faux = cas.filter(([t, l]) => S.identifier(t).langue !== l).map(([t, l]) => l + "→" + S.identifier(t).langue);
    const m = S.identifier("On se voit at the station, ok ? Je t'attends.").melange;
    return { ok: !faux.length && m, detail: faux.length ? faux.join(", ") : "12 / 12 · mélange repéré" };
  });
  await step("Contrôle : « rabbit » (mot à mot), nombre perdu, nom propre perdu, faux ami et heure swahili sont signalés", async () => {
    const t1 = "Il m'a posé un lapin à 14 h.", a1 = S.comprendre(t1, "fr", D);
    const e1 = S.controler(t1, "He placed a rabbit on me at 3 pm.", a1, "en", D);
    const t2 = "Marie a envoyé 250 € à Karim.", a2 = S.comprendre(t2, "fr", D);
    const e2 = S.controler(t2, "Marie sent 25 € to him.", a2, "en", D);
    const t3 = "Actuellement, je travaille.", e3 = S.controler(t3, "Actually, I work.", S.comprendre(t3, "fr", D), "en", D);
    const t4 = "On se voit demain à 9 h.", e4 = S.controler(t4, "Tuonane kesho saa 9 alfajiri.", S.comprendre(t4, "fr", D), "sw", D);
    const bon = S.controler(t1, "He stood me up at 2 pm.", a1, "en", D);
    const lit = e1.resultats.some((x) => x.ok === false && /MOT À MOT/.test(x.detail)), nb = e1.resultats.some((x) => x.controle === "nombre 14" && x.ok === false);
    const nb2 = e2.resultats.some((x) => x.controle === "nombre 250" && !x.ok), nom = e2.resultats.some((x) => x.controle === "nom propre Karim" && !x.ok);
    const fa = e3.resultats.some((x) => /faux ami/.test(x.controle)), sw = e4.resultats.some((x) => /swahili/.test(x.controle));
    return { ok: lit && nb && nb2 && nom && fa && sw && bon.echecs === 0, detail: JSON.stringify({ lit, nb, nb2, nom, fa, sw, bonne_traduction_sans_alerte: bon.echecs === 0 }) };
  });

  // ---------- Isolement : rien dans l'application ne mène au labo
  await step("Isolement : aucune page de l'application ni de la vitrine ne mène au labo ; le labo n'est pas indexé", async () => {
    const pages = ["index.html", "monde/index.html", "everywhere/index.html", "sw.js", "everywhere/sw.js"].filter((f) => fs.existsSync(path.join(SITE, f)));
    const liens = pages.filter((f) => /labo\//.test(fs.readFileSync(path.join(SITE, f), "utf8")));
    const noindex = /<meta name="robots" content="noindex, nofollow"/.test(fs.readFileSync(path.join(SITE, "labo", "index.html"), "utf8"));
    return { ok: !liens.length && noindex, detail: "pages vérifiées " + pages.length + " · liens vers labo " + liens.length + " · noindex " + noindex };
  });

  // ---------- Phase 4 : batterie spécifique et contrôles de fidélité du sens (moteur seul, simulé)
  await step("Phase 4 : batterie de 29 phrases en 9 familles, mêmes 5 langues ; la batterie de base reste à 35 phrases", async () => {
    const fam = [...new Set(B4.cas.map((c) => c.famille))];
    const attendues = ["idiomes", "argot", "familier", "soutenu", "métaphores", "doubles sens", "négations", "heures, dates, nombres", "contexte"];
    const okL = JSON.stringify(B4.langues) === JSON.stringify(BT.langues);
    return { ok: B4.cas.length === 29 && attendues.every((f) => fam.includes(f)) && okL && BT.cas.length === 35 && B4.cas.filter((c) => c.contexte).length === 3,
      detail: B4.cas.length + " phrases · " + fam.length + " familles · langues " + B4.langues.join(",") + " · base " + BT.cas.length };
  });
  await step("Phase 4 : bonnes traductions anglaises (écrites à la main) → aucune fausse alerte de sens", async () => {
    const bon = { "Je ne viendrai jamais à cette fête.": "I will never come to this party.", "Tu viens ou pas ? On t'attend depuis une plombe.": "Are you coming or not? We've been waiting for ages.",
      "Le rendez-vous est le vendredi 3 avril à 8 h 15.": "The appointment is on Friday, April 3 at 8:15.", "J'ai payé 1 499,99 € pour 2 billets le 31 décembre.": "I paid €1,499.99 for 2 tickets on December 31.",
      "Il ne saurait être question de reporter cette réunion.": "Postponing this meeting is out of the question.", "Oui, elle l'a visité hier et elle l'adore.": "Yes, she visited it yesterday and she loves it." };
    const ko = Object.keys(bon).map((t) => { const c = B4.cas.find((x) => x.t === t); const an = S.comprendre(t, "fr", D); return S.controler(t, bon[t], an, "en", D).echecs + S.verifierSens(t, bon[t], "en", c).echecs; });
    return { ok: ko.every((n) => n === 0), detail: "fausses alertes " + ko.join(",") };
  });
  await step("Phase 4 : sens trahi détecté (négation perdue, question perdue, mois changé, vouvoiement perdu, mot à mot, chiffre changé)", async () => {
    const c = (t) => B4.cas.find((x) => x.t === t);
    const v = (t, trad, l) => S.verifierSens(t, trad, l, c(t)).echecs + S.controler(t, trad, S.comprendre(t, "fr", D), l, D).echecs;
    const r = [
      v("Je ne viendrai jamais à cette fête.", "I will come to this party.", "en"),
      v("Tu viens ou pas ? On t'attend depuis une plombe.", "You are coming. We have been waiting for a lead.", "en"),
      v("Le rendez-vous est le vendredi 3 avril à 8 h 15.", "La cita es el viernes 3 de mayo a las 8:15.", "es"),
      v("Enchanté. Vous pouvez m'appeler quand vous voulez.", "Encantado. Puedes llamarme cuando quieras.", "es"),
      v("Mon patron m'a passé un savon.", "My boss gave me a soap.", "en"),
      v("Le train part à 23 h 45, quai 12, dimanche.", "The train leaves at 11:45 pm, platform 13, Sunday.", "en"),
      v("Je ne viendrai jamais à cette fête.", "我永远不会来参加这个聚会。", "zh") === 0 ? 1 : 0,
    ];
    return { ok: r.every((n) => n >= 1), detail: "alertes par cas " + r.join(",") };
  });
  await step("Phase 4 : le contexte de conversation est transmis à l'IA (simulée), jamais à MyMemory", async () => {
    let vuIA = null, vuMM = [];
    await S.traduire("Oui, ils ont volé la victoire !", "fr", "en", { contexte: ["Tu as vu le match hier soir ?"] },
      { mymemory: (t) => { vuMM.push(t); return Promise.resolve("Yes, they stole the win!"); }, ia: (req) => { vuIA = req; return Promise.resolve({ traduction: "Yes, they stole the win!" }); } }, D);
    const ok = vuIA && Array.isArray(vuIA.contexte) && vuIA.contexte[0] === "Tu as vu le match hier soir ?" && vuMM.every((t) => !/match/.test(t));
    return { ok, detail: "contexte IA " + JSON.stringify(vuIA && vuIA.contexte) + " · textes MyMemory " + vuMM.length };
  });
  await step("Sécurité : aucune clé Groq dans le dépôt ; la fonction lit GROQ_API_KEY côté serveur et ne journalise aucun texte", async () => {
    const fichiers = [];
    (function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/node_modules|\.git$/.test(p)) walk(p); } else if (/\.(js|ts|html|yml|json|md)$/.test(e.name)) fichiers.push(p); }); })(path.join(SITE, "labo"));
    const fuite = fichiers.filter((f) => /gsk_[A-Za-z0-9]{20,}/.test(fs.readFileSync(f, "utf8")));
    const fn = fs.readFileSync(path.join(SITE, "labo", "serveur", "labo-traduire.ts"), "utf8");
    const okFn = /Deno\.env\.get\("GROQ_API_KEY"\)/.test(fn) && !/console\.(log|info|warn|error)/.test(fn);
    return { ok: !fuite.length && okFn, detail: "fichiers lus " + fichiers.length + " · clé Groq trouvée " + fuite.length + " · fonction sans journal " + okFn };
  });

  await step("112 langues : registre complet, écriture connue pour chacune, AUCUNE langue marquée validée ; batterie couvrant les 11 registres", async () => {
    const codes = L112.langues.map((l) => l.code), uniques = new Set(codes).size;
    const sansEcriture = L112.langues.filter((l) => !l.ecriture).length;
    const couverts = BR.registres.filter((r) => BR.cas.some((c) => c.registre === r)).length;
    return { ok: codes.length === 112 && uniques === 112 && !sansEcriture && L112.valides.length === 0 && couverts === 11 && BR.registres.length === 11,
      detail: codes.length + " langues · " + uniques + " codes uniques · validées " + L112.valides.length + " · registres couverts " + couverts + "/11 · phrases " + BR.cas.length };
  });

  // ---------- Page (Chromium, MyMemory et IA simulées)
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ORIGIN = "http://localhost:" + server.address().port, URL_LABO = ORIGIN + BASE + "labo/";
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 320, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR" });
  let iaBranchee = false, appelsIA = 0;
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => {
    const u = r.request().url();
    if (/mymemory/.test(u)) {
      const q = new URL(u).searchParams.get("q");
      const t = /lapin/.test(q) ? "He placed a rabbit on me." : /rendez-vous/.test(q) ? "He didn't show up for our date." : "[en] " + q;
      return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ responseStatus: 200, responseData: { translatedText: t, match: 0.85 }, matches: [] }) });
    }
    if (/labo-traduire/.test(u)) {
      appelsIA++;
      if (r.request().method() === "OPTIONS") return r.fulfill({ status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" }, body: "ok" });
      if (!iaBranchee) return r.fulfill({ status: 503, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ erreur: "IA non branchée" }) });
      return r.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ traduction: "He stood me up.", registre_detecte: "casual", expressions: [], remarques: "", modele: "simulé", ms: 5 }) });
    }
    return r.abort();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await step("Page labo : bandeau « prototype isolé », 35 exemples, 7 styles, aucune erreur au chargement", async () => {
    await page.goto(URL_LABO);
    const r = await page.evaluate(() => ({ b: /Prototype isolé/.test(document.querySelector(".bandeau").textContent), ex: document.querySelectorAll("#exemples button").length, st: document.querySelectorAll("#style option").length }));
    return { ok: r.b && r.ex === 35 && r.st === 7 && !errors.length, detail: JSON.stringify(r) };
  });
  await step("« Il m'a posé un lapin » sans IA : MyMemory (simulé) signalé mot à mot, pré-édition propre, IA « pas encore branchée »", async () => {
    await page.fill("#txt", "Il m'a posé un lapin.");
    await page.selectOption("#vers", "en");
    await page.tap("#go");
    await page.waitForFunction(() => /D \+ E/.test(document.querySelector("#sortie").textContent), null, { timeout: 10000 });
    const r = await page.evaluate(() => { const s = document.querySelector("#sortie"); const cols = s.querySelectorAll(".col"); return { n: cols.length, mm: cols[0].textContent, pre: cols[1].textContent, ia: cols[2].textContent, exp: /posé un lapin/.test(s.textContent) && /stand someone up/.test(s.textContent) }; });
    const ok = r.n === 3 && /MOT À MOT/.test(r.mm) && /didn't show up/.test(r.pre) && !/MOT À MOT/.test(r.pre) && /pas encore branchée/.test(r.ia) && r.exp;
    return { ok, detail: "colonnes " + r.n + " · expression expliquée " + r.exp };
  });
  await step("Avec l'IA branchée (simulée) : 3e colonne remplie et contrôlée", async () => {
    iaBranchee = true;
    await page.tap("#go");
    await page.waitForFunction(() => /stood me up/.test(document.querySelector("#sortie").textContent), null, { timeout: 10000 });
    const ia = await page.evaluate(() => document.querySelectorAll("#sortie .col")[2].textContent);
    return { ok: /stood me up/.test(ia) && /image non traduite/.test(ia), detail: "appels IA " + appelsIA };
  });
  await step("Écran 320 px : aucun défilement de côté, boutons ≥ 44 px, capture", async () => {
    const r = await page.evaluate(() => ({ deb: document.documentElement.scrollWidth - innerWidth, petits: [...document.querySelectorAll("main > section button")].filter((b) => !b.closest("#exemples") && b.getBoundingClientRect().height < 44).length }));
    await page.screenshot({ path: path.join(OUT, "labo-320.png"), fullPage: true });
    return { ok: r.deb <= 1 && r.petits === 0, detail: "débord " + r.deb + " px · boutons trop petits " + r.petits };
  });
  await step("Accessibilité (axe-core) : aucune violation grave ou critique", async () => {
    if (!process.env.AXE) return { ok: true, detail: "axe-core absent en local : sauté" };
    await page.addScriptTag({ path: process.env.AXE });
    const v = await page.evaluate(async () => (await axe.run()).violations.filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => x.id));
    return { ok: !v.length, detail: v.join(", ") || "aucune" };
  });
  rec("Aucune erreur JavaScript", !errors.length, errors.join(" | ") || "aucune");
  await browser.close(); server.close();
  const n = results.filter(Boolean).length;
  console.log("\n" + n + " / " + results.length + " tests réussis");
  process.exit(n === results.length ? 0 : 1);
})();

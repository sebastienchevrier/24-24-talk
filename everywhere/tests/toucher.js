/* 24/24 ONE WORLD — essais de la couche d'interaction everywhere/toucher.js (30 oct. 2026).
   Page d'essai locale (aucun réseau). Lancer : node everywhere/tests/toucher.js */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const JS = fs.readFileSync(path.join(__dirname, "..", "toucher.js"), "utf8");
// owEtat() de index.html (inscription), repris tel quel du fichier pour l'essai de nouvel essai rapide après une erreur.
const OWETAT = (fs.readFileSync(path.join(__dirname, "..", "..", "index.html"), "utf8").match(/(?:  const owEtatTimers[^\n]*\n)?  function owEtat\(el, etat\) \{[\s\S]*?\n  \}\n/) || [""])[0];
const STYLE = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
const PAGE = `<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>${STYLE}</style></head><body>
<button id="go" class="ob-go">Créer mon compte</button> <button id="a" class="btn primary">Envoyer</button> <button id="b" class="btn">Autre</button>
<button id="c" class="btn" disabled>Déjà désactivé</button><div id="liste" style="height:200px;overflow-y:auto"><button id="d" class="btn">Dans une liste</button><div style="height:3000px"></div></div></body></html>`;
const results = [];
function rec(n, ok, d) { results.push(ok); console.log((ok ? "OK   " : "ÉCHEC") + "  " + n + (d ? "  — " + d : "")); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function ouvrir(browser, opts) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 360, height: 640 }, hasTouch: true }, opts || {}));
  const page = await ctx.newPage();
  await page.setContent(PAGE);
  await page.addScriptTag({ content: JS });
  return { ctx, page };
}
// Appui simulé (doigt n° id) sur un bouton.
const PTR = (sel, type, id) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); const r = el.getBoundingClientRect();
  el.dispatchEvent(new PointerEvent(${JSON.stringify(type)}, { bubbles: true, pointerId: ${id}, pointerType: "touch", isPrimary: ${id === 1}, clientX: r.left + 5, clientY: r.top + 5 })); })()`;
const press = (p, sel) => p.evaluate((s) => document.querySelector(s).classList.contains("ow-press"), sel);

(async () => {
  const browser = await chromium.launch();
  let { ctx, page } = await ouvrir(browser);
  const t = async (n, fn) => { try { const r = await fn(); rec(n, r.ok, r.detail); } catch (e) { rec(n, false, String(e.message || e).split("\n")[0]); } };

  await t("Porte d'entrée orange (texte sombre), les autres boutons gardent leur couleur", async () => {
    const s = await page.evaluate(() => { const g = getComputedStyle(document.querySelector("#go")), a = getComputedStyle(document.querySelector("#a"));
      return [g.backgroundImage, g.color, a.backgroundImage, a.backgroundColor]; });
    return { ok: /255, 196, 107/.test(s[0]) && /255, 122, 26/.test(s[0]) && s[1] === "rgb(31, 13, 0)" && s[2] === "none" && s[3] !== "rgba(0, 0, 0, 0)", detail: s.join(" | ") };
  });
  await t("L'onde prend la couleur du bouton touché", async () => {
    await page.evaluate(PTR("#a", "pointerdown", 60));
    const r = await page.evaluate(() => { const o = document.querySelector(".ow-onde"); return [o && o.style.getPropertyValue("--ow-tint"), getComputedStyle(document.querySelector("#a")).backgroundColor]; });
    await page.evaluate(PTR("#a", "pointerup", 60)); await sleep(500);
    return { ok: !!r[0] && r[1].replace(/rgba?\(|\)/g, "").split(",").slice(0, 3).join(",").replace(/ /g, "") === r[0].replace(/rgba\(|\)/g, "").split(",").slice(0, 3).join(",").replace(/ /g, ""), detail: JSON.stringify(r) };
  });
  await t("Chargement puis succès : ✓, annonce texte, bouton réactivé", async () => {
    const r = await page.evaluate(async () => { const b = document.querySelector("#a"); OWMotion.loading(b, true);
      const pendant = [b.disabled, b.getAttribute("data-ow-state"), b.getAttribute("aria-busy")];
      OWMotion.success(b, { message: "Compte créé" }); await new Promise((x) => setTimeout(x, 80));
      const st = document.querySelector("[role=status]");
      return { pendant, apres: [b.disabled, b.getAttribute("data-ow-state"), b.hasAttribute("aria-busy")], ok: !!document.querySelector(".ow-ok"), annonce: st && st.textContent }; });
    await page.evaluate(() => OWMotion.reset(document.querySelector("#a")));
    return { ok: r.pendant[0] === true && r.pendant[1] === "loading" && r.pendant[2] === "true" && r.apres[0] === false && r.apres[1] === "success" && !r.apres[2] && r.ok && r.annonce === "Compte créé", detail: JSON.stringify(r) };
  });
  await t("Chargement puis erreur : pas de ✓, bouton réactivé", async () => {
    await sleep(900);
    const r = await page.evaluate(() => { const b = document.querySelector("#b"); OWMotion.loading(b, true); OWMotion.error(b, { message: "Erreur" });
      return [b.disabled, b.getAttribute("data-ow-state"), document.querySelectorAll(".ow-ok").length]; });
    await page.evaluate(() => OWMotion.reset(document.querySelector("#b")));
    return { ok: r[0] === false && r[1] === "error" && r[2] === 0, detail: JSON.stringify(r) };
  });
  await t("Un bouton déjà désactivé le reste après chargement", async () => {
    const r = await page.evaluate(() => { const c = document.querySelector("#c"); const o = [];
      OWMotion.loading(c, true); OWMotion.success(c); o.push(c.disabled);
      OWMotion.loading(c, true); OWMotion.error(c); o.push(c.disabled);
      OWMotion.loading(c, true); OWMotion.loading(c, false); o.push(c.disabled); OWMotion.reset(c); o.push(c.disabled); return o; });
    return { ok: r.every(Boolean), detail: JSON.stringify(r) };
  });
  await t("Le simple clic ne montre pas de ✓ (seulement une vraie réussite)", async () => {
    await sleep(900);
    await page.click("#a");
    return { ok: (await page.locator(".ow-ok").count()) === 0 };
  });
  await t("Deux doigts sur deux boutons : relâchés séparément", async () => {
    await page.evaluate(PTR("#a", "pointerdown", 1)); await page.evaluate(PTR("#b", "pointerdown", 2));
    const deux = [await press(page, "#a"), await press(page, "#b")];
    await page.evaluate(PTR("#a", "pointerup", 1));
    const un = [await press(page, "#a"), await press(page, "#b")];
    await page.evaluate(PTR("#b", "pointerup", 2));
    return { ok: deux[0] && deux[1] && !un[0] && un[1] && !(await press(page, "#b")), detail: JSON.stringify({ deux, un }) };
  });
  await t("Appuis rapides : le nouvel appui n'est pas effacé par l'ancien", async () => {
    await page.evaluate(PTR("#a", "pointerdown", 3)); await page.evaluate(PTR("#a", "pointerup", 3));
    await page.evaluate(PTR("#a", "pointerdown", 4)); await sleep(250);
    const tient = await press(page, "#a");
    await page.evaluate(PTR("#a", "pointerup", 4));
    return { ok: tient && !(await press(page, "#a")) };
  });
  await t("Chargement avec disable:false : le bouton n'est pas désactivé par la couche", async () => {
    const r = await page.evaluate(() => { const b = document.querySelector("#b"); OWMotion.loading(b, true, { disable: false }); const o = [b.disabled, b.getAttribute("data-ow-state")]; OWMotion.reset(b); o.push(b.disabled, b.hasAttribute("data-ow-state"), b.hasAttribute("aria-busy")); return o; });
    return { ok: r[0] === false && r[1] === "loading" && r[2] === false && !r[3] && !r[4], detail: JSON.stringify(r) };
  });
  await t("Réinitialisation pendant le chargement : bouton rendu actif", async () => {
    const r = await page.evaluate(() => { const b = document.querySelector("#a"); OWMotion.loading(b, true); OWMotion.reset(b); return [b.disabled, b.hasAttribute("data-ow-state")]; });
    return { ok: r[0] === false && !r[1], detail: JSON.stringify(r) };
  });
  await t("Doigt annulé (pointercancel) : bouton relâché", async () => {
    await page.evaluate(PTR("#a", "pointerdown", 50)); const avant = await press(page, "#a");
    await page.evaluate(PTR("#a", "pointercancel", 50));
    return { ok: avant && !(await press(page, "#a")) };
  });
  await t("Défilement d'une liste pendant un appui : bouton relâché", async () => {
    await page.evaluate(PTR("#d", "pointerdown", 51)); const avant = await press(page, "#d");
    const y = await page.evaluate(async () => { const l = document.querySelector("#liste"); l.scrollTop = 400; await new Promise((x) => setTimeout(x, 80)); return l.scrollTop; });
    const apres = await press(page, "#d");
    await page.evaluate(PTR("#d", "pointerup", 51)); await page.evaluate(() => { document.querySelector("#liste").scrollTop = 0; });
    return { ok: avant && y > 0 && !apres, detail: "défilé de " + y + " px" };
  });
  await t("Pastille de message non lu toujours visible pendant l'appui", async () => {
    const r = await page.evaluate(() => { const b = document.querySelector("#b"); const d = document.createElement("span"); d.id = "pastille";
      d.style.cssText = "position:absolute;top:2px;right:2px;width:10px;height:10px;border-radius:50%;background:red"; b.style.position = "relative"; b.appendChild(d); return 0; });
    await page.evaluate(PTR("#b", "pointerdown", 52));
    const v = await page.evaluate(() => { const b = document.querySelector("#b"), d = document.querySelector("#pastille"), r = d.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return [getComputedStyle(b).overflow, !!top && (top === d || top.classList.contains("ow-onde")), r.width > 0, top && (top.id || top.className)]; });
    await page.evaluate(PTR("#b", "pointerup", 52)); await page.evaluate(() => document.querySelector("#pastille").remove());
    return { ok: v[0] === "visible" && v[1] && v[2], detail: JSON.stringify(v) };
  });
  await t("Clavier : Tab donne un contour visible, Espace enfonce puis relâche", async () => {
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press("Tab");
    const out = await page.evaluate(() => { const e = document.activeElement; return [e.id, getComputedStyle(e).outlineStyle, getComputedStyle(e).outlineWidth]; });
    await page.keyboard.down(" "); const bas = await page.evaluate(() => document.activeElement.classList.contains("ow-press"));
    await page.keyboard.up(" "); const haut = await page.evaluate(() => document.activeElement.classList.contains("ow-press"));
    return { ok: !!out[0] && out[1] === "solid" && out[2] === "3px" && bas && !haut, detail: JSON.stringify(out) };
  });
  await t("Nettoyage : 4 ondes au plus, tout disparaît", async () => {
    for (let i = 0; i < 10; i++) { await page.evaluate(PTR("#b", "pointerdown", 10 + i)); await page.evaluate(PTR("#b", "pointerup", 10 + i)); }
    const max = await page.locator(".ow-onde").count();
    await sleep(600);
    const apres = await page.evaluate(() => document.querySelectorAll(".ow-onde,.ow-ok").length);
    return { ok: max <= 4 && apres === 0, detail: "max " + max + ", après " + apres };
  });
  await t("Réduire les animations après chargement : effet immédiat", async () => {
    await page.evaluate(() => document.documentElement.classList.add("ow-reduce-motion")); await sleep(20);
    const red = await page.evaluate(() => OWMotion.reducedMotion);
    await page.evaluate(PTR("#b", "pointerdown", 40));
    const r = [red, await press(page, "#b"), await page.locator(".ow-onde").count()];
    await page.evaluate(PTR("#b", "pointerup", 40));
    const spin = await page.evaluate(() => { const b = document.querySelector("#b"); OWMotion.loading(b, true); const a = getComputedStyle(b, "::after").animationName; OWMotion.reset(b); return a; });
    await page.evaluate(() => OWMotion.setReducedMotion(false));
    return { ok: r[0] === true && !r[1] && r[2] === 0 && spin === "none" && (await page.evaluate(() => !OWMotion.reducedMotion)), detail: JSON.stringify(r) + " " + spin };
  });
  await ctx.close();
  ({ ctx, page } = await ouvrir(browser, { reducedMotion: "reduce" }));
  await t("Réduire les animations dès le démarrage (réglage du téléphone)", async () => {
    await page.evaluate(PTR("#a", "pointerdown", 1));
    const r = [await page.evaluate(() => OWMotion.reducedMotion), await press(page, "#a"), await page.locator(".ow-onde").count()];
    await page.evaluate(PTR("#a", "pointerup", 1));
    return { ok: r[0] === true && !r[1] && r[2] === 0, detail: JSON.stringify(r) };
  });
  await t("Inscription : nouvel essai juste après une erreur, le chargement n'est pas effacé", async () => {
    if (!OWETAT) return { ok: false, detail: "owEtat introuvable dans index.html" };
    await page.evaluate((src) => { (0, eval)(src + "; window.__owEtat = owEtat;"); }, OWETAT);
    await page.evaluate(() => window.__owEtat(document.querySelector("#go"), "error"));
    await sleep(1000);
    await page.evaluate(() => window.__owEtat(document.querySelector("#go"), "loading"));
    await sleep(900);
    const r = await page.evaluate(() => document.querySelector("#go").getAttribute("data-ow-state"));
    return { ok: r === "loading", detail: "état 1,9 s après l'erreur (0,9 s après le nouvel essai) : " + r };
  });
  await ctx.close();
  await browser.close();
  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} essais réussis`);
  process.exit(ok === results.length ? 0 : 1);
})();

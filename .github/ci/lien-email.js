/* 24/24 ONE WORLD — étape H : essai RÉEL du bouton « Confirmer mon e-mail » sur la base TEST (jamais la PROD). © 2026 Sébastien Chevrier.
   Navigateur 1 = celui où l'inscription commence (compte anonyme + demande d'e-mail, comme l'appli, retour vers le site TEST).
   Navigateur 2 = un AUTRE navigateur, tout neuf, comme le navigateur intégré de Gmail : il ouvre le lien du bouton.
   Le lien du bouton (usage unique) est lu dans Gmail puis poussé dans .github/ci/liens-<run>.json sur la branche d'essai.
   Données laissées sur TEST : 1 compte anonyme d'essai (e-mail contact.2424oneworld+lienh…), sans profil sauf si l'appli le crée. */
const { createClient } = require("@supabase/supabase-js");
const pw = require("playwright");
const { execSync } = require("child_process");
const fs = require("fs");
const URL_TEST = "https://tbynnefrrxzxufcptijc.supabase.co", KEY_TEST = "sb_publishable_zNyy7HYlbwtdNjewaxcKdA_uF_vlskR";
const SITE = "https://talk-24-24-lab.github.io/24-24-talk/";
const RUN = process.env.GITHUB_RUN_ID || String(Date.now()), BR = "claude/test-reel-test";
const res = [];
function rec(statut, nom, detail) { res.push(statut); console.log(statut.padEnd(12) + nom + (detail ? "  — " + detail : "")); }
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const masque = (u) => String(u || "").replace(/(access_token|refresh_token|token|token_hash|code)=[^&#]+/g, "$1=…");
async function liens() {
  for (let i = 0; i < 90; i++) {
    try {
      execSync("git fetch -q https://github.com/sebastienchevrier/24-24-talk.git " + BR, { stdio: "ignore" });
      return JSON.parse(execSync("git show FETCH_HEAD:.github/ci/liens-" + RUN + ".json", { stdio: ["ignore", "pipe", "ignore"] }).toString());
    } catch (e) { await attendre(10000); }
  }
  return null;
}
(async () => {
  fs.mkdirSync("captures-lien", { recursive: true });
  const c = createClient(URL_TEST, KEY_TEST, { auth: { persistSession: false, autoRefreshToken: false } });
  const s = await c.auth.signInAnonymously();
  if (s.error) { rec("NON EXÉCUTÉ", "Compte anonyme TEST", s.error.message); return fin(); }
  const email = "contact.2424oneworld+lienh" + RUN + "@gmail.com";
  const t0 = Date.now();
  const u = await c.auth.updateUser({ email, data: { email_lang: "fr" } }, { emailRedirectTo: SITE });
  if (u.error) { rec("FAIL", "Demande de l'e-mail de confirmation (retour vers le site TEST)", u.error.message); return fin(); }
  rec("PASS", "Demande de l'e-mail de confirmation (retour vers le site TEST)", email.split("+")[1]);
  console.log("ATTENTE DU LIEN pour " + email + " (fichier .github/ci/liens-" + RUN + ".json)");
  const k = await liens();
  if (!k || !k.lien) { rec("NON EXÉCUTÉ", "Lien du bouton", "non reçu en 15 min"); return fin(); }
  const attente = Math.round((Date.now() - t0) / 60000);
  console.log("Lien reçu après ~" + attente + " min : " + masque(k.lien));

  const browser = await pw.chromium.launch();
  // Navigateur 2 : neuf, comme le navigateur intégré de Gmail sur Android
  const ctx2 = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "fr-FR",
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 GSA/15.0" });
  const p2 = await ctx2.newPage();
  const vus = []; p2.on("framenavigated", (f) => { if (f === p2.mainFrame()) vus.push(masque(f.url())); });
  const erreursJs = []; p2.on("pageerror", (e) => erreursJs.push(String(e).slice(0, 160)));
  await p2.goto(k.lien, { waitUntil: "load", timeout: 60000 }).catch((e) => rec("FAIL", "Ouverture du lien", e.message.split("\n")[0]));
  await p2.waitForTimeout(8000);
  const arrivee = p2.url();
  console.log("Parcours du lien : " + vus.join("  →  "));
  rec(arrivee.startsWith(SITE) ? "PASS" : "FAIL", "Le lien ramène sur le site TEST (adresse de retour acceptée)", masque(arrivee));
  rec(!/error/.test(vus.join(" ")) ? "PASS" : "FAIL", "Aucune erreur dans le parcours du lien", vus.filter((x) => /error/.test(x)).join(" | ") || "aucune");
  await p2.screenshot({ path: "captures-lien/navigateur2-apres-lien.png", fullPage: false });
  const ecran2 = await p2.evaluate(() => ({ titre: document.title, texte: (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 400),
    session: Object.keys(localStorage).filter((x) => /auth|lc_net/.test(x)), hash: location.hash ? "reste dans l'adresse" : "nettoyé" }));
  console.log("Écran du navigateur 2 : " + JSON.stringify(ecran2));
  rec(ecran2.session.length ? "PASS" : "FAIL", "Navigateur 2 : l'appli garde la session du lien", ecran2.session.join(",") || "aucune session enregistrée");
  // Navigateur 1 : l'appli d'origine apprend-elle la confirmation ?
  const r1 = await c.auth.refreshSession();
  const conf = r1.data && r1.data.user && r1.data.user.email_confirmed_at;
  const mail1 = r1.data && r1.data.user && r1.data.user.email;
  rec(conf && mail1 === email ? "PASS" : "FAIL", "Navigateur 1 : après renouvellement, le compte d'origine est confirmé avec la bonne adresse", r1.error ? r1.error.message : "email=" + (mail1 === email ? "ok" : mail1) + ", confirmé=" + !!conf);
  // Lien réutilisé : il doit être refusé proprement
  const ctx3 = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, locale: "fr-FR" });
  const p3 = await ctx3.newPage(); const vus3 = []; p3.on("framenavigated", (f) => { if (f === p3.mainFrame()) vus3.push(masque(f.url())); });
  await p3.goto(k.lien, { waitUntil: "load", timeout: 60000 }).catch(() => {});
  await p3.waitForTimeout(6000);
  await p3.screenshot({ path: "captures-lien/lien-reutilise.png" });
  const txt3 = await p3.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 300));
  rec(/error|expired|invalid/i.test(vus3.join(" ")) ? "PASS" : "FAIL", "Lien utilisé une 2e fois : refusé (usage unique)", vus3.join(" → ").slice(0, 300));
  console.log("Écran du lien réutilisé : " + txt3);
  rec(erreursJs.length ? "INFO" : "PASS", "Erreurs JavaScript sur le site TEST après le lien", erreursJs.join(" | ") || "aucune");
  await browser.close();
  console.log("Délai de réception de l'e-mail : ~" + attente + " min (inclut le temps de lecture Gmail par Claude)");
  fin();
})().catch((e) => { rec("FAIL", "Erreur inattendue", String((e && e.message) || e)); fin(); });
function fin() { const f = res.filter((x) => x === "FAIL").length; console.log("\nRÉSUMÉ : " + res.filter((x) => x === "PASS").length + " PASS, " + f + " FAIL, " + res.filter((x) => x === "NON EXÉCUTÉ").length + " NON EXÉCUTÉ"); process.exit(f ? 1 : 0); }

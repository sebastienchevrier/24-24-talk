/* 24/24 ONE WORLD — AI LAB : tests d'acceptation F-30 (retraduction impossible = NON VÉRIFIÉ, jamais réussi).
   © 2026 Sébastien Chevrier. Tous droits réservés.
   Lancer : node labo/tests/f30-retraduction.test.js
   Hors ligne : fonctions seules + banc-112.js complet sur un faux réseau (labo/tests/outils/faux-reseau.js),
   lancé dans une copie temporaire du labo. Aucun appel à MyMemory, Supabase ou une IA. */
"use strict";
const path = require("path"), fs = require("fs"), os = require("os"), cp = require("child_process");
const LABO = path.join(__dirname, "..");
const F = require(path.join(LABO, "moteur", "fiabilite.js"));

const resultats = [];
async function test(nom, fn) {
  let ok = false, detail = "";
  try { const r = await fn(); ok = r.ok; detail = r.detail || ""; } catch (e) { detail = "exception : " + e.message; }
  resultats.push(ok);
  console.log((ok ? "OK   " : "ÉCHEC") + "  " + nom + (detail ? "  — " + detail : ""));
}
const SRC = "Je t'appelle ce soir après le travail.";
const base = () => [{ controle: "longueur", ok: true }, { controle: "écriture latin", ok: true }];
const echoue = (msg) => async () => { throw new Error(msg); };
const ret = (txt) => async () => txt;
const mesure = (v) => () => v;
const retraduction = (c) => c.find((x) => x.controle === "retraduction");

// Lance le vrai banc-112.js sur une copie temporaire du labo, avec le faux réseau. Renvoie { bilan, lignes }.
function banc(mode, ia) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "f30-"));
  fs.cpSync(LABO, path.join(tmp, "labo"), { recursive: true, filter: (s) => !/[\\/]resultats([\\/]|$)/.test(s) });
  const args = ["-r", path.join(tmp, "labo", "tests", "outils", "faux-reseau.js"), path.join(tmp, "labo", "tests", "banc-112.js"), "es"].concat(ia ? ["--ia", "--ecart", "0"] : []);
  const r = cp.spawnSync(process.execPath, args, { encoding: "utf8", env: Object.assign({}, process.env, { FAUX_RESEAU: mode, LABO_CLE: "" }), timeout: 120000 });
  const f = path.join(tmp, "labo", "tests", "resultats", "112-es.json");
  const out = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
  fs.rmSync(tmp, { recursive: true, force: true });
  if (!out) throw new Error("banc sans résultat (code " + r.status + ") " + (r.stderr || "").slice(0, 300));
  return out;
}
// Invariant F-30 : aucune phrase non vérifiée n'est comptée comme réussie, ni au total, ni par registre.
function invariant(bilan, lignes, prendre) {
  const ev = lignes.map(prendre).filter((e) => e && e.traduction && !e.erreur);
  const reussies = ev.filter((e) => F.estSansProbleme(e));
  const fautives = reussies.filter((e) => e.chrf_retour == null || e.controles.some((x) => x.ok !== true));
  const parReg = Object.values((prendre === ID ? bilan : bilan.ia).par_registre);
  const sommeReg = parReg.reduce((s, v) => s + v.reussis, 0);
  return { ok: fautives.length === 0 && (prendre === ID ? bilan : bilan.ia).tests_reussis === reussies.length && sommeReg === reussies.length, reussies: reussies.length };
}
const ID = (l) => l;

(async () => {
  await test("1. Retraduction réussie, chrF ≥ 15 : contrôle « retraduction » à true, phrase vérifiée", async () => {
    const c = base(); const o = await F.verifierRetour(c, "Te llamo esta noche", SRC, ret("Je t'appelle ce soir"), mesure(62));
    const e = Object.assign({ controles: c }, o), k = F.classer(e);
    return { ok: retraduction(c).ok === true && o.chrf_retour === 62 && k.verifiee && k.erreurs === 0 && k.impossibles === 0, detail: JSON.stringify(k) };
  });
  await test("2. Retraduction réussie, chrF < 15 : contrôle à false (erreur détectée), phrase non réussie", async () => {
    const c = base(); const o = await F.verifierRetour(c, "Naka nga def", SRC, ret("comment vas-tu"), mesure(9));
    const e = Object.assign({ controles: c }, o), k = F.classer(e);
    return { ok: retraduction(c).ok === false && !k.verifiee && k.erreurs === 1 && k.impossibles === 0, detail: retraduction(c).detail };
  });
  await test("3. Retraduction impossible (erreur réseau) : contrôle ok:null « NON VÉRIFIÉ », jamais réussi", async () => {
    const c = base(); const o = await F.verifierRetour(c, "Te llamo", SRC, echoue("fetch failed"), mesure(99));
    const e = Object.assign({ controles: c }, o), k = F.classer(e), r = retraduction(c);
    const ancien = c.filter((x) => x.ok === false).length === 0; // l'ancien calcul « echecs === 0 » l'aurait comptée réussie
    return { ok: r && r.ok === null && /^NON VÉRIFIÉ : retraduction impossible/.test(r.detail) && o.retour_erreur === "fetch failed" && o.chrf_retour === null && !k.verifiee && k.impossibles === 1 && k.erreurs === 0 && k.a_relire === 0 && ancien, detail: r && r.detail };
  });
  await test("4. Retraduction impossible (quota) : même traitement, NON VÉRIFIÉ", async () => {
    const c = base(); const o = await F.verifierRetour(c, "Te llamo", SRC, echoue("QUOTA"), mesure(99));
    const e = Object.assign({ controles: c }, o), k = F.classer(e), v = F.verdictTraduction(e);
    return { ok: retraduction(c).ok === null && /QUOTA/.test(retraduction(c).detail) && !k.verifiee && k.impossibles === 1 && v.etat === "incertaine", detail: v.raison };
  });
  await test("4b. Retraduction vide : NON VÉRIFIÉ aussi", async () => {
    const c = base(); const o = await F.verifierRetour(c, "Te llamo", SRC, ret(""), mesure(99));
    return { ok: retraduction(c).ok === null && o.chrf_retour === null, detail: retraduction(c).detail };
  });
  await test("5. Traduction initiale réussie mais retraduction impossible (banc-112 complet, faux réseau) : 0 réussie, toutes non vérifiées", async () => {
    const { bilan, lignes } = banc("reseau", false);
    const toutesNull = lignes.every((l) => l.traduction && retraduction(l.controles) && retraduction(l.controles).ok === null);
    const inv = invariant(bilan, lignes, ID);
    const regs = Object.values(bilan.par_registre).every((v) => v.reussi === false && v.reussis === 0);
    const ok = toutesNull && inv.ok && bilan.tests_reussis === 0 && regs && bilan.verifications_impossibles === lignes.length && bilan.phrases_non_verifiees + bilan.phrases_avec_erreur === lignes.length && bilan.fiabilite.mymemory.sans_probleme === 0;
    return { ok, detail: `traduites ${bilan.traduites} · réussies ${bilan.tests_reussis} · impossibles ${bilan.verifications_impossibles} · non vérifiées ${bilan.phrases_non_verifiees} · avec erreur ${bilan.phrases_avec_erreur} · à relire ${bilan.a_relire_humain}` };
  });
  await test("5b. Même chose avec le quota (HTTP 429) à la retraduction", async () => {
    const { bilan, lignes } = banc("quota", false);
    return { ok: bilan.tests_reussis === 0 && invariant(bilan, lignes, ID).ok && bilan.verifications_impossibles === lignes.length, detail: `réussies ${bilan.tests_reussis} · impossibles ${bilan.verifications_impossibles}` };
  });
  await test("6. Comparaison MyMemory / IA sur les mêmes phrases : mêmes règles, retraduction impossible = 0 réussie des deux côtés", async () => {
    const { bilan, lignes } = banc("reseau", true);
    const c = bilan.ia.comparaison_memes_phrases;
    const iaNull = lignes.every((l) => l.ia && retraduction(l.ia.controles) && retraduction(l.ia.controles).ok === null);
    const ok = iaNull && c.phrases === lignes.length && c.mymemory_sans_probleme === 0 && c.ia_sans_probleme === 0 && invariant(bilan, lignes, ID).ok && invariant(bilan, lignes, (l) => l.ia).ok && bilan.ia.verifications_impossibles === lignes.length && bilan.fiabilite.ia.sans_probleme === 0;
    return { ok, detail: `mêmes phrases ${c.phrases} · MyMemory réussies ${c.mymemory_sans_probleme} · IA réussies ${c.ia_sans_probleme} · IA impossibles ${bilan.ia.verifications_impossibles}` };
  });
  await test("6b. Retraduction disponible (faux réseau « ok ») : l'invariant tient et les réussites restent possibles", async () => {
    const { bilan, lignes } = banc("ok", true);
    const inv = invariant(bilan, lignes, ID), invIA = invariant(bilan, lignes, (l) => l.ia);
    return { ok: inv.ok && invIA.ok && bilan.verifications_impossibles === 0 && bilan.ia.verifications_impossibles === 0, detail: `MyMemory réussies ${inv.reussies}/${lignes.length} · IA ${invIA.reussies}/${lignes.length} (le faux texte « ES: … » peut échouer d'autres contrôles, c'est normal)` };
  });
  await test("6c. Retraduction très éloignée partout : erreurs détectées, comptées à part des impossibles", async () => {
    const { bilan, lignes } = banc("eloigne", false);
    return { ok: bilan.tests_reussis === 0 && bilan.phrases_avec_erreur === lignes.length && bilan.verifications_impossibles === 0 && invariant(bilan, lignes, ID).ok, detail: `avec erreur ${bilan.phrases_avec_erreur} · impossibles ${bilan.verifications_impossibles}` };
  });
  const n = resultats.filter(Boolean).length;
  console.log("\n" + n + " / " + resultats.length + " tests d'acceptation F-30 réussis");
  process.exit(n === resultats.length ? 0 : 1);
})();

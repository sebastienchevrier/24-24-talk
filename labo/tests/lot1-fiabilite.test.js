/* 24/24 ONE WORLD — AI LAB : tests d'acceptation du LOT 1 (fiabilité linguistique, 4 nov. 2026).
   © 2026 Sébastien Chevrier. Tous droits réservés.
   Lancer : node labo/tests/lot1-fiabilite.test.js
   Hors ligne : n'appelle ni Supabase, ni MyMemory, ni aucune IA. Sort avec le code 1 si un test échoue. */
"use strict";
const path = require("path");
const F = require(path.join(__dirname, "..", "moteur", "fiabilite.js"));

const resultats = [];
function test(nom, fn) {
  let ok = false, detail = "";
  try { const r = fn(); ok = r.ok; detail = r.detail || ""; } catch (e) { detail = "exception : " + e.message; }
  resultats.push(ok);
  console.log((ok ? "OK   " : "ÉCHEC") + "  " + nom + (detail ? "  — " + detail : ""));
}
const C = (ok, controle) => ({ controle: controle || "longueur", ok });

test("1. Retraduction absente : non vérifiée", () => {
  const e = { controles: [C(true)], chrf_retour: null };
  const r = F.resumer([e]), v = F.verdictTraduction(e);
  return { ok: r.non_verifie === 1 && r.sans_probleme === 0 && !F.estSansProbleme(e) && v.etat === "incertaine" && /retraduction/.test(v.raison), detail: JSON.stringify({ non_verifie: r.non_verifie, verdict: v.etat }) };
});
test("2. Contrôle null : non vérifié", () => {
  const e = { controles: [C(true), C(null, "indice mot à mot (retour)")], chrf_retour: 70 };
  const r = F.resumer([e]), v = F.verdictTraduction(e);
  return { ok: r.non_verifie === 1 && r.sans_probleme === 0 && v.etat === "incertaine" && v.raison === "au moins un contrôle non vérifié", detail: v.raison };
});
test("3. Contrôle undefined : non vérifié", () => {
  const e = { controles: [C(true), { controle: "longueur" }], chrf_retour: 70 };
  const r = F.resumer([e]), v = F.verdictTraduction(e);
  return { ok: r.non_verifie === 1 && r.sans_probleme === 0 && v.etat === "incertaine" && v.raison === "au moins un contrôle non vérifié", detail: v.raison };
});
test("4. Contrôle false : incertaine", () => {
  const e = { controles: [C(true), C(false, "nombre 3")], chrf_retour: 70 };
  const r = F.resumer([e]), v = F.verdictTraduction(e);
  return { ok: v.etat === "incertaine" && /grave : nombre 3/.test(v.raison) && r.graves === 1 && r.sans_probleme === 0, detail: v.raison };
});
test("5. Tous les contrôles true et chrF numérique : sans problème détecté", () => {
  const e = { controles: [C(true), C(true, "retraduction")], chrf_retour: 61.5 };
  const r = F.resumer([e]), v = F.verdictTraduction(e);
  return { ok: v.etat === "sans problème détecté" && r.sans_probleme === 1 && r.non_verifie === 0 && r.taux === 100 && F.estSansProbleme(e), detail: v.etat };
});
test("6. Aucun contrôle : incertaine", () => {
  const vide = F.verdictTraduction({ controles: [], chrf_retour: 70 }), absent = F.verdictTraduction({ chrf_retour: 70 });
  const r = F.resumer([{ controles: [], chrf_retour: 70 }]);
  return { ok: vide.etat === "incertaine" && absent.etat === "incertaine" && vide.raison === "contrôles absents" && r.sans_probleme === 0 && r.non_verifie === 1, detail: vide.raison + " / " + absent.raison };
});
test("7. Deux phrases dans le même registre : deux résultats conservés", () => {
  const lignes = [
    { registre: "familier", traduction: "a", controles: [C(true)], chrf_retour: 60 },
    { registre: "familier", traduction: "b", controles: [C(false, "nombre 3")], chrf_retour: 40 },
  ];
  const p = F.statsParRegistre(lignes).familier;
  return { ok: p.phrases === 2 && p.reussis === 1 && p.problemes === 1 && p.non_verifies === 0 && p.phrases_avec_erreur === 1 && p.reussi === false && p.chrf_retour_moyen === 50, detail: JSON.stringify(p) };
});
test("8. Trois latences 100, 200 et 900 : médiane 200", () => {
  const m = F.mediane([900, 100, 200]);
  return { ok: m === 200, detail: "médiane " + m };
});
test("9. Quatre latences 100, 200, 300 et 400 : médiane 250", () => {
  const m = F.mediane([400, 100, 300, 200]);
  return { ok: m === 250 && F.mediane([]) === null && F.mediane(null) === null, detail: "médiane " + m + " · vide → " + F.mediane([]) };
});
test("10. Les mêmes règles s'appliquent à MyMemory et à l'IA", () => {
  const evals = [
    { controles: [C(true)], chrf_retour: 70 },
    { controles: [C(null)], chrf_retour: 70 },
    { controles: [C(true)], chrf_retour: null },
    { controles: [C(false, "jour « vendredi »")], chrf_retour: 70 },
    { controles: [], chrf_retour: 70 },
  ];
  // Même évaluation posée côté MyMemory (la ligne) et côté IA (l.ia) : résultats identiques attendus.
  const lignes = evals.map((e, i) => Object.assign({ registre: "r" + (i % 2), traduction: "x", ia: Object.assign({ traduction: "x" }, e) }, e));
  const mm = F.resumer(lignes), ia = F.resumer(lignes.map((l) => l.ia));
  const pmm = F.statsParRegistre(lignes), pia = F.statsParRegistre(lignes, (l) => l.ia);
  const memeSans = lignes.every((l) => F.estSansProbleme(l) === F.estSansProbleme(l.ia));
  const ok = JSON.stringify(mm) === JSON.stringify(ia) && JSON.stringify(pmm) === JSON.stringify(pia) && memeSans && mm.sans_probleme === 1;
  return { ok, detail: "MyMemory " + JSON.stringify(mm) + " · IA " + JSON.stringify(ia) };
});

// ---- Correction complémentaire du 4 nov. : plus de double comptage (erreur détectée ≠ non vérifié).
const ANCIEN = require(path.join(__dirname, "outils", "fiabilite-18db14e.js")); // fiabilite.js tel qu'au commit 18db14e, gardé pour comparer
const cas = {
  faux_sans_chrf: { registre: "a", traduction: "x", controles: [C(true), C(false, "nombre 3")], chrf_retour: null },
  faux_retour_impossible: { registre: "b", traduction: "x", controles: [C(true), C(false, "négation"), { controle: "retraduction", ok: null, detail: F.RETOUR_IMPOSSIBLE }], chrf_retour: null },
  vrai_retour_impossible: { registre: "c", traduction: "x", controles: [C(true), { controle: "retraduction", ok: null, detail: F.RETOUR_IMPOSSIBLE }], chrf_retour: null },
};
const probleme = (r) => r.graves + r.sens + r.contexte;
test("11. Contrôle false + chrF absent : problème = 1, non vérifié = 0", () => {
  const r = F.resumer([cas.faux_sans_chrf]);
  return { ok: probleme(r) === 1 && r.non_verifie === 0 && r.sans_probleme === 0, detail: JSON.stringify(r) };
});
test("12. Contrôle false + retraduction impossible : problème = 1, non vérifié = 0", () => {
  const r = F.resumer([cas.faux_retour_impossible]);
  return { ok: probleme(r) === 1 && r.non_verifie === 0 && r.sans_probleme === 0, detail: JSON.stringify(r) };
});
test("13. Contrôle true + retraduction impossible : problème = 0, non vérifié = 1", () => {
  const r = F.resumer([cas.vrai_retour_impossible]);
  return { ok: probleme(r) === 0 && r.non_verifie === 1 && r.sans_probleme === 0, detail: JSON.stringify(r) };
});
test("14. Mêmes résultats dans les statistiques par registre", () => {
  const p = F.statsParRegistre(Object.values(cas));
  const ok = p.a.phrases_avec_erreur === 1 && p.a.non_verifies === 0 && p.a.reussis === 0 &&
    p.b.phrases_avec_erreur === 1 && p.b.non_verifies === 0 && p.b.reussis === 0 &&
    p.c.phrases_avec_erreur === 0 && p.c.problemes === 0 && p.c.non_verifies === 1 && p.c.reussis === 0;
  // Total par registre = total de resumer (même règle).
  const r = F.resumer(Object.values(cas)), t = Object.values(p);
  const memes = t.reduce((s, v) => s + v.non_verifies, 0) === r.non_verifie && t.reduce((s, v) => s + v.phrases_avec_erreur, 0) === probleme(r) && t.reduce((s, v) => s + v.reussis, 0) === r.sans_probleme;
  return { ok: ok && memes, detail: JSON.stringify(p) };
});
test("15. Réussites identiques avant (18db14e) et après la correction ; seul « non vérifié » baisse", () => {
  // Jeu varié : réussite, null, undefined, false, chrF absent, retraduction impossible, aucun contrôle, erreur d'appel.
  const jeu = [
    { registre: "r1", traduction: "x", controles: [C(true), C(true)], chrf_retour: 70 },
    { registre: "r1", traduction: "x", controles: [C(true), C(null)], chrf_retour: 70 },
    { registre: "r2", traduction: "x", controles: [C(true), { controle: "longueur" }], chrf_retour: 70 },
    { registre: "r2", traduction: "x", controles: [C(false, "jour « vendredi »")], chrf_retour: 70 },
    { registre: "r3", traduction: "x", controles: [C(false, "attendu /usted/")], chrf_retour: null },
    { registre: "r3", traduction: "x", controles: [C(true, "retraduction")], chrf_retour: 55 },
    { registre: "r4", traduction: "x", controles: [], chrf_retour: 70 },
    cas.faux_retour_impossible, cas.vrai_retour_impossible,
  ];
  const a = ANCIEN.resumer(jeu), n = F.resumer(jeu);
  const pa = ANCIEN.statsParRegistre(jeu), pn = F.statsParRegistre(jeu);
  const regsIdentiques = Object.keys(pa).every((k) => pa[k].reussis === pn[k].reussis && pa[k].reussi === pn[k].reussi && pa[k].problemes === pn[k].problemes && pa[k].chrf_retour_moyen === pn[k].chrf_retour_moyen);
  const ok = a.sans_probleme === n.sans_probleme && a.taux === n.taux && a.graves === n.graves && a.sens === n.sens && a.contexte === n.contexte &&
    n.non_verifie === a.non_verifie - probleme(n) && regsIdentiques && n.sans_probleme === jeu.filter(F.estSansProbleme).length;
  return { ok, detail: "avant " + JSON.stringify(a) + " · après " + JSON.stringify(n) };
});

const n = resultats.filter(Boolean).length;
console.log("\n" + n + " / " + resultats.length + " tests d'acceptation LOT 1 réussis");
process.exit(n === resultats.length ? 0 : 1);

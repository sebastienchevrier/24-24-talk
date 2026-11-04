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
    { registre: "r1", erreur: "fetch failed (erreur d'appel)" },          // erreur d'appel dans un registre déjà mesuré
    { registre: "r5", erreur: "IA 500 (erreur du moteur)" },               // registre où tout a échoué à l'appel
  ];
  const a = ANCIEN.resumer(jeu), n = F.resumer(jeu);
  const pa = ANCIEN.statsParRegistre(jeu), pn = F.statsParRegistre(jeu);
  // F-34 : l'ancienne version (18db14e) comptait les erreurs d'appel dans statsParRegistre ; on compare donc
  // les réussites registre par registre sur les registres mesurés, et on vérifie que r5 (que des erreurs) n'existe plus.
  const regsIdentiques = !pn.r5 && Object.keys(pn).every((k) => pa[k].reussis === pn[k].reussis && pa[k].problemes === pn[k].problemes && pa[k].chrf_retour_moyen === pn[k].chrf_retour_moyen);
  const ok = a.sans_probleme === n.sans_probleme && a.taux === n.taux && a.graves === n.graves && a.sens === n.sens && a.contexte === n.contexte &&
    n.non_verifie === a.non_verifie - probleme(n) && regsIdentiques && n.sans_probleme === jeu.filter(F.estSansProbleme).length;
  return { ok, detail: "avant " + JSON.stringify(a) + " · après " + JSON.stringify(n) };
});

// ---- F-34 : statsParRegistre ignore exactement ce que resumer ignore.
const ligne = (registre, e) => Object.assign({ registre, traduction: "x" }, e);
const f34 = {
  reseau: { registre: "reseau", erreur: "fetch failed" },
  moteur: { registre: "moteur", erreur: "IA 500" },
  absente: null,
  sansControles: { registre: "sansControles", traduction: "x", chrf_retour: 70 },
  avecErreur: ligne("avecErreur", { controles: [C(true), C(false, "nombre 3")], chrf_retour: 70 }),
  incomplete: ligne("incomplete", { controles: [C(true), C(null)], chrf_retour: 70 }),
  reussie: ligne("reussie", { controles: [C(true)], chrf_retour: 70 }),
};
test("16. F-34 erreur réseau : ni resumer ni statsParRegistre ne la comptent", () => {
  const r = F.resumer([f34.reseau]), p = F.statsParRegistre([f34.reseau]);
  return { ok: r.phrases === 0 && Object.keys(p).length === 0, detail: "resumer " + r.phrases + " · registres " + Object.keys(p).length };
});
test("17. F-34 erreur du moteur (IA) : non comptée, côté IA aussi", () => {
  const l = ligne("m", { controles: [C(true)], chrf_retour: 70, ia: { erreur: "IA 500" } });
  const r = F.resumer([l.ia]), p = F.statsParRegistre([l], (x) => x.ia), pm = F.statsParRegistre([l]);
  return { ok: r.phrases === 0 && Object.keys(p).length === 0 && pm.m.phrases === 1 && pm.m.reussis === 1, detail: "IA : " + Object.keys(p).length + " registre · MyMemory : " + JSON.stringify(pm.m) };
});
test("18. F-34 évaluation absente (null, ou l.ia manquant) : non comptée", () => {
  const sansIA = ligne("s", { controles: [C(true)], chrf_retour: 70 });
  const r = F.resumer([null, undefined]), p = F.statsParRegistre([null, sansIA], (x) => x && x.ia);
  return { ok: r.phrases === 0 && Object.keys(p).length === 0, detail: "resumer " + r.phrases + " · registres " + Object.keys(p).length };
});
test("19. F-34 tableau de contrôles absent : non compté", () => {
  const r = F.resumer([f34.sansControles]), p = F.statsParRegistre([f34.sansControles]);
  return { ok: r.phrases === 0 && Object.keys(p).length === 0, detail: "resumer " + r.phrases + " · registres " + Object.keys(p).length };
});
test("20. F-34 phrase avec erreur détectée : 1 problème, 0 non vérifié, des deux côtés", () => {
  const r = F.resumer([f34.avecErreur]), p = F.statsParRegistre([f34.avecErreur]).avecErreur;
  return { ok: r.phrases === 1 && r.graves === 1 && r.non_verifie === 0 && p.phrases === 1 && p.phrases_avec_erreur === 1 && p.non_verifies === 0 && p.reussis === 0, detail: JSON.stringify(p) };
});
test("21. F-34 phrase sans erreur mais incomplètement vérifiée : 0 problème, 1 non vérifié, des deux côtés", () => {
  const r = F.resumer([f34.incomplete]), p = F.statsParRegistre([f34.incomplete]).incomplete;
  return { ok: r.phrases === 1 && r.graves + r.sens + r.contexte === 0 && r.non_verifie === 1 && p.phrases === 1 && p.phrases_avec_erreur === 0 && p.non_verifies === 1 && p.reussis === 0, detail: JSON.stringify(p) };
});
test("22. F-34 totaux identiques entre resumer() et statsParRegistre() sur un jeu mêlé (erreurs, absentes, sans contrôles…)", () => {
  const jeu = Object.values(f34).concat([ligne("avecErreur", { controles: [C(false, "attendu /usted/")], chrf_retour: null }), ligne("reussie", { controles: [C(true)], chrf_retour: null })]);
  const r = F.resumer(jeu), t = Object.values(F.statsParRegistre(jeu));
  const S = (k) => t.reduce((s, v) => s + v[k], 0);
  const ok = S("phrases") === r.phrases && S("reussis") === r.sans_probleme && S("non_verifies") === r.non_verifie && S("phrases_avec_erreur") === r.graves + r.sens + r.contexte && r.phrases === 5;
  return { ok, detail: `resumer ${r.phrases} phrases / ${r.sans_probleme} sans problème / ${r.non_verifie} non vérifiées / ${r.graves + r.sens + r.contexte} avec erreur · registres ${S("phrases")} / ${S("reussis")} / ${S("non_verifies")} / ${S("phrases_avec_erreur")}` };
});

const n = resultats.filter(Boolean).length;
console.log("\n" + n + " / " + resultats.length + " tests d'acceptation LOT 1 réussis");
process.exit(n === resultats.length ? 0 : 1);

/* 24/24 ONE WORLD — AI LAB : tests du LOT A (statut chiffré de chaque langue + rapport-112 hors ligne).
   © 2026 Sébastien Chevrier. Tous droits réservés.
   Lancer : node labo/tests/lotA-statut.test.js
   Hors ligne : bilans fabriqués, aucun appel réseau. rapport-112.js est lancé sur un dossier temporaire. */
"use strict";
const path = require("path"), fs = require("fs"), os = require("os"), cp = require("child_process");
const F = require(path.join(__dirname, "..", "moteur", "fiabilite.js"));
const resultats = [];
function test(nom, fn) {
  let ok = false, detail = "";
  try { const r = fn(); ok = r.ok; detail = r.detail || ""; } catch (e) { detail = "exception : " + e.message; }
  resultats.push(ok);
  console.log((ok ? "OK   " : "ÉCHEC") + "  " + nom + (detail ? "  — " + detail : ""));
}
// Bilan au NOUVEAU format (après LOT 1 / F-30), 13 phrases.
const neuf = (code, o) => Object.assign({
  code, nom: code, disponible: true, phrases: 13, traduites: 13, erreurs: [], tests_reussis: 12, problemes: 0, mauvaise_ecriture: 0,
  chrf_retour_moyen: 55, verifications_impossibles: 0, phrases_avec_erreur: 0, phrases_non_verifiees: 1, a_relire_humain: 0, indices_mot_a_mot: 0,
  latence_ms_mediane: 200, latences_ms: [100, 200, 300], fiabilite: { mymemory: { phrases: 13, sans_probleme: 12, taux: 92, graves: 0, sens: 0, contexte: 0, non_verifie: 1 } },
  par_registre: { familier: { phrases: 1, reussis: 1, problemes: 0, non_verifies: 0, phrases_avec_erreur: 0, reussi: true, chrf_retour_moyen: 55 } },
}, o || {});
const fiab = (taux, graves) => ({ mymemory: { phrases: 13, sans_probleme: Math.round(taux * 13 / 100), taux, graves, sens: 0, contexte: 0, non_verifie: 0 } });

test("1. Aucun bilan : « non mesurée »", () => { const s = F.statutLangue(undefined); return { ok: s.statut === "non mesurée", detail: s.raisons[0] }; });
test("2. Langue refusée par MyMemory : « non prise en charge »", () => {
  const s = F.statutLangue({ disponible: false, erreurs: ["LANGUE NON PRISE EN CHARGE"] }); return { ok: s.statut === "non prise en charge", detail: s.statut };
});
test("3. Aucune phrase traduite (quota, vide) : « mesure en échec »", () => {
  const s = F.statutLangue({ disponible: false, erreurs: ["QUOTA"] }); return { ok: s.statut === "mesure en échec" && s.raisons[0] === "QUOTA", detail: s.raisons.join(" ; ") };
});
test("4. Moins de 80 % des phrases traduites : « mesure incomplète », jamais jugée bonne", () => {
  const s = F.statutLangue(neuf("eu", { traduites: 4, erreurs: ["VIDE"] })); return { ok: s.statut === "mesure incomplète", detail: s.raisons.join(" ; ") };
});
test("5. Mauvaise écriture > 15 % : « défaillante » (détection / langue)", () => {
  const s = F.statutLangue(neuf("uz", { mauvaise_ecriture: 3 })); return { ok: s.statut === "défaillante" && /mauvaise écriture/.test(s.raisons.join()), detail: s.raisons.join(" ; ") };
});
test("6. 2 erreurs graves : « défaillante » même avec un bon taux", () => {
  const s = F.statutLangue(neuf("sw", { fiabilite: fiab(92, 2) })); return { ok: s.statut === "défaillante" && /grave/.test(s.raisons.join()), detail: s.raisons.join(" ; ") };
});
test("7. Moins de 50 % sans problème : « défaillante »", () => {
  const s = F.statutLangue(neuf("sr", { fiabilite: fiab(23, 0) })); return { ok: s.statut === "défaillante", detail: s.raisons.join(" ; ") };
});
test("8. Plus de 20 % de retraductions impossibles : « non vérifiable », jamais « prometteuse »", () => {
  const s = F.statutLangue(neuf("om", { verifications_impossibles: 4 })); return { ok: s.statut === "non vérifiable", detail: s.raisons.join(" ; ") };
});
test("9. ≥ 90 %, 0 grave, chrF ≥ 40, nouveau format : « prometteuse » avec relecture native exigée", () => {
  const s = F.statutLangue(neuf("es")); return { ok: s.statut === "prometteuse" && /relecture native/.test(s.raisons[0]), detail: s.raisons[0] };
});
test("10. Mêmes chiffres mais mesure à l'ancienne règle : « à surveiller » et « à remesurer », jamais « prometteuse »", () => {
  const b = neuf("es"); delete b.fiabilite; delete b.verifications_impossibles;
  const s = F.statutLangue(b); return { ok: s.statut === "à surveiller" && s.ancienne && /remesurer/.test(s.raisons[0]), detail: s.raisons.join(" ; ") };
});
test("11. chrF retour faible (< 40) : « à surveiller », pas « prometteuse »", () => {
  const s = F.statutLangue(neuf("gn", { chrf_retour_moyen: 28 })); return { ok: s.statut === "à surveiller", detail: s.raisons.join(" ; ") };
});
test("12. Aucun statut « validée » possible, quelles que soient les entrées", () => {
  const essais = [undefined, neuf("a"), neuf("b", { fiabilite: fiab(100, 0), chrf_retour_moyen: 99 }), { disponible: false }, neuf("c", { traduites: 0 })];
  const st = essais.map((b) => F.statutLangue(b).statut);
  return { ok: st.every((x) => !/valid/i.test(x)), detail: st.join(", ") };
});

// rapport-112.js complet sur un dossier temporaire : mélange nouveau format / ancien format / langue absente.
function rapport(bilans) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "lotA-"));
  bilans.forEach((b) => fs.writeFileSync(path.join(d, "112-" + b.code + ".json"), JSON.stringify({ bilan: b })));
  const r = cp.spawnSync(process.execPath, [path.join(__dirname, "rapport-112.js"), d], { encoding: "utf8" });
  const out = { code: r.status, total: JSON.parse(fs.readFileSync(path.join(d, "dernier-112.json"), "utf8")), md: fs.readFileSync(path.join(d, "rapport-112.md"), "utf8") };
  fs.rmSync(d, { recursive: true, force: true });
  return out;
}
test("13. rapport-112 : vraie médiane globale (F-33) quand toutes les langues ont leurs latences brutes", () => {
  const r = rapport([neuf("es", { latences_ms: [100, 200, 900] }), neuf("de", { latences_ms: [300] })]);
  return { ok: r.code === 0 && r.total.latence_ms_mediane === 250 && /Latence médiane \| 250 ms/.test(r.md), detail: "médiane de [100, 200, 900, 300] = " + r.total.latence_ms_mediane };
});
test("14. rapport-112 : la médiane n'est pas la moyenne des médianes", () => {
  // médianes par langue : 100 et 1000 → moyenne 550 ; vraie médiane de [90,100,110,1000] = 105
  const r = rapport([neuf("es", { latences_ms: [90, 100, 110], latence_ms_mediane: 100 }), neuf("de", { latences_ms: [1000], latence_ms_mediane: 1000 })]);
  return { ok: r.total.latence_ms_mediane === 105, detail: "vraie médiane " + r.total.latence_ms_mediane + " (moyenne des médianes : 550)" };
});
test("15. rapport-112 : une langue à l'ancien format → latence « indisponible », statut « à remesurer »", () => {
  const vieux = neuf("de"); delete vieux.latences_ms; delete vieux.fiabilite; delete vieux.verifications_impossibles;
  const r = rapport([neuf("es"), vieux]);
  return { ok: r.total.latence_ms_mediane === null && /Latence médiane \| indisponible/.test(r.md) && r.total.statuts.de.ancienne === true && r.total.verifications_impossibles === null, detail: "latence " + r.total.latence_ms_mediane + " · de : " + r.total.statuts.de.statut };
});
test("16. rapport-112 : chaque langue cible a un statut ; les langues sans fichier sont « non mesurée »", () => {
  const r = rapport([neuf("es")]);
  const L = require(path.join(__dirname, "..", "donnees", "langues-112.js")).langues.filter((l) => l.code !== "fr");
  const nm = Object.values(r.total.statuts).filter((x) => x.statut === "non mesurée").length;
  return { ok: Object.keys(r.total.statuts).length === L.length && nm === L.length - 1 && r.total.statuts.es.statut === "prometteuse" && /\| non mesurée \| 110 :/.test(r.md), detail: L.length + " langues cibles · non mesurées " + nm };
});
test("17. rapport-112 : nouveau format par registre lu (phrases, reussis) et comptes séparés F-30 additionnés", () => {
  const r = rapport([neuf("es", { verifications_impossibles: 2, phrases_avec_erreur: 1 }), neuf("de", { verifications_impossibles: 1, phrases_avec_erreur: 3 })]);
  const reg = r.total.par_registre.familier;
  return { ok: reg.langues === 2 && reg.phrases === 2 && reg.phrases_reussies === 2 && r.total.verifications_impossibles === 3 && r.total.phrases_avec_erreur === 4, detail: JSON.stringify(reg) };
});

const n = resultats.filter(Boolean).length;
console.log("\n" + n + " / " + resultats.length + " tests du LOT A réussis");
process.exit(n === resultats.length ? 0 : 1);

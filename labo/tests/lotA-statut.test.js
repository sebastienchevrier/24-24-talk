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
test("7. Beaucoup d'erreurs détectées (9 / 13, 23 % sans problème) : « défaillante »", () => {
  const s = F.statutLangue(neuf("sr", { fiabilite: fiab(23, 0), phrases_avec_erreur: 9, phrases_non_verifiees: 1 })); return { ok: s.statut === "défaillante", detail: s.raisons.join(" ; ") };
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

// L-01 (mesure réelle du 4 nov. : uk, ru classées « défaillantes » avec 1 seule erreur et 6 phrases non vérifiables).
test("18. L-01 peu d'erreurs mais beaucoup de non vérifiées : « non vérifiable », pas « défaillante »", () => {
  const s = F.statutLangue(neuf("uk", { tests_reussis: 6, phrases_avec_erreur: 1, phrases_non_verifiees: 6, fiabilite: fiab(46, 0) }));
  return { ok: s.statut === "non vérifiable" && /relecture native/.test(s.raisons.join()), detail: s.raisons.join(" ; ") };
});
test("19. L-01 40 % ou plus de phrases avec erreur détectée : « défaillante »", () => {
  const s = F.statutLangue(neuf("sr", { tests_reussis: 2, phrases_avec_erreur: 10, phrases_non_verifiees: 1, fiabilite: fiab(15, 0) }));
  return { ok: s.statut === "défaillante" && /10 \/ 13 phrases avec erreur/.test(s.raisons.join()), detail: s.raisons.join(" ; ") };
});
test("20. L-01 ancien format sans comptes séparés : règle « < 50 % » conservée", () => {
  const b = neuf("x", { tests_reussis: 3 }); delete b.fiabilite; delete b.verifications_impossibles; delete b.phrases_avec_erreur; delete b.phrases_non_verifiees;
  const s = F.statutLangue(b); return { ok: s.statut === "défaillante" && /23 % sans problème/.test(s.raisons.join()), detail: s.raisons.join(" ; ") };
});

// L-02 : faux « ajout suspect » sur le serbe écrit en latin (traductions réelles de MyMemory, 4 nov. 2026).
const S = require(path.join(__dirname, "..", "moteur", "socle.js")), D = require(path.join(__dirname, "..", "donnees", "expressions-fr.js"));
const ajout = (src, trad, code) => S.controler(src, trad, S.comprendre(src, "fr", D), code, D).resultats.filter((x) => x.controle === "ajout suspect");
test("21. L-02 serbe en latin (réponse réelle) : plus de faux « ajout suspect »", () => {
  const cas = [["Je t'appelle ce soir après le travail.", "Zvaću te večeras posle posla."], ["Je vous saurais gré de bien vouloir me répondre avant vendredi.", "Bio bih Vam zahvalan ako biste mogli da mi odgovorite pre petka."], ["Je ne viendrai jamais à cette fête.", "Nikada neću doći na ovu žurku."]];
  const faux = cas.filter(([s, t]) => ajout(s, t, "sr").length);
  return { ok: faux.length === 0, detail: faux.length + " faux positif(s) sur " + cas.length };
});
test("22. L-02 la détection de pollution reste active dans une réponse non latine (arabe + « Underwood »)", () => {
  const a = ajout("Je t'appelle ce soir.", "سأتصل بك الليلة Underwood", "ar"), sr = ajout("Je t'appelle ce soir.", "Позваћу те вечерас Underwood", "sr");
  return { ok: a.length === 1 && sr.length === 1, detail: (a[0] || {}).detail + " · serbe cyrillique : " + sr.length };
});

// L-03 : heure sur 12 h ; L-04 : négation dans plus de langues (confirme seulement, n'accuse jamais).
const BR = require(path.join(__dirname, "batterie-registres.js"));
const casNb = BR.cas.find((x) => x.registre === "nombres et noms"), casNeg = BR.cas.find((x) => x.registre === "négation"), casFormel = BR.cas.find((x) => x.registre === "formel");
const nb = (src, t, code) => S.controler(src, t, S.comprendre(src, "fr", D), code, D).resultats.filter((x) => /^nombre/.test(x.controle));
test("23. L-03 pachto réel « 2.30 … après-midi » pour 14 h 30 : à relire (null), plus une erreur grave", () => {
  const r = nb(casNb.t, "ماري د مارچ په 12 د ماسپښین په 2.30 بجې کریم ته 250 یورو ولیږل.", "ps"), h = r.find((x) => x.controle === "nombre 14");
  return { ok: h && h.ok === null && r.every((x) => x.ok !== false), detail: r.map((x) => x.controle + ":" + x.ok).join(" ") };
});
test("24. L-03 une vraie erreur de nombre reste une erreur (pachto réel : facture 2026-118 rendue 1218-2026)", () => {
  const r = nb(casFormel.t, "اغلې، مهرباني وکړئ ضمیمه رسید شمیره 1218-2026 د € 1,250 په مقدار کې ومومئ.", "ps");
  return { ok: r.find((x) => x.controle === "nombre 118").ok === false, detail: r.map((x) => x.controle + ":" + x.ok).join(" ") };
});
test("25. L-04 négation confirmée dans de nouvelles langues (de, ru, sr latin, ja, tr)", () => {
  const t = { de: "Ich werde nie zu dieser Party kommen.", ru: "Я никогда не приду на эту вечеринку.", sr: "Nikada neću doći na ovu žurku.", ja: "このパーティーには絶対に行きません。", tr: "Bu partiye asla gelmeyeceğim." };
  const r = Object.entries(t).map(([k, v]) => [k, S.verifierSens(casNeg.t, v, k, casNeg).resultats.find((x) => x.controle === "négation gardée").ok]);
  return { ok: r.every(([, o]) => o === true), detail: r.map((x) => x.join(":")).join(" ") };
});
test("26. L-04 liste étendue sans marque trouvée : « à relire » (null), jamais une erreur", () => {
  const r = S.verifierSens(casNeg.t, "Verrò a questa festa.", "it", casNeg).resultats.find((x) => x.controle === "négation gardée");
  const en = S.verifierSens(casNeg.t, "I will come to this party.", "en", casNeg).resultats.find((x) => x.controle === "négation gardée");
  return { ok: r.ok === null && en.ok === false, detail: "it : " + r.ok + " · en (liste d'origine) : " + en.ok };
});

// L-06 : chiffres locaux ; L-07 : longueur du chinois traditionnel (traductions réelles de MyMemory, 4 nov. 2026).
const nbl = (c, t, code) => S.controler(c.t, t, S.comprendre(c.t, "fr", D), code, D).resultats.filter((x) => /^nombre|^longueur/.test(x.controle));
test("27. L-06 chiffres népalais, birmans et khmers reconnus (plus de fausses erreurs graves)", () => {
  const r = [["ne", casFormel, "महोदया, कृपया १,२५० यूरोको रकममा संलग्न इनभ्वाइस नम्बर २०२६ - ११८ फेला पार्नुहोस्।"],
    ["my", casNb, "မာရီသည္ မတ္လ ၁၂ ရက္ေန႔ ေန႔လယ္ ၂း၃၀ နာရီတြင္ ကာမီအား ယူ႐ိုသန္း ၂၅၀ လႊဲေပးခဲ့သည္။"],
    ["km", casFormel, "សូមស្វែងរកវិក្កយបត្រភ្ជាប់លេខ ២០២៦-១១៨ ក្នុងចំនួនទឹកប្រាក់ ១២៥០ អឺរ៉ូ។"]].map(([k, c, t]) => [k, nbl(c, t, k).filter((x) => x.ok === false).length]);
  return { ok: r.every(([, n]) => n === 0), detail: r.map((x) => x.join(" : ") + " erreur(s)").join(" · ") };
});
test("28. L-06 une vraie erreur reste détectée (malgache réel : la facture devient « 26128 »)", () => {
  const r = nbl(casFormel, "Ny INSEE dia mampiasa ny kaodim-paositra 26128.", "mg").filter((x) => x.ok === false).map((x) => x.controle);
  return { ok: r.includes("nombre 2026") && r.includes("nombre 118") && r.includes("nombre 1250"), detail: r.join(", ") };
});
test("29. L-07 chinois traditionnel court mais complet : plus d'« OMISSION probable »", () => {
  const casReg = BR.cas.find((x) => x.registre === "régional"), casEmo = BR.cas.find((x) => x.registre === "émotionnel");
  const r = [[casReg, "派對上有七十人。"], [casEmo, "很高興再次見到你，我很想念你！"]].map(([c, t]) => nbl(c, t, "zh-TW").find((x) => x.controle === "longueur"));
  return { ok: r.every((x) => x && x.ok === true), detail: r.map((x) => x && x.detail).join(" · ") };
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

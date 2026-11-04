/* 24/24 ONE WORLD — Labo linguistique : rapport automatique des 112 langues (après le banc réel).
   © 2026 Sébastien Chevrier. Tous droits réservés.
   Lancer : node labo/tests/rapport-112.js <dossier des résultats 112-*.json> [<ancien dernier-112.json>]
   Écrit dans le dossier : dernier-112.json (agrégat) et rapport-112.md (tableau lisible, aussi affiché dans GitHub).
   Compare avec le passage précédent si on le lui donne (progrès ou recul par langue). */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("../donnees/langues-112.js"), B = require("./batterie-registres.js");
const F = require("../moteur/fiabilite.js");
const dir = process.argv[2] || path.join(__dirname, "resultats");
const ancien = process.argv[3] && fs.existsSync(process.argv[3]) ? JSON.parse(fs.readFileSync(process.argv[3], "utf8")) : null;
const fichiers = [];
(function walk(d) { if (!fs.existsSync(d)) return; fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/^112-.+\.json$/.test(e.name)) fichiers.push(p); }); })(dir);
const bilans = {};
fichiers.forEach((f) => { try { const j = JSON.parse(fs.readFileSync(f, "utf8")); bilans[j.bilan.code] = j.bilan; } catch (e) { /* fichier abîmé : ignoré */ } });
const langues = L.langues.filter((l) => l.code !== "fr");
const testees = langues.filter((l) => bilans[l.code] && bilans[l.code].disponible);
const reg = {};
B.registres.concat(["négation", "nombres et noms"]).forEach((r) => { reg[r] = { langues: 0, reussis: 0, chrf: [], phrases: 0, phrases_reussies: 0 }; });
// LOT 1 : nouveau format par registre { phrases, reussis, chrf_retour_moyen, reussi } ; ancien format { reussi, chrf_retour } encore lu.
testees.forEach((l) => Object.entries(bilans[l.code].par_registre || {}).forEach(([r, v]) => {
  if (!reg[r]) return;
  reg[r].langues++;
  if (v.reussi) reg[r].reussis++;
  const c = v.chrf_retour_moyen !== undefined ? v.chrf_retour_moyen : v.chrf_retour;
  if (typeof c === "number" && Number.isFinite(c)) reg[r].chrf.push(c);
  if (typeof v.phrases === "number") { reg[r].phrases += v.phrases; reg[r].phrases_reussies += v.reussis || 0; }
}));
// Vraie médiane des latences : calculée sur toutes les latences brutes, jamais en moyennant des médianes.
const toutesLatences = [];
let latencesCompletes = testees.length > 0;
testees.forEach((l) => { const a = bilans[l.code].latences_ms; if (Array.isArray(a)) toutesLatences.push(...a); else latencesCompletes = false; });
const moy = (a) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length * 10) / 10 : null);
const somme = (k) => (testees.length && testees.every((l) => typeof bilans[l.code][k] === "number") ? testees.reduce((s, l) => s + bilans[l.code][k], 0) : null);
const total = {
  date: new Date().toISOString(), moteur: "MyMemory", langues_officielles: 112, langues_cibles: langues.length,
  langues_testees: testees.length, langues_non_disponibles: langues.filter((l) => bilans[l.code] && !bilans[l.code].disponible).map((l) => l.code),
  langues_sans_resultat: langues.filter((l) => !bilans[l.code]).map((l) => l.code), langues_validees: L.valides.length,
  tests_executes: testees.reduce((s, l) => s + bilans[l.code].traduites, 0), tests_reussis: testees.reduce((s, l) => s + bilans[l.code].tests_reussis, 0),
  problemes: testees.reduce((s, l) => s + bilans[l.code].problemes, 0), mauvaise_ecriture: testees.reduce((s, l) => s + bilans[l.code].mauvaise_ecriture, 0),
  indices_mot_a_mot: testees.reduce((s, l) => s + bilans[l.code].indices_mot_a_mot, 0), a_relire_humain: testees.reduce((s, l) => s + bilans[l.code].a_relire_humain, 0),
  // F-30 : comptes séparés (null = tranche ancienne sans ce champ, affiché « — »).
  phrases_avec_erreur: somme("phrases_avec_erreur"), verifications_impossibles: somme("verifications_impossibles"), phrases_non_verifiees: somme("phrases_non_verifiees"),
  chrf_retour_moyen: moy(testees.map((l) => bilans[l.code].chrf_retour_moyen).filter((x) => x != null)),
  // null si une tranche ancienne n'a pas ses latences brutes : affiché « indisponible ».
  latence_ms_mediane: latencesCompletes ? F.mediane(toutesLatences) : null, cout_eur: 0,
  par_registre: Object.fromEntries(Object.entries(reg).map(([r, v]) => [r, { langues: v.langues, reussis: v.reussis, taux: v.langues ? Math.round(v.reussis / v.langues * 100) : null, phrases: v.phrases, phrases_reussies: v.phrases_reussies, chrf_retour_moyen: moy(v.chrf) }])),
  par_langue: bilans,
};
let md = "# Labo ONE WORLD — 112 langues, batterie des registres (" + total.date.slice(0, 16).replace("T", " ") + " UTC)\n\n";
md += "Moteur : **MyMemory** (gratuit). Statut de chaque langue : **testé par contrôles automatiques, PAS validé** (aucune langue validée par un natif : " + total.langues_validees + ").\n\n";
md += `| Indicateur | Valeur |\n|---|---|\n| Langues testées | ${total.langues_testees} / ${total.langues_cibles} |\n| Langues non disponibles chez MyMemory | ${total.langues_non_disponibles.length} ${total.langues_non_disponibles.join(" ")} |\n| Langues sans résultat (machine en échec) | ${total.langues_sans_resultat.length} ${total.langues_sans_resultat.join(" ")} |\n| Tests exécutés | ${total.tests_executes} |\n| Tests sans problème détecté | ${total.tests_reussis} |\n| Problèmes détectés | ${total.problemes} |\n| Phrases avec au moins une erreur | ${total.phrases_avec_erreur ?? "—"} |\n| Phrases non vérifiées (sans erreur mais vérification incomplète) | ${total.phrases_non_verifiees ?? "—"} |\n| Vérifications impossibles (retraduction…) | ${total.verifications_impossibles ?? "—"} |\n| Réponses dans la mauvaise écriture | ${total.mauvaise_ecriture} |\n| Indices de mot à mot (retour) | ${total.indices_mot_a_mot} |\n| Points à faire relire par un humain | ${total.a_relire_humain} |\n| Proximité moyenne au retour (chrF, 0-100) | ${total.chrf_retour_moyen} |\n| Latence médiane | ${total.latence_ms_mediane == null ? "indisponible" : total.latence_ms_mediane + " ms"} |\n| Coût | 0 € |\n\n`;
md += "## Par registre\n\n| Registre | Langues | Sans problème détecté | chrF retour |\n|---|---|---|---|\n";
Object.entries(total.par_registre).forEach(([r, v]) => { md += `| ${r} | ${v.langues} | ${v.reussis} (${v.taux ?? "—"} %) | ${v.chrf_retour_moyen ?? "—"} |\n`; });
md += "\n## Par langue (du plus faible au plus fort)\n\n| Code | Langue | Sans problème | Problèmes | Mauvaise écriture | chrF retour | Évolution |\n|---|---|---|---|---|---|---|\n";
testees.map((l) => bilans[l.code]).sort((a, b) => (a.chrf_retour_moyen ?? 0) - (b.chrf_retour_moyen ?? 0)).forEach((b) => {
  const a = ancien && ancien.par_langue && ancien.par_langue[b.code];
  const evo = a && a.chrf_retour_moyen != null && b.chrf_retour_moyen != null ? (b.chrf_retour_moyen - a.chrf_retour_moyen >= 0 ? "+" : "") + (Math.round((b.chrf_retour_moyen - a.chrf_retour_moyen) * 10) / 10) : "—";
  md += `| ${b.code} | ${b.nom} | ${b.tests_reussis}/${b.traduites} | ${b.problemes} | ${b.mauvaise_ecriture} | ${b.chrf_retour_moyen ?? "—"} | ${evo} |\n`;
});
const avecIA = testees.filter((l) => bilans[l.code].ia && bilans[l.code].ia.traduites);
if (avecIA.length) {
  const somme = (f) => avecIA.reduce((s, l) => s + (f(bilans[l.code].ia.comparaison_memes_phrases) || 0), 0);
  total.comparaison_ia = { langues: avecIA.length, modele: bilans[avecIA[0].code].ia.modele, phrases: somme((c) => c.phrases), mymemory_sans_probleme: somme((c) => c.mymemory_sans_probleme), ia_sans_probleme: somme((c) => c.ia_sans_probleme) };
  md += "\n## MyMemory contre IA (" + total.comparaison_ia.modele + "), mêmes phrases, même protocole\n\n| Langue | Phrases | MyMemory sans problème | IA sans problème | chrF retour MyMemory | chrF retour IA | Latence IA | Coût si payant / trad. |\n|---|---|---|---|---|---|---|---|\n";
  avecIA.forEach((l) => { const i = bilans[l.code].ia, c = i.comparaison_memes_phrases; md += `| ${l.code} | ${c.phrases} | ${c.mymemory_sans_probleme} | ${c.ia_sans_probleme} | ${c.chrf_mymemory ?? "—"} | ${c.chrf_ia ?? "—"} | ${i.latence_ms_mediane ?? "—"} ms | ${i.cout_estime_si_payant_usd_par_traduction ?? "—"} $ |\n`; });
  md += `| **Total** | ${total.comparaison_ia.phrases} | ${total.comparaison_ia.mymemory_sans_probleme} | ${total.comparaison_ia.ia_sans_probleme} | | | | |\n\nAttention : une bonne retraduction ne prouve pas une bonne traduction (deux erreurs peuvent se compenser). Coût réel : 0 € (offre gratuite).\n`;
}
md += "\nLecture : « sans problème détecté » veut dire que les contrôles automatiques (écriture, nombres, noms, longueur, recopie, retour) n'ont rien trouvé. Ce n'est PAS une preuve de bonne traduction. Les idiomes, l'humour et les métaphores demandent toujours une relecture humaine.\n";
fs.writeFileSync(path.join(dir, "dernier-112.json"), JSON.stringify(total, null, 1));
fs.writeFileSync(path.join(dir, "rapport-112.md"), md);
console.log(md);

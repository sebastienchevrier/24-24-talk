/* 24/24 ONE WORLD — AI LAB : tableau de fiabilité par langue (phase 5).
   © 2026 Sébastien Chevrier. Tous droits réservés.

   Usage : node labo/tests/tableau-fiabilite.js <dossier des ia-*.json> > TABLEAU-FIABILITE.md
   Lit toutes les tranches mesurées (MyMemory + IA, mêmes phrases) et écrit, pour chaque langue et chaque moteur :
   taux sans problème détecté, erreurs graves / de sens / de contexte, non vérifié, latence, coût réel, décision.
   La tranche la plus récente d'un même couple (langue, modèle) remplace les plus anciennes.
   « Sans problème détecté » n'est PAS « correct » : seule une relecture native valide une langue. */
"use strict";
const fs = require("fs"), path = require("path");
const F = require(path.join(__dirname, "..", "moteur", "fiabilite.js"));

const dir = process.argv[2] || ".";
const fichiers = fs.readdirSync(dir).filter((f) => /^ia-.*\.json$/.test(f)).sort();
const taille = (m) => (/120b|70b/.test(m || "") ? "grande IA" : "petite IA");
const lignes = {}; // code -> { nom, mm, ia: { modele: {...} } }

for (const f of fichiers) {
  let d; try { d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch (e) { continue; }
  for (const [code, b] of Object.entries(d.par_langue || {})) {
    if (!b || !b.ia || !b.disponible) continue;
    const L = (lignes[code] = lignes[code] || { nom: b.nom, ia: {} });
    const modele = b.ia.modele || "?";
    let mm, ia, categories = true;
    if (b.fiabilite && b.fiabilite.ia) { mm = b.fiabilite.mymemory; ia = b.fiabilite.ia; }
    else {
      // Tranches d'avant la phase 5 : pas de types d'erreurs enregistrés, seulement le total sur les mêmes phrases.
      const c = b.ia.comparaison_memes_phrases || {};
      const t = (n) => (c.phrases ? Math.round((n / c.phrases) * 100) : null);
      mm = { phrases: c.phrases, sans_probleme: c.mymemory_sans_probleme, taux: t(c.mymemory_sans_probleme) };
      ia = { phrases: c.phrases, sans_probleme: c.ia_sans_probleme, taux: t(c.ia_sans_probleme) };
      categories = false;
    }
    mm.latence = b.latence_ms_mediane; ia.latence = b.ia.latence_ms_mediane;
    ia.si_payant = b.ia.cout_estime_si_payant_usd_par_traduction; ia.echecs_appel = b.ia.echecs || 0;
    L.mm = mm; L.ia[modele] = { ia, categories, date: b.date, tranche: f };
  }
}

const v = (x) => (x == null ? "—" : x);
const out = [];
out.push("# ONE WORLD AI LAB — Fiabilité par langue (phase 5)", "");
out.push("Généré le " + new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC à partir de " + fichiers.length + " tranche(s) mesurée(s). TEST seulement.", "");
out.push("**Attention : « sans problème détecté » n'est pas « correct ».** Les contrôles automatiques ne voient pas tout. Aucune langue n'est validée sans relecture native.", "");
out.push("Erreurs : **grave** = change un fait (nombre, heure, jour, nom, négation, mauvaise langue) ; **sens** = mot à mot, sens inventé ou perdu ; **contexte** = tu/vous, pronom. « — » = pas mesuré dans cette tranche (tranches d'avant la phase 5).", "");
out.push("Décision IA : **autorisée en test** si ≥ " + F.SEUILS.taux_autorise + " % sans problème détecté, 0 erreur grave et au moins aussi bien que MyMemory ; **exclue** si ≥ " + F.SEUILS.graves_max_exclusion + " erreurs graves, < " + F.SEUILS.taux_min + " %, ou " + F.SEUILS.ecart_exclusion + " points de moins que MyMemory ; sinon **à surveiller**. Coût réel : 0 € (offres gratuites).", "");
out.push("| Langue | Moteur | Phrases | Sans problème détecté | Graves | Sens | Contexte | Non vérifié | Latence | Coût réel (si payant) | Décision |");
out.push("|---|---|---|---|---|---|---|---|---|---|---|");
const compte = { "autorisée en test": 0, "à surveiller": 0, "exclue": 0 };
for (const code of Object.keys(lignes).sort()) {
  const L = lignes[code], mm = L.mm;
  out.push(`| ${L.nom} (${code}) | MyMemory | ${v(mm.phrases)} | ${v(mm.taux)} % | ${v(mm.graves)} | ${v(mm.sens)} | ${v(mm.contexte)} | ${v(mm.non_verifie)} | ${v(mm.latence)} ms | 0 € | référence |`);
  for (const [modele, x] of Object.entries(L.ia)) {
    const ia = x.ia;
    let d = F.decider(ia.graves == null ? Object.assign({}, ia, { graves: 0 }) : ia, mm);
    if (!x.categories) d = d.decision === "autorisée en test" ? { decision: "à surveiller", pourquoi: ia.taux + " % mais erreurs graves pas encore classées : remesurer" }
      : { decision: d.decision, pourquoi: d.pourquoi.replace(/, 0 grave\(s\)/, ", graves non classées") };
    compte[d.decision]++;
    const cout = "0 € (" + (ia.si_payant != null ? ia.si_payant + " $" : "—") + ")";
    out.push(`| ${L.nom} (${code}) | ${taille(modele)} ${modele.replace("openai/", "")} | ${v(ia.phrases)} | ${v(ia.taux)} % | ${v(ia.graves)} | ${v(ia.sens)} | ${v(ia.contexte)} | ${v(ia.non_verifie)} | ${v(ia.latence)} ms | ${cout} | **${d.decision}** — ${d.pourquoi} |`);
  }
}
out.push("", `Bilan : ${compte["autorisée en test"]} autorisée(s) en test, ${compte["à surveiller"]} à surveiller, ${compte["exclue"]} exclue(s). Langues mesurées avec IA : ${Object.keys(lignes).length} / 111.`);
process.stdout.write(out.join("\n") + "\n");

/* 24/24 ONE WORLD — AI LAB : fiabilité par langue et choix du moteur (phase 5).
   © 2026 Sébastien Chevrier. Tous droits réservés.

   LABO SEULEMENT. Ce module ne touche ni la messagerie, ni l'envoi, ni la réception, ni la traduction de l'appli.
   Il sert à décider, langue par langue et à partir de MESURES, quand faire confiance à MyMemory,
   à la petite IA ou à la grande IA, et quand afficher « traduction incertaine ».

   Règles (Sébastien, 3 nov. 2026) :
   - une traduction qui passe les contrôles automatiques n'est PAS forcément correcte : on dit « sans problème détecté » ;
   - aucune langue n'est « validée » ici : la validation vient d'une relecture native ;
   - langue rare : aucune activation automatique sans résultats suffisamment solides (seuils ci-dessous). */
(function (racine) {
  "use strict";

  // Type d'erreur d'après le contrôle qui a échoué.
  // grave    : change un fait (nombre, heure, jour, mois, nom, négation, lien, texte vide/non traduit, mauvaise écriture)
  // sens     : mot à mot, sens inventé ou perdu, faux ami, ajout, question perdue
  // contexte : registre ou pronom attendu d'après la conversation (tu/vous, il/elle)
  function categorie(nomControle) {
    const c = String(nomControle || "");
    if (/^(nombre|heure|jour|mois|nom|négation|lien|traduction vide|non traduit|écriture)/.test(c)) return "grave";
    if (/^attendu/.test(c)) return "contexte";
    return "sens";
  }

  // Résumé d'un moteur sur une liste de phrases évaluées ({ controles, chrf_retour }).
  function resumer(evaluations) {
    const r = { phrases: 0, sans_probleme: 0, non_verifie: 0, graves: 0, sens: 0, contexte: 0 };
    for (const e of evaluations) {
      if (!e || e.erreur || !e.controles) continue;
      r.phrases++;
      const ko = e.controles.filter((x) => x.ok === false).map((x) => categorie(x.controle));
      if (ko.includes("grave")) r.graves++;
      else if (ko.includes("sens")) r.sens++;
      else if (ko.includes("contexte")) r.contexte++;
      if (e.chrf_retour == null) r.non_verifie++;
      else if (!ko.length) r.sans_probleme++;
    }
    r.taux = r.phrases ? Math.round((r.sans_probleme / r.phrases) * 100) : null;
    return r;
  }

  const SEUILS = { phrases_min: 10, taux_autorise: 90, ecart_exclusion: 10, taux_min: 50, graves_max_exclusion: 2 };

  // Décision pour un moteur IA dans une langue, comparé à MyMemory sur LES MÊMES phrases.
  function decider(ia, mm) {
    if (!ia || !ia.phrases) return { decision: "exclue", pourquoi: "aucune mesure" };
    if (ia.phrases < SEUILS.phrases_min) return { decision: "à surveiller", pourquoi: "trop peu de phrases mesurées (" + ia.phrases + ")" };
    const ecart = mm && mm.taux != null ? ia.taux - mm.taux : 0;
    if (ia.graves >= SEUILS.graves_max_exclusion) return { decision: "exclue", pourquoi: ia.graves + " erreurs graves" };
    if (ia.taux < SEUILS.taux_min) return { decision: "exclue", pourquoi: "moins de " + SEUILS.taux_min + " % sans problème détecté" };
    if (ecart <= -SEUILS.ecart_exclusion) return { decision: "exclue", pourquoi: "l'IA dégrade le résultat (" + ecart + " points face à MyMemory)" };
    if (ia.taux >= SEUILS.taux_autorise && ia.graves === 0 && ecart >= 0)
      return { decision: "autorisée en test", pourquoi: ia.taux + " % sans problème détecté, aucune erreur grave, au moins aussi bien que MyMemory" };
    return { decision: "à surveiller", pourquoi: ia.taux + " %, " + ia.graves + " grave(s), écart MyMemory " + (ecart >= 0 ? "+" : "") + ecart };
  }

  // Ordre des moteurs pour une langue, d'après les décisions mesurées.
  // decisions = { grande: "autorisée en test"|..., petite: ... }
  function ordreMoteurs(decisions) {
    const d = decisions || {};
    const ordre = [];
    if (d.grande === "autorisée en test") ordre.push("grande");
    if (d.petite === "autorisée en test") ordre.push("petite");
    ordre.push("mymemory");
    if (d.grande === "à surveiller") ordre.push("grande");
    if (d.petite === "à surveiller") ordre.push("petite");
    return ordre.filter((x, i, a) => a.indexOf(x) === i);
  }

  // Verdict sur UNE traduction après contrôles : sûre ou incertaine.
  // Incertaine si : erreur grave, sens douteux, contexte non respecté, ou retraduction impossible (non vérifiée).
  function verdictTraduction(evaluation) {
    if (!evaluation || evaluation.erreur) return { etat: "échec", raison: evaluation && evaluation.erreur };
    const ko = evaluation.controles.filter((x) => x.ok === false);
    if (ko.length) return { etat: "incertaine", raison: ko.map((x) => categorie(x.controle) + " : " + x.controle).join(" ; ") };
    if (evaluation.chrf_retour == null) return { etat: "incertaine", raison: "non vérifiée (retraduction impossible)" };
    return { etat: "sans problème détecté", raison: "" };
  }

  // Choix final : on essaie les moteurs dans l'ordre ; le premier « sans problème détecté » gagne.
  // Sinon on garde la meilleure tentative (le moins d'erreurs graves) ET on la marque « traduction incertaine ».
  async function choisir(ordre, traduireAvec, evaluer) {
    const essais = [];
    for (const m of ordre) {
      let ev;
      try { ev = await evaluer(await traduireAvec(m)); } catch (e) { ev = { erreur: e.message }; }
      const v = verdictTraduction(ev);
      essais.push({ moteur: m, evaluation: ev, verdict: v });
      if (v.etat === "sans problème détecté") return { moteur: m, evaluation: ev, incertaine: false, essais };
    }
    const poids = (e) => (e.evaluation.erreur ? 1e6 : e.evaluation.controles.filter((x) => x.ok === false).reduce((s, x) => s + (categorie(x.controle) === "grave" ? 100 : 1), 0));
    const ok = essais.filter((e) => !e.evaluation.erreur).sort((a, b) => poids(a) - poids(b));
    const meilleur = ok[0] || essais[0];
    return { moteur: meilleur && meilleur.moteur, evaluation: meilleur && meilleur.evaluation, incertaine: true, essais };
  }

  const API = { categorie, resumer, decider, ordreMoteurs, verdictTraduction, choisir, SEUILS };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else racine.OW_FIABILITE = API;
})(typeof window !== "undefined" ? window : globalThis);

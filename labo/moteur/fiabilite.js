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

  // LOT 1 (ChatGPT, 4 nov. 2026) : une phrase n'est « sans problème » que si TOUS ses contrôles valent true
  // et si sa retraduction a donné un chrF numérique. Contrôle null, absent ou retraduction manquante = non vérifié.
  function controlesTousValides(controles) {
    return Array.isArray(controles) &&
      controles.length > 0 &&
      controles.every((x) => x && x.ok === true);
  }

  function estSansProbleme(evaluation) {
    return !!evaluation &&
      !evaluation.erreur &&
      typeof evaluation.chrf_retour === "number" &&
      Number.isFinite(evaluation.chrf_retour) &&
      controlesTousValides(evaluation.controles);
  }

  // Résumé d'un moteur sur une liste de phrases évaluées ({ controles, chrf_retour }).
  function resumer(evaluations) {
    const r = {
      phrases: 0,
      sans_probleme: 0,
      non_verifie: 0,
      graves: 0,
      sens: 0,
      contexte: 0
    };

    for (const e of evaluations) {
      if (!e || e.erreur || !Array.isArray(e.controles)) continue;

      r.phrases++;

      const ko = e.controles
        .filter((x) => x && x.ok === false)
        .map((x) => categorie(x.controle));

      if (ko.includes("grave")) r.graves++;
      else if (ko.includes("sens")) r.sens++;
      else if (ko.includes("contexte")) r.contexte++;

      const controlesComplets =
        e.controles.length > 0 &&
        e.controles.every((x) => x && x.ok === true);

      const retourDisponible =
        typeof e.chrf_retour === "number" &&
        Number.isFinite(e.chrf_retour);

      if (!controlesComplets || !retourDisponible) {
        r.non_verifie++;
      } else {
        r.sans_probleme++;
      }
    }

    r.taux = r.phrases
      ? Math.round(r.sans_probleme / r.phrases * 100)
      : null;

    return r;
  }

  // Statistiques par registre SANS écraser : plusieurs phrases d'un même registre sont toutes comptées.
  // « prendre » donne l'évaluation à juger pour une ligne (la ligne elle-même pour MyMemory, l.ia pour l'IA).
  function statsParRegistre(lignes, prendre) {
    const parRegistre = {};

    for (const l of lignes) {
      const e = prendre ? prendre(l) : l;
      const r = l.registre;

      if (!parRegistre[r]) {
        parRegistre[r] = {
          phrases: 0,
          reussis: 0,
          problemes: 0,
          non_verifies: 0,
          chrf: [],
          reussi: true
        };
      }

      const v = parRegistre[r];
      const valide = estSansProbleme(e);

      v.phrases++;
      if (valide) v.reussis++;
      else v.reussi = false;

      v.problemes += ((e && e.controles) || []).filter(
        (x) => x && x.ok === false
      ).length;

      if (!valide) v.non_verifies++;

      if (e && typeof e.chrf_retour === "number" &&
          Number.isFinite(e.chrf_retour)) {
        v.chrf.push(e.chrf_retour);
      }
    }

    for (const v of Object.values(parRegistre)) {
      v.chrf_retour_moyen = v.chrf.length
        ? Math.round(
            v.chrf.reduce((a, b) => a + b, 0) /
            v.chrf.length * 10
          ) / 10
        : null;

      delete v.chrf;
    }

    return parRegistre;
  }

  // F-30 : retraduction vers le français + contrôle « retraduction », pour MyMemory ET l'IA (même code).
  // Si la retraduction échoue (réseau, quota, réponse vide…), on ajoute TOUJOURS un contrôle ok:null :
  // une vérification impossible n'est jamais une réussite.
  // retraduire(texte) -> Promise<string> ; mesurer(retour, source) -> chrF 0-100.
  const SEUIL_RETOUR = 15;
  const RETOUR_IMPOSSIBLE = "NON VÉRIFIÉ : retraduction impossible";
  async function verifierRetour(controles, traduction, source, retraduire, mesurer, pieges) {
    const o = {};
    try {
      o.retour = await retraduire(String(traduction).slice(0, 450));
      if (!o.retour) throw new Error("retraduction vide");
      const v = mesurer(o.retour, source);
      o.chrf_retour = typeof v === "number" && Number.isFinite(v) ? v : null;
    } catch (e) {
      o.retour_erreur = (e && e.message) || String(e);
      o.chrf_retour = null;
    }
    if (o.chrf_retour == null) {
      controles.push({ controle: "retraduction", ok: null, detail: RETOUR_IMPOSSIBLE + (o.retour_erreur ? " (" + o.retour_erreur + ")" : "") });
      return o;
    }
    const v = o.chrf_retour;
    controles.push({ controle: "retraduction", ok: v >= SEUIL_RETOUR, detail: v >= SEUIL_RETOUR ? "chrF " + v : "chrF " + v + " : RETOUR TRÈS ÉLOIGNÉ, sens probablement inventé ou perdu" });
    if (pieges) {
      const hit = pieges.filter((w) => o.retour.toLowerCase().includes(w));
      controles.push({ controle: "indice mot à mot (retour)", ok: hit.length ? null : true, detail: hit.length ? "l'image revient dans la retraduction (« " + hit.join(", ") + " ») : relecture" : "pas d'image littérale au retour" });
    }
    return o;
  }

  // F-30 : trois comptes séparés par phrase. Jamais mélangés.
  //   erreurs     : contrôles ok:false (problème détecté)
  //   impossibles : vérifications impossibles (retraduction impossible, contrôle sans résultat)
  //   a_relire    : points ok:null à faire relire par un humain (hors vérification impossible) + phrase complexe
  function classer(evaluation, complexe) {
    const c = (evaluation && Array.isArray(evaluation.controles)) ? evaluation.controles : [];
    const impossible = (x) => !x || x.ok === undefined || (x.ok === null && x.controle === "retraduction");
    const r = {
      erreurs: c.filter((x) => x && x.ok === false).length,
      impossibles: c.filter(impossible).length + (evaluation && evaluation.chrf_retour == null && !c.some((x) => x && x.controle === "retraduction") ? 1 : 0),
      a_relire: c.filter((x) => x && x.ok === null && !impossible(x)).length + (complexe ? 1 : 0),
    };
    r.verifiee = estSansProbleme(evaluation);
    return r;
  }

  // Vraie médiane d'observations individuelles (jamais une médiane de médianes).
  function mediane(valeurs) {
    const a = (valeurs || [])
      .filter((x) => typeof x === "number" && Number.isFinite(x))
      .sort((x, y) => x - y);

    if (!a.length) return null;

    const m = Math.floor(a.length / 2);

    return a.length % 2
      ? a[m]
      : Math.round((a[m - 1] + a[m]) / 2);
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
  // Incertaine si : contrôles absents, un contrôle en échec ou non vérifié (null/absent), ou retraduction impossible.
  function verdictTraduction(evaluation) {
    if (!evaluation || evaluation.erreur) {
      return {
        etat: "échec",
        raison: evaluation && evaluation.erreur
      };
    }

    if (!Array.isArray(evaluation.controles) ||
        evaluation.controles.length === 0) {
      return {
        etat: "incertaine",
        raison: "contrôles absents"
      };
    }

    const ko = evaluation.controles.filter(
      (x) => !x || x.ok === false
    );

    if (ko.length) {
      return {
        etat: "incertaine",
        raison: ko.map(
          (x) => categorie(x && x.controle) + " : " + (x && x.controle)
        ).join(" ; ")
      };
    }

    if (evaluation.controles.some((x) => !x || x.ok !== true)) {
      return {
        etat: "incertaine",
        raison: "au moins un contrôle non vérifié"
      };
    }

    if (typeof evaluation.chrf_retour !== "number" ||
        !Number.isFinite(evaluation.chrf_retour)) {
      return {
        etat: "incertaine",
        raison: "retraduction impossible ou non vérifiée"
      };
    }

    return {
      etat: "sans problème détecté",
      raison: ""
    };
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

  const API = { categorie, controlesTousValides, estSansProbleme, resumer, statsParRegistre, mediane, verifierRetour, classer, SEUIL_RETOUR, RETOUR_IMPOSSIBLE, decider, ordreMoteurs, verdictTraduction, choisir, SEUILS };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else racine.OW_FIABILITE = API;
})(typeof window !== "undefined" ? window : globalThis);

/* 24/24 ONE WORLD — Labo linguistique : banc RÉEL d'une langue parmi les 112 (batterie courte des registres).
   © 2026 Sébastien Chevrier. Tous droits réservés.
   Lancer : node labo/tests/banc-112.js <code langue>   (workflow « Labo — 112 langues », une langue par machine)
   Pour chaque phrase : MyMemory fr → langue, puis retraduction langue → fr. Contrôles automatiques :
   - écriture attendue (une réponse en alphabet latin pour le japonais = langue non traduite ou mauvaise langue) ;
   - nombres, noms, émojis, longueur, recopie du français (socle.controler) ;
   - retour vers le français : proximité chrF avec la phrase d'origine (0 à 100) et indices de mot à mot
     (« lapin », « corde », « canard » revenus dans la retraduction).
   Écrit labo/tests/resultats/112-<code>.json. N'est pas lancé par les tests automatiques (Internet, quota). */
"use strict";
const fs = require("fs"), path = require("path");
const S = require("../moteur/socle.js"), D = require("../donnees/expressions-fr.js");
const L = require("../donnees/langues-112.js"), B = require("./batterie-registres.js");
const code = process.argv[2];
const avecIA = process.argv.includes("--ia");
const argv = (k, d) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const modele = argv("--modele", null), ECART_IA = +argv("--ecart", "20000");
const IA_URL = "https://tbynnefrrxzxufcptijc.supabase.co/functions/v1/labo-traduire";
// Clé PUBLIQUE « anon » du projet Supabase de TEST (pas la clé Groq, qui reste secrète sur le serveur). Jamais la PROD.
const IA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieW5uZWZycnh6eHVmY3B0aWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNDQwMDksImV4cCI6MjEwNjYyMDAwOX0.ykVFdlV6Rly4iln4JiufKMKOnSyE4fkGYK59GAZ186Y";
const langue = L.langues.find((x) => x.code === code);
if (!langue) { console.error("Langue inconnue : " + code); process.exit(2); }
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const ECRITURES = {
  latin: /[A-Za-zÀ-ɏ]/, cyrillique: /[Ѐ-ӿ]/, arabe: /[؀-ۿݐ-ݿ]/, "hébreu": /[֐-׿]/, grec: /[Ͱ-Ͽ]/, "arménien": /[԰-֏]/,
  "géorgien": /[Ⴀ-ჿ]/, "éthiopien": /[ሀ-፿]/, han: /[一-鿿]/, japonais: /[぀-ヿ一-鿿]/, hangul: /[가-힯]/, "thaï": /[฀-๿]/,
  devanagari: /[ऀ-ॿ]/, bengali: /[ঀ-৿]/, tamoul: /[஀-௿]/, "télougou": /[ఀ-౿]/, malayalam: /[ഀ-ൿ]/, kannada: /[ಀ-೿]/,
  gujarati: /[઀-૿]/, gurmukhi: /[਀-੿]/, oriya: /[଀-୿]/, cingalais: /[඀-෿]/, birman: /[က-႟]/, khmer: /[ក-៿]/, lao: /[຀-໿]/,
};
function bonneEcriture(texte) {
  const att = langue.ecriture.split("|");
  const lettres = String(texte).replace(/[\s\d\p{P}\p{S}]/gu, "");
  if (!lettres) return false;
  return att.some((e) => { const re = new RegExp(ECRITURES[e].source, "gu"); return (lettres.match(re) || []).length / lettres.length >= 0.5; });
}
// chrF (Popović 2015) : F-score de n-grammes de caractères, n = 1..6, bêta = 2. Sans dépendance.
function chrf(hyp, ref) {
  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
  const h = norm(hyp), r = norm(ref);
  let p = 0, rc = 0, n = 0;
  for (let k = 1; k <= 6; k++) {
    const g = (s) => { const m = new Map(); for (let i = 0; i + k <= s.length; i++) { const x = s.slice(i, i + k); m.set(x, (m.get(x) || 0) + 1); } return m; };
    const gh = g(h), gr = g(r); let commun = 0, th = 0, tr = 0;
    gh.forEach((v) => (th += v)); gr.forEach((v) => (tr += v)); gh.forEach((v, x) => (commun += Math.min(v, gr.get(x) || 0)));
    if (!th || !tr) continue;
    p += commun / th; rc += commun / tr; n++;
  }
  if (!n) return 0;
  p /= n; rc /= n;
  return p + rc ? Math.round((5 * p * rc) / (4 * p + rc) * 1000) / 10 : 0;
}
let appels = 0, caracteres = 0;
const ms = [];
async function mymemory(texte, de, vers) {
  appels++; caracteres += texte.length;
  const t0 = Date.now();
  const r = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(texte) + "&langpair=" + de + "|" + vers, { signal: AbortSignal.timeout(15000) });
  ms.push(Date.now() - t0);
  if (r.status === 429) throw new Error("QUOTA");
  if (!r.ok) throw new Error("HTTP " + r.status);
  const d = await r.json();
  const rd = d.responseData || {}, list = Array.isArray(d.matches) ? d.matches : [];
  const mt = Number(rd.match) >= 1 ? null : list.find((m) => m && m["created-by"] === "MT!" && m.translation);
  const t = mt ? mt.translation : rd.translatedText;
  const note = String(d.responseDetails || "") + " " + String(t || "");
  if (d.quotaFinished || /MYMEMORY WARNING|QUOTA/i.test(note)) throw new Error("QUOTA");
  if (/INVALID (TARGET|SOURCE) LANGUAGE|IS AN INVALID|NOT SUPPORTED/i.test(note)) throw new Error("LANGUE NON PRISE EN CHARGE");
  if (!t) throw new Error("VIDE");
  await pause(400);
  return String(t).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

let dernierIA = 0, iaCoupee = null;
const iaStats = { appels: 0, reussis: 0, echecs: 0, refus_429: 0, ms: [], entree: 0, sortie: 0, modele: null, erreurs: {} };
async function ia(texte) {
  if (iaCoupee) throw new Error(iaCoupee);
  for (let essai = 1; essai <= 5; essai++) {
    const att = dernierIA + ECART_IA - Date.now(); if (att > 0) await pause(att);
    dernierIA = Date.now(); iaStats.appels++;
    const t0 = Date.now(); let r, j;
    try {
      r = await fetch(IA_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + IA_ANON, apikey: IA_ANON, "x-labo-cle": process.env.LABO_CLE || "", Origin: "http://localhost" },
        body: JSON.stringify({ texte, de: "fr", vers: code, style: "auto", modele: modele || undefined }), signal: AbortSignal.timeout(40000) });
      j = await r.json().catch(() => ({}));
    } catch (e) { r = { ok: false, status: 0 }; j = { erreur: "réseau : " + e.message }; }
    if (r.status === 429) { iaStats.refus_429++; await pause(30000); continue; }
    if (!r.ok) { const m = j.erreur || "IA " + r.status; iaStats.echecs++; iaStats.erreurs[m] = (iaStats.erreurs[m] || 0) + 1; if (r.status === 503 || r.status === 401 || /\(4\d\d\)/.test(m)) iaCoupee = m; throw new Error(m); }
    iaStats.reussis++; iaStats.ms.push(Date.now() - t0); iaStats.modele = j.modele;
    if (j.jetons) { iaStats.entree += j.jetons.entree || 0; iaStats.sortie += j.jetons.sortie || 0; }
    return j.traduction;
  }
  iaStats.echecs++; throw new Error("quota de l'IA (5 essais)");
}
// Même protocole pour chaque moteur : contrôles + retraduction MyMemory vers le français + chrF.
// Retraduction très éloignée de la phrase de départ (chrF < 15) : sens probablement inventé ou perdu.
// Mesuré le 2 nov. : en wolof, l'IA a rendu « Je t'appelle ce soir après le travail » par « Naka nga def ci jamono bi, ci jàmm »
// (« comment vas-tu, en paix »), sans qu'aucun autre contrôle ne réagisse. Même seuil pour MyMemory et l'IA.
// F-30 : le seuil, le contrôle « retraduction » et le cas « retraduction impossible » sont dans fiabilite.js
// (verifierRetour), partagés par MyMemory et l'IA et testés hors ligne (labo/tests/f30-retraduction.test.js).
const F = require("../moteur/fiabilite.js");
const retraduireFr = (t) => mymemory(t, code, "fr");

async function evaluer(c, traduction) {
  const an = S.comprendre(c.t, "fr", D);
  const E = S.controler(c.t, traduction, an, code, D), V = S.verifierSens(c.t, traduction, code, c);
  const controles = E.resultats.concat(V.resultats).filter((x) => !/^expression «/.test(x.controle));
  controles.push({ controle: "écriture " + langue.ecriture, ok: bonneEcriture(traduction), detail: bonneEcriture(traduction) ? "bonne écriture" : "MAUVAISE ÉCRITURE : non traduit ou mauvaise langue" });
  const o = { traduction, controles };
  Object.assign(o, await F.verifierRetour(controles, traduction, c.t, retraduireFr, chrf, c.pieges_retour));
  o.echecs = controles.filter((x) => x.ok === false).length;
  return o;
}

(async () => {
  const lignes = [];
  for (const c of B.cas) {
    const l = { registre: c.registre, source: c.t, complexe: !!c.complexe };
    try {
      l.traduction = await mymemory(c.t, "fr", code);
      const an = S.comprendre(c.t, "fr", D);
      const E = S.controler(c.t, l.traduction, an, code, D);
      const V = S.verifierSens(c.t, l.traduction, code, c);
      l.controles = E.resultats.concat(V.resultats).filter((x) => !/^expression «/.test(x.controle));
      l.controles.push({ controle: "écriture " + langue.ecriture, ok: bonneEcriture(l.traduction), detail: bonneEcriture(l.traduction) ? "bonne écriture" : "MAUVAISE ÉCRITURE : non traduit ou mauvaise langue" });
      Object.assign(l, await F.verifierRetour(l.controles, l.traduction, c.t, retraduireFr, chrf, c.pieges_retour));
    } catch (e) { l.erreur = e.message; }
    if (avecIA && !l.erreur) {
      try { l.ia = await evaluer(c, await ia(c.t)); } catch (e) { l.ia = { erreur: e.message }; }
    }
    l.echecs = (l.controles || []).filter((x) => x.ok === false).length;
    // F-30 : erreurs, vérifications impossibles et relecture humaine comptées à part.
    const k = F.classer(l, c.complexe);
    l.verifiee = k.verifiee; l.impossibles = k.impossibles; l.a_relire = k.a_relire;
    if (l.ia && !l.ia.erreur) { const ki = F.classer(l.ia, c.complexe); l.ia.verifiee = ki.verifiee; l.ia.impossibles = ki.impossibles; l.ia.a_relire = ki.a_relire; }
    lignes.push(l);
    if (l.ia) console.log(`        IA ${l.ia.erreur ? "ERREUR " + l.ia.erreur : (l.ia.echecs ? "✗" + l.ia.echecs : "✓") + " chrF retour " + (l.ia.chrf_retour ?? "—") + "  " + l.ia.traduction}`);
    console.log(`[${code}] ${c.registre.padEnd(16)} ${l.erreur ? "ERREUR " + l.erreur : (l.echecs ? "✗" + l.echecs : "✓") + " chrF retour " + (l.chrf_retour ?? "—")}  ${l.traduction || ""}`);
    if (l.erreur === "QUOTA" || l.erreur === "LANGUE NON PRISE EN CHARGE") break;
  }
  // LOT 1 : « sans problème » = tous les contrôles à true ET chrF de retour numérique (fiabilite.js estSansProbleme).
  const ok = lignes.filter((l) => !!l.traduction);
  const testsReussis = ok.filter((l) => F.estSansProbleme(l)).length;
  const problemes = ok.reduce((s, l) => s + (l.controles || []).filter((x) => x && x.ok === false).length, 0);
  const moy = (a) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length * 10) / 10 : null);
  // Par registre : toutes les phrases sont gardées (avant, la dernière phrase d'un registre écrasait les autres).
  const parRegistre = F.statsParRegistre(ok);
  const bilan = {
    code, nom: langue.nom, ecriture: langue.ecriture, moteur: "MyMemory", date: new Date().toISOString(),
    disponible: ok.length > 0, phrases: B.cas.length, traduites: ok.length, erreurs: lignes.filter((l) => l.erreur).map((l) => l.erreur).filter((x, i, a) => a.indexOf(x) === i),
    tests_reussis: testsReussis, problemes,
    mauvaise_ecriture: ok.filter((l) => l.controles.some((x) => /^écriture/.test(x.controle) && x.ok === false)).length,
    chrf_retour_moyen: moy(ok.map((l) => l.chrf_retour).filter((x) => x != null)),
    indices_mot_a_mot: ok.filter((l) => l.controles.some((x) => /indice mot à mot/.test(x.controle) && x.ok === null)).length,
    a_relire_humain: ok.reduce((s, l) => s + (l.a_relire || 0), 0),
    phrases_avec_erreur: ok.filter((l) => l.controles.some((x) => x && x.ok === false)).length,
    verifications_impossibles: ok.reduce((s, l) => s + (l.impossibles || 0), 0),
    phrases_non_verifiees: ok.filter((l) => !F.estSansProbleme(l) && !l.controles.some((x) => x && x.ok === false)).length,
    latence_ms_mediane: F.mediane(ms), latences_ms: ms.slice(), appels, caracteres, cout_eur: 0,
    statut: "testé (contrôles automatiques) — PAS validé", par_registre: parRegistre,
    // L-05 : le détail des erreurs détectées et des contrôles non vérifiés est gardé dans le bilan
    // (dernier-112.json), pour diagnostiquer chaque langue sans fouiller les journaux de GitHub.
    detail: ok.map((l) => ({ registre: l.registre, traduction: String(l.traduction).slice(0, 160),
      erreurs: l.controles.filter((x) => x && x.ok === false).map((x) => x.controle + " : " + x.detail),
      non_verifies: l.controles.filter((x) => !x || x.ok !== true && x.ok !== false).map((x) => (x && x.controle) || "contrôle absent") }))
      .filter((d) => d.erreurs.length || d.non_verifies.length),
  };
  if (avecIA) {
    const okIA = lignes.filter((l) => l.ia && l.ia.traduction && !l.ia.erreur);
    const testsReussisIA = okIA.filter((l) => F.estSansProbleme(l.ia)).length;
    const memes = okIA.filter((l) => !l.erreur);
    const prix = { "openai/gpt-oss-120b": [0.15, 0.6], "openai/gpt-oss-20b": [0.075, 0.3] }[iaStats.modele];
    bilan.ia = {
      modele: iaStats.modele, traduites: okIA.length, tests_reussis: testsReussisIA, problemes: okIA.reduce((s, l) => s + (l.ia.controles || []).filter((x) => x && x.ok === false).length, 0),
      mauvaise_ecriture: okIA.filter((l) => l.ia.controles.some((x) => /^écriture/.test(x.controle) && x.ok === false)).length,
      chrf_retour_moyen: moy(okIA.map((l) => l.ia.chrf_retour).filter((x) => x != null)),
      indices_mot_a_mot: okIA.filter((l) => l.ia.controles.some((x) => /indice mot à mot/.test(x.controle) && x.ok === null)).length,
      a_relire_humain: okIA.reduce((s, l) => s + (l.ia.a_relire || 0), 0),
      phrases_avec_erreur: okIA.filter((l) => l.ia.controles.some((x) => x && x.ok === false)).length,
      verifications_impossibles: okIA.reduce((s, l) => s + (l.ia.impossibles || 0), 0),
      phrases_non_verifiees: okIA.filter((l) => !F.estSansProbleme(l.ia) && !l.ia.controles.some((x) => x && x.ok === false)).length,
      // Comparaison stricte : seulement les phrases traduites par LES DEUX moteurs.
      comparaison_memes_phrases: { phrases: memes.length, mymemory_sans_probleme: memes.filter((l) => F.estSansProbleme(l)).length, ia_sans_probleme: memes.filter((l) => F.estSansProbleme(l.ia)).length,
        mymemory_non_verifie: memes.filter((l) => !F.estSansProbleme(l) && !(l.controles || []).some((x) => x && x.ok === false)).length,
        ia_non_verifie: memes.filter((l) => !F.estSansProbleme(l.ia) && !(l.ia.controles || []).some((x) => x && x.ok === false)).length,
        chrf_mymemory: moy(memes.map((l) => l.chrf_retour).filter((x) => x != null)), chrf_ia: moy(memes.map((l) => l.ia.chrf_retour).filter((x) => x != null)) },
      appels: iaStats.appels, echecs: iaStats.echecs, refus_429: iaStats.refus_429, erreurs: iaStats.erreurs,
      latence_ms_mediane: F.mediane(iaStats.ms), latences_ms: iaStats.ms.slice(),
      jetons_par_traduction: iaStats.reussis ? Math.round((iaStats.entree + iaStats.sortie) / iaStats.reussis) : null,
      cout_reel_eur: 0, cout_estime_si_payant_usd_par_traduction: prix && iaStats.reussis ? +(((iaStats.entree * prix[0] + iaStats.sortie * prix[1]) / 1e6) / iaStats.reussis).toFixed(6) : null,
      par_registre: F.statsParRegistre(okIA, (l) => l.ia),
    };
  }
  // Phase 5 : types d'erreurs (grave / sens / contexte), « non vérifié », et décision par langue, sur LES MÊMES phrases.
  const memesF = avecIA ? lignes.filter((l) => !l.erreur && l.ia && !l.ia.erreur) : ok;
  bilan.fiabilite = { mymemory: F.resumer(memesF) };
  if (avecIA) {
    bilan.fiabilite.ia = F.resumer(memesF.map((l) => l.ia));
    bilan.fiabilite.ia.modele = iaStats.modele;
    Object.assign(bilan.fiabilite, F.decider(bilan.fiabilite.ia, bilan.fiabilite.mymemory));
  }
  console.log("\nBILAN112 " + JSON.stringify(bilan));
  const dir = path.join(__dirname, "resultats");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "112-" + code + ".json"), JSON.stringify({ bilan, lignes }, null, 1));
})().catch((e) => { console.error("ÉCHEC du banc : " + e.message); process.exitCode = 1; });

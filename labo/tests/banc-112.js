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
      try {
        l.retour = await mymemory(l.traduction.slice(0, 450), code, "fr");
        l.chrf_retour = chrf(l.retour, c.t);
        const hit = (c.pieges_retour || []).filter((w) => l.retour.toLowerCase().includes(w));
        if (c.pieges_retour) l.controles.push({ controle: "indice mot à mot (retour)", ok: hit.length ? null : true, detail: hit.length ? "l'image revient dans la retraduction (« " + hit.join(", ") + " ») : relecture" : "pas d'image littérale au retour" });
      } catch (e) { l.retour_erreur = e.message; }
    } catch (e) { l.erreur = e.message; }
    l.echecs = (l.controles || []).filter((x) => x.ok === false).length;
    l.a_relire = (l.controles || []).filter((x) => x.ok === null).length + (c.complexe ? 1 : 0);
    lignes.push(l);
    console.log(`[${code}] ${c.registre.padEnd(16)} ${l.erreur ? "ERREUR " + l.erreur : (l.echecs ? "✗" + l.echecs : "✓") + " chrF retour " + (l.chrf_retour ?? "—")}  ${l.traduction || ""}`);
    if (l.erreur === "QUOTA" || l.erreur === "LANGUE NON PRISE EN CHARGE") break;
  }
  const ok = lignes.filter((l) => !l.erreur);
  const moy = (a) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length * 10) / 10 : null);
  const parRegistre = {};
  ok.forEach((l) => { parRegistre[l.registre] = { reussi: l.echecs === 0, chrf_retour: l.chrf_retour ?? null, echecs: l.echecs }; });
  const bilan = {
    code, nom: langue.nom, ecriture: langue.ecriture, moteur: "MyMemory", date: new Date().toISOString(),
    disponible: ok.length > 0, phrases: B.cas.length, traduites: ok.length, erreurs: lignes.filter((l) => l.erreur).map((l) => l.erreur).filter((x, i, a) => a.indexOf(x) === i),
    tests_reussis: ok.filter((l) => l.echecs === 0).length, problemes: ok.reduce((s, l) => s + l.echecs, 0),
    mauvaise_ecriture: ok.filter((l) => l.controles.some((x) => /^écriture/.test(x.controle) && x.ok === false)).length,
    chrf_retour_moyen: moy(ok.map((l) => l.chrf_retour).filter((x) => x != null)),
    indices_mot_a_mot: ok.filter((l) => l.controles.some((x) => /indice mot à mot/.test(x.controle) && x.ok === null)).length,
    a_relire_humain: ok.reduce((s, l) => s + l.a_relire, 0),
    latence_ms_mediane: ms.length ? [...ms].sort((a, b) => a - b)[Math.floor(ms.length / 2)] : null, appels, caracteres, cout_eur: 0,
    statut: "testé (contrôles automatiques) — PAS validé", par_registre: parRegistre,
  };
  console.log("\nBILAN112 " + JSON.stringify(bilan));
  const dir = path.join(__dirname, "resultats");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "112-" + code + ".json"), JSON.stringify({ bilan, lignes }, null, 1));
})().catch((e) => { console.error("ÉCHEC du banc : " + e.message); process.exitCode = 1; });

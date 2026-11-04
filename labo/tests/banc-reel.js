/* 24/24 ONE WORLD — Labo linguistique : banc d'essai RÉEL (appels réels à MyMemory, et à l'IA de test si branchée).
   © 2026 Sébastien Chevrier. Tous droits réservés.
   Lancer : node labo/tests/banc-reel.js <langue cible> [--ia] [--batterie p4] [--modele openai/gpt-oss-120b]
   - Sans --ia : MyMemory seul, puis MyMemory sur la phrase pré-éditée (l'image remplacée par son sens).
   - Avec --ia : ajoute la fonction labo-traduire du projet Supabase de TEST (sans clé Groq : « non branchée »).
   - --batterie p4 : batterie spécifique de la phase 4 (29 phrases, contexte de conversation, négations, dates…).
   Écrit labo/tests/resultats/banc-<batterie>-<langue>.json et affiche un tableau. Ce banc n'est PAS lancé par les
   tests automatiques (run-tests.js) : il utilise Internet et les quotas gratuits. */
"use strict";
const fs = require("fs"), path = require("path");
const S = require("../moteur/socle.js"), D = require("../donnees/expressions-fr.js");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const vers = process.argv[2] || "en", avecIA = process.argv.includes("--ia");
const nomBatterie = arg("--batterie", "base"), modele = arg("--modele", null);
const B = nomBatterie === "p4" ? require("./batterie-phase4.js") : require("./batterie.js");
const IA_URL = "https://tbynnefrrxzxufcptijc.supabase.co/functions/v1/labo-traduire";
// Clé PUBLIQUE « anon » du projet Supabase de TEST (rôle anon, aucun droit particulier, faite pour être dans un client).
// Elle sert seulement à passer le contrôle d'accès de la fonction de test. Ce n'est PAS la clé Groq, qui reste secrète
// sur le serveur. Jamais la clé du projet de PRODUCTION.
const IA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieW5uZWZycnh6eHVmY3B0aWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNDQwMDksImV4cCI6MjEwNjYyMDAwOX0.ykVFdlV6Rly4iln4JiufKMKOnSyE4fkGYK59GAZ186Y";
// Prix publics Groq (USD par million de jetons, entrée / sortie), relevés le 2 nov. 2026 sur console.groq.com/docs/models.
// Dans l'offre gratuite, le coût réel est 0 € ; ces prix servent à estimer le coût si l'offre payante devenait nécessaire.
const PRIX = { "openai/gpt-oss-120b": [0.15, 0.60], "openai/gpt-oss-20b": [0.075, 0.30] };
// Écart entre deux appels IA : 5 machines tournent en même temps et l'offre gratuite autorise 8 000 jetons par minute.
const ECART_IA = +arg("--ecart", "45000");
// Garde-fou : passé ce délai, l'IA est arrêtée et le banc finit avec MyMemory, pour que le BILAN s'écrive toujours
// (le 2 nov., un passage coupé par la limite de 60 min de GitHub a perdu tous ses chiffres).
const FIN = Date.now() + (+arg("--minutes", "48")) * 60000;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let appels = 0, caracteres = 0;

function meilleur(data) {
  const rd = data && data.responseData, tr = rd && rd.translatedText, exact = rd && Number(rd.match) >= 1;
  const list = Array.isArray(data && data.matches) ? data.matches : [];
  const mt = !exact ? list.find((m) => m && m["created-by"] === "MT!" && m.translation) : null;
  return mt ? mt.translation : tr;
}
function decode(x) {
  return String(x).replace(/&(#x?[0-9a-f]+|quot|amp|lt|gt|apos);/gi, (m, e) => {
    const k = e.toLowerCase();
    if (k === "quot") return '"'; if (k === "amp") return "&"; if (k === "lt") return "<"; if (k === "gt") return ">"; if (k === "apos") return "'";
    const n = k[1] === "x" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
    return String.fromCodePoint(n);
  });
}
async function mymemory(texte, de, cible) {
  const parts = Buffer.byteLength(texte) <= 450 ? [texte] : (texte.match(/[^.!?]+[.!?]*\s*/g) || [texte]).map((x) => x.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    appels++; caracteres += p.length;
    const t0 = Date.now();
    const r = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(p) + "&langpair=" + de + "|" + cible, { signal: AbortSignal.timeout(15000) });
    if (r.status === 429) throw new Error("QUOTA");
    if (!r.ok) throw new Error("HTTP " + r.status);
    mm_ms.push(Date.now() - t0);
    const d = await r.json(), t = meilleur(d), note = String(d.responseDetails || "") + " " + String(t || "");
    if (d.quotaFinished || /MYMEMORY WARNING|QUOTA/i.test(note)) throw new Error("QUOTA");
    if (!t) throw new Error("VIDE");
    out.push(decode(t));
    await pause(300);
  }
  return out.join(/^(zh|ja|th)/.test(cible) ? "" : " ");
}
let dernierIA = 0;
const ia_stats = { appels: 0, reussis: 0, echecs: 0, quota_429: 0, ms: [], ms_serveur: [], entree: 0, sortie: 0, modele: null, erreurs: {} };
let iaCoupee = null; // IA non branchée ou accès refusé : inutile d'attendre entre chaque phrase.
async function ia(req) {
  if (iaCoupee) throw new Error(iaCoupee);
  if (Date.now() > FIN) { iaCoupee = "temps du banc écoulé : IA arrêtée (voir --minutes)"; throw new Error(iaCoupee); }
  if (modele) req.modele = modele;
  for (let essai = 1; essai <= 6; essai++) {
    const attente = dernierIA + ECART_IA - Date.now();
    if (attente > 0) await pause(attente);
    dernierIA = Date.now();
    ia_stats.appels++;
    const t0 = Date.now();
    let r, j;
    try {
      r = await fetch(IA_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + IA_ANON, apikey: IA_ANON, "x-labo-cle": process.env.LABO_CLE || "", Origin: "http://localhost" }, body: JSON.stringify(req), signal: AbortSignal.timeout(40000) });
      j = await r.json().catch(() => ({}));
    } catch (e) { r = { ok: false, status: 0 }; j = { erreur: "réseau : " + e.message }; }
    if (r.status === 429) { ia_stats.quota_429++; if (Date.now() > FIN) break; await pause(Math.min(90000, Math.max(30000, (+j.reessayer_dans || 0) * 1000))); continue; }
    if (!r.ok) { const m = j.erreur || "IA " + r.status; ia_stats.echecs++; ia_stats.erreurs[m] = (ia_stats.erreurs[m] || 0) + 1; if (r.status === 503 || r.status === 401 || /\(4\d\d\)/.test(m)) { iaCoupee = m; throw new Error(m); } if (essai < 3) continue; throw new Error(m); }
    ia_stats.reussis++; ia_stats.ms.push(Date.now() - t0); if (j.ms) ia_stats.ms_serveur.push(j.ms);
    if (j.jetons) { ia_stats.entree += j.jetons.entree || 0; ia_stats.sortie += j.jetons.sortie || 0; }
    ia_stats.modele = j.modele || ia_stats.modele;
    return j;
  }
  ia_stats.echecs++; throw new Error("Quota gratuit de l'IA atteint (6 essais)");
}
const mm_ms = [];
const med = (a) => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const p90 = (a) => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(b.length * 0.9))]; };

(async () => {
  const lignes = [];
  for (const c of B.cas) {
    const r = await S.traduire(c.t, "fr", vers, { style: "auto", contexte: c.contexte }, { mymemory, ia: avecIA ? ia : null }, D);
    // Fidélité du sens (négation, question, dates, noms, mots attendus, pièges propres à la phrase) : ajoutée au contrôle
    // de chaque colonne, à égalité. La batterie de base n'a pas ces attentes : ses chiffres restent comparables à la phase 3.
    const att = { negation: c.negation, negation_aussi: c.negation_aussi, question: c.question, mois: c.mois, jours: c.jours, noms: c.noms, attendus: c.attendus, pieges: c.pieges, pourquoi: c.pourquoi };
    const aDesAttentes = Object.keys(att).some((k) => att[k]);
    const fusion = (E, texte) => { if (!E || !aDesAttentes) return E; const V = S.verifierSens(c.t, texte, vers, att); return { resultats: E.resultats.concat(V.resultats), ok: E.ok + V.ok, echecs: E.echecs + V.echecs, a_relire: E.a_relire + V.a_relire }; };
    r.E.brut = fusion(r.E.brut, r.D.brut); r.E.preedite = fusion(r.E.preedite, r.D.preedite);
    if (r.D.gratuit_source) r.E.gratuit = r.D.gratuit_source === "MyMemory direct" ? r.E.brut : r.E.preedite;
    r.E.ia = fusion(r.E.ia, r.D.ia && r.D.ia.traduction);
    lignes.push({ famille: c.famille, source: c.t, preedition: r.C.preedition.faits.length ? r.C.preedition.texte : null, registres: r.B.registres, expressions: r.B.expressions.map((x) => x.id),
      brut: r.D.brut || null, brut_erreur: r.D.brut_erreur || null, controle_brut: r.E.brut || null,
      preedite: r.D.preedite || null, preedite_erreur: r.D.preedite_erreur || null, controle_preedite: r.E.preedite || null,
      gratuit: r.D.gratuit || null, gratuit_source: r.D.gratuit_source || null, controle_gratuit: r.E.gratuit || null,
      ia: r.D.ia || null, ia_erreur: r.D.ia_erreur || null, controle_ia: r.E.ia || null });
    const L = lignes[lignes.length - 1];
    const f = (E) => (E ? E.ok + "✓ " + E.echecs + "✗" + (E.a_relire ? " " + E.a_relire + "?" : "") : "—");
    console.log(`[${vers}] ${c.famille.padEnd(18)} ${c.t.slice(0, 44).padEnd(44)} | MM ${f(L.controle_brut)} ${L.brut_erreur || ""} | PRE ${L.preedition ? f(L.controle_preedite) : "—"} | IA ${avecIA ? (L.ia_erreur || f(L.controle_ia)) : "—"}`);
    console.log(`        MM : ${L.brut || L.brut_erreur}`);
    if (L.preedition) console.log(`        PRE: ${L.preedite || L.preedite_erreur}`);
    if (L.preedition) console.log(`        GRATUIT retenu : ${L.gratuit_source}`);
    if (avecIA) console.log(`        IA : ${L.ia ? L.ia.traduction + (L.ia.registre_detecte ? "  [" + L.ia.registre_detecte + "]" : "") + (L.ia.remarques ? "  — " + L.ia.remarques : "") : L.ia_erreur}`);
    const ko = (E, n) => E && E.resultats.filter((x) => x.ok === false).forEach((x) => console.log(`        ✗ ${n} ${x.controle} : ${x.detail}`));
    ko(L.controle_brut, "MM"); if (L.gratuit_source && L.gratuit_source !== "MyMemory direct") ko(L.controle_gratuit, "GRATUIT"); if (avecIA) ko(L.controle_ia, "IA");
  }
  const somme = (k) => lignes.reduce((s, l) => s + (l[k] ? l[k].echecs : 0), 0);
  const litteral = (k) => lignes.reduce((s, l) => s + (l[k] ? l[k].resultats.filter((x) => x.ok === false && /MOT À MOT/.test(x.detail)).length : 0), 0);
  const idio = lignes.filter((l) => l.expressions.length);
  const SENS = /négation|question gardée|mois «|jour «|nom «|attendu \//;
  const sens = (k) => lignes.reduce((s, l) => s + (l[k] ? l[k].resultats.filter((x) => x.ok === false && SENS.test(x.controle)).length : 0), 0);
  const parFamille = {};
  lignes.forEach((l) => { const f = parFamille[l.famille] || (parFamille[l.famille] = { phrases: 0, mymemory: 0, meilleur_gratuit: 0, ia: avecIA ? 0 : null });
    f.phrases++; f.mymemory += l.controle_brut ? l.controle_brut.echecs : 0; f.meilleur_gratuit += l.controle_gratuit ? l.controle_gratuit.echecs : 0; if (avecIA) f.ia += l.controle_ia ? l.controle_ia.echecs : 0; });
  const cout = ia_stats.modele && PRIX[ia_stats.modele] ? (ia_stats.entree * PRIX[ia_stats.modele][0] + ia_stats.sortie * PRIX[ia_stats.modele][1]) / 1e6 : null;
  const bilan = {
    batterie: nomBatterie, langue: vers, date: new Date().toISOString(), phrases: lignes.length, phrases_avec_expression: idio.length, appels_mymemory: appels, caracteres_envoyes: caracteres,
    erreurs_mymemory: lignes.filter((l) => l.brut_erreur).length,
    problemes_detectes: { mymemory: somme("controle_brut"), meilleur_gratuit: somme("controle_gratuit"), mymemory_preedite_sur_les_phrases_preeditees: somme("controle_preedite"), ia: avecIA ? somme("controle_ia") : null },
    mot_a_mot_detecte: { mymemory: litteral("controle_brut"), meilleur_gratuit: litteral("controle_gratuit"), mymemory_preedite: litteral("controle_preedite"), ia: avecIA ? litteral("controle_ia") : null },
    sens_perdu_detecte: { mymemory: sens("controle_brut"), meilleur_gratuit: sens("controle_gratuit"), ia: avecIA ? sens("controle_ia") : null },
    par_famille: parFamille,
    latence_ms: { mymemory_mediane: med(mm_ms), mymemory_p90: p90(mm_ms), ia_mediane: avecIA ? med(ia_stats.ms) : null, ia_p90: avecIA ? p90(ia_stats.ms) : null, ia_serveur_groq_mediane: avecIA ? med(ia_stats.ms_serveur) : null },
    ia: avecIA ? { modele: ia_stats.modele, appels: ia_stats.appels, reussis: ia_stats.reussis, echecs: ia_stats.echecs, refus_quota_429: ia_stats.quota_429, erreurs: ia_stats.erreurs,
      jetons_entree: ia_stats.entree, jetons_sortie: ia_stats.sortie, jetons_par_traduction: ia_stats.reussis ? Math.round((ia_stats.entree + ia_stats.sortie) / ia_stats.reussis) : null,
      cout_reel_eur: 0, cout_estime_si_payant_usd_total: cout, cout_estime_si_payant_usd_par_traduction: cout != null && ia_stats.reussis ? +(cout / ia_stats.reussis).toFixed(6) : null } : null,
    avertissement: "Contrôles automatiques seulement (nombres, noms, émojis, longueur, mots-pièges). La qualité réelle demande une relecture native.",
  };
  console.log("\nBILAN " + JSON.stringify(bilan));
  const dir = path.join(__dirname, "resultats");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "banc-" + nomBatterie + "-" + vers + ".json"), JSON.stringify({ bilan, lignes }, null, 1));
  if (bilan.erreurs_mymemory === lignes.length) process.exitCode = 1;
})().catch((e) => { console.error("ÉCHEC du banc : " + e.message); process.exitCode = 1; });

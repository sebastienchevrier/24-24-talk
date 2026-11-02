/* 24/24 ONE WORLD — Labo linguistique : banc d'essai RÉEL (appels réels à MyMemory, et à l'IA de test si branchée).
   © 2026 Sébastien Chevrier. Tous droits réservés.
   Lancer : node labo/tests/banc-reel.js <langue cible> [--ia]
   - Sans --ia : MyMemory seul, puis MyMemory sur la phrase pré-éditée (l'image remplacée par son sens).
   - Avec --ia : ajoute la fonction labo-traduire du projet Supabase de TEST (sans clé : « non branchée »).
   Écrit labo/tests/resultats/banc-<langue>.json et affiche un tableau. Ce banc n'est PAS lancé par les tests
   automatiques (run-tests.js) : il utilise Internet et le quota gratuit de MyMemory. */
"use strict";
const fs = require("fs"), path = require("path");
const S = require("../moteur/socle.js"), D = require("../donnees/expressions-fr.js"), B = require("./batterie.js");
const vers = process.argv[2] || "en", avecIA = process.argv.includes("--ia");
const IA_URL = "https://tbynnefrrxzxufcptijc.supabase.co/functions/v1/labo-traduire";
const IA_ANON = "sb_publishable_zNyy7HYlbwtdNjewaxcKdA_uF_vlskR";
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
    const r = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(p) + "&langpair=" + de + "|" + cible, { signal: AbortSignal.timeout(15000) });
    if (r.status === 429) throw new Error("QUOTA");
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json(), t = meilleur(d), note = String(d.responseDetails || "") + " " + String(t || "");
    if (d.quotaFinished || /MYMEMORY WARNING|QUOTA/i.test(note)) throw new Error("QUOTA");
    if (!t) throw new Error("VIDE");
    out.push(decode(t));
    await pause(300);
  }
  return out.join(/^(zh|ja|th)/.test(cible) ? "" : " ");
}
async function ia(req) {
  const r = await fetch(IA_URL, { method: "POST", headers: { "Content-Type": "application/json", apikey: IA_ANON, Origin: "http://localhost" }, body: JSON.stringify(req), signal: AbortSignal.timeout(30000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.erreur || "IA " + r.status);
  return j;
}

(async () => {
  const lignes = [];
  for (const c of B.cas) {
    const r = await S.traduire(c.t, "fr", vers, { style: "auto" }, { mymemory, ia: avecIA ? ia : null }, D);
    lignes.push({ famille: c.famille, source: c.t, preedition: r.C.preedition.faits.length ? r.C.preedition.texte : null, registres: r.B.registres, expressions: r.B.expressions.map((x) => x.id),
      brut: r.D.brut || null, brut_erreur: r.D.brut_erreur || null, controle_brut: r.E.brut || null,
      preedite: r.D.preedite || null, preedite_erreur: r.D.preedite_erreur || null, controle_preedite: r.E.preedite || null,
      ia: r.D.ia || null, ia_erreur: r.D.ia_erreur || null, controle_ia: r.E.ia || null });
    const L = lignes[lignes.length - 1];
    const f = (E) => (E ? E.ok + "✓ " + E.echecs + "✗" + (E.a_relire ? " " + E.a_relire + "?" : "") : "—");
    console.log(`[${vers}] ${c.famille.padEnd(18)} ${c.t.slice(0, 44).padEnd(44)} | MM ${f(L.controle_brut)} ${L.brut_erreur || ""} | PRE ${L.preedition ? f(L.controle_preedite) : "—"} | IA ${avecIA ? (L.ia_erreur || f(L.controle_ia)) : "—"}`);
    console.log(`        MM : ${L.brut || L.brut_erreur}`);
    if (L.preedition) console.log(`        PRE: ${L.preedite || L.preedite_erreur}`);
    if (avecIA) console.log(`        IA : ${L.ia ? L.ia.traduction : L.ia_erreur}`);
  }
  const somme = (k) => lignes.reduce((s, l) => s + (l[k] ? l[k].echecs : 0), 0);
  const litteral = (k) => lignes.reduce((s, l) => s + (l[k] ? l[k].resultats.filter((x) => x.ok === false && /MOT À MOT/.test(x.detail)).length : 0), 0);
  const idio = lignes.filter((l) => l.expressions.length);
  const bilan = {
    langue: vers, date: new Date().toISOString(), phrases: lignes.length, phrases_avec_expression: idio.length, appels_mymemory: appels, caracteres_envoyes: caracteres,
    erreurs_mymemory: lignes.filter((l) => l.brut_erreur).length,
    problemes_detectes: { mymemory: somme("controle_brut"), mymemory_preedite_sur_les_phrases_preeditees: somme("controle_preedite"), ia: avecIA ? somme("controle_ia") : null },
    mot_a_mot_detecte: { mymemory: litteral("controle_brut"), mymemory_preedite: litteral("controle_preedite"), ia: avecIA ? litteral("controle_ia") : null },
    avertissement: "Contrôles automatiques seulement (nombres, noms, émojis, longueur, mots-pièges). La qualité réelle demande une relecture native.",
  };
  console.log("\nBILAN " + JSON.stringify(bilan));
  const dir = path.join(__dirname, "resultats");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "banc-" + vers + ".json"), JSON.stringify({ bilan, lignes }, null, 1));
  if (bilan.erreurs_mymemory === lignes.length) process.exitCode = 1;
})().catch((e) => { console.error("ÉCHEC du banc : " + e.message); process.exitCode = 1; });

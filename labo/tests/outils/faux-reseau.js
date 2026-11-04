/* 24/24 ONE WORLD — AI LAB : faux réseau pour tester banc-112.js HORS LIGNE (F-30).
   © 2026 Sébastien Chevrier. Tous droits réservés.
   Chargé avec « node -r ». Remplace fetch : aucun appel à MyMemory, Supabase ou une IA.
   FAUX_RESEAU = ok | eloigne | reseau | quota  (comportement de la RETRADUCTION vers le français).
   La traduction aller (fr → langue) et l'IA réussissent toujours. */
"use strict";
const mode = process.env.FAUX_RESEAU || "ok";
const json = (status, corps) => ({ ok: status >= 200 && status < 300, status, json: async () => corps });
global.fetch = async (url, opts) => {
  url = String(url);
  if (/mymemory/.test(url)) {
    const u = new URL(url), q = u.searchParams.get("q"), paire = u.searchParams.get("langpair");
    if (/\|fr$/.test(paire)) {
      if (mode === "reseau") throw new TypeError("fetch failed (réseau simulé)");
      if (mode === "quota") return json(429, {});
      const retour = mode === "eloigne" ? "zzz qqq www" : q.replace(/^ES: /, "");
      return json(200, { responseData: { translatedText: retour, match: 1 }, matches: [] });
    }
    return json(200, { responseData: { translatedText: "ES: " + q, match: 1 }, matches: [] });
  }
  if (/labo-traduire/.test(url)) {
    const b = JSON.parse(opts.body);
    return json(200, { traduction: "ES: " + b.texte, modele: "faux/modele", jetons: { entree: 1, sortie: 1 } });
  }
  throw new Error("faux réseau : adresse inattendue " + url);
};
// Pas d'attente pendant les tests.
const st = global.setTimeout;
global.setTimeout = (f, ms, ...a) => st(f, 0, ...a);

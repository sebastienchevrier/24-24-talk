/* 24/24 ONE WORLD — lance toutes les suites de everywhere/tests/, l'une après l'autre, et fait le bilan.
   © 2026 Sébastien Chevrier. Tous droits réservés.
   - Aucune suite n'utilise Internet ni la vraie base : faux serveur local, Chromium sans réseau extérieur.
   - Chaque fichier *.js de everywhere/tests/ est une suite (sauf les aides listées dans AIDES) :
     une nouvelle suite est donc lancée automatiquement, sans modifier ce fichier.
   - Code de sortie : 0 si tout est vert, 1 sinon. Le bilan est écrit aussi dans $GITHUB_STEP_SUMMARY.
   Lancer en local : node .github/ci/run-tests.js   (après « npm ci » dans .github/ci et « npx playwright install chromium ») */
"use strict";
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const RACINE = path.resolve(__dirname, "..", "..");
const DOSSIER = path.join(RACINE, "everywhere", "tests");
const MODULES = path.join(__dirname, "node_modules");
const AIDES = new Set(["fake-supabase.js"]); // fichiers d'aide, pas des suites
const DUREE_MAX = 15 * 60 * 1000; // une suite bloquée est arrêtée au bout de 15 min

// Échecs CONNUS et ATTENDUS sur ce dépôt (production) : dependances.js contient 3 contrôles écrits pour la copie
// de TEST (config.js et index.html doivent y viser la base de TEST). Sur la production, ils échouent par construction.
// Seuls ces 3 libellés exacts sont tolérés ; tout autre « ÉCHEC » de dependances.js rend la suite rouge.
const ECHECS_ATTENDUS = {
  "dependances.js": [
    "ÉCHEC  Mode TEST : everywhere/config.js vise la base de TEST",
    "ÉCHEC  Garde-fou : adresse de production avec env « test »",
    "ÉCHEC  Garde-fou TALK : index.html vise la base de TEST",
  ],
};

const env = Object.assign({}, process.env, {
  NODE_PATH: MODULES, // require("playwright") et axe-core trouvés depuis everywhere/tests/
  SB_SDK: path.join(MODULES, "@supabase", "supabase-js", "dist", "umd", "supabase.js"), // le vrai fichier 2.117.2
  AXE: path.join(MODULES, "axe-core", "axe.min.js"),
});
delete env.OW_REEL; // jamais de base réelle depuis les tests automatiques

const suites = fs.readdirSync(DOSSIER).filter((f) => f.endsWith(".js") && !AIDES.has(f)).sort();
const bilan = [];
for (const f of suites) {
  const debut = Date.now();
  console.log("\n==================== " + f + " ====================");
  const r = spawnSync(process.execPath, [path.join("everywhere", "tests", f)], {
    cwd: RACINE, env, encoding: "utf8", timeout: DUREE_MAX, maxBuffer: 64 * 1024 * 1024,
  });
  const sortie = (r.stdout || "") + (r.stderr || "");
  process.stdout.write(sortie);
  const secondes = Math.round((Date.now() - debut) / 100) / 10;
  const lignes = sortie.split("\n");
  const score = (lignes.filter((l) => /\d+\s*\/\s*\d+/.test(l)).pop() || "").trim();
  let etat;
  let note = "";
  if (r.error && r.error.code === "ETIMEDOUT") { etat = "ROUGE"; note = "arrêtée après 15 min"; }
  else if (r.status === 0) etat = "VERT";
  else if (r.status === 1 && ECHECS_ATTENDUS[f]) {
    const echecs = lignes.filter((l) => l.startsWith("ÉCHEC"));
    const inattendus = echecs.filter((l) => !ECHECS_ATTENDUS[f].some((p) => l.startsWith(p)));
    if (echecs.length && !inattendus.length) { etat = "VERT"; note = echecs.length + " échec(s) attendu(s) : contrôles propres à la copie de TEST"; }
    else { etat = "ROUGE"; note = inattendus.length + " échec(s) inattendu(s)"; }
  } else { etat = "ROUGE"; note = "code de sortie " + r.status; }
  bilan.push({ f, etat, score, secondes, note });
}

const rouges = bilan.filter((b) => b.etat !== "VERT");
const tableau = ["| Suite | État | Score | Durée | Remarque |", "|---|---|---|---|---|"]
  .concat(bilan.map((b) => `| ${b.f} | ${b.etat === "VERT" ? "✅ vert" : "❌ rouge"} | ${b.score.replace(/\|/g, "/")} | ${b.secondes} s | ${b.note} |`));
const texte = "## Tests automatiques 24/24 ONE WORLD\n\n" + tableau.join("\n") + "\n\n" +
  (rouges.length ? `**${rouges.length} suite(s) en échec sur ${bilan.length}.**` : `**Toutes les suites sont vertes (${bilan.length}).**`) + "\n";
console.log("\n" + texte);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, texte);
process.exit(rouges.length ? 1 : 0);

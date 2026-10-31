/* 24/24 ONE WORLD — essai du choix de la traduction MyMemory (31 oct. 2026).
   Réponses RÉELLES de MyMemory enregistrées le 31 oct. 2026 (essai GitHub Actions, dépôt de test).
   Vérifie la même règle dans TALK (index.html, mmBest) et dans EVERYWHERE (traduction/moteur.js, best).
   Lancer : node everywhere/tests/traduction-choix.js [dossier] (dossier = autre copie du site, pour comparer avant/après) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const SITE = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, "..", "..");
const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
const a = html.indexOf("function mmBest("), b = html.indexOf("\n}\n", a) + 2;
const talk = vm.runInNewContext("(" + html.slice(a, b) + ")");
const mot = fs.readFileSync(path.join(SITE, "everywhere", "traduction", "moteur.js"), "utf8");
const c = mot.indexOf("function best("), d = mot.indexOf("\n  }\n", c) + 4;
const ew = vm.runInNewContext("(" + mot.slice(c, d) + ")");
const M = (match, by, seg, tr) => ({ match, "created-by": by, segment: seg, translation: tr });
const CAS = [
  { n: "« Bonjour, comment vas-tu ? » fr→es : pas de « XXX »", src: "Bonjour, comment vas-tu ?", want: "¿Hola, cómo estás?",
    data: { responseData: { translatedText: "Hola XXX, ¿cómo estás?", match: 0.98 }, matches: [M(0.98, "MateCat", "Bonjour, comment vas-tu?", "Hola XXX, ¿cómo estás?"), M(0.96, "MateCat", "- Bonjour, comment vas-tu ?", "- ¿Hola, cómo estás?"), M(0.96, "MateCat", "Bonjour comment vas tu ?", "hola como esta usted")] } },
  { n: "« J'ai besoin d'un médecin » fr→ar : pas changé en question", src: "J'ai besoin d'un médecin", want: "أحتاج إلى طبيب.",
    data: { responseData: { translatedText: "هل يوجد دكتور؟", match: 0.99 }, matches: [M(0.99, "Public_Corpora", "J'ai besoin d'un médecin", "هل يوجد دكتور؟"), M(0.98, "Public_Corpora", "J'ai besoin d'un médecin.", "أحتاج إلى طبيب."), M(0.97, "Public_Corpora", "J'ai besoin d'un médecin !", "أحتاج إلى طبيب!")] } },
  { n: "« Tu es arrivé à la maison ? » fr→it : la traduction automatique reste choisie (règle du 19 oct.)", src: "Tu es arrivé à la maison ?", want: "Sei arrivato a casa?",
    data: { responseData: { translatedText: "- Siamo a casa,", match: 0.97 }, matches: [M(0.97, "Public_Corpora", "Tu es arrivé à la maison?", "- Siamo a casa,"), M(0.85, "MT!", "Tu es arrivé à la maison ?", "Sei arrivato a casa?")] } },
  { n: "Correspondance exacte gardée telle quelle (« Je t'aime » → « Ti amo »)", src: "Je t'aime", want: "Ti amo",
    data: { responseData: { translatedText: "Ti amo", match: 1 }, matches: [M(1, "Public_Corpora", "Je t'aime", "Ti amo"), M(0.85, "MT!", "Je t'aime", "Je t'aime bien")] } },
  { n: "Une vraie question reste une question (« Où est la gare ? » → « ¿Dónde está la estación? »)", src: "Où est la gare ?", want: "¿Dónde está la estación?",
    data: { responseData: { translatedText: "¿Dónde está la estación?", match: 0.85 }, matches: [M(0.85, "MT!", "Où est la gare ?", "¿Dónde está la estación?")] } },
  { n: "Réponse simple sans liste matches (ancien format) : inchangée", src: "Bonjour", want: "Hello",
    data: { responseData: { translatedText: "Hello" } } },
  { n: "Si rien d'autre n'existe, « XXX » est enlevé au lieu d'être affiché", src: "Bonjour Paul", want: "Hola",
    data: { responseData: { translatedText: "Hola XXX", match: 0.97 }, matches: [M(0.97, "MateCat", "Bonjour Paul", "Hola XXX")] } },
];
let ok = 0, tot = 0;
for (const [nom, f] of [["TALK", talk], ["EVERYWHERE", ew]]) for (const k of CAS) {
  tot++; let got; try { got = f(k.data, k.src); } catch (e) { got = "ERREUR " + e.message; }
  const pass = got === k.want; if (pass) ok++;
  console.log((pass ? "OK   " : "ÉCHEC") + "  " + nom + " · " + k.n + "  — " + got);
}
console.log("\n" + ok + " / " + tot + " tests réussis");
process.exitCode = ok === tot ? 0 : 1;

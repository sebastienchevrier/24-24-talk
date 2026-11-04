// 24/24 ONE WORLD — Labo linguistique : fonction serveur « labo-traduire » (Supabase Edge Function, Deno).
// © 2026 Sébastien Chevrier. Tous droits réservés.
//
// RÔLE : traduire une PHRASE DE TEST avec une IA (Groq, offre gratuite) en respectant le sens réel et le registre.
// À déployer UNIQUEMENT sur le projet Supabase de TEST. Jamais branchée sur la messagerie.
//
// Sécurité et confidentialité :
// - La clé GROQ_API_KEY est un secret Supabase : elle n'est jamais dans le site, jamais renvoyée, jamais journalisée.
// - Aucun texte n'est enregistré ni journalisé ici. Groq dit ne pas garder les requêtes par défaut
//   (https://console.groq.com/docs/your-data) ; activer « Zero Data Retention » dans la console Groq si proposé.
// - Origines autorisées : le site officiel, la copie de test et localhost. 600 caractères au plus.
// - Limite simple : 30 demandes par minute et par instance (protège le quota gratuit).
// - Déployée avec verify_jwt = true : il faut la clé publique « anon » (JWT) du projet de TEST dans Authorization.
// - Audit F-29 (3 nov. 2026) : la clé anon est PUBLIQUE, elle ne suffit plus. Il faut AUSSI l'en-tête « x-labo-cle »
//   égal au secret serveur LABO_CLE (secret Supabase du TEST + secret GitHub Actions, choisis par Sébastien,
//   jamais dans le dépôt). Sans LABO_CLE configuré : labo FERMÉ (503). Mauvaise clé : 401.
// - Sans clé configurée : réponse 503 « IA non branchée », le labo continue sans IA.

const ORIGINES = ["https://sebastienchevrier.github.io", "https://talk-24-24-lab.github.io", "http://localhost", "http://127.0.0.1"];
// Modèle par défaut : openai/gpt-oss-120b (modèle « production » de Groq, limites gratuites et prix publiés :
// https://console.groq.com/docs/rate-limits et https://console.groq.com/docs/models). Autres modèles permis pour comparer.
const MODELES = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const MODELE_DEFAUT = Deno.env.get("LABO_MODELE") || MODELES[0];
const MAX = 600;
let fenetre = Date.now(), compte = 0;

function cors(origin: string | null) {
  const ok = origin && ORIGINES.some((o) => origin === o || origin.startsWith(o + ":"));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ORIGINES[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-labo-cle",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
function rep(status: number, corps: unknown, origin: string | null) {
  return new Response(JSON.stringify(corps), { status, headers: { ...cors(origin), "Content-Type": "application/json; charset=utf-8" } });
}
const STYLES: Record<string, string> = {
  auto: "Keep the register of the original message (casual stays casual, formal stays formal, slang becomes natural slang).",
  naturel: "Natural everyday language, neither slang nor formal.",
  familier: "Casual, warm tone, as between friends.",
  argot: "Current, natural slang of the target language, without gratuitous vulgarity.",
  soutenu: "Elevated, elegant register.",
  professionnel: "Professional, polite register suitable for work.",
  litteraire: "Literary style, carefully crafted sentences.",
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return rep(405, { erreur: "POST seulement" }, origin);
  // F-29 : contrôle du secret du labo AVANT tout appel à l'IA (comparaison en temps constant).
  const cleLabo = Deno.env.get("LABO_CLE") || "";
  if (cleLabo.length < 24) return rep(503, { erreur: "Labo fermé : secret LABO_CLE absent sur le serveur de test" }, origin);
  const donnee = req.headers.get("x-labo-cle") || "";
  let diff = donnee.length ^ cleLabo.length;
  for (let i = 0; i < cleLabo.length; i++) diff |= cleLabo.charCodeAt(i) ^ donnee.charCodeAt(i % Math.max(donnee.length, 1));
  if (diff !== 0) return rep(401, { erreur: "Accès au labo refusé" }, origin);
  const cle = Deno.env.get("GROQ_API_KEY");
  if (!cle) return rep(503, { erreur: "IA non branchée (clé absente sur le serveur de test)" }, origin);
  if (Date.now() - fenetre > 60000) { fenetre = Date.now(); compte = 0; }
  if (++compte > 30) return rep(429, { erreur: "Trop de demandes, réessayez dans une minute" }, origin);

  let d: any;
  try { d = await req.json(); } catch { return rep(400, { erreur: "JSON illisible" }, origin); }
  const texte = String(d?.texte || "").trim();
  const de = String(d?.de || "").slice(0, 12), vers = String(d?.vers || "").slice(0, 12);
  if (!texte || !de || !vers) return rep(400, { erreur: "texte, de et vers obligatoires" }, origin);
  if (texte.length > MAX) return rep(413, { erreur: "Phrase trop longue pour le labo (600 caractères)" }, origin);
  const style = STYLES[d?.style] ? d.style : "auto";
  const MODELE = MODELES.includes(String(d?.modele)) ? String(d.modele) : MODELE_DEFAUT;
  const indices = Array.isArray(d?.expressions) ? d.expressions.slice(0, 8).map((x: any) => ({
    expression: String(x?.expression || "").slice(0, 120), sens: String(x?.sens || "").slice(0, 200), equivalent_connu: x?.equivalent_connu ? String(x.equivalent_connu).slice(0, 120) : null,
  })) : [];

  const contexte = Array.isArray(d?.contexte) ? d.contexte.slice(-4).map((x: any) => String(x || "").slice(0, 300)) : [];

  const systeme = [
    "You are a professional human-quality translator. Translate what the person MEANS, not word by word.",
    "Rules:",
    "1. Idioms, metaphors and slang: never translate the image literally; use a natural equivalent in the target language if one truly exists, otherwise render the meaning naturally. Never invent an idiom that does not exist.",
    "2. Keep emotions, intensity, humour and irony. If the source is ironic, keep it ironic.",
    "3. Keep every number, time, amount, date, proper name, emoji and link exactly (times may follow target conventions, e.g. 14:00).",
    "3b. Proper names of people, places and brands stay EXACTLY as written (Marie stays Marie, never María/Maria/ماريا; transliterate letter by letter only if the script differs, e.g. Arabic ماري, Chinese 玛丽). Days of the week and dates must name the SAME day (vendredi = Friday = Ijumaa, never another day).",
    "3c. Times: the clock time must be the same moment. For Swahili (sw), if you use Swahili time (saa X), convert correctly: Swahili hour = (24h hour + 6) modulo 12, 0 meaning 12 (07:00 = saa moja asubuhi, 14:00 = saa nane mchana, 18:00 = saa kumi na mbili jioni, 20:00 = saa mbili usiku); when unsure, write the digits as in the source (14:00). Never shift a time, a day or a number.",
    "3d. Quantities words: half a dozen = 6, a dozen = 12; keep the exact quantity, never a unit change.",
    "4. Do not add or remove information. Do not explain inside the translation. Keep every negation (a 'not' stays a 'not') and the intention of the message (question stays question, request stays request, refusal stays refusal).",
    "4b. 'contexte' holds the previous messages of the conversation (oldest first). Use them ONLY to resolve ambiguity (pronouns, gender, tu/vous, meaning of a word). Never translate them, never copy information from them into the translation.",
    "4c. Politeness (T/V): French 'vous' addressed to ONE person (e.g. context presents 'Madame X', a boss, a client, a stranger) is FORMAL: use the formal form of the target language (Spanish usted, German Sie, Italian Lei, Portuguese o senhor/a senhora, Russian Вы, Arabic حضرتك/formal phrasing, Chinese 您, Japanese keigo, Swahili polite forms). 'tu' stays informal. Plural 'vous' to several people: plural form. Mention the choice in 'remarques'.",
    "4d. Arabic (ar): use Modern Standard Arabic (فصحى), never a dialect (no Egyptian, Levantine…) unless the source is itself dialectal.",
    "5. Style: " + STYLES[style],
    "6. Answer ONLY with JSON: {\"traduction\": string, \"registre_detecte\": string, \"expressions\": [{\"source\": string, \"sens\": string, \"rendu\": string, \"equivalent_direct\": boolean}], \"remarques\": string}. 'remarques' in French, short, empty if nothing to say (e.g. ambiguity, no direct equivalent, politeness level chosen).",
  ].join("\n");
  const utilisateur = JSON.stringify({ langue_source: de, langue_cible: vers, texte, contexte, indices_expressions: indices, ironie_possible: !!d?.ironie_possible });

  const t0 = Date.now();
  const corps: Record<string, unknown> = { model: MODELE, temperature: 0.2, max_completion_tokens: 1200, response_format: { type: "json_object" }, messages: [{ role: "system", content: systeme }, { role: "user", content: utilisateur }] };
  if (MODELE.startsWith("openai/gpt-oss")) corps.reasoning_effort = "low";
  const appel = (b: Record<string, unknown>) => fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST", headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" }, body: JSON.stringify(b), signal: AbortSignal.timeout(25000),
  });
  let r: Response;
  try {
    r = await appel(corps);
    if (r.status === 400 && corps.reasoning_effort) { delete corps.reasoning_effort; r = await appel(corps); }
  } catch { return rep(502, { erreur: "IA injoignable" }, origin); }
  if (r.status === 429) return rep(429, { erreur: "Quota gratuit de l'IA atteint", reessayer_dans: r.headers.get("retry-after") }, origin);
  if (!r.ok) {
    // Message d'erreur de Groq (jamais la clé, jamais le texte) pour comprendre un refus.
    let m = ""; try { m = String((await r.json())?.error?.message || "").slice(0, 160); } catch { /* rien */ }
    return rep(502, { erreur: "IA en erreur (" + r.status + ")" + (m ? " : " + m : "") }, origin);
  }
  let j: any;
  try { j = await r.json(); } catch { return rep(502, { erreur: "Réponse de l'IA illisible" }, origin); }
  let o: any;
  try { o = JSON.parse(j?.choices?.[0]?.message?.content || "{}"); } catch { return rep(502, { erreur: "JSON de l'IA illisible" }, origin); }
  if (!o || typeof o.traduction !== "string" || !o.traduction.trim()) return rep(502, { erreur: "Traduction vide" }, origin);
  return rep(200, {
    traduction: o.traduction.slice(0, 2000),
    registre_detecte: String(o.registre_detecte || "").slice(0, 80),
    expressions: Array.isArray(o.expressions) ? o.expressions.slice(0, 8) : [],
    remarques: String(o.remarques || "").slice(0, 400),
    modele: MODELE, ms: Date.now() - t0,
    jetons: j?.usage ? { entree: j.usage.prompt_tokens, sortie: j.usage.completion_tokens } : null,
  }, origin);
});

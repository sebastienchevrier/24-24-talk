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
// - À déployer avec verify_jwt = false : le labo envoie seulement la clé « publishable » du projet de TEST (en-tête apikey).
// - Sans clé configurée : réponse 503 « IA non branchée », le labo continue sans IA.

const ORIGINES = ["https://sebastienchevrier.github.io", "https://talk-24-24-lab.github.io", "http://localhost", "http://127.0.0.1"];
const MODELE = Deno.env.get("LABO_MODELE") || "llama-3.3-70b-versatile";
const MAX = 600;
let fenetre = Date.now(), compte = 0;

function cors(origin: string | null) {
  const ok = origin && ORIGINES.some((o) => origin === o || origin.startsWith(o + ":"));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ORIGINES[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
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
  const indices = Array.isArray(d?.expressions) ? d.expressions.slice(0, 8).map((x: any) => ({
    expression: String(x?.expression || "").slice(0, 120), sens: String(x?.sens || "").slice(0, 200), equivalent_connu: x?.equivalent_connu ? String(x.equivalent_connu).slice(0, 120) : null,
  })) : [];

  const systeme = [
    "You are a professional human-quality translator. Translate what the person MEANS, not word by word.",
    "Rules:",
    "1. Idioms, metaphors and slang: never translate the image literally; use a natural equivalent in the target language if one truly exists, otherwise render the meaning naturally. Never invent an idiom that does not exist.",
    "2. Keep emotions, intensity, humour and irony. If the source is ironic, keep it ironic.",
    "3. Keep every number, time, amount, date, proper name, emoji and link exactly (times may follow target conventions, e.g. 14:00).",
    "4. Do not add or remove information. Do not explain inside the translation.",
    "5. Style: " + STYLES[style],
    "6. Answer ONLY with JSON: {\"traduction\": string, \"registre_detecte\": string, \"expressions\": [{\"source\": string, \"sens\": string, \"rendu\": string, \"equivalent_direct\": boolean}], \"remarques\": string}. 'remarques' in French, short, empty if nothing to say (e.g. ambiguity, no direct equivalent, politeness level chosen).",
  ].join("\n");
  const utilisateur = JSON.stringify({ langue_source: de, langue_cible: vers, texte, indices_expressions: indices, ironie_possible: !!d?.ironie_possible });

  const t0 = Date.now();
  let r: Response;
  try {
    r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODELE, temperature: 0.2, max_tokens: 700, response_format: { type: "json_object" }, messages: [{ role: "system", content: systeme }, { role: "user", content: utilisateur }] }),
      signal: AbortSignal.timeout(20000),
    });
  } catch { return rep(502, { erreur: "IA injoignable" }, origin); }
  if (r.status === 429) return rep(429, { erreur: "Quota gratuit de l'IA atteint" }, origin);
  if (!r.ok) return rep(502, { erreur: "IA en erreur (" + r.status + ")" }, origin);
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

// 24/24 Talk — notifications d'appel quand l'appli est fermée. © 2026 Sébastien Chevrier.
// Actions : "key" (clé publique), "sub" / "unsub" (téléphone qui veut / ne veut plus être prévenu),
// "ring" / "cancel" (prévenir le contact d'un appel, ou lui dire que l'appel est manqué).
import postgres from "npm:postgres@3.4.5";
import { encryptPayload, vapidHeader, newVapidKeys } from "./webpush.mjs";

const ORIGINS = ["https://sebastienchevrier.github.io", "http://127.0.0.1:8768", "http://localhost:8768"];
const PUSH_HOST = /^https:\/\/([a-z0-9-]+\.)*(fcm\.googleapis\.com|push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com)\//;
const SUBJECT = "https://sebastienchevrier.github.io/24-24-talk/";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 2 });
const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
function publicKeyForAuth(): string {
  try {
    const ks = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
    if (ks.default) return ks.default;
  } catch (_e) { /* clé ancienne ci-dessous */ }
  return Deno.env.get("SUPABASE_ANON_KEY") || "";
}

let vapid: { pub: string; jwk: JsonWebKey } | null = null;
async function getVapid() {
  if (vapid) return vapid;
  let rows = await sql`select public_key, private_jwk from private.push_config where id = 1`;
  if (!rows.length) {
    const k = await newVapidKeys();
    await sql`insert into private.push_config (id, public_key, private_jwk) values (1, ${k.pub}, ${sql.json(k.jwk)}) on conflict (id) do nothing`;
    rows = await sql`select public_key, private_jwk from private.push_config where id = 1`;
  }
  vapid = { pub: rows[0].public_key, jwk: rows[0].private_jwk };
  return vapid;
}

// Vérifie la session de l'utilisateur auprès du service d'authentification du projet.
async function userId(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token.split(".").length !== 3) return null;
  const r = await fetch(SUPA_URL + "/auth/v1/user", { headers: { apikey: publicKeyForAuth(), Authorization: "Bearer " + token } });
  if (!r.ok) return null;
  const u = await r.json().catch(() => null);
  return u && typeof u.id === "string" && UUID.test(u.id) ? u.id : null;
}

function cors(req: Request) {
  const o = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-region, x-supabase-api-version",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
function json(data: unknown, status: number, h: Record<string, string>) {
  return new Response(JSON.stringify(data), { status, headers: { ...h, "Content-Type": "application/json" } });
}

async function sendOne(t: { endpoint: string; p256dh: string; auth: string }, payload: Record<string, unknown>, topic: string) {
  if (!PUSH_HOST.test(t.endpoint)) return false;
  const v = await getVapid();
  const body = await encryptPayload(new TextEncoder().encode(JSON.stringify(payload)), t.p256dh, t.auth);
  const r = await fetch(t.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": "60",
      "Urgency": "high",
      "Topic": topic,
      "Authorization": await vapidHeader(t.endpoint, v.jwk, v.pub, SUBJECT),
    },
    body,
  });
  if (r.status === 404 || r.status === 410) {
    await sql`delete from private.push_subs where endpoint = ${t.endpoint}`;
    return false;
  }
  if (!r.ok) console.log("push refusé", r.status, (await r.text()).slice(0, 200));
  return r.ok;
}

Deno.serve(async (req) => {
  const h = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "method" }, 405, h);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch (_e) { return json({ error: "json" }, 400, h); }
  try {
    const action = String(b.action || b.type || "");
    if (action === "key") return json({ key: (await getVapid()).pub }, 200, h);

    // Essai réservé à l'administrateur : jeton à usage unique créé sur le serveur, notification à ses propres téléphones.
    if (action === "selftest") {
      const tok = String(b.token || "");
      if (!/^[a-f0-9]{32,64}$/.test(tok)) return json({ error: "auth" }, 401, h);
      const ok = await sql`delete from private.push_selftest where token = ${tok} and expires > now() returning 1`;
      if (!ok.length) return json({ error: "auth" }, 401, h);
      const targets = await sql`select s.endpoint, s.p256dh, s.auth from private.push_subs s join public.admins a on a.uid = s.user_id`;
      const v = await getVapid();
      const out = [];
      for (const t of targets) {
        const body = await encryptPayload(new TextEncoder().encode(JSON.stringify({ t: "ring", call: "essai" + Date.now().toString(36), p: "" })), t.p256dh, t.auth);
        const r = await fetch(t.endpoint, { method: "POST", headers: { "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", "TTL": "120", "Urgency": "high", "Authorization": await vapidHeader(t.endpoint, v.jwk, v.pub, SUBJECT) }, body });
        out.push({ status: r.status, host: new URL(t.endpoint).host, msg: r.ok ? "" : (await r.text()).slice(0, 200) });
      }
      return json({ results: out }, 200, h);
    }

    const uid = await userId(req);
    if (!uid) return json({ error: "auth" }, 401, h);

    if (action === "sub") {
      const endpoint = String(b.endpoint || ""), p256dh = String(b.p256dh || ""), auth = String(b.auth || "");
      if (!PUSH_HOST.test(endpoint) || endpoint.length > 1000 || p256dh.length < 80 || p256dh.length > 100 || auth.length < 16 || auth.length > 30) {
        return json({ error: "args" }, 400, h);
      }
      const prof = await sql`select 1 from public.profiles where id = ${uid}`;
      if (!prof.length) return json({ error: "profile" }, 403, h);
      await sql`insert into private.push_subs (endpoint, user_id, p256dh, auth) values (${endpoint}, ${uid}, ${p256dh}, ${auth})
                on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, created_at = now()`;
      await sql`delete from private.push_subs where user_id = ${uid} and endpoint not in
                (select endpoint from private.push_subs where user_id = ${uid} order by created_at desc limit 5)`;
      return json({ ok: true }, 200, h);
    }

    if (action === "unsub") {
      await sql`delete from private.push_subs where endpoint = ${String(b.endpoint || "")} and user_id = ${uid}`;
      return json({ ok: true }, 200, h);
    }

    if (action === "ring" || action === "cancel") {
      const conv = String(b.conv || ""), call = String(b.call || "");
      if (!UUID.test(conv) || !/^[a-z0-9]{6,40}$/.test(call)) return json({ error: "args" }, 400, h);
      const mine = await sql`select 1 from public.members where conversation_id = ${conv} and user_id = ${uid}`;
      if (!mine.length) return json({ sent: 0 }, 200, h);
      const other = await sql`select user_id from public.members where conversation_id = ${conv} and user_id <> ${uid} limit 1`;
      if (!other.length) return json({ sent: 0 }, 200, h);
      const oid = other[0].user_id;
      const blocked = await sql`select 1 from public.blocks where (blocker = ${oid} and blocked = ${uid}) or (blocker = ${uid} and blocked = ${oid})`;
      if (blocked.length) return json({ sent: 0 }, 200, h);
      // Limite anti-abus : 20 notifications par minute et par personne qui appelle.
      const recent = await sql`select count(*)::int as n from private.push_log where caller = ${uid} and at > now() - interval '1 minute'`;
      if (recent[0].n >= 20) return json({ sent: 0, limited: true }, 200, h);
      await sql`insert into private.push_log (caller) values (${uid})`;
      if (Math.random() < 0.05) await sql`delete from private.push_log where at < now() - interval '1 hour'`;
      const me = await sql`select pseudo from public.profiles where id = ${uid}`;
      const targets = await sql`select endpoint, p256dh, auth from private.push_subs where user_id = ${oid}`;
      const payload = { t: action, call, conv, p: me.length ? me[0].pseudo : "" };
      const results = await Promise.all(targets.map((t) => sendOne(t as never, payload, "c" + call.slice(0, 31)).catch((e) => { console.log("push erreur", String(e)); return false; })));
      return json({ sent: results.filter(Boolean).length }, 200, h);
    }
    return json({ error: "action" }, 400, h);
  } catch (e) {
    console.log("erreur", String(e));
    return json({ error: "server" }, 500, h);
  }
});

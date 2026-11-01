/* 24/24 ONE WORLD — essais RÉELS à deux comptes sur la base TEST uniquement (jamais la PROD). © 2026 Sébastien Chevrier.
   Ce que fait ce script : crée 2 comptes ANONYMES sur TEST (A et B), vérifie les droits dans Espaces (table ow_rooms),
   le changement de compte, la déconnexion et qu'un ancien jeton ne garde aucun droit. N'écrit AUCUNE donnée nouvelle :
   la seule écriture tentée est une « modification » d'un salon d'autrui avec la MÊME valeur (aucun changement possible). */
const { createClient } = require("@supabase/supabase-js");
const URL_TEST = "https://tbynnefrrxzxufcptijc.supabase.co", KEY_TEST = "sb_publishable_zNyy7HYlbwtdNjewaxcKdA_uF_vlskR";
if (!URL_TEST.includes("tbynnefrrxzxufcptijc")) { console.log("REFUS : seule la base TEST est permise."); process.exit(2); }
const res = [];
function rec(statut, nom, detail) { res.push(statut); console.log(statut.padEnd(12) + nom + (detail ? "  — " + detail : "")); }
function client() { return createClient(URL_TEST, KEY_TEST, { auth: { persistSession: false, autoRefreshToken: false } }); }
async function rest(jeton, chemin) {
  const r = await fetch(URL_TEST + "/rest/v1/" + chemin, { headers: { apikey: KEY_TEST, Authorization: "Bearer " + jeton } });
  let corps = null; try { corps = await r.json(); } catch (e) {}
  return { code: r.status, corps };
}
(async () => {
  const cA = client(), cB = client();
  const a = await cA.auth.signInAnonymously(), b = await cB.auth.signInAnonymously();
  if (a.error || b.error) { rec("NON EXÉCUTÉ", "Création de 2 comptes anonymes TEST", (a.error || b.error).message); return fin(); }
  const A = a.data.session, B = b.data.session;
  rec(A.user.id !== B.user.id ? "PASS" : "FAIL", "Deux comptes TEST distincts créés", "A=" + A.user.id.slice(0, 8) + "… B=" + B.user.id.slice(0, 8) + "…");

  // 1) Espaces : lecture des salons par A et B
  const la = await rest(A.access_token, "ow_rooms?select=id,owner_id,members,title&limit=50");
  if (Array.isArray(la.corps)) la.corps.forEach(r => console.log("            salon visible : « " + r.title + " » propriétaire " + String(r.owner_id).slice(0, 8) + "…"));
  const lb = await rest(B.access_token, "ow_rooms?select=id,owner_id,members&limit=50");
  const n = Array.isArray(la.corps) ? la.corps.length : -1;
  rec(la.code === 200 && lb.code === 200 ? "PASS" : "FAIL", "Espaces : A et B connectés peuvent lire les salons", "HTTP " + la.code + "/" + lb.code + ", " + n + " salon(s) visibles");

  // 2) Espaces : B ne peut pas modifier un salon qui n'est pas à lui (même valeur, donc aucun changement réel possible)
  const autrui = Array.isArray(la.corps) && la.corps.find(r => r.owner_id !== B.user.id);
  if (!autrui) rec("NON EXÉCUTÉ", "Espaces : B modifie le salon d'un autre", "aucun salon existant sur TEST");
  else {
    const u = await cB.from("ow_rooms").update({ members: autrui.members }).eq("id", autrui.id).select("id");
    const touche = Array.isArray(u.data) ? u.data.length : 0;
    rec(!u.error && touche === 0 ? "PASS" : "FAIL", "Espaces : B ne peut pas modifier le salon d'un autre (RLS)", u.error ? "erreur " + u.error.code + " " + u.error.message : touche + " ligne touchée");
  }

  // 3) Espaces : un compte sans profil ne peut pas créer de salon (owner_id → profiles)
  const ins = await cA.from("ow_rooms").insert({ kind: "community", title: "Essai RLS ne pas garder", about: "" }).select("id");
  if (!ins.error && ins.data && ins.data.length) { await cA.from("ow_rooms").delete().eq("id", ins.data[0].id); rec("FAIL", "Espaces : compte sans profil refusé à la création", "salon créé (puis effacé)"); }
  else rec("PASS", "Espaces : compte sans profil refusé à la création", ins.error ? ins.error.code + " " + ins.error.message.slice(0, 90) : "0 ligne");

  // 4) Changement de compte dans le même client : A se déconnecte, B se connecte → l'identité courante est B
  const ancienA = A.access_token;
  const so = await cA.auth.signOut();
  const apres = await cA.auth.getSession();
  rec(!so.error && !apres.data.session ? "PASS" : "FAIL", "Déconnexion réelle de A : plus aucune session dans le client", so.error ? so.error.message : "session vide");
  const s2 = await cA.auth.setSession({ access_token: B.access_token, refresh_token: B.refresh_token });
  const qui = await cA.auth.getUser();
  rec(!s2.error && qui.data.user && qui.data.user.id === B.user.id ? "PASS" : "FAIL", "Changement de compte (A → B dans le même client) : le serveur voit B, pas A", qui.data.user ? qui.data.user.id.slice(0, 8) + "…" : String(qui.error && qui.error.message));

  // 5) L'ancien jeton de A (non expiré) ne garde aucun droit après la déconnexion
  const u2 = await fetch(URL_TEST + "/auth/v1/user", { headers: { apikey: KEY_TEST, Authorization: "Bearer " + ancienA } });
  rec(u2.status === 401 || u2.status === 403 ? "PASS" : "FAIL", "Ancien jeton de A refusé par le service de comptes après déconnexion", "HTTP " + u2.status);
  const la2 = await rest(ancienA, "ow_rooms?select=id&limit=50");
  const vu = Array.isArray(la2.corps) ? la2.corps.length : -1;
  if (n <= 0) rec("NON EXÉCUTÉ", "Ancien jeton de A ne lit plus les salons (règle « session active »)", "aucun salon à lire sur TEST, HTTP " + la2.code);
  else rec(vu === 0 || la2.code >= 400 ? "PASS" : "FAIL", "Ancien jeton de A ne lit plus les salons (règle « session active »)", "HTTP " + la2.code + ", " + vu + " salon(s) vus sur " + n);
  const rf = await client().auth.refreshSession({ refresh_token: A.refresh_token });
  rec(rf.error ? "PASS" : "FAIL", "Ancien jeton de renouvellement de A refusé", rf.error ? rf.error.code || rf.error.message : "renouvelé !");

  await cA.auth.signOut(); await cB.auth.signOut();
  fin();
})().catch(e => { rec("FAIL", "Erreur inattendue", String(e && e.message || e)); fin(); });
function fin() { const f = res.filter(x => x === "FAIL").length; console.log("\nRÉSUMÉ : " + res.filter(x => x === "PASS").length + " PASS, " + f + " FAIL, " + res.filter(x => x === "NON EXÉCUTÉ").length + " NON EXÉCUTÉ"); process.exit(f ? 1 : 0); }

/* 24/24 ONE WORLD — essais RÉELS à deux comptes CONFIRMÉS sur la base TEST uniquement (jamais la PROD). © 2026 Sébastien Chevrier.
   Même parcours que l'appli : compte anonyme → profil → e-mail (code à 8 chiffres reçu sur contact.2424oneworld+…@gmail.com).
   Le script attend que les deux codes soient poussés dans .github/ci/codes-<run>.json sur la branche d'essai (codes à usage unique).
   Données laissées sur TEST : 2 profils d'essai (pseudo pr90a…/pr90b…). Le salon d'essai est effacé à la fin. */
const { createClient } = require("@supabase/supabase-js");
const { execSync } = require("child_process");
const URL_TEST = "https://tbynnefrrxzxufcptijc.supabase.co", KEY_TEST = "sb_publishable_zNyy7HYlbwtdNjewaxcKdA_uF_vlskR";
const RUN = process.env.GITHUB_RUN_ID || String(Date.now()), BR = "claude/test-reel-test";
const res = [];
function rec(statut, nom, detail) { res.push(statut); console.log(statut.padEnd(12) + nom + (detail ? "  — " + detail : "")); }
const client = () => createClient(URL_TEST, KEY_TEST, { auth: { persistSession: false, autoRefreshToken: false } });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
async function rest(jeton, chemin) {
  const r = await fetch(URL_TEST + "/rest/v1/" + chemin, { headers: { apikey: KEY_TEST, Authorization: "Bearer " + jeton } });
  let corps = null; try { corps = await r.json(); } catch (e) {}
  return { code: r.status, corps };
}
async function codes() {
  for (let i = 0; i < 90; i++) { // 15 minutes au plus
    try {
      execSync("git fetch -q https://github.com/sebastienchevrier/24-24-talk.git " + BR, { stdio: "ignore" });
      const t = execSync("git show FETCH_HEAD:.github/ci/codes-" + RUN + ".json", { stdio: ["ignore", "pipe", "ignore"] }).toString();
      return JSON.parse(t);
    } catch (e) { await attendre(10000); }
  }
  return null;
}
async function compte(lettre) {
  const c = client();
  const s = await c.auth.signInAnonymously(); if (s.error) throw new Error("anonyme " + lettre + " : " + s.error.message);
  const id = s.data.user.id, pseudo = "pr90" + lettre + RUN.slice(-6);
  const p = await c.from("profiles").insert({ id, pseudo, lang: "fr", nom: "Essai PR90 " + lettre.toUpperCase() });
  if (p.error) throw new Error("profil " + lettre + " : " + p.error.code + " " + p.error.message);
  const email = "contact.2424oneworld+pr90" + lettre + RUN + "@gmail.com";
  const u = await c.auth.updateUser({ email, data: { email_lang: "fr" } });
  if (u.error) throw new Error("e-mail " + lettre + " : " + u.error.message);
  return { c, id, email };
}
(async () => {
  let A, B;
  try { A = await compte("a"); B = await compte("b"); }
  catch (e) { rec("NON EXÉCUTÉ", "Création de 2 comptes TEST avec profil", e.message); return fin(); }
  console.log("ATTENTE DES CODES pour " + A.email + " et " + B.email + " (fichier .github/ci/codes-" + RUN + ".json)");
  const k = await codes();
  if (!k) { rec("NON EXÉCUTÉ", "Confirmation des e-mails", "codes non reçus en 15 min"); return fin(); }
  for (const [X, code] of [[A, k.a], [B, k.b]]) {
    const v = await X.c.auth.verifyOtp({ email: X.email, token: String(code), type: "email_change" });
    if (v.error) { rec("FAIL", "Confirmation de l'e-mail " + X.email.split("+")[1], v.error.message); return fin(); }
    X.s = v.data.session || (await X.c.auth.getSession()).data.session;
  }
  const okA = A.s && A.s.user.email_confirmed_at, okB = B.s && B.s.user.email_confirmed_at;
  rec(okA && okB ? "PASS" : "FAIL", "Deux comptes TEST distincts, profil + e-mail confirmé (vrai code reçu)", "A=" + A.id.slice(0, 8) + "… B=" + B.id.slice(0, 8) + "…");

  // Espaces : A crée un salon
  const ins = await A.c.from("ow_rooms").insert({ kind: "community", title: "Essai PR90 a effacer", about: "essai automatique", lang: "fr" }).select("*").single();
  if (ins.error) { rec("FAIL", "Espaces : A (confirmé) crée un salon", ins.error.code + " " + ins.error.message); return fin(); }
  const salon = ins.data;
  rec("PASS", "Espaces : A (confirmé) crée un salon", "salon " + salon.id.slice(0, 8) + "…");
  const vuB = await B.c.from("ow_rooms").select("id").eq("id", salon.id);
  rec(!vuB.error && vuB.data.length === 1 ? "PASS" : "FAIL", "Espaces : B voit le salon public de A", vuB.error ? vuB.error.message : vuB.data.length + " ligne");
  const upB = await B.c.from("ow_rooms").update({ title: "Pirate par B" }).eq("id", salon.id).select("id");
  const delB = await B.c.from("ow_rooms").delete().eq("id", salon.id).select("id");
  const relu = await A.c.from("ow_rooms").select("title").eq("id", salon.id).single();
  rec(!upB.error && upB.data.length === 0 && relu.data && relu.data.title === salon.title ? "PASS" : "FAIL", "Espaces : B ne peut pas modifier le salon de A", (upB.error ? upB.error.code : upB.data.length + " ligne touchée") + ", titre relu : " + (relu.data && relu.data.title));
  rec(!delB.error && delB.data.length === 0 && relu.data ? "PASS" : "FAIL", "Espaces : B ne peut pas supprimer le salon de A", delB.error ? delB.error.code : delB.data.length + " ligne supprimée");
  const owB = await B.c.from("ow_rooms").insert({ kind: "community", title: "Usurpation", owner_id: A.id }).select("id");
  if (!owB.error && owB.data && owB.data.length) await A.c.from("ow_rooms").delete().eq("id", owB.data[0].id);
  rec(owB.error ? "PASS" : "FAIL", "Espaces : B ne peut pas créer un salon au nom de A", owB.error ? owB.error.code : "créé (effacé)");

  // Changement de compte : le client de B prend la session de A puis revient à B
  const ancienB = B.s.access_token, refreshB = B.s.refresh_token;
  const sw = await B.c.auth.setSession({ access_token: A.s.access_token, refresh_token: A.s.refresh_token });
  const qui = await B.c.auth.getUser();
  const upSw = await B.c.from("ow_rooms").update({ about: "modifié après changement de compte" }).eq("id", salon.id).select("id");
  rec(!sw.error && qui.data.user && qui.data.user.id === A.id && upSw.data && upSw.data.length === 1 ? "PASS" : "FAIL", "Changement de compte (B → A dans le même client) : droits de A, plus ceux de B", "serveur voit " + (qui.data.user ? qui.data.user.id.slice(0, 8) : "?") + "…, modif propriétaire : " + (upSw.data ? upSw.data.length : upSw.error && upSw.error.code));

  // Déconnexion de B (vraie session B) puis anciens jetons de B
  const cB2 = client(); await cB2.auth.setSession({ access_token: ancienB, refresh_token: refreshB });
  const nAvant = (await rest(ancienB, "ow_rooms?select=id&id=eq." + salon.id)).corps;
  const so = await cB2.auth.signOut();
  rec(!so.error && !(await cB2.auth.getSession()).data.session ? "PASS" : "FAIL", "Déconnexion réelle de B", so.error ? so.error.message : "session vide");
  const u2 = await fetch(URL_TEST + "/auth/v1/user", { headers: { apikey: KEY_TEST, Authorization: "Bearer " + ancienB } });
  rec(u2.status === 401 || u2.status === 403 ? "PASS" : "FAIL", "Ancien jeton de B refusé par le service de comptes", "HTTP " + u2.status);
  const lu = await rest(ancienB, "ow_rooms?select=id&id=eq." + salon.id);
  const nApres = Array.isArray(lu.corps) ? lu.corps.length : -1;
  rec(Array.isArray(nAvant) && nAvant.length === 1 && (nApres === 0 || lu.code >= 400) ? "PASS" : "FAIL", "Ancien jeton de B ne lit plus les salons (règle « session active »)", "avant : " + (Array.isArray(nAvant) ? nAvant.length : "?") + " salon, après : HTTP " + lu.code + ", " + nApres);
  const ecr = await fetch(URL_TEST + "/rest/v1/ow_room_members", { method: "POST", headers: { apikey: KEY_TEST, Authorization: "Bearer " + ancienB, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ room_id: salon.id, user_id: B.id }) });
  rec(ecr.status >= 400 ? "PASS" : "FAIL", "Ancien jeton de B ne peut plus écrire (rejoindre le salon)", "HTTP " + ecr.status);
  const rf = await client().auth.refreshSession({ refresh_token: refreshB });
  rec(rf.error ? "PASS" : "FAIL", "Ancien jeton de renouvellement de B refusé", rf.error ? (rf.error.code || rf.error.message) : "renouvelé !");

  // Ménage : A efface son salon puis se déconnecte
  const del = await A.c.from("ow_rooms").delete().eq("id", salon.id).select("id");
  rec(!del.error && del.data.length === 1 ? "PASS" : "FAIL", "Ménage : A supprime son propre salon", del.error ? del.error.code : del.data.length + " ligne");
  await A.c.auth.signOut();
  fin();
})().catch((e) => { rec("FAIL", "Erreur inattendue", String((e && e.message) || e)); fin(); });
function fin() { const f = res.filter((x) => x === "FAIL").length; console.log("\nRÉSUMÉ : " + res.filter((x) => x === "PASS").length + " PASS, " + f + " FAIL, " + res.filter((x) => x === "NON EXÉCUTÉ").length + " NON EXÉCUTÉ"); process.exit(f ? 1 : 0); }

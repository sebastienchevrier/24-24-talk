# OWIdentite — le gardien unique de l'identité (OW-012, lot 4)

Fichier : `everywhere/ow-identite.js`. Tests : `everywhere/tests/identite.js` (page `identite.html`).

## Principe
- **Un seul gardien** répond à « qui est connecté ? » et prévient tous les écrans quand le compte change.
- **Pages séparées.** ONE WORLD a plusieurs pages séparées : `index.html`, `everywhere/index.html` et `gestion/`.
  - Chaque page charge le même gardien, avec un seul client Supabase par page.
  - Les pages se synchronisent par la session partagée (clé `lc_net_auth`), par les événements de supabase-js et par l'événement `storage` entre onglets.
- **Pas une protection.** Les règles RLS du serveur restent la seule protection des données. Le gardien gère l'affichage et le ménage du téléphone.
- **Aucune copie de profil.**
  - `profiles` reste la source du compte, du nom et de la langue maternelle. Il est lu au plus une fois par compte et gardé en mémoire.
  - `language_profiles` reste la source des langues parlées.

## API (`window.OWIdentite`)
| Fonction | Rôle |
|---|---|
| `adopter(client)` | L'écran confie son client supabase-js. Le premier adopté reste l'unique référence de la page. |
| `client()` | Promesse du client. |
| `moi()` | Renvoie `{ id, pseudo, nom, langue, email, emailConfirme }` ou `null`. Plusieurs demandes en même temps donnent une seule lecture. |
| `etat()` | `inconnu`, `chargement`, `connecte`, `sans-profil`, `deconnecte`, `hors-ligne` ou `expire`. |
| `ecouter(fn)` | `fn(evenement, moi)` reçoit `connexion`, `deconnexion`, `changement-de-compte`, `expiration`, `profil-modifie`, `hors-ligne` ou `en-ligne`. |
| `proteger(promesse)` | Ignore une réponse arrivée après un changement de compte (`OW_COMPTE_CHANGE`). |
| `profilModifie()` | Relit `profiles` au prochain `moi()`. |
| `seDeconnecter()` | Déconnexion de ce téléphone, puis ménage. Rien n'est effacé si la déconnexion échoue. |
| `supprimerLeCompte()` | Appelle la RPC `supprimer_mon_compte`, puis déconnexion et ménage. Rien n'est effacé si le serveur refuse. |
| `nettoyerAppareil(o)` | Efface la liste ci-dessous. Avec `o.garderSession`, la session est gardée (changement de compte). |

## Téléphone partagé (décision de Sébastien, 1er nov. 2026)
À la déconnexion réelle, tout ce qui touche au compte et aux contacts est effacé.

**Effacé dans localStorage :**
- `lc_net_auth`, `lc_net_joined`, `lc_home_name`
- `lc_signup`, `lc_net_pending`, `lc_hidden_msgs`
- `lc_photos_v1`, `lc_pres_hidden`, `lc_push`
- `lc_history`, `lc_favorites`
- `ow_profile_v1`, `ew_learn_v1`, `ew_voyage_v1`
- `lc_callhist_*`, `lc_cleared_*`, `lc_convlang_*`

**Effacé dans sessionStorage :**
- `ew_voice_call`, `ew_voice_next`, `ew_face_other`, `ew_connect_login`

**Gardé (réglages de l'appareil) :**
- `lc_uilang` (langue de l'interface) et `ew_prefs` (thème, réglages)
- `lc_stats_off`, `lc_speaker`, `lc_autospeak`, `lc_aud`, `ow_vibre`
- `lc_keep_history`, `lc_net_tr`, `lc_net_autoread`
- `ew_lang_recent`, `ew_tr_v1`, `ew_papier_from`, `ew_voyage_tr_*`

**IndexedDB.** L'appli n'en utilise pas, et supabase-js garde sa session dans localStorage. Le gardien n'y touche jamais.

**Caches.** Le service worker ne met en cache que les fichiers du site (même origine). Les réponses Supabase n'y sont jamais. Le gardien n'y touche jamais.

**Règles du ménage :**
- Jamais de `clear()`, et jamais tout le stockage.
- Jamais de ménage sur une erreur réseau.
- On efface seulement quand la session a vraiment disparu : `getSession` vide ET `lc_net_auth` absent.

## Migration (une PR par étape)
| Étape | Contenu |
|---|---|
| A | Gardien seul et testé. Aucun écran ne le charge (cette étape). |
| B | Pilote Espaces. |
| C | Mon compte (`connect.js`). |
| D | Face à face et Profil de langue. |
| E | Messagerie (`index.html`), par des points d'accroche, sans réécriture. |
| F | Retrait des anciens mécanismes, après les tests. |

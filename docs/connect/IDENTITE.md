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
| `moi()` | Renvoie `{ id, pseudo, nom, langue, email, emailConfirme }` ou `null`. Plusieurs demandes en même temps donnent une seule lecture. `emailConfirme` = vrai indicateur Supabase `email_confirmed_at` (jamais la simple présence d'une adresse) ; toujours `false` pour un compte anonyme. |
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
| A | Gardien seul et testé. Aucun écran ne le charge. (PR 89) |
| B | Pilote Espaces : le portail charge le gardien, `espaces.js` lit le compte par `moi()` et écoute `ecouter()`. Changement de compte, déconnexion ou session expirée : salon ou direct arrêté (caméra, micro, temps réel), écran vidé puis redessiné pour le compte actuel. Les autres écrans du portail ne sont pas branchés. |
| C | Mon compte (`connect.js`). Reste à faire ici : désabonner les notifications push (`push_subs`) côté serveur à la déconnexion. |
| D | Face à face et Profil de langue. |
| E | Messagerie (`index.html`), par des points d'accroche, sans réécriture. Abonnement push du téléphone retiré à la déconnexion et au changement de compte. |
| F | Retrait des anciens mécanismes, après les tests. |

## Essais
- `everywhere/tests/identite.js` : gardien seul, faux client (dont e-mail confirmé, non confirmé, anonyme).
- `everywhere/tests/identite-reel.js` : gardien + VRAIE bibliothèque supabase-js 2.117.2 (empreinte SRI vérifiée).
  - Mode local (par défaut) : serveur d'authentification imité, aucune sortie sur Internet.
  - Mode TEST (`OW_REEL=TEST`) : vraie base TEST, crée 1 compte anonyme par passage ; la PROD est refusée.
  - Constat sur la vraie bibliothèque : un renouvellement refusé lors d'un appel explicite `refreshSession()` ne supprime pas la session ; c'est à l'ouverture (jeton expiré) que supabase-js la supprime. Le gardien suit la session réelle dans les deux cas.
- `everywhere/tests/espaces.js` : étape B (changement de compte pendant un direct, réponse lente de l'ancien compte, déconnexion, reconnexion).

## Niveaux de validation (état au 1er nov. 2026, PR 90)
| Niveau | Fait ? | Détail |
|---|---|---|
| 1. Faux serveur (Chromium) | OUI | identite 23/23, espaces 33/33 (10 essais étape B, dont enDirect strict et courses), e2e, messagerie, visio, terre, expert, piliers, profil-voyage |
| 2. Vraie bibliothèque supabase-js 2.117.2 | OUI | identite-reel.js en mode local 12/12 (serveur d'authentification imité) |
| 3. Vraie base TEST | NON | prêt (`OW_REEL=TEST`), pas lancé : réseau de Claude bloqué vers supabase.co. À lancer depuis un poste ou GitHub Actions. Crée 1 compte anonyme sur TEST. |
| 4. Vrai téléphone | NON | à faire par Sébastien après fusion sur TEST/PROD : 2 comptes sur le même téléphone, direct en cours. |
La PROD n'est jamais utilisée pour les essais (page et script la refusent).

## Direct abandonné (« en direct » qui restait affiché)
- Capacités existantes vérifiées (lecture TEST, 1er nov.) : colonnes `live_on`, `last_at` ; règle « modifier mon salon » (le propriétaire peut écrire `last_at`) ; `ow_before_msg` met `last_at` à jour à chaque message ; pas de pg_cron. Aucune fonction ni RPC nouvelle.
- Choix sans SQL : l'animateur renouvelle `last_at` chaque minute pendant son direct ; un salon n'est annoncé « en direct » que si `live_on` vaut vrai ET `last_at` est une date lisible, de moins de 5 min, et pas plus de 2 min dans le futur (horloge des téléphones). `last_at` absent, null ou illisible = pas en direct.
- Limite : `live_on` reste vrai dans la base (non affiché). Une fermeture côté serveur demanderait du SQL (à proposer et valider séparément).

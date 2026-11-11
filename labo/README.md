# Labo linguistique (prototype isolé)

© 2026 Sébastien Chevrier. Tous droits réservés.

Ce dossier mesure ce qu'apporterait une traduction qui comprend **le sens réel et le registre**. **Il n'est pas branché sur l'application** : aucune page de l'appli ou de la vitrine n'y mène, la page n'est pas indexée, et elle ne lit ni n'écrit aucune donnée de compte. L'essai `everywhere/tests/labo-linguistique.js` le vérifie.

| Fichier | Rôle |
|---|---|
| `index.html` | Page de test : une phrase, 3 colonnes (MyMemory seul, MyMemory + pré-édition, IA de test) et les contrôles |
| `moteur/socle.js` | Moteur en 5 couches : A identification, B compréhension, C adaptation, D traduction (moteurs branchés de l'extérieur), E contrôle |
| `donnees/expressions-fr.js` | 51 expressions françaises : sens réel, registres, équivalents en en/es/ar/zh/sw. **Rédigées par Claude, non validées par des natifs.** |
| `tests/batterie.js` | 35 phrases en 15 familles (normal, familier, argot, soutenu, formel, idiomes, métaphores, humour, ironie, régional, faux amis, ambigu, long, mélange, nombres et noms) |
| `tests/banc-reel.js` | Banc **réel** (Internet) : `node labo/tests/banc-reel.js en [--ia]`, lancé par le workflow « Labo linguistique — banc réel » |
| `serveur/labo-traduire.ts` | Fonction Supabase du projet de **TEST** : IA gratuite (Groq) avec la clé en secret serveur |

## Ce que le prototype sait faire, et ses limites

- **Compréhension** : seulement pour le **français** (listes écrites à la main). Les autres langues sont identifiées, sans plus.
- **Détection de langue** : par l'écriture (fiable) et par mots fréquents pour l'alphabet latin (fragile sur 2 ou 3 mots).
- **Ironie** : repérée seulement avec un signe écrit (« bravo… », 🙄, « comme d'habitude »). Sans signe, elle n'est **pas** vue.
- **Pré-édition** : remplace l'image par son sens pour les formes conjuguées prévues ; ailleurs l'expression est seulement signalée.
- **Contrôles** : nombres, heures, montants, noms propres (alphabet latin), émojis, liens, longueur, mots-pièges du mot-à-mot, faux amis, heures en swahili. Ils **signalent**, ils ne corrigent pas, et ne remplacent pas une relecture native.
- La batterie a été écrite **en même temps** que le moteur : réussir la batterie n'est **pas** une évaluation indépendante.

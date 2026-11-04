# ONE WORLD AI LAB — Fiabilité par langue (phase 5)

Généré le 2026-11-04 04:07 UTC à partir de 5 tranche(s) mesurée(s). TEST seulement.

**Attention : « sans problème détecté » n'est pas « correct ».** Les contrôles automatiques ne voient pas tout. Aucune langue n'est validée sans relecture native.

Erreurs : **grave** = change un fait (nombre, heure, jour, nom, négation, mauvaise langue) ; **sens** = mot à mot, sens inventé ou perdu ; **contexte** = tu/vous, pronom. « — » = pas mesuré dans cette tranche (tranches d'avant la phase 5).

Décision IA : **autorisée en test** si ≥ 90 % sans problème détecté, 0 erreur grave et au moins aussi bien que MyMemory ; **exclue** si ≥ 2 erreurs graves, < 50 %, ou 10 points de moins que MyMemory ; sinon **à surveiller**. Coût réel : 0 € (offres gratuites).

| Langue | Moteur | Phrases | Sans problème détecté | Graves | Sens | Contexte | Non vérifié | Latence | Coût réel (si payant) | Décision |
|---|---|---|---|---|---|---|---|---|---|---|
| Basque (eu) | MyMemory | 4 | 75 % | — | — | — | — | 603 ms | 0 € | référence |
| Basque (eu) | petite IA gpt-oss-20b | 4 | 75 % | — | — | — | — | 661 ms | 0 € (0.000081 $) | **à surveiller** — trop peu de phrases mesurées (4) |
| Persan (Farsi) (fa) | MyMemory | 0 | — % | 0 | 0 | 0 | 0 | 553 ms | 0 € | référence |
| Persan (Farsi) (fa) | petite IA gpt-oss-20b | 11 | 91 % | — | — | — | — | 565 ms | 0 € (0.000073 $) | **à surveiller** — 91 % mais erreurs graves pas encore classées : remesurer |
| Persan (Farsi) (fa) | grande IA gpt-oss-120b | 12 | 83 % | 0 | 0 | 0 | 2 | 843 ms | 0 € (0.00022 $) | **à surveiller** — 83 %, 0 grave(s), écart MyMemory +0 |
| Persan (Farsi) (fa) | petite IA ? | 0 | — % | 0 | 0 | 0 | 0 | — ms | 0 € (—) | **exclue** — aucune mesure |
| Guarani (gn) | MyMemory | 0 | — % | 0 | 0 | 0 | 0 | 735 ms | 0 € | référence |
| Guarani (gn) | petite IA gpt-oss-20b | 13 | 69 % | — | — | — | — | 739 ms | 0 € (0.0001 $) | **à surveiller** — 69 %, graves non classées, écart MyMemory +0 |
| Guarani (gn) | grande IA gpt-oss-120b | 13 | 85 % | 0 | 2 | 0 | 0 | 832 ms | 0 € (0.000262 $) | **à surveiller** — 85 %, 0 grave(s), écart MyMemory +0 |
| Guarani (gn) | petite IA ? | 0 | — % | 0 | 0 | 0 | 0 | — ms | 0 € (—) | **exclue** — aucune mesure |
| Khmer (km) | MyMemory | 0 | — % | 0 | 0 | 0 | 0 | 699 ms | 0 € | référence |
| Khmer (km) | petite IA gpt-oss-20b | 13 | 100 % | — | — | — | — | 665 ms | 0 € (0.000086 $) | **à surveiller** — 100 % mais erreurs graves pas encore classées : remesurer |
| Khmer (km) | grande IA gpt-oss-120b | 13 | 100 % | 0 | 0 | 0 | 0 | 810 ms | 0 € (0.000259 $) | **autorisée en test** — 100 % sans problème détecté, aucune erreur grave, au moins aussi bien que MyMemory |
| Khmer (km) | petite IA ? | 0 | — % | 0 | 0 | 0 | 0 | — ms | 0 € (—) | **exclue** — aucune mesure |
| Kurde (ku) | MyMemory | 3 | 0 % | — | — | — | — | 598 ms | 0 € | référence |
| Kurde (ku) | petite IA gpt-oss-20b | 3 | 100 % | — | — | — | — | 897 ms | 0 € (0.000133 $) | **à surveiller** — trop peu de phrases mesurées (3) |
| Lingala (ln) | MyMemory | 1 | 100 % | 0 | 0 | 0 | 0 | 755 ms | 0 € | référence |
| Lingala (ln) | petite IA gpt-oss-20b | 13 | 69 % | — | — | — | — | 814 ms | 0 € (0.000134 $) | **exclue** — l'IA dégrade le résultat (-31 points face à MyMemory) |
| Lingala (ln) | grande IA gpt-oss-120b | 1 | 0 % | 0 | 1 | 0 | 0 | 1072 ms | 0 € (0.000207 $) | **à surveiller** — trop peu de phrases mesurées (1) |
| Malgache (mg) | MyMemory | 0 | — % | 0 | 0 | 0 | 0 | 703 ms | 0 € | référence |
| Malgache (mg) | petite IA gpt-oss-20b | 13 | 100 % | — | — | — | — | 579 ms | 0 € (0.000084 $) | **à surveiller** — 100 % mais erreurs graves pas encore classées : remesurer |
| Malgache (mg) | grande IA gpt-oss-120b | 13 | 100 % | 0 | 0 | 0 | 0 | 751 ms | 0 € (0.000229 $) | **autorisée en test** — 100 % sans problème détecté, aucune erreur grave, au moins aussi bien que MyMemory |
| Malgache (mg) | petite IA ? | 0 | — % | 0 | 0 | 0 | 0 | — ms | 0 € (—) | **exclue** — aucune mesure |
| Mooré (mos) | MyMemory | 0 | — % | 0 | 0 | 0 | 0 | 694 ms | 0 € | référence |
| Mooré (mos) | petite IA gpt-oss-20b | 2 | 0 % | — | — | — | — | 1369 ms | 0 € (0.000154 $) | **à surveiller** — trop peu de phrases mesurées (2) |
| Mooré (mos) | grande IA gpt-oss-120b | 12 | 25 % | — | — | — | — | 969 ms | 0 € (0.000219 $) | **exclue** — moins de 50 % sans problème détecté |
| Mooré (mos) | petite IA ? | 0 | — % | 0 | 0 | 0 | 0 | — ms | 0 € (—) | **exclue** — aucune mesure |
| Birman (my) | MyMemory | 13 | 85 % | — | — | — | — | 968 ms | 0 € | référence |
| Birman (my) | petite IA gpt-oss-20b | 13 | 92 % | — | — | — | — | 739 ms | 0 € (0.000086 $) | **à surveiller** — 92 % mais erreurs graves pas encore classées : remesurer |
| Kinyarwanda (rw) | MyMemory | 2 | 100 % | 0 | 0 | 0 | 0 | 773 ms | 0 € | référence |
| Kinyarwanda (rw) | petite IA gpt-oss-20b | 13 | 85 % | — | — | — | — | 928 ms | 0 € (0.000107 $) | **exclue** — l'IA dégrade le résultat (-15 points face à MyMemory) |
| Kinyarwanda (rw) | grande IA gpt-oss-120b | 2 | 100 % | 0 | 0 | 0 | 0 | 989 ms | 0 € (0.000218 $) | **à surveiller** — trop peu de phrases mesurées (2) |
| Serbe (sr) | MyMemory | 13 | 23 % | — | — | — | — | 870 ms | 0 € | référence |
| Serbe (sr) | petite IA gpt-oss-20b | 13 | 23 % | — | — | — | — | 565 ms | 0 € (0.000075 $) | **exclue** — moins de 50 % sans problème détecté |
| Soundanais (su) | MyMemory | 13 | 85 % | — | — | — | — | 867 ms | 0 € | référence |
| Soundanais (su) | petite IA gpt-oss-20b | 13 | 92 % | — | — | — | — | 782 ms | 0 € (0.000083 $) | **à surveiller** — 92 % mais erreurs graves pas encore classées : remesurer |
| Ouzbek (uz) | MyMemory | 2 | 0 % | — | — | — | — | 566 ms | 0 € | référence |
| Ouzbek (uz) | petite IA gpt-oss-20b | 2 | 100 % | — | — | — | — | 813 ms | 0 € (0.000076 $) | **à surveiller** — trop peu de phrases mesurées (2) |
| Wolof (wo) | MyMemory | 1 | 100 % | 0 | 0 | 0 | 0 | 769 ms | 0 € | référence |
| Wolof (wo) | petite IA gpt-oss-20b | 4 | 25 % | — | — | — | — | 1148 ms | 0 € (0.000152 $) | **à surveiller** — trop peu de phrases mesurées (4) |
| Wolof (wo) | grande IA gpt-oss-120b | 1 | 100 % | 0 | 0 | 0 | 0 | 1058 ms | 0 € (0.00022 $) | **à surveiller** — trop peu de phrases mesurées (1) |
| Chinois (traditionnel) (zh-TW) | MyMemory | 13 | 38 % | — | — | — | — | 865 ms | 0 € | référence |
| Chinois (traditionnel) (zh-TW) | petite IA gpt-oss-20b | 13 | 38 % | — | — | — | — | 708 ms | 0 € (0.000072 $) | **exclue** — moins de 50 % sans problème détecté |

Bilan : 2 autorisée(s) en test, 16 à surveiller, 10 exclue(s). Langues mesurées avec IA : 15 / 111.

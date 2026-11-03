# ONE WORLD AI LAB — Fiabilité par langue (phase 5)

Généré le 2026-11-03 09:01 UTC à partir de 4 tranche(s) mesurée(s). TEST seulement.

**Attention : « sans problème détecté » n'est pas « correct ».** Les contrôles automatiques ne voient pas tout. Aucune langue n'est validée sans relecture native.

Erreurs : **grave** = change un fait (nombre, heure, jour, nom, négation, mauvaise langue) ; **sens** = mot à mot, sens inventé ou perdu ; **contexte** = tu/vous, pronom. « — » = pas mesuré dans cette tranche (tranches d'avant la phase 5).

Décision IA : **autorisée en test** si ≥ 90 % sans problème détecté, 0 erreur grave et au moins aussi bien que MyMemory ; **exclue** si ≥ 2 erreurs graves, < 50 %, ou 10 points de moins que MyMemory ; sinon **à surveiller**. Coût réel : 0 € (offres gratuites).

| Langue | Moteur | Phrases | Sans problème détecté | Graves | Sens | Contexte | Non vérifié | Latence | Coût réel (si payant) | Décision |
|---|---|---|---|---|---|---|---|---|---|---|
| Basque (eu) | MyMemory | 4 | 75 % | — | — | — | — | 603 ms | 0 € | référence |
| Basque (eu) | petite IA gpt-oss-20b | 4 | 75 % | — | — | — | — | 661 ms | 0 € (0.000081 $) | **à surveiller** — trop peu de phrases mesurées (4) |
| Persan (Farsi) (fa) | MyMemory | 12 | 92 % | 1 | 0 | 0 | 0 | 1200 ms | 0 € | référence |
| Persan (Farsi) (fa) | petite IA gpt-oss-20b | 11 | 91 % | — | — | — | — | 565 ms | 0 € (0.000073 $) | **à surveiller** — 91 %, graves non classées, écart MyMemory -1 |
| Persan (Farsi) (fa) | grande IA gpt-oss-120b | 12 | 83 % | 0 | 0 | 0 | 2 | 843 ms | 0 € (0.00022 $) | **à surveiller** — 83 %, 0 grave(s), écart MyMemory -9 |
| Guarani (gn) | MyMemory | 13 | 69 % | 2 | 2 | 0 | 0 | 921 ms | 0 € | référence |
| Guarani (gn) | petite IA gpt-oss-20b | 13 | 69 % | — | — | — | — | 739 ms | 0 € (0.0001 $) | **à surveiller** — 69 %, graves non classées, écart MyMemory +0 |
| Guarani (gn) | grande IA gpt-oss-120b | 13 | 85 % | 0 | 2 | 0 | 0 | 832 ms | 0 € (0.000262 $) | **à surveiller** — 85 %, 0 grave(s), écart MyMemory +16 |
| Khmer (km) | MyMemory | 13 | 77 % | 2 | 1 | 0 | 0 | 926 ms | 0 € | référence |
| Khmer (km) | petite IA gpt-oss-20b | 13 | 100 % | — | — | — | — | 665 ms | 0 € (0.000086 $) | **à surveiller** — 100 % mais erreurs graves pas encore classées : remesurer |
| Khmer (km) | grande IA gpt-oss-120b | 13 | 100 % | 0 | 0 | 0 | 0 | 810 ms | 0 € (0.000259 $) | **autorisée en test** — 100 % sans problème détecté, aucune erreur grave, au moins aussi bien que MyMemory |
| Kurde (ku) | MyMemory | 3 | 0 % | — | — | — | — | 598 ms | 0 € | référence |
| Kurde (ku) | petite IA gpt-oss-20b | 3 | 100 % | — | — | — | — | 897 ms | 0 € (0.000133 $) | **à surveiller** — trop peu de phrases mesurées (3) |
| Lingala (ln) | MyMemory | 13 | 92 % | 1 | 0 | 0 | 0 | 1036 ms | 0 € | référence |
| Lingala (ln) | petite IA gpt-oss-20b | 13 | 69 % | — | — | — | — | 814 ms | 0 € (0.000134 $) | **exclue** — l'IA dégrade le résultat (-23 points face à MyMemory) |
| Lingala (ln) | grande IA gpt-oss-120b | 13 | 85 % | 0 | 2 | 0 | 0 | 762 ms | 0 € (0.000244 $) | **à surveiller** — 85 %, 0 grave(s), écart MyMemory -7 |
| Malgache (mg) | MyMemory | 13 | 85 % | 2 | 0 | 0 | 0 | 866 ms | 0 € | référence |
| Malgache (mg) | petite IA gpt-oss-20b | 13 | 100 % | — | — | — | — | 579 ms | 0 € (0.000084 $) | **à surveiller** — 100 % mais erreurs graves pas encore classées : remesurer |
| Malgache (mg) | grande IA gpt-oss-120b | 13 | 100 % | 0 | 0 | 0 | 0 | 751 ms | 0 € (0.000229 $) | **autorisée en test** — 100 % sans problème détecté, aucune erreur grave, au moins aussi bien que MyMemory |
| Mooré (mos) | MyMemory | 12 | 83 % | — | — | — | — | 1071 ms | 0 € | référence |
| Mooré (mos) | petite IA gpt-oss-20b | 2 | 0 % | — | — | — | — | 1369 ms | 0 € (0.000154 $) | **à surveiller** — trop peu de phrases mesurées (2) |
| Mooré (mos) | grande IA gpt-oss-120b | 12 | 25 % | — | — | — | — | 969 ms | 0 € (0.000219 $) | **exclue** — moins de 50 % sans problème détecté |
| Birman (my) | MyMemory | 13 | 85 % | — | — | — | — | 968 ms | 0 € | référence |
| Birman (my) | petite IA gpt-oss-20b | 13 | 92 % | — | — | — | — | 739 ms | 0 € (0.000086 $) | **à surveiller** — 92 % mais erreurs graves pas encore classées : remesurer |
| Kinyarwanda (rw) | MyMemory | 13 | 92 % | 1 | 0 | 0 | 0 | 1032 ms | 0 € | référence |
| Kinyarwanda (rw) | petite IA gpt-oss-20b | 13 | 85 % | — | — | — | — | 928 ms | 0 € (0.000107 $) | **à surveiller** — 85 %, graves non classées, écart MyMemory -7 |
| Kinyarwanda (rw) | grande IA gpt-oss-120b | 13 | 100 % | 0 | 0 | 0 | 0 | 723 ms | 0 € (0.000241 $) | **autorisée en test** — 100 % sans problème détecté, aucune erreur grave, au moins aussi bien que MyMemory |
| Serbe (sr) | MyMemory | 13 | 23 % | — | — | — | — | 870 ms | 0 € | référence |
| Serbe (sr) | petite IA gpt-oss-20b | 13 | 23 % | — | — | — | — | 565 ms | 0 € (0.000075 $) | **exclue** — moins de 50 % sans problème détecté |
| Soundanais (su) | MyMemory | 13 | 85 % | — | — | — | — | 867 ms | 0 € | référence |
| Soundanais (su) | petite IA gpt-oss-20b | 13 | 92 % | — | — | — | — | 782 ms | 0 € (0.000083 $) | **à surveiller** — 92 % mais erreurs graves pas encore classées : remesurer |
| Ouzbek (uz) | MyMemory | 2 | 0 % | — | — | — | — | 566 ms | 0 € | référence |
| Ouzbek (uz) | petite IA gpt-oss-20b | 2 | 100 % | — | — | — | — | 813 ms | 0 € (0.000076 $) | **à surveiller** — trop peu de phrases mesurées (2) |
| Wolof (wo) | MyMemory | 13 | 100 % | 0 | 0 | 0 | 0 | 1146 ms | 0 € | référence |
| Wolof (wo) | petite IA gpt-oss-20b | 4 | 25 % | — | — | — | — | 1148 ms | 0 € (0.000152 $) | **à surveiller** — trop peu de phrases mesurées (4) |
| Wolof (wo) | grande IA gpt-oss-120b | 13 | 92 % | 0 | 1 | 0 | 0 | 893 ms | 0 € (0.000256 $) | **à surveiller** — 92 %, 0 grave(s), écart MyMemory -8 |
| Chinois (traditionnel) (zh-TW) | MyMemory | 13 | 38 % | — | — | — | — | 865 ms | 0 € | référence |
| Chinois (traditionnel) (zh-TW) | petite IA gpt-oss-20b | 13 | 38 % | — | — | — | — | 708 ms | 0 € (0.000072 $) | **exclue** — moins de 50 % sans problème détecté |

Bilan : 3 autorisée(s) en test, 16 à surveiller, 4 exclue(s). Langues mesurées avec IA : 15 / 111.

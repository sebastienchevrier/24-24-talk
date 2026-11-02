# Labo ONE WORLD — 112 langues, batterie des registres (2026-11-02 19:18 UTC)

Moteur : **MyMemory** (gratuit). Statut de chaque langue : **testé par contrôles automatiques, PAS validé** (aucune langue validée par un natif : 0).

| Indicateur | Valeur |
|---|---|
| Langues testées | 15 / 111 |
| Langues non disponibles chez MyMemory | 0  |
| Langues sans résultat (machine en échec) | 96 en es de it pt pt-BR nl pl ro el cs sv da nb fi hu bg hr sk sl lt lv et is ga mt sq mk bs uk be ru ca gl cy lb ar he tr ps az hy ka sw am ha yo ig zu xh af st so rn sn ny ti om zh ja ko vi th id ms tl hi bn ta te ml kn mr gu pa or as ur ne si lo mn ceb jv kk ky tg tk es-MX ht qu mi sm to fj haw |
| Tests exécutés | 163 |
| Tests sans problème détecté | 122 |
| Problèmes détectés | 72 |
| Réponses dans la mauvaise écriture | 6 |
| Indices de mot à mot (retour) | 9 |
| Points à faire relire par un humain | 89 |
| Proximité moyenne au retour (chrF, 0-100) | 42.4 |
| Latence médiane | 821.6 ms |
| Coût | 0 € |

## Par registre

| Registre | Langues | Sans problème détecté | chrF retour |
|---|---|---|---|
| normal | 12 | 9 (75 %) | 64 |
| familier | 12 | 10 (83 %) | 38.5 |
| argot | 12 | 11 (92 %) | 24.3 |
| soutenu | 12 | 10 (83 %) | 45.3 |
| formel | 11 | 4 (36 %) | 45.9 |
| littéraire | 13 | 12 (92 %) | 40.3 |
| idiomatique | 15 | 12 (80 %) | 28 |
| métaphorique | 14 | 10 (71 %) | 42.6 |
| humoristique | 11 | 9 (82 %) | 51.6 |
| régional | 15 | 11 (73 %) | 47 |
| émotionnel | 12 | 10 (83 %) | 51.4 |
| négation | 12 | 10 (83 %) | 51.5 |
| nombres et noms | 12 | 4 (33 %) | 60.4 |

## Par langue (du plus faible au plus fort)

| Code | Langue | Sans problème | Problèmes | Mauvaise écriture | chrF retour | Évolution |
|---|---|---|---|---|---|---|
| ku | Kurde | 0/3 | 4 | 3 | 27.6 | — |
| gn | Guarani | 11/13 | 6 | 0 | 28 | — |
| uz | Ouzbek | 0/2 | 3 | 2 | 28.7 | — |
| eu | Basque | 3/4 | 1 | 0 | 29.9 | — |
| mos | Mooré | 12/13 | 3 | 0 | 31.6 | — |
| rw | Kinyarwanda | 12/13 | 7 | 0 | 35.3 | — |
| mg | Malgache | 11/13 | 5 | 0 | 36.1 | — |
| fa | Persan (Farsi) | 8/11 | 7 | 1 | 37.3 | — |
| su | Soundanais | 13/13 | 0 | 0 | 40.4 | — |
| wo | Wolof | 13/13 | 0 | 0 | 43.7 | — |
| ln | Lingala | 12/13 | 2 | 0 | 44 | — |
| my | Birman | 11/13 | 7 | 0 | 49.5 | — |
| km | Khmer | 10/13 | 7 | 0 | 62.3 | — |
| zh-TW | Chinois (traditionnel) | 3/13 | 10 | 0 | 68.2 | — |
| sr | Serbe | 3/13 | 10 | 0 | 74 | — |

## MyMemory contre IA (openai/gpt-oss-20b), mêmes phrases, même protocole

| Langue | Phrases | MyMemory sans problème | IA sans problème | chrF retour MyMemory | chrF retour IA | Latence IA | Coût si payant / trad. |
|---|---|---|---|---|---|---|---|
| sr | 13 | 3 | 5 | 74 | 65.8 | 731 ms | 0.000078 $ |
| eu | 4 | 3 | 4 | 29.9 | 20.9 | 659 ms | 0.000081 $ |
| fa | 11 | 8 | 11 | 37.3 | 27.2 | 586 ms | 0.000065 $ |
| ku | 3 | 0 | 3 | 27.6 | 6 | 665 ms | 0.000095 $ |
| rw | 13 | 12 | 12 | 35.3 | 39.1 | 520 ms | 0.000096 $ |
| ln | 13 | 12 | 13 | 44 | 25.4 | 739 ms | 0.000125 $ |
| wo | 4 | 4 | 4 | 41.9 | 11.1 | 1120 ms | 0.00015 $ |
| mg | 13 | 11 | 13 | 36.1 | 52.1 | 748 ms | 0.00009 $ |
| mos | 2 | 2 | 1 | 16.4 | 7.6 | 726 ms | 0.000127 $ |
| zh-TW | 13 | 3 | 2 | 68.2 | 59.1 | 662 ms | 0.000073 $ |
| my | 5 | 4 | 5 | 55.4 | 42.3 | 690 ms | 0.00008 $ |
| km | 13 | 10 | 12 | 62.3 | 46.7 | 666 ms | 0.000073 $ |
| su | 13 | 13 | 13 | 40.4 | 40.3 | 500 ms | 0.000075 $ |
| uz | 2 | 0 | 2 | 28.7 | — | 1482 ms | 0.000074 $ |
| gn | 5 | 4 | 5 | 15.9 | 19.1 | 685 ms | 0.000116 $ |
| **Total** | 127 | 89 | 105 | | | | |

Attention : une bonne retraduction ne prouve pas une bonne traduction (deux erreurs peuvent se compenser). Coût réel : 0 € (offre gratuite).

Lecture : « sans problème détecté » veut dire que les contrôles automatiques (écriture, nombres, noms, longueur, recopie, retour) n'ont rien trouvé. Ce n'est PAS une preuve de bonne traduction. Les idiomes, l'humour et les métaphores demandent toujours une relecture humaine.

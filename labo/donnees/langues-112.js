/* 24/24 ONE WORLD — Labo linguistique : registre des 112 langues officielles du projet.
   © 2026 Sébastien Chevrier. Tous droits réservés.
   Source : matrice-112-langues.md (2 nov. 2026). « ressources » = ESTIMATION, pas une mesure.
   Trois états qu'on ne confond JAMAIS :
   - disponible : un moteur répond dans cette langue (rien n'est prouvé sur la qualité) ;
   - testé : la batterie automatique a tourné et ses contrôles sont enregistrés ;
   - validé : un locuteur natif a relu et noté la langue. AUCUNE langue n'est validée à ce jour. */
(function (root) {
  "use strict";
  var LANGUES = [
    {
    "code": "fr",
    "nom": "Français",
    "region": "Europe",
    "phrasier": 0,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "en",
    "nom": "Anglais",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "es",
    "nom": "Espagnol",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "de",
    "nom": "Allemand",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "it",
    "nom": "Italien",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "pt",
    "nom": "Portugais",
    "region": "Europe",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "pt-BR",
    "nom": "Portugais (Brésil)",
    "region": "Amériques",
    "phrasier": 17,
    "flores": "oui (sans variante régionale)",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "nl",
    "nom": "Néerlandais",
    "region": "Europe",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "pl",
    "nom": "Polonais",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "ro",
    "nom": "Roumain",
    "region": "Europe",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "el",
    "nom": "Grec",
    "region": "Europe",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "grec"
    },
    {
    "code": "cs",
    "nom": "Tchèque",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "sv",
    "nom": "Suédois",
    "region": "Europe",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "da",
    "nom": "Danois",
    "region": "Europe",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "nb",
    "nom": "Norvégien",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "fi",
    "nom": "Finnois",
    "region": "Europe",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "hu",
    "nom": "Hongrois",
    "region": "Europe",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "bg",
    "nom": "Bulgare",
    "region": "Europe",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "cyrillique"
    },
    {
    "code": "hr",
    "nom": "Croate",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "sk",
    "nom": "Slovaque",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "sl",
    "nom": "Slovène",
    "region": "Europe",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "lt",
    "nom": "Lituanien",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "lv",
    "nom": "Letton",
    "region": "Europe",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "et",
    "nom": "Estonien",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "is",
    "nom": "Islandais",
    "region": "Europe",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "ga",
    "nom": "Irlandais",
    "region": "Europe",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "mt",
    "nom": "Maltais",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "sq",
    "nom": "Albanais",
    "region": "Europe",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "mk",
    "nom": "Macédonien",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "cyrillique"
    },
    {
    "code": "sr",
    "nom": "Serbe",
    "region": "Europe",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "cyrillique|latin"
    },
    {
    "code": "bs",
    "nom": "Bosniaque",
    "region": "Europe",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "uk",
    "nom": "Ukrainien",
    "region": "Europe",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "cyrillique"
    },
    {
    "code": "be",
    "nom": "Biélorusse",
    "region": "Europe",
    "phrasier": 11,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "cyrillique"
    },
    {
    "code": "ru",
    "nom": "Russe",
    "region": "Europe",
    "phrasier": 16,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "cyrillique"
    },
    {
    "code": "ca",
    "nom": "Catalan",
    "region": "Europe",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "eu",
    "nom": "Basque",
    "region": "Europe",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "gl",
    "nom": "Galicien",
    "region": "Europe",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "cy",
    "nom": "Gallois",
    "region": "Europe",
    "phrasier": 9,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "lb",
    "nom": "Luxembourgeois",
    "region": "Europe",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "ar",
    "nom": "Arabe",
    "region": "Moyen-Orient",
    "phrasier": 14,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "arabe"
    },
    {
    "code": "he",
    "nom": "Hébreu",
    "region": "Moyen-Orient",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "hébreu"
    },
    {
    "code": "fa",
    "nom": "Persan (Farsi)",
    "region": "Moyen-Orient",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "arabe"
    },
    {
    "code": "tr",
    "nom": "Turc",
    "region": "Moyen-Orient",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "ku",
    "nom": "Kurde",
    "region": "Moyen-Orient",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "ps",
    "nom": "Pachto",
    "region": "Moyen-Orient",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "arabe"
    },
    {
    "code": "az",
    "nom": "Azéri",
    "region": "Moyen-Orient",
    "phrasier": 16,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "hy",
    "nom": "Arménien",
    "region": "Moyen-Orient",
    "phrasier": 9,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "arménien"
    },
    {
    "code": "ka",
    "nom": "Géorgien",
    "region": "Moyen-Orient",
    "phrasier": 8,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "géorgien"
    },
    {
    "code": "sw",
    "nom": "Swahili",
    "region": "Afrique",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "am",
    "nom": "Amharique",
    "region": "Afrique",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "éthiopien"
    },
    {
    "code": "ha",
    "nom": "Haoussa",
    "region": "Afrique",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "yo",
    "nom": "Yoruba",
    "region": "Afrique",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "ig",
    "nom": "Igbo",
    "region": "Afrique",
    "phrasier": 16,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "zu",
    "nom": "Zoulou",
    "region": "Afrique",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "xh",
    "nom": "Xhosa",
    "region": "Afrique",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "af",
    "nom": "Afrikaans",
    "region": "Afrique",
    "phrasier": 13,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "st",
    "nom": "Sotho",
    "region": "Afrique",
    "phrasier": 13,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "so",
    "nom": "Somali",
    "region": "Afrique",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "rw",
    "nom": "Kinyarwanda",
    "region": "Afrique",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "rn",
    "nom": "Kirundi",
    "region": "Afrique",
    "phrasier": 12,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "ln",
    "nom": "Lingala",
    "region": "Afrique",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "sn",
    "nom": "Shona",
    "region": "Afrique",
    "phrasier": 14,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "ny",
    "nom": "Chichewa",
    "region": "Afrique",
    "phrasier": 16,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "wo",
    "nom": "Wolof",
    "region": "Afrique",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "ti",
    "nom": "Tigrigna",
    "region": "Afrique",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "éthiopien"
    },
    {
    "code": "om",
    "nom": "Oromo",
    "region": "Afrique",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "mg",
    "nom": "Malgache",
    "region": "Afrique",
    "phrasier": 39,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "mos",
    "nom": "Mooré",
    "region": "Afrique",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "zh",
    "nom": "Chinois (simplifié)",
    "region": "Asie",
    "phrasier": 16,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "han"
    },
    {
    "code": "zh-TW",
    "nom": "Chinois (traditionnel)",
    "region": "Asie",
    "phrasier": 19,
    "flores": "oui (chinois traditionnel, pas spécifique Taïwan)",
    "ressources": "A riche",
    "ecriture": "han"
    },
    {
    "code": "ja",
    "nom": "Japonais",
    "region": "Asie",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "japonais"
    },
    {
    "code": "ko",
    "nom": "Coréen",
    "region": "Asie",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "hangul"
    },
    {
    "code": "vi",
    "nom": "Vietnamien",
    "region": "Asie",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "th",
    "nom": "Thaï",
    "region": "Asie",
    "phrasier": 10,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "thaï"
    },
    {
    "code": "id",
    "nom": "Indonésien",
    "region": "Asie",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "ms",
    "nom": "Malais",
    "region": "Asie",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "tl",
    "nom": "Filipino (Tagalog)",
    "region": "Asie",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "hi",
    "nom": "Hindi",
    "region": "Asie",
    "phrasier": 14,
    "flores": "oui",
    "ressources": "A riche",
    "ecriture": "devanagari"
    },
    {
    "code": "bn",
    "nom": "Bengali",
    "region": "Asie",
    "phrasier": 14,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "bengali"
    },
    {
    "code": "ta",
    "nom": "Tamoul",
    "region": "Asie",
    "phrasier": 10,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "tamoul"
    },
    {
    "code": "te",
    "nom": "Télougou",
    "region": "Asie",
    "phrasier": 14,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "télougou"
    },
    {
    "code": "ml",
    "nom": "Malayalam",
    "region": "Asie",
    "phrasier": 8,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "malayalam"
    },
    {
    "code": "kn",
    "nom": "Kannada",
    "region": "Asie",
    "phrasier": 8,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "kannada"
    },
    {
    "code": "mr",
    "nom": "Marathi",
    "region": "Asie",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "devanagari"
    },
    {
    "code": "gu",
    "nom": "Goujarati",
    "region": "Asie",
    "phrasier": 11,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "gujarati"
    },
    {
    "code": "pa",
    "nom": "Pendjabi",
    "region": "Asie",
    "phrasier": 11,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "gurmukhi"
    },
    {
    "code": "or",
    "nom": "Odia",
    "region": "Asie",
    "phrasier": 11,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "oriya"
    },
    {
    "code": "as",
    "nom": "Assamais",
    "region": "Asie",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "bengali"
    },
    {
    "code": "ur",
    "nom": "Ourdou",
    "region": "Asie",
    "phrasier": 10,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "arabe"
    },
    {
    "code": "ne",
    "nom": "Népalais",
    "region": "Asie",
    "phrasier": 16,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "devanagari"
    },
    {
    "code": "si",
    "nom": "Cingalais",
    "region": "Asie",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "cingalais"
    },
    {
    "code": "my",
    "nom": "Birman",
    "region": "Asie",
    "phrasier": 8,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "birman"
    },
    {
    "code": "km",
    "nom": "Khmer",
    "region": "Asie",
    "phrasier": 10,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "khmer"
    },
    {
    "code": "lo",
    "nom": "Lao",
    "region": "Asie",
    "phrasier": 14,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "lao"
    },
    {
    "code": "mn",
    "nom": "Mongol",
    "region": "Asie",
    "phrasier": 8,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "cyrillique"
    },
    {
    "code": "ceb",
    "nom": "Cebuano",
    "region": "Asie",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "jv",
    "nom": "Javanais",
    "region": "Asie",
    "phrasier": 17,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "su",
    "nom": "Soundanais",
    "region": "Asie",
    "phrasier": 16,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "kk",
    "nom": "Kazakh",
    "region": "Asie centrale",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "cyrillique"
    },
    {
    "code": "ky",
    "nom": "Kirghiz",
    "region": "Asie centrale",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "cyrillique"
    },
    {
    "code": "uz",
    "nom": "Ouzbek",
    "region": "Asie centrale",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "B moyen",
    "ecriture": "latin"
    },
    {
    "code": "tg",
    "nom": "Tadjik",
    "region": "Asie centrale",
    "phrasier": 16,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "cyrillique"
    },
    {
    "code": "tk",
    "nom": "Turkmène",
    "region": "Asie centrale",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "es-MX",
    "nom": "Espagnol (Mexique)",
    "region": "Amériques",
    "phrasier": 13,
    "flores": "oui (sans variante régionale)",
    "ressources": "A riche",
    "ecriture": "latin"
    },
    {
    "code": "ht",
    "nom": "Créole haïtien",
    "region": "Amériques",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "qu",
    "nom": "Quechua",
    "region": "Amériques",
    "phrasier": 15,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "gn",
    "nom": "Guarani",
    "region": "Amériques",
    "phrasier": 13,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "mi",
    "nom": "Maori",
    "region": "Océanie",
    "phrasier": 18,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "sm",
    "nom": "Samoan",
    "region": "Océanie",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "to",
    "nom": "Tongien",
    "region": "Océanie",
    "phrasier": 16,
    "flores": "non",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "fj",
    "nom": "Fidjien",
    "region": "Océanie",
    "phrasier": 19,
    "flores": "oui",
    "ressources": "C faible",
    "ecriture": "latin"
    },
    {
    "code": "haw",
    "nom": "Hawaïen",
    "region": "Océanie",
    "phrasier": 19,
    "flores": "non",
    "ressources": "C faible",
    "ecriture": "latin"
    }
    ];
  var data = { langues: LANGUES, valides: [] };
  if (typeof module === "object" && module.exports) module.exports = data; else root.OW_LANGUES_112 = data;
})(this);

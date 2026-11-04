/* 24/24 ONE WORLD — Labo linguistique : moteur en 5 couches (PROTOTYPE ISOLÉ, 2 nov. 2026).
   © 2026 Sébastien Chevrier. Tous droits réservés.

   Ce fichier N'EST PAS utilisé par l'application. Il sert à mesurer, dans la page labo/, ce qu'apporterait
   une couche « sens réel et registres » au-dessus du moteur actuel (MyMemory).

   A. Identification : écriture (Unicode), langue probable, mélange de langues.            → identifier()
   B. Compréhension : expressions imagées, registre, ton, ironie possible, ambiguïtés.    → comprendre()
   C. Adaptation : pré-édition (l'image remplacée par son sens) et consigne de style.      → preediter(), consigne()
   D. Traduction : moteurs branchables (MyMemory, IA via fonction serveur), jamais ici.    → traduire()
   E. Contrôle : nombres, heures, montants, noms propres, émojis, liens, longueur,
      traduction littérale d'une image, faux amis.                                         → controler()

   Limites assumées (voir labo/README.md) : la compréhension (B) repose sur des listes écrites à la main pour le
   FRANÇAIS seulement ; la détection de langue (A) est grossière pour les phrases courtes en alphabet latin. */
(function (root) {
  "use strict";

  // Expressions régulières « lettres du monde entier » : en JavaScript, \b et \w ne connaissent que l'alphabet anglais
  // (« gré » ou « tombée » cassent la limite de mot). U() les remplace par leurs équivalents Unicode.
  var LIM = "(?:(?<![\\p{L}\\p{N}])(?=[\\p{L}\\p{N}])|(?<=[\\p{L}\\p{N}])(?![\\p{L}\\p{N}]))";
  function U(src, flags) {
    if (src instanceof RegExp) { flags = flags == null ? src.flags : flags; src = src.source; }
    src = String(src).replace(/\\b/g, LIM).replace(/\\w/g, "[\\p{L}\\p{N}_]");
    flags = (flags || "").replace(/u/g, "");
    return new RegExp(src, flags + "u");
  }

  // ---------------------------------------------------------------- A. IDENTIFICATION
  var SCRIPTS = [
    ["latin", /[A-Za-zÀ-ÖØ-öø-ɏḀ-ỿ]/g], ["cyrillique", /[Ѐ-ӿ]/g], ["grec", /[Ͱ-Ͽ]/g],
    ["arabe", /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g], ["hébreu", /[֐-׿]/g], ["devanagari", /[ऀ-ॿ]/g],
    ["bengali", /[ঀ-৿]/g], ["gurmukhi", /[਀-੿]/g], ["gujarati", /[઀-૿]/g], ["oriya", /[଀-୿]/g],
    ["tamoul", /[஀-௿]/g], ["télougou", /[ఀ-౿]/g], ["kannada", /[ಀ-೿]/g], ["malayalam", /[ഀ-ൿ]/g],
    ["cingalais", /[඀-෿]/g], ["thaï", /[฀-๿]/g], ["lao", /[຀-໿]/g], ["birman", /[က-႟]/g],
    ["khmer", /[ក-៿]/g], ["géorgien", /[Ⴀ-ჿ]/g], ["arménien", /[԰-֏]/g], ["éthiopien", /[ሀ-፿]/g],
    ["hangul", /[가-힯ᄀ-ᇿ㄰-㆏]/g], ["kana", /[぀-ヿ]/g], ["han", /[一-鿿㐀-䶿]/g],
  ];
  var PAR_ECRITURE = { cyrillique: "ru", grec: "el", arabe: "ar", hébreu: "he", devanagari: "hi", bengali: "bn", gurmukhi: "pa", gujarati: "gu", oriya: "or", tamoul: "ta", télougou: "te", kannada: "kn", malayalam: "ml", cingalais: "si", thaï: "th", lao: "lo", birman: "my", khmer: "km", géorgien: "ka", arménien: "hy", éthiopien: "am", hangul: "ko", kana: "ja", han: "zh" };
  // Mots très fréquents (alphabet latin) : suffisant pour une phrase de messagerie, pas pour un mot isolé.
  var MOTS = {
    fr: "le la les un une des de du et est je tu il elle on nous vous ils pas que qui ce cette ça c'est j'ai a à au aux se en encore comme mon ma mes ton ta tes son sa ses pour avec chez dans sur mais très bien merci bonjour oui non",
    en: "the a an and is are i you he she we they not that this it's i'm for with in on but very good thanks hello yes no what",
    es: "el la los las un una y es soy eres yo tú él ella nosotros no que esto para con en pero muy bien gracias hola sí qué",
    pt: "o a os as um uma e é eu você ele ela nós não que isso para com em mas muito bem obrigado olá sim você",
    it: "il lo la gli le un una e è io tu lui lei noi non che questo per con in ma molto bene grazie ciao sì",
    de: "der die das ein eine und ist ich du er sie wir nicht dass für mit auf aber sehr gut danke hallo ja nein wie geht dir mir guten morgen auch noch",
    nl: "de het een en is ik jij je hij zij wij niet dat dit voor met in op maar heel goed dank hallo ja nee",
    sw: "na ni wa ya kwa la katika mimi wewe yeye sisi hapana ndiyo asante habari sana nini nzuri lakini huyu",
    id: "dan yang di ini itu saya kamu dia kami tidak ya untuk dengan dari tetapi sangat baik terima kasih apa",
    tr: "ve bir bu da de ben sen o biz değil evet için ile ama çok iyi teşekkürler merhaba ne",
    pl: "i w na jest nie to że ja ty on ona my się z do ale bardzo dobrze dziękuję cześć tak co",
    mg: "ny sy dia amin'ny aho ianao izy isika tsy eny ho an'ny fa tena tsara misaotra manao ahoana",
  };
  var LISTES = {}; Object.keys(MOTS).forEach(function (k) { LISTES[k] = {}; MOTS[k].split(" ").forEach(function (m) { LISTES[k][m] = 1; }); });

  function compterEcritures(t) {
    var n = {};
    SCRIPTS.forEach(function (s) { var m = t.match(s[1]); if (m) n[s[0]] = m.length; });
    return n;
  }
  function langueLatine(mots) {
    var score = {}, best = null, total = 0;
    mots.forEach(function (m) { Object.keys(LISTES).forEach(function (k) { if (LISTES[k][m]) score[k] = (score[k] || 0) + 1; }); });
    Object.keys(score).forEach(function (k) { total += score[k]; if (!best || score[k] > score[best]) best = k; });
    return { langue: best, score: score, total: total };
  }
  function affinerNonLatin(ecriture, t) {
    var l = PAR_ECRITURE[ecriture];
    if (ecriture === "arabe") { if (/[ےٹڈڑں]/.test(t)) l = "ur"; else if (/[پچژگک]/.test(t)) l = /[ښځډړ]/.test(t) ? "ps" : "fa"; }
    if (ecriture === "cyrillique") { if (/[іїєґ]/i.test(t)) l = "uk"; else if (/[әғқңөұһ]/i.test(t)) l = "kk"; else if (/[ўі]/i.test(t)) l = "be"; else if (/[ќѓѕ]/i.test(t)) l = "mk"; else if (/[ђћџљњ]/i.test(t)) l = "sr"; }
    if (ecriture === "bengali" && /[ৰৱ]/.test(t)) l = "as";
    if (ecriture === "éthiopien" && /(ኣ|ዝ|እዩ)/.test(t)) l = "ti (ou am)";
    if (ecriture === "devanagari" && /(आहे|आहेत)/.test(t)) l = "mr";
    if (ecriture === "devanagari" && /(छ|छन्|हुन्छ)/.test(t)) l = "ne (ou hi)";
    return l;
  }
  function identifier(texte) {
    var t = String(texte || "");
    var n = compterEcritures(t), noms = Object.keys(n).sort(function (a, b) { return n[b] - n[a]; });
    if (n.kana && n.han) { n.kana += n.han; delete n.han; noms = Object.keys(n).sort(function (a, b) { return n[b] - n[a]; }); }
    var principale = noms[0] || null;
    var res = { ecriture: principale, ecritures: n, langue: null, confiance: "faible", melange: false, segments: [] };
    if (!principale) return res;
    var totalLettres = noms.reduce(function (s, k) { return s + n[k]; }, 0);
    if (noms.length > 1 && n[noms[1]] / totalLettres > 0.15) res.melange = true; // deux écritures bien présentes
    if (principale !== "latin") {
      res.langue = affinerNonLatin(principale, t);
      res.confiance = principale === "han" || principale === "arabe" || principale === "cyrillique" || principale === "devanagari" ? "moyenne" : "élevée";
    } else {
      var mots = t.toLowerCase().replace(/[^\p{L}' ]/gu, " ").split(/\s+/).filter(Boolean);
      var g = langueLatine(mots);
      res.langue = g.langue;
      res.confiance = g.total >= 4 ? "moyenne" : "faible";
      // Mélange de deux langues latines : on découpe la phrase en morceaux et on regarde chaque morceau.
      var parts = t.split(/[,;:.!?]\s*|\s(?=at |the |and |ok\b|bro\b)/i).filter(function (p) { return p.trim().length > 2; });
      var vues = {};
      parts.forEach(function (p) {
        var gg = langueLatine(p.toLowerCase().split(/\s+/));
        // Un morceau ne compte comme une autre langue que s'il contient au moins 2 mots de cette langue.
        if (gg.langue && gg.score[gg.langue] >= 2) { vues[gg.langue] = 1; res.segments.push({ texte: p.trim(), langue: gg.langue }); }
      });
      var anglic = t.match(/\b(ok|cool|bro|at the|station|meeting|deadline|sorry|please|thanks|weekend)\b/gi);
      if (Object.keys(vues).length > 1 || (g.langue && g.langue !== "en" && anglic && anglic.length >= 2)) res.melange = true;
    }
    return res;
  }

  // ---------------------------------------------------------------- B. COMPRÉHENSION (français)
  var REG = {
    familier: /\b(ouais|nan|mec|truc|bouquin|boulot|bagnole|fric|pote|copain|copine|super|t'es|t'as|j'sais|chui|chais|y'a|bah|ben|ça|trop (?:bien|cool|bon)|la flemme|à la bourre)\b|\b(?:je|tu|on|il|c')\s?\w+ pas\b(?!.*\bne\b)/i,
    argot: /\b(kiff\w*|ouf|wesh|chelou|relou|meuf|keum|thune|taf|boss(?:e|es|er)|gal[eè]re|frérot|grave (?:bien|cool|bon)|zarbi|les boules|fauch[ée]e?)\b/i,
    soutenu: /\b(néanmoins|toutefois|nonobstant|je vous saurais gré|daign\w+|quoique|fût|eût|ô|d'aucuns|sied|derechef|afin que)\b/i,
    formel: /\b(madame|monsieur|cordialement|je vous prie|veuillez|ci-joint|conformément|dans l'attente|bien à vous|salutations distinguées|n°|facture|dossier)\b/i,
    littéraire: /\b\w+(?:èrent|âmes|âtes)\b|\b(fut|eut|dit-il|dit-elle|s'écria|naguère|jadis|onc)\b/i,
    humoristique: /\b(mdr|ptdr|lol|haha+|hihi|jpp)\b|😂|🤣|😆|😜/i,
    générationnel: /\b(mdr|ptdr|jpp|tkt|wesh|frérot|en mode|ça passe|chill\w*|crush|cringe|bro|ouf|grave (?:bien|cool|bon|stylé))\b/i,
    régional: /\b(septante|huitante|nonante|dracher|magasiner|pantoute|char|marmaille|zoreil\w*|la case|kosa|lé|té|gramoun|baba)\b/i,
  };
  var REGIONS = { septante: "Belgique / Suisse (70)", huitante: "Suisse (80)", nonante: "Belgique / Suisse (90)", dracher: "Belgique (pleuvoir fort)", magasiner: "Québec (faire les magasins)", pantoute: "Québec (pas du tout)", char: "Québec (voiture)", marmaille: "La Réunion (les enfants)", zoreil: "La Réunion (métropolitain)", "la case": "La Réunion / Antilles (la maison)", gramoun: "La Réunion (personne âgée)", baba: "La Réunion (bébé)" };
  var EMO = /\b(heureu\w+|content\w*|triste|déçu\w*|en colère|furieu\w+|peur|angoiss\w+|je t'aime|amour|ému\w*|fier|fière|honte|stress\w*|bravo|félicitations|désolé\w*)\b/i;
  var INTENS = /\b(trop|vraiment|tellement|grave (?:bien|cool|bon)|super|hyper|ultra|carrément|énormément)\b/gi;
  Object.keys(REG).forEach(function (k) { REG[k] = U(REG[k]); });
  EMO = U(EMO); INTENS = U(INTENS);
  var EMOJI = /\p{Extended_Pictographic}/gu;
  var AMBIGUS = { avocat: "avocat (métier) ou avocat (fruit)", livre: "livre (objet) ou livre (monnaie, poids)", glace: "glace (crème glacée, miroir ou eau gelée)", "la mousse": "mousse (bière, plante, savon)", "le tour": "le tour (promenade) ou la tour (bâtiment)", "faux": "faux (inexact) ou faux (outil)", "son": "son (possessif) ou son (bruit)", "louer": "louer (prendre ou donner en location : sens opposés)", "hôte": "hôte (qui reçoit ou qui est reçu)", "passer me voir": "passer me voir (venir chez moi) — souvent mal rendu" };

  function chercherExpressions(t, base) {
    var trouv = [];
    if (!base) return trouv;
    base.entrees.forEach(function (e) {
      var m = U(e.motif, "i").exec(t);
      if (m) trouv.push({ id: e.id, expr: e.expr, extrait: m[0], sens: e.sens, registres: e.registres, eq: e.eq, confiance: e.confiance });
    });
    return trouv;
  }
  function comprendre(texte, langue, base) {
    var t = String(texte || "");
    var res = { langue: langue, expressions: [], registres: [], ton: {}, ironie_possible: false, ambiguites: [], regional: [], nombres: extraireNombres(t), noms_propres: nomsPropres(t), emojis: (t.match(EMOJI) || []), avertissements: [] };
    if (langue !== "fr") { res.avertissements.push("Compréhension fine disponible seulement pour le français dans ce prototype."); return res; }
    res.expressions = chercherExpressions(t, base);
    Object.keys(REG).forEach(function (k) { if (REG[k].test(t)) res.registres.push(k); });
    res.expressions.forEach(function (x) { x.registres.forEach(function (r) { if (r !== "normal" && res.registres.indexOf(r) < 0) res.registres.push(r); }); });
    if (!res.registres.length) res.registres.push("normal");
    var intens = t.match(INTENS) || [];
    res.ton = {
      exclamation: (t.match(/!/g) || []).length, question: /[?？]\s*$/.test(t.trim()) || /\?/.test(t),
      majuscules: /\b[A-ZÀ-Ý]{4,}\b/.test(t), intensifs: intens.length, emotion: EMO.test(t) || intens.length > 0 || /!/.test(t) || res.emojis.length > 0,
    };
    if (res.ton.emotion && res.registres.indexOf("émotionnel") < 0) res.registres.push("émotionnel");
    // Ironie : un mot positif + un signe de reproche (« encore », « comme d'habitude », 🙄, points de suspension).
    if (/\b(bravo|génial|super|merci beaucoup|parfait|trop bien|quelle chance)\b/i.test(t) && /(…|\.\.\.|🙄|😒|🙃|\bencore\b|comme d'habitude|évidemment|bien sûr)/i.test(t)) {
      res.ironie_possible = true;
      if (res.registres.indexOf("humoristique") < 0) res.registres.push("humoristique");
    }
    Object.keys(AMBIGUS).forEach(function (k) { if (U("\\b" + k + "\\b", "i").test(t) && !res.expressions.some(function (x) { return x.extrait.toLowerCase().indexOf(k) >= 0; })) res.ambiguites.push(AMBIGUS[k]); });
    if (U(/\b(?:tu|te|toi)\b|\bt'/i).test(t)) res.ambiguites.push("tutoiement : la langue cible peut exiger un niveau de politesse (japonais, coréen, allemand…)");
    if (U(/\b(je suis|j'étais) (all[ée]e?|arriv[ée]e?|content\w*|fatigu[ée]e?|pr[eê]te?)\b/i).test(t)) res.ambiguites.push("genre de la personne qui parle : à garder (le français l'indique parfois, la langue cible peut l'exiger)");
    Object.keys(REGIONS).forEach(function (k) { if (U("\\b" + k, "i").test(t)) res.regional.push(k + " : " + REGIONS[k]); });
    return res;
  }

  // ---------------------------------------------------------------- C. ADAPTATION
  function preediter(texte, base) {
    var t = String(texte || ""), faits = [];
    if (!base) return { texte: t, faits: faits };
    base.entrees.forEach(function (e) {
      for (var i = 0; i < e.pre.length; i++) {
        var re = U(e.pre[i][0], "i");
        if (re.test(t)) {
          var avant = t;
          t = t.replace(re, function () {
            var a = arguments, rep = e.pre[i][1];
            return rep.replace(/\$(\d)/g, function (_, n) { return a[+n] || ""; });
          });
          faits.push({ id: e.id, avant: avant, apres: t });
          break;
        }
      }
    });
    t = t.replace(/^(\p{Ll})/u, function (c) { return c.toUpperCase(); });
    return { texte: t, faits: faits };
  }
  var STYLES = {
    auto: "Garde le registre du message original (familier reste familier, formel reste formel).",
    naturel: "Langage courant et naturel, ni familier ni soutenu.",
    familier: "Ton familier et chaleureux, comme entre amis.",
    argot: "Argot courant et actuel de la langue cible, sans vulgarité gratuite.",
    soutenu: "Registre soutenu, formulation élégante.",
    professionnel: "Registre professionnel et poli, adapté au travail.",
    litteraire: "Style littéraire, phrases soignées.",
  };
  function consigne(style, analyse) {
    var s = STYLES[style] ? style : "auto";
    var reg = analyse && analyse.registres ? analyse.registres.join(", ") : "normal";
    return { style: s, texte: STYLES[s], registre_source: reg };
  }

  // ---------------------------------------------------------------- E. CONTRÔLE
  var CHIFFRES_MOTS = { septante: "70", huitante: "80", nonante: "90", "quatre-vingt-dix": "90", "quatre-vingts": "80" };
  function extraireNombres(t) {
    var out = [];
    // Séparateurs de milliers (1 250, 1,250, 1.250) retirés ; heures « 2:30 », « 2.30 », « 14h30 » découpées en heure et minutes.
    var s = String(t || "").replace(/(\d)[\s\u00a0\u202f,.](?=\d{3}(?!\d))/g, "$1").replace(/(\d{1,2})[:.h](\d{2})(?!\d)/g, "$1 $2");
    (s.match(/\d+(?:,\d+)?/g) || []).forEach(function (n) { out.push(n.replace(",", ".")); });
    Object.keys(CHIFFRES_MOTS).forEach(function (k) { if (U("\\b" + k + "\\b", "i").test(t)) out.push("~" + CHIFFRES_MOTS[k]); }); // « ~ » : nombre écrit en lettres
    return out;
  }
  // Mots qui commencent souvent une phrase française : jamais pris pour un nom propre en début de phrase.
  var DEBUTS = /^(Je|Tu|Il|Elle|On|Nous|Vous|Ils|Elles|Le|La|Les|Un|Une|Ce|Cette|Ces|Mon|Ma|Mes|Ton|Ta|Tes|Son|Sa|Ses|Notre|Votre|Leur|Bon|Bonne|Bonjour|Bonsoir|Salut|Merci|Madame|Monsieur|Bravo|Génial|Super|Dites|Rendez|Et|Mais|Ou|Donc|Or|Car|Si|Quand|Comme|Pour|Avec|Dans|Sur|Hier|Demain|Aujourd|Oui|Non|Allez|Voici|Voilà|Nonobstant|Néanmoins|Toutefois|Quel|Quelle|Où|Pourquoi|Comment|Depuis|Après|Avant|Tout|Tous|Toutes|Ici|Là|Ah|Oh|Eh|Arrête|Arrêtez|Laisse|Laissez|Veuillez|Personne|Rien|Enchanté|Enchantée|Grave|Ok|Attends|Attendez|Regarde|Regardez|Viens|Venez|Excuse|Excusez|Pardon|Désolé|Désolée|Écoute|Écoutez|Dis|Prends|Prenez|Va|Allons|Ne|Moi|Toi|Ça|Cela|Ceci|Chaque|Aucun|Aucune|Encore|Déjà|Puis|Ensuite|Enfin|Alors)$/;
  function nomsPropres(t) {
    var out = [], mots = String(t || "").split(/\s+/);
    for (var i = 0; i < mots.length; i++) {
      var m = mots[i].replace(/^[«"'(]+|[»"'),.;:!?…]+$/g, "");
      var debut = i === 0 || /[.!?…:]$/.test(mots[i - 1]);
      if (!/^\p{Lu}\p{Ll}+(?:-\p{Lu}?\p{Ll}+)*$/u.test(m)) continue;
      if (debut && (DEBUTS.test(m.split("-")[0]) || /ment$/.test(m) || m.length > 12)) continue;
      if (!debut && /^(Madame|Monsieur)$/.test(m)) continue;
      out.push(m);
    }
    return out;
  }
  // Images françaises qui ne doivent PAS apparaître telles quelles dans la traduction (signe de mot-à-mot).
  // Une langue est omise quand son équivalent naturel utilise la même image (es « hambre de lobo », en « break the ice »…).
  var PIEGES = {
    "fr.poser-un-lapin": { en: ["rabbit", "bunny"], es: ["conejo"], ar: ["أرنب"], zh: ["兔"], sw: ["sungura"] },
    "fr.yeux-de-la-tete": { en: ["eyes", "head"], es: ["ojos de la cabeza"], ar: ["عيون", "أعين", "رأس"], zh: ["眼睛", "头"], sw: ["macho", "kichwa"] },
    "fr.pleut-des-cordes": { en: ["ropes", "strings", "cords"], es: ["cuerdas"], ar: ["حبال"], zh: ["绳"], sw: ["kamba"] },
    "fr.tomber-dans-les-pommes": { en: ["apple"], es: ["manzana"], ar: ["تفاح"], zh: ["苹果"], sw: ["tufaha", "matofaa"] },
    "fr.poil-dans-la-main": { en: ["hair"], es: ["pelo"], ar: ["شعرة", "شعر"], zh: ["毛"], sw: ["unywele", "nywele"] },
    "fr.casser-les-pieds": { en: ["feet", "foot"], es: ["pies"], ar: ["أقدام", "قدم"], zh: ["脚"], sw: ["miguu", "mguu"] },
    "fr.dans-son-assiette": { en: ["plate", "not feeling under the weather", "not under the weather"], es: ["plato"], ar: ["صحن"], zh: ["盘"], sw: ["sahani"] },
    "fr.avoir-le-cafard": { en: ["cockroach"], es: ["cucaracha"], ar: ["صرصور"], zh: ["蟑螂"], sw: ["mende"] },
    "fr.autres-chats": { en: ["cats", "whip"], es: ["gatos", "azotar"], ar: ["قطط"], zh: ["猫"], sw: ["paka"] },
    "fr.faim-de-loup": { en: ["wolf"], ar: ["ذئب"], zh: ["狼"], sw: ["mbwa mwitu"] },
    "fr.temps-de-chien": { en: ["dog"], ar: ["كلب"], zh: ["狗"], sw: ["mbwa"] },
    "fr.revenir-a-nos-moutons": { en: ["sheep"], es: ["ovejas", "corderos"], ar: ["خراف", "أغنام"], zh: ["羊"], sw: ["kondoo"] },
    "fr.pas-mes-oignons": { en: ["onion"], es: ["cebolla"], ar: ["بصل"], zh: ["洋葱"], sw: ["vitunguu"] },
    "fr.passer-un-savon": { en: ["soap"], es: ["jabón"], ar: ["صابون"], zh: ["肥皂"], sw: ["sabuni"] },
    "fr.jeter-l-eponge": { en: ["sponge"], es: ["esponja"], zh: ["海绵"], sw: ["sifongo"] },
    "fr.vendre-la-meche": { en: ["wick", "fuse"], es: ["mecha"], ar: ["فتيل"], zh: ["引信", "导火索"], sw: ["utambi"] },
    "fr.moral-chaussettes": { en: ["socks"], es: ["calcetines"], ar: ["جوارب"], zh: ["袜子"], sw: ["soksi"] },
    "fr.prendre-un-rateau": { en: ["rake"], es: ["rastrillo"], ar: ["مجرفة", "مشط"], zh: ["耙"], sw: ["reki"] },
    "fr.raconter-des-salades": { en: ["salad"], es: ["ensalada"], ar: ["سلطة"], zh: ["沙拉"], sw: ["saladi"] },
    "fr.coup-de-foudre": { en: ["lightning", "thunderbolt"], es: ["rayo"], ar: ["صاعقة", "برق"], zh: ["雷", "闪电"], sw: ["radi"] },
    "fr.avoir-la-peche": { en: ["peach", "fishing"], es: ["melocotón", "durazno", "pesca"], ar: ["خوخ", "دراق"], zh: ["桃"], sw: ["pichi"] },
    "fr.trois-pattes-canard": { en: ["duck", "legs", "paws"], es: ["pato", "patas"], ar: ["بطة"], zh: ["鸭"], sw: ["bata"] },
    "fr.langue-au-chat": { en: ["tongue", "cat"], es: ["lengua", "gato"], ar: ["لسان", "قط"], zh: ["舌头", "猫"], sw: ["ulimi", "paka"] },
    "fr.mer-a-boire": { en: ["sea", "drink"], es: ["mar", "beber"], ar: ["البحر"], zh: ["海"], sw: ["bahari"] },
    "fr.doigts-dans-le-nez": { en: ["fingers", "nose"], es: ["dedos", "nariz"], ar: ["أصابع", "أنف"], zh: ["手指", "鼻"], sw: ["vidole", "pua"] },
    "fr.je-t-embrasse-fort": { en: ["kiss you hard", "kiss you strongly", "kiss you tight", "kiss you all very hard", "very hard"], zh: ["狠狠", "激烈", "用力"], ar: ["بشدة"], sw: ["kwa nguvu"] },
    "fr.tete-dans-les-nuages": { ar: ["غيوم", "سحاب"], zh: ["云"], sw: ["mawingu"] },
    "fr.briser-la-glace": { sw: ["barafu"] },
    "fr.trente-et-un": { en: ["thirty-one", "31"], es: ["treinta y uno", "31"], ar: ["31", "واحد وثلاثين"], zh: ["31", "三十一"], sw: ["31", "thelathini na moja"] },
    "fr.cartonner": { en: ["cardboard", "carton"], es: ["cartón"], ar: ["كرتون"], zh: ["纸板"], sw: ["katoni"] },
    "fr.a-la-bourre": { en: ["drunk", "stuffing"], es: ["borracho"], ar: ["سكران", "ثمل"], zh: ["醉"], sw: ["mlevi"] },
    "fr.avoir-les-boules": { en: ["balls"], es: ["bolas"], ar: ["كرات"], zh: ["球"], sw: ["mipira"] },
    "fr.c-est-le-pied": { en: ["foot"], es: ["pie"], ar: ["قدم"], zh: ["脚"], sw: ["mguu"] },
  };
  var NUM_AR = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9", "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9" };
  function tiretsSimples(t) { return String(t || "").replace(/[\u2010-\u2012]/g, "-"); }
  function chiffresLatins(t) { return String(t || "").replace(/[٠-٩۰-۹]/g, function (c) { return NUM_AR[c]; }); }
  var NB_MOTS = { en: { 7: "seven", 9: "nine", 10: "ten", 12: "twelve", 70: "seventy", 90: "ninety" }, es: { 7: "siete", 9: "nueve", 10: "diez", 12: "doce", 70: "setenta", 90: "noventa" },
    zh: { 7: "七", 9: "九", 10: "十", 12: "十二", 70: "七十", 90: "九十" } }; // « 十分钟 » = 10 minutes (mesuré le 2 nov.)

  function controler(source, cible, analyse, versLangue, base, reference) {
    // Traits d'union typographiques (U+2010 à U+2012, mesurés le 2 nov. : l'IA écrit « Saint‑Lazare » avec U+2011) = trait d'union simple.
    var c = tiretsSimples(cible), cl = chiffresLatins(c), low = cl.toLowerCase(), rep = [];
    var srcNb = analyse && analyse.nombres ? analyse.nombres : extraireNombres(source);
    var cibleNb = extraireNombres(cl);
    // Swahili : l'heure se compte depuis 6 h du matin (9 h = « saa 3 asubuhi », 14 h = « saa 8 mchana »).
    var heuresSrc = [], mh, reH = /(\d{1,2})\s?h(?:\s?\d{2})?(?![\p{L}])/giu;
    while ((mh = reH.exec(String(source)))) heuresSrc.push(+mh[1]);
    var saa = [], ms, reS = /\bsaa\s+(\d{1,2})/gi;
    while ((ms = reS.exec(c))) saa.push(+ms[1]);
    srcNb.forEach(function (n) {
      if (n.charAt(0) === "~") { // nombre écrit en lettres dans la source (« septante ») : la cible peut l'écrire en lettres aussi
        var v = n.slice(1), okv = cibleNb.indexOf(v) >= 0;
        rep.push({ controle: "nombre " + v + " (écrit en lettres)", ok: okv ? true : null, detail: okv ? "présent" : "à relire : la traduction l'écrit peut-être en lettres" });
        return;
      }
      var ok = cibleNb.indexOf(n) >= 0;
      var h = +n;
      if (!ok && versLangue === "sw" && heuresSrc.indexOf(h) >= 0 && saa.indexOf(((h + 6) % 12) || 12) >= 0) ok = true;
      // Heure « 14 h » rendue « 2 pm » : acceptée. Petit nombre écrit en lettres : accepté.
      if (!ok && h > 12 && h <= 23 && cibleNb.indexOf(String(h - 12)) >= 0 && (/\b(p\.?m\.?|afternoon|evening|tarde|jioni|mchana)\b/i.test(cl) || /下午|晚上|مساء/.test(cl))) ok = true;
      if (!ok && NB_MOTS[versLangue] && NB_MOTS[versLangue][h] && low.indexOf(NB_MOTS[versLangue][h]) >= 0) ok = true;
      if (!ok && n.indexOf(".") > 0 && cibleNb.indexOf(n.replace(".", "")) >= 0) ok = true;
      // « 1 499,99 » rendu « 1,499.99 » : partie entière et décimales présentes séparément.
      if (!ok && n.indexOf(".") > 0) { var pp = n.split("."); if (cibleNb.indexOf(pp[0]) >= 0 && cibleNb.indexOf(pp[1]) >= 0) ok = true; }
      rep.push({ controle: "nombre " + n, ok: ok, detail: ok ? "présent" : "ABSENT ou modifié dans la traduction" });
    });
    // Heures en swahili : « saa 9 » = 15 h (les heures se comptent depuis 6 h du matin).
    if (versLangue === "sw" && heuresSrc.length && saa.length) {
      var attendu = heuresSrc.map(function (x) { return ((x + 6) % 12) || 12; });
      var okS = saa.every(function (x) { return attendu.indexOf(x) >= 0; });
      rep.push({ controle: "heure en swahili", ok: okS, detail: okS ? "« saa " + saa.join(", ") + " » correspond (heures comptées depuis 6 h)" : "« saa " + saa.join(", ") + " » au lieu de « saa " + attendu.join(", ") + " » : heure FAUSSE (les heures se comptent depuis 6 h)" });
    }
    var srcEm = (String(source).match(EMOJI) || []);
    if (srcEm.length) { var ok2 = srcEm.every(function (e) { return c.indexOf(e) >= 0; }); rep.push({ controle: "émojis", ok: ok2, detail: ok2 ? "gardés" : "émoji perdu" }); }
    var latin = !/^(ar|zh|ja|ko|th|ru|uk|he|fa|ur|hi|el|ka|hy|am|bn|ta|te|my|km|lo|si|ne|mr|gu|pa|or|as|kn|ml|ps|ti|mn|kk|ky|tg|be|bg|mk|sr)$/.test(versLangue);
    (analyse && analyse.noms_propres || []).forEach(function (n) {
      if (!latin) { rep.push({ controle: "nom propre " + n, ok: null, detail: "non vérifiable automatiquement dans cette écriture" }); return; }
      var ok3 = low.indexOf(n.toLowerCase()) >= 0;
      rep.push({ controle: "nom propre " + n, ok: ok3, detail: ok3 ? "gardé" : "absent ou traduit" });
    });
    (String(source).match(/https?:\/\/\S+/g) || []).forEach(function (u) { var ok4 = c.indexOf(u) >= 0; rep.push({ controle: "lien", ok: ok4, detail: ok4 ? "gardé" : "lien modifié" }); });
    // Pollution par la mémoire de sous-titres de MyMemory (mesuré le 2 nov. : « - لقد فقدت الوعي - دعني أرى, سيدة (أندروود) ») :
    // parenthèses, tiret de dialogue ou nom en alphabet latin absents de la phrase source.
    var src = String(source);
    var pol = [];
    if (/[()（）]/.test(c) && !/[()]/.test(src)) pol.push("parenthèses");
    if (/(^|\s)[-–—]\s/.test(c) && !/(^|\s)[-–—]\s/.test(src)) pol.push("tiret de dialogue");
    // L-02 (mesure du 4 nov.) : le serbe s'écrit aussi en latin ; MyMemory répond en latin (« Zvaću te večeras… »).
    // Les majuscules latines ne sont suspectes que si la réponse est surtout dans une AUTRE écriture.
    var lettresC = c.replace(/[^\p{L}]/gu, ""), latC = (c.match(/[A-Za-zÀ-ɏ]/g) || []).length;
    var reponseLatine = lettresC.length > 0 && latC / lettresC.length >= 0.5;
    if (!latin && !reponseLatine) (c.match(/\b[A-Z][a-z]{2,}\b/g) || []).forEach(function (w) { if (src.indexOf(w) < 0 && !/^(OK|Ok)$/.test(w)) pol.push("mot « " + w + " »"); });
    if (pol.length) rep.push({ controle: "ajout suspect", ok: false, detail: "texte étranger à la phrase (" + pol.join(", ") + ") : réponse probablement tirée d'une autre phrase" });
    // La longueur se compare à la phrase réellement envoyée (la phrase pré-éditée est souvent plus courte).
    var ls = String(reference || source).length, lc = c.length;
    if (ls > 25 && lc) {
      // Phrase courte : une expression se traduit souvent en 2 ou 3 mots (« Elle est tombée dans les pommes » → « She fainted », mesuré le 2 nov.).
      var ideo = /^(zh|ja|ko)$/.test(versLangue), r = lc / ls, min = ideo ? 0.15 : ls <= 45 ? 0.3 : 0.45, max = ideo ? 1.2 : 2.2;
      rep.push({ controle: "longueur", ok: r >= min && r <= max, detail: "rapport " + r.toFixed(2) + (r < min ? " : OMISSION probable" : r > max ? " : AJOUT probable" : "") });
    }
    if (!lc) rep.push({ controle: "traduction vide", ok: false, detail: "rien reçu" });
    if (lc && String(source).trim().toLowerCase() === c.trim().toLowerCase() && versLangue !== "fr") rep.push({ controle: "non traduit", ok: false, detail: "la traduction recopie l'original" });
    (analyse && analyse.expressions || []).forEach(function (x) {
      var p = PIEGES[x.id] && PIEGES[x.id][versLangue];
      if (!p) { rep.push({ controle: "expression « " + x.extrait + " »", ok: null, detail: "pas de mot-piège connu pour cette langue : relecture humaine" }); return; }
      var hit = p.filter(function (w) { return low.indexOf(w.toLowerCase()) >= 0; });
      rep.push({ controle: "expression « " + x.extrait + " »", ok: !hit.length, detail: hit.length ? "TRADUCTION MOT À MOT probable (« " + hit.join(", ") + " »)" : "image non traduite à la lettre" });
    });
    if (base && base.faux_amis) base.faux_amis.forEach(function (f) {
      if (f.vers === versLangue && U("\\b" + f.fr, "i").test(source) && U("\\b" + f.faux, "i").test(c)) rep.push({ controle: "faux ami « " + f.fr + " »", ok: false, detail: "« " + f.faux + " » est un faux ami ; sens attendu : " + f.vrai });
    });
    var nOk = rep.filter(function (x) { return x.ok === true; }).length, nKo = rep.filter(function (x) { return x.ok === false; }).length;
    return { resultats: rep, ok: nOk, echecs: nKo, a_relire: rep.filter(function (x) { return x.ok === null; }).length };
  }

  // ---------------------------------------------------------------- D. TRADUCTION (moteurs branchés de l'extérieur)
  // moteurs = { mymemory: function(texte, de, vers) → Promise<texte>, ia: function(requete) → Promise<{traduction,…}> }
  function traduire(texte, de, vers, options, moteurs, base) {
    options = options || {};
    var A = identifier(texte), B = comprendre(texte, de, base), C = preediter(texte, base), cons = consigne(options.style, B);
    var r = { A: A, B: B, C: { preedition: C, consigne: cons }, D: {}, E: {} };
    var jobs = [];
    if (moteurs && moteurs.mymemory) {
      jobs.push(moteurs.mymemory(texte, de, vers).then(function (t) { r.D.brut = t; r.E.brut = controler(texte, t, B, vers, base); }, function (e) { r.D.brut_erreur = String(e && e.message || e); }));
      if (C.faits.length) jobs.push(moteurs.mymemory(C.texte, de, vers).then(function (t) { r.D.preedite = t; r.E.preedite = controler(texte, t, B, vers, base, C.texte); }, function (e) { r.D.preedite_erreur = String(e && e.message || e); }));
    }
    if (moteurs && moteurs.ia) {
      var indices = B.expressions.map(function (x) { return { expression: x.extrait, sens: x.sens, equivalent_connu: x.eq && x.eq[vers] ? x.eq[vers].t : null }; });
      jobs.push(moteurs.ia({ texte: texte, de: de, vers: vers, style: cons.style, consigne: cons.texte, registre_source: cons.registre_source, expressions: indices, ironie_possible: B.ironie_possible, contexte: options.contexte || undefined })
        .then(function (o) { r.D.ia = o; r.E.ia = controler(texte, o && o.traduction, B, vers, base); }, function (e) { r.D.ia_erreur = String(e && e.message || e); }));
    }
    return Promise.all(jobs).then(function () {
      // « Meilleur gratuit » : la traduction directe garde mieux le ton (« I can't be bothered ») ; la phrase pré-éditée
      // ne sert qu'à RÉPARER une traduction directe où le contrôle voit du mot-à-mot ou un ajout suspect.
      if (r.D.brut || r.D.preedite) {
        var casse = r.E.brut && r.E.brut.resultats.some(function (x) { return x.ok === false && /MOT À MOT|ajout suspect|non traduit/.test(x.detail + " " + x.controle); });
        var prendPre = r.D.preedite && (!r.D.brut || casse);
        r.D.gratuit = prendPre ? r.D.preedite : r.D.brut;
        r.D.gratuit_source = prendPre ? "pré-édition (réparation)" : "MyMemory direct";
        r.E.gratuit = prendPre ? r.E.preedite : r.E.brut;
      }
      return r;
    });
  }

  // ---------------------------------------------------------------- E bis. FIDÉLITÉ DU SENS (phase 4)
  // Contrôles guidés par les ATTENTES écrites dans la batterie (pas de devinette) : négation gardée, question gardée,
  // mois et jours gardés, noms propres (y compris en arabe et en chinois quand l'écriture est connue), mots attendus
  // (ex. « usted » quand on vouvoie), mots-pièges propres à la phrase. Sert pour les 3 colonnes, à égalité.
  var NEG = {
    en: /\b(not|no|never|nothing|nobody|no one|none|neither|nor|without)\b|n't/i,
    es: /(^|[^\p{L}])(no|nunca|jamás|nada|nadie|ningún|ninguna|ninguno|sin|tampoco|ni)(?![\p{L}])/iu,
    ar: /(^|[^\p{L}])(لا|لم|لن|ليس|ليست|لست|ما|بدون|دون|غير|أبدا|أبداً|أحد)(?![\p{L}])/u,
    zh: /[不没沒别別未无無非勿]/,
    sw: /(^|[^\p{L}])(si|sio|siyo|hapana|bila|wala|hakuna|kamwe|hakuna mtu)(?![\p{L}])/iu,
  };
  var QUESTION = /[?？؟]/;
  var MOIS = {
    janvier: { en: "january", es: "enero", ar: "يناير|كانون الثاني", zh: "1月|一月", sw: "januari" },
    "février": { en: "february", es: "febrero", ar: "فبراير|شباط", zh: "2月|二月", sw: "februari" },
    mars: { en: "march", es: "marzo", ar: "مارس|آذار", zh: "3月|三月", sw: "machi" },
    avril: { en: "april", es: "abril", ar: "أبريل|ابريل|إبريل|نيسان", zh: "4月|四月", sw: "aprili" },
    mai: { en: "may", es: "mayo", ar: "مايو|أيار", zh: "5月|五月", sw: "mei" },
    juin: { en: "june", es: "junio", ar: "يونيو|حزيران", zh: "6月|六月", sw: "juni" },
    juillet: { en: "july", es: "julio", ar: "يوليو|تموز", zh: "7月|七月", sw: "julai" },
    "août": { en: "august", es: "agosto", ar: "أغسطس|آب", zh: "8月|八月", sw: "agosti" },
    septembre: { en: "september", es: "septiembre|setiembre", ar: "سبتمبر|أيلول", zh: "9月|九月", sw: "septemba" },
    octobre: { en: "october", es: "octubre", ar: "أكتوبر|تشرين الأول", zh: "10月|十月", sw: "oktoba" },
    novembre: { en: "november", es: "noviembre", ar: "نوفمبر|تشرين الثاني", zh: "11月|十一月", sw: "novemba" },
    "décembre": { en: "december", es: "diciembre", ar: "ديسمبر|كانون الأول", zh: "12月|十二月", sw: "desemba" },
  };
  var JOURS = {
    lundi: { en: "monday", es: "lunes", ar: "الاثنين|الإثنين", zh: "星期一|周一|週一|礼拜一", sw: "jumatatu" },
    mardi: { en: "tuesday", es: "martes", ar: "الثلاثاء", zh: "星期二|周二|週二|礼拜二", sw: "jumanne" },
    mercredi: { en: "wednesday", es: "miércoles", ar: "الأربعاء", zh: "星期三|周三|週三|礼拜三", sw: "jumatano" },
    jeudi: { en: "thursday", es: "jueves", ar: "الخميس", zh: "星期四|周四|週四|礼拜四", sw: "alhamisi" },
    vendredi: { en: "friday", es: "viernes", ar: "الجمعة", zh: "星期五|周五|週五|礼拜五", sw: "ijumaa" },
    samedi: { en: "saturday", es: "sábado", ar: "السبت", zh: "星期六|周六|週六|礼拜六", sw: "jumamosi" },
    dimanche: { en: "sunday", es: "domingo", ar: "الأحد", zh: "星期日|星期天|周日|週日|礼拜天", sw: "jumapili" },
  };
  // Noms propres hors alphabet latin : graphies usuelles connues (sinon « à relire », jamais « faux » par défaut).
  var GRAPHIES = {
    Marie: { ar: "ماري(?![\u0621-\u064A])", zh: "玛丽|瑪麗" }, Karim: { ar: "كريم", zh: "卡里姆|卡利姆" }, "Saint-Denis": { ar: "سان دوني|سان دينيس", zh: "圣但尼|圣丹尼|聖但尼" },
    "Saint-Lazare": { ar: "سان لازار", zh: "圣拉扎尔|聖拉扎爾" }, Lyon: { ar: "ليون", zh: "里昂" }, Durand: { ar: "دوران|دوراند", zh: "杜兰|杜朗" }, Paris: { ar: "باريس", zh: "巴黎" },
  };
  function verifierSens(source, cible, vers, att) {
    att = att || {};
    var c = tiretsSimples(cible), low = c.toLowerCase(), rep = [];
    var cherche = function (motif) { return U("(^|[^\\p{L}])(" + motif + ")(?![\\p{L}])", "iu").test(low) || (/^(zh|ja|ar)$/.test(vers) && new RegExp(motif).test(c)); };
    if (att.negation) {
      var extra = att.negation_aussi && att.negation_aussi[vers];
      var okN = (NEG[vers] ? NEG[vers].test(c) : false) || !!(extra && extra.some(function (x) { return low.indexOf(x.toLowerCase()) >= 0; }));
      rep.push({ controle: "négation gardée", ok: NEG[vers] ? (okN ? true : vers === "sw" ? null : false) : null, detail: okN ? "négation présente" : NEG[vers] ? "NÉGATION PERDUE probable : le sens peut être inversé" : "langue non outillée : relecture" });
    }
    if (att.question) {
      var okQ = QUESTION.test(c);
      rep.push({ controle: "question gardée", ok: okQ, detail: okQ ? "point d'interrogation présent" : "LA QUESTION EST DEVENUE UNE AFFIRMATION probable" });
    }
    (att.mois || []).forEach(function (m) { var g = MOIS[m] && MOIS[m][vers]; if (!g) return; var okM = cherche(g); rep.push({ controle: "mois « " + m + " »", ok: okM, detail: okM ? "gardé" : "MOIS absent ou changé" }); });
    (att.jours || []).forEach(function (j) { var g = JOURS[j] && JOURS[j][vers]; if (!g) return; var okJ = cherche(g); rep.push({ controle: "jour « " + j + " »", ok: okJ, detail: okJ ? "gardé" : "JOUR absent ou changé" }); });
    (att.noms || []).forEach(function (n) {
      var g = GRAPHIES[n] && GRAPHIES[n][vers];
      var okL = low.indexOf(n.toLowerCase()) >= 0 || (g ? new RegExp(g).test(c) : false);
      rep.push({ controle: "nom « " + n + " »", ok: okL ? true : (g || /^(en|es|sw|fr|pt|de|it)$/.test(vers)) ? false : null, detail: okL ? "gardé" : g || /^(en|es|sw)$/.test(vers) ? "NOM absent ou changé" : "écriture non vérifiable : relecture" });
    });
    var a = att.attendus && att.attendus[vers];
    if (a) a.forEach(function (motif) { var okA = new RegExp(motif, "iu").test(c); rep.push({ controle: "attendu /" + motif + "/", ok: okA, detail: okA ? "présent" : "absent : " + (att.pourquoi || "voir la batterie") }); });
    var p = att.pieges && att.pieges[vers];
    // Mot entier pour les écritures à espaces (mesuré le 3 nov. : « serious » trouvé à tort dans « Seriously »). Arabe, persan, hébreu : préfixes collés (بال…), on garde la recherche simple.
    if (p) { var hit = p.filter(function (w) { var lw = w.toLowerCase(); return /^(zh|ja|th|lo|km|my|ar|fa|ur|he)$/.test(vers) ? low.indexOf(lw) >= 0 : U("(^|[^\\p{L}])" + lw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\p{L}])", "iu").test(low); }); rep.push({ controle: "mot-piège de la phrase", ok: !hit.length, detail: hit.length ? "TRADUCTION MOT À MOT probable (« " + hit.join(", ") + " »)" : "pas de mot-piège" }); }
    var nOk = rep.filter(function (x) { return x.ok === true; }).length, nKo = rep.filter(function (x) { return x.ok === false; }).length;
    return { resultats: rep, ok: nOk, echecs: nKo, a_relire: rep.filter(function (x) { return x.ok === null; }).length };
  }

  var api = { verifierSens: verifierSens, MOIS: MOIS, JOURS: JOURS, identifier: identifier, comprendre: comprendre, preediter: preediter, consigne: consigne, controler: controler, traduire: traduire, extraireNombres: extraireNombres, nomsPropres: nomsPropres, STYLES: STYLES, PIEGES: PIEGES };
  if (typeof module === "object" && module.exports) module.exports = api; else root.OW_SOCLE = api;
})(this);

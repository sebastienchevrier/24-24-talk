/* 24/24 ONE WORLD — Labo linguistique : batterie SPÉCIFIQUE de la phase 4 (IA mesurée sur TEST).
   © 2026 Sébastien Chevrier. Tous droits réservés.
   29 phrases sources en français, 9 familles demandées par Sébastien le 2 nov. 2026 : idiomes, argot, familier,
   soutenu, métaphores, doubles sens, négations, heures/dates/nombres, contexte de conversation.
   La plupart des expressions ici sont ABSENTES de la base du labo (expressions-fr.js) : on mesure ce que chaque
   système fait SANS aide, c'est le cas réel le plus fréquent.
   Champs d'attente (contrôlés par socle.verifierSens, pour les 3 colonnes à égalité) :
   - negation / question : la négation ou la question doivent survivre ; negation_aussi = tournures sans mot négatif
     mais de même sens (« out of the question ») ;
   - mois / jours / noms : à garder ; les nombres sont toujours contrôlés (socle.controler) ;
   - attendus[langue] : motifs qui DOIVENT apparaître (vouvoiement, pronom déduit du contexte) ;
   - pieges[langue] : mots qui trahissent une traduction MOT À MOT de cette phrase précise ;
   - contexte : messages précédents envoyés à l'IA (MyMemory ne sait pas les utiliser) ;
   - sens : ce que la phrase veut dire, pour la relecture humaine.
   Rédigé par Claude (non natif des langues cibles) : les pièges et attendus sont des indices, pas une vérité. */
(function (root) {
  "use strict";
  var B = [
    // --- Idiomes (absents de la base)
    { famille: "idiomes", t: "Arrête de tourner autour du pot et dis-moi la vérité.", sens: "Parle franchement.",
      pieges: { en: ["the pot", "around the jar"], es: ["olla", "maceta"], zh: ["锅", "罐"], ar: ["القدر", "الوعاء"], sw: ["chungu", "sufuria"] } },
    { famille: "idiomes", t: "Il a mis les pieds dans le plat pendant le dîner.", sens: "Il a abordé maladroitement un sujet gênant.",
      pieges: { en: ["feet in the", "plate", "dish"], es: ["pies en el plato"], zh: ["盘子", "盘里"], ar: ["الطبق", "قدميه في"], sw: ["sahani"] } },
    { famille: "idiomes", t: "Elle a le cœur sur la main.", sens: "Elle est très généreuse.",
      pieges: { en: ["on her hand", "in her hand", "on the hand", "sleeve"], es: ["corazón en la mano"], zh: ["手上", "手里"], ar: ["على يدها", "في يدها"], sw: ["mkononi"] } },
    // --- Argot
    { famille: "argot", t: "Ce mec est trop relou, il me saoule.", sens: "Ce type est pénible, il m'agace.",
      pieges: { en: ["drunk", "drink"], es: ["borracho", "emborracha"], zh: ["醉", "喝"], ar: ["سكران", "يسكر", "أسكر"], sw: ["lewa", "pombe"] } },
    { famille: "argot", t: "J'ai pas une thune pour sortir ce week-end.", sens: "Je n'ai pas d'argent ce week-end.",
      negation: true, negation_aussi: { en: ["broke"], es: ["sin blanca", "pelado"] },
      pieges: { en: ["tuna"], es: ["atún"], zh: ["金枪鱼"], ar: ["تونة"], sw: ["jodari"] } },
    { famille: "argot", t: "Grave, c'est chanmé ce resto !", sens: "Oui, ce restaurant est génial !",
      pieges: { en: ["serious", "grave"], es: ["grave"], zh: ["严重"], ar: ["خطير"], sw: ["hatari", "kaburi"] } },
    // --- Familier
    { famille: "familier", t: "Tu viens ou pas ? On t'attend depuis une plombe.", sens: "Tu viens ? On t'attend depuis longtemps.",
      question: true, pieges: { en: ["lead", "plumb"], es: ["plomo"], zh: ["铅"], ar: ["رصاص"], sw: ["risasi"] } },
    { famille: "familier", t: "Laisse tomber, c'est pas grave.", sens: "Oublie, ce n'est pas important.",
      negation: true, negation_aussi: { en: ["never mind", "don't worry", "forget it"] },
      pieges: { en: ["let fall", "let it fall"], es: ["deja caer"], zh: ["掉下", "掉落"], ar: ["دعه يسقط", "اتركه يسقط"], sw: ["acha ianguke"] } },
    { famille: "familier", t: "Je suis crevé, je vais pioncer.", sens: "Je suis épuisé, je vais dormir.",
      pieges: { en: ["punctured", "burst", "flat tire"], es: ["pinchado", "reventado"], zh: ["爆胎", "扎破"], ar: ["مثقوب"], sw: ["pancha"] } },
    // --- Soutenu
    { famille: "soutenu", t: "Je vous prie d'agréer, Madame, l'expression de mes salutations distinguées.", sens: "Formule de politesse de fin de lettre.",
      pieges: { en: ["i pray"], es: ["le rezo"], zh: ["祈祷"], ar: ["أصلي"], sw: ["naomba dua"] } },
    { famille: "soutenu", t: "Il ne saurait être question de reporter cette réunion.", sens: "Il est hors de question de reporter cette réunion.",
      negation: true, negation_aussi: { en: ["out of the question"], es: ["fuera de discusión", "impensable"], ar: ["غير وارد", "مستحيل"] },
      pieges: { en: ["would know"], es: ["sabría"], zh: ["知道"], ar: ["يعرف"], sw: ["kujua"] } },
    { famille: "soutenu", t: "Veuillez m'excuser pour ce contretemps indépendant de ma volonté.", sens: "Excusez-moi pour ce retard ou empêchement que je n'ai pas choisi." },
    // --- Métaphores
    { famille: "métaphores", t: "Il est sous l'eau en ce moment avec son travail.", sens: "Il est débordé de travail.",
      pieges: { en: ["underwater", "under water"], es: ["bajo el agua", "debajo del agua"], zh: ["水下", "水里", "水中"], ar: ["تحت الماء"], sw: ["chini ya maji"] } },
    { famille: "métaphores", t: "Mon patron m'a passé un savon.", sens: "Mon patron m'a fortement réprimandé.",
      pieges: { en: ["soap"], es: ["jabón"], zh: ["肥皂"], ar: ["صابون"], sw: ["sabuni"] } },
    { famille: "métaphores", t: "Cette nouvelle m'a brisé le cœur.", sens: "Cette nouvelle m'a rendu très triste (image partagée par beaucoup de langues)." },
    // --- Doubles sens
    { famille: "doubles sens", t: "Ce n'est pas très frais.", sens: "Ambigu : pas frais (aliment) ou pas sympa / pas froid. Relecture.", negation: true, ambigu: true },
    { famille: "doubles sens", t: "Cette blague est un peu lourde.", sens: "Cette blague est de mauvais goût / insistante.",
      pieges: { en: ["heavy"], zh: ["很重", "沉重"], sw: ["nzito"] } },
    { famille: "doubles sens", t: "Il a tout volé dans la boutique.", sens: "Il a tout dérobé (voler = dérober, pas « voler dans les airs »).",
      pieges: { en: ["flew", "flown"], es: ["voló"], zh: ["飞"], ar: ["طار"], sw: ["aliruka", "ruka"] } },
    // --- Négations
    { famille: "négations", t: "Je ne viendrai jamais à cette fête.", sens: "Refus ferme et définitif.", negation: true },
    { famille: "négations", t: "Personne n'a appelé ce matin.", sens: "Aucun appel ce matin.", negation: true },
    { famille: "négations", t: "Je n'ai rien contre toi, mais je ne peux pas venir.", sens: "Pas d'hostilité, mais impossible de venir.", negation: true },
    { famille: "négations", t: "Ce n'est pas que je ne veux pas, c'est que je ne peux pas.", sens: "Je veux bien, mais je ne peux pas (double négation à garder).", negation: true },
    // --- Heures, dates, nombres
    { famille: "heures, dates, nombres", t: "Le rendez-vous est le vendredi 3 avril à 8 h 15.", jours: ["vendredi"], mois: ["avril"] },
    { famille: "heures, dates, nombres", t: "J'ai payé 1 499,99 € pour 2 billets le 31 décembre.", mois: ["décembre"] },
    { famille: "heures, dates, nombres", t: "Le train part à 23 h 45, quai 12, dimanche.", jours: ["dimanche"] },
    { famille: "heures, dates, nombres", t: "Il me faut 3 kilos de riz et une demi-douzaine d'œufs.", sens: "Une demi-douzaine = 6 (relecture)." },
    // --- Contexte de conversation (l'IA reçoit les messages précédents, MyMemory non)
    { famille: "contexte", contexte: ["Ma sœur cherche un appartement à Lyon.", "Elle a trouvé quelque chose ?"],
      t: "Oui, elle l'a visité hier et elle l'adore.", sens: "« elle » = la sœur ; « l' » = l'appartement.",
      attendus: { en: ["\\bshe\\b"], es: ["\\b(lo|piso|apartamento)\\b"] }, pourquoi: "le contexte dit qui (la sœur) et quoi (l'appartement)" },
    { famille: "contexte", contexte: ["Tu as vu le match hier soir ?"],
      t: "Oui, ils ont volé la victoire !", sens: "Ils ont gagné sans le mériter (volé = dérobé).",
      pieges: { en: ["flew", "flown"], es: ["volaron"], zh: ["飞"], ar: ["طاروا"], sw: ["waliruka"] } },
    { famille: "contexte", contexte: ["Je vous présente Madame Durand, notre nouvelle directrice."],
      t: "Enchanté. Vous pouvez m'appeler quand vous voulez.", sens: "Vouvoiement de politesse envers une seule personne (Madame Durand).",
      attendus: { es: ["\\b(puede|usted|quiera)\\b"] }, pourquoi: "on vouvoie une seule personne : usted, pas tú ni vosotros" },
  ];
  var LANGUES = ["en", "es", "ar", "zh", "sw"];
  var data = { cas: B, langues: LANGUES };
  if (typeof module === "object" && module.exports) module.exports = data; else root.OW_BATTERIE_P4 = data;
})(this);

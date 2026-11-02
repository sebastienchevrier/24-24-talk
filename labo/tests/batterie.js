/* 24/24 ONE WORLD — Labo linguistique : batterie de tests (15 familles, phrases sources en français).
   © 2026 Sébastien Chevrier. Tous droits réservés.
   Chaque cas dit ce que le moteur doit REPÉRER (expressions, registre, ironie, région, ambiguïté) et ce que la
   traduction doit GARDER (nombres, noms propres, émojis). La qualité d'ensemble se note aussi à la main (0 à 3). */
(function (root) {
  "use strict";
  var B = [
    { famille: "normal", t: "Je t'appelle ce soir après le travail.", registre: "normal" },
    { famille: "normal", t: "Le médecin a dit que ce n'est pas grave.", registre: "normal" },
    { famille: "familier", t: "T'es où ? Je suis à la bourre, j'arrive dans 10 minutes.", registre: "familier", expressions: ["fr.a-la-bourre"], nombres: ["10"] },
    { famille: "familier", t: "J'ai la flemme de sortir ce soir.", registre: "familier", expressions: ["fr.flemme"] },
    { famille: "argot", t: "Ton concert, c'est ouf !", registre: "argot", expressions: ["fr.c-est-ouf"] },
    { famille: "argot", t: "Je kiffe trop cette chanson.", registre: "argot", expressions: ["fr.kiffer"] },
    { famille: "argot", t: "J'ai les boules, on a perdu.", registre: "argot", expressions: ["fr.avoir-les-boules"] },
    { famille: "soutenu", t: "Je vous saurais gré de bien vouloir me répondre avant vendredi.", registre: "soutenu" },
    { famille: "soutenu", t: "Nonobstant ces difficultés, nous poursuivrons nos efforts.", registre: "soutenu" },
    { famille: "formel", t: "Madame, veuillez trouver ci-joint la facture n° 2026-118 d'un montant de 1 250 €.", registre: "formel", nombres: ["2026", "118", "1250"] },
    { famille: "idiomatique", t: "Il m'a posé un lapin.", expressions: ["fr.poser-un-lapin"] },
    { famille: "idiomatique", t: "Ce projet va cartonner !", expressions: ["fr.cartonner"] },
    { famille: "idiomatique", t: "Cette voiture coûte les yeux de la tête.", expressions: ["fr.yeux-de-la-tete"] },
    { famille: "idiomatique", t: "Bon anniversaire, je t'embrasse fort.", expressions: ["fr.je-t-embrasse-fort"] },
    { famille: "idiomatique", t: "Elle est tombée dans les pommes.", expressions: ["fr.tomber-dans-les-pommes"] },
    { famille: "idiomatique", t: "J'ai d'autres chats à fouetter.", expressions: ["fr.autres-chats"] },
    { famille: "idiomatique", t: "Je ne suis pas dans mon assiette aujourd'hui.", expressions: ["fr.dans-son-assiette"] },
    { famille: "métaphorique", t: "Il pleut des cordes, reste à la maison.", expressions: ["fr.pleut-des-cordes"] },
    { famille: "métaphorique", t: "Tu as encore la tête dans les nuages.", expressions: ["fr.tete-dans-les-nuages"] },
    { famille: "métaphorique", t: "Ce mois-ci on se serre la ceinture.", expressions: ["fr.serrer-la-ceinture"] },
    { famille: "humoristique", t: "Mon frère a un poil dans la main, mdr.", registre: "humoristique", expressions: ["fr.poil-dans-la-main"] },
    { famille: "humoristique", t: "Le film ne casse pas trois pattes à un canard.", expressions: ["fr.trois-pattes-canard"] },
    { famille: "ironie", t: "Bravo, encore en retard… comme d'habitude 🙄", ironie: true },
    { famille: "ironie", t: "Génial, il pleut des cordes et j'ai oublié mon parapluie.", ironie: false, expressions: ["fr.pleut-des-cordes"], note: "ironie sans signe écrit : le prototype NE la repère PAS (limite assumée)" },
    { famille: "régional", t: "La marmaille joue devant la case.", regional: ["marmaille", "la case"] },
    { famille: "régional", t: "Il y avait septante personnes à la fête.", regional: ["septante"], nombres: ["70"] },
    { famille: "faux amis", t: "Actuellement, je travaille dans une librairie.", fauxAmis: ["actuellement", "librairie"] },
    { famille: "faux amis", t: "Elle est très sensible.", fauxAmis: ["sensible"] },
    { famille: "ambigu", t: "Je suis allé chez l'avocat ce matin.", ambigu: true },
    { famille: "ambigu", t: "Tu peux passer me voir demain ?", ambigu: true },
    { famille: "long", t: "Bonjour à tous, je voulais vous remercier pour cette belle soirée d'hier. C'était vraiment un plaisir de vous retrouver après toutes ces années. Marie a promis d'envoyer les photos dimanche, et Karim propose qu'on se revoie le 14 décembre chez lui, à Saint-Denis, vers 19 h. Dites-moi si vous êtes disponibles, et n'oubliez pas d'apporter un plat. Je vous embrasse tous très fort, et à très vite !", expressions: ["fr.je-t-embrasse-fort"], nombres: ["14", "19"], noms: ["Marie", "Karim", "Saint-Denis"] },
    { famille: "mélange de langues", t: "On se voit at the station, ok ? Je t'attends à 9 h.", melange: true, nombres: ["9"] },
    { famille: "mélange de langues", t: "C'est vraiment cool, merci bro.", melange: true },
    { famille: "nombres et noms", t: "Marie a envoyé 250 € à Karim le 12 mars à 14 h 30.", nombres: ["250", "12", "14", "30"], noms: ["Marie", "Karim"] },
    { famille: "nombres et noms", t: "Rendez-vous gare Saint-Lazare, quai 7, à 9 h.", nombres: ["7", "9"], noms: ["Saint-Lazare"] },
  ];
  var LANGUES = ["en", "es", "ar", "zh", "sw"];
  var data = { cas: B, langues: LANGUES };
  if (typeof module === "object" && module.exports) module.exports = data; else root.OW_BATTERIE = data;
})(this);

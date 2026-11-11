/* 24/24 ONE WORLD — Labo linguistique : batterie COURTE des registres, passée sur les 112 langues.
   © 2026 Sébastien Chevrier. Tous droits réservés.
   Une phrase par registre obligatoire (11), plus une négation et une phrase de nombres et de noms = 13 phrases,
   ~650 caractères par langue : tient dans le quota gratuit de MyMemory pour chaque machine.
   Les pièges notés ici sont FRANÇAIS : ils se cherchent dans la retraduction vers le français (langue → fr),
   ce qui donne un indice de mot à mot pour N'IMPORTE quelle langue, même sans locuteur. Un indice, pas une preuve. */
(function (root) {
  "use strict";
  var B = [
    { registre: "normal", t: "Je t'appelle ce soir après le travail." },
    { registre: "familier", t: "J'ai la flemme de sortir ce soir." },
    { registre: "argot", t: "Ton concert, c'est ouf !" },
    { registre: "soutenu", t: "Je vous saurais gré de bien vouloir me répondre avant vendredi.", jours: ["vendredi"] },
    { registre: "formel", t: "Madame, veuillez trouver ci-joint la facture n° 2026-118 d'un montant de 1 250 €." },
    { registre: "littéraire", t: "La nuit tombait doucement sur la ville endormie." },
    { registre: "idiomatique", t: "Il m'a posé un lapin.", pieges_retour: ["lapin"], complexe: true },
    { registre: "métaphorique", t: "Il pleut des cordes, reste à la maison.", pieges_retour: ["corde"], complexe: true },
    { registre: "humoristique", t: "Le film ne casse pas trois pattes à un canard.", pieges_retour: ["canard", "pattes"], complexe: true },
    { registre: "régional", t: "Il y avait septante personnes à la fête." },
    { registre: "émotionnel", t: "Je suis tellement heureux de te revoir, tu m'as manqué !" },
    { registre: "négation", t: "Je ne viendrai jamais à cette fête.", negation: true },
    { registre: "nombres et noms", t: "Marie a envoyé 250 € à Karim le 12 mars à 14 h 30.", noms: ["Marie", "Karim"], mois: ["mars"] },
  ];
  var REGISTRES = ["normal", "familier", "argot", "soutenu", "formel", "littéraire", "idiomatique", "métaphorique", "humoristique", "régional", "émotionnel"];
  var data = { cas: B, registres: REGISTRES };
  if (typeof module === "object" && module.exports) module.exports = data; else root.OW_BATTERIE_REGISTRES = data;
})(this);

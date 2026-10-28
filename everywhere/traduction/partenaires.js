/* 24/24 TRAVEL — partenaires de réservation (liens d'affiliation). © 2026 Sébastien Chevrier. Tous droits réservés.
   Chaque réservation faite par ces liens peut rapporter une commission à 24/24 ONE WORLD, sans rien coûter de plus au voyageur.
   « url » = lien d'affiliation de Sébastien quand il l'a reçu du programme ; tant qu'il est vide, « site » (lien simple, sans commission).
   Ajouter un partenaire = une ligne ici, rien d'autre à modifier. Les textes sont dans voyage.js (clés bk_<id>, bk_<id>_d). */
window.EW_PARTNERS = [
  { id: "hotel", icon: "🏨", brand: "Booking.com", site: "https://www.booking.com/", url: "" },
  { id: "esim", icon: "📶", brand: "Airalo", site: "https://www.airalo.com/", url: "" },
  { id: "assur", icon: "🛟", brand: "SafetyWing", site: "https://safetywing.com/nomad-insurance", url: "" },
  { id: "act", icon: "🎟️", brand: "GetYourGuide", site: "https://www.getyourguide.com/", url: "" }
];

/* Envoyer de l'argent (#/business/argent) : lien de parrainage de Sébastien par service, tant qu'il est vide le lien simple s'affiche.
   Wise : programme Partnerize (wise.com/gb/affiliate-program) ; Remitly : programme Impact (remitly.com/us/en/landing/partner-program). */
window.EW_MONEY_AFF = { "Wise": "", "Remitly": "" };

/* 24/24 ONE WORLD — AI LAB : espace d'innovation IA. © 2026 Sébastien Chevrier. Tous droits réservés.
   Statut : « Bientôt ». Cette page présente seulement ce qui est prévu (PROPOSITION) : aucune fonction n'est simulée,
   aucun service d'IA n'est appelé, aucune clé n'est présente dans le site. Route : #/ailab. */
(function () {
  "use strict";
  var STR = {
    fr: {
      title: "AI LAB", soon: "BIENTÔT", sub: "L'espace d'innovation de 24/24 ONE WORLD.",
      intro: "AI LAB accueillera les expériences d'intelligence artificielle de ONE WORLD. Rien n'y fonctionne encore : cette page présente ce qui est prévu.",
      ideas_t: "Pistes prévues (propositions, non développées)",
      ideas: "Tuteur de conversation pour Apprendre : parler avec une IA qui corrige avec bienveillance.|Résumé et reformulation d'une conversation traduite, à la demande.|Traduction plus naturelle des expressions et du ton (politesse, humour).|Assistant de voyage : préparer les phrases utiles d'un séjour à partir de votre programme.",
      rules_t: "Nos règles avant d'ouvrir AI LAB",
      rules: "Aucune fonction présentée comme disponible tant qu'elle n'est pas testée.|Aucun service payant activé sans l'accord écrit de Sébastien.|Aucune clé secrète dans le site : l'IA passerait par une fonction serveur protégée.|Vos conversations ne servent jamais à entraîner un modèle sans votre accord explicite.",
      now_t: "Disponible dès aujourd'hui", now: "Pour parler avec quelqu'un dans une autre langue, utilisez Face à face ; pour apprendre une langue, Apprendre.",
      ew: "Ouvrir Face à face", learn: "Ouvrir Apprendre"
    },
    en: {
      title: "AI LAB", soon: "COMING SOON", sub: "The innovation space of 24/24 ONE WORLD.",
      intro: "AI LAB will host ONE WORLD's artificial intelligence experiments. Nothing works here yet: this page shows what is planned.",
      ideas_t: "Planned ideas (proposals, not built)",
      ideas: "Conversation tutor for Learn: talk with an AI that corrects you kindly.|On-demand summary and rephrasing of a translated conversation.|More natural translation of expressions and tone (politeness, humor).|Travel assistant: prepare useful phrases for a trip from your plans.",
      rules_t: "Our rules before opening AI LAB",
      rules: "No feature shown as available until it is tested.|No paid service turned on without Sébastien's written approval.|No secret key in the site: AI would go through a protected server function.|Your conversations are never used to train a model without your explicit consent.",
      now_t: "Available today", now: "To talk with someone in another language, use Face to face; to learn a language, Learn.",
      ew: "Open Face to face", learn: "Open Learn"
    }
  };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function list(txt) { return "<ul class=\"ai-list\">" + txt.split("|").map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"; }
  function show(root, uiLang) {
    var S = STR[uiLang === "en" ? "en" : "fr"];
    root.innerHTML =
      '<div class="ai-head"><span class="ai-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 3h6"/><path d="M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7.5 15h9"/></svg></span>' +
      '<div><h1 id="h-ailab">' + esc(S.title) + ' <span class="badge ai-badge">' + esc(S.soon) + '</span></h1><p class="muted">' + esc(S.sub) + "</p></div></div>" +
      '<div class="card"><p>' + esc(S.intro) + "</p></div>" +
      '<div class="card"><h2 class="cx-h">' + esc(S.ideas_t) + "</h2>" + list(S.ideas) + "</div>" +
      '<div class="card"><h2 class="cx-h">' + esc(S.rules_t) + "</h2>" + list(S.rules) + "</div>" +
      '<div class="card"><h2 class="cx-h">' + esc(S.now_t) + "</h2><p>" + esc(S.now) + '</p><div class="cx-actions"><a class="btn primary" href="#/everywhere">' + esc(S.ew) + '</a><a class="btn" href="#/learn">' + esc(S.learn) + "</a></div></div>";
    return S.title;
  }
  window.EWAilab = { show: show };
})();

/* 24/24 LEARN — apprendre une langue (interface LEARN de 24/24 ONE WORLD). Prototype construit le 4 oct. 2026 sous le nom
   « EVERYWHERE 0.4.0 », isolé et renommé LEARN le même jour (rectification de Sébastien). Progression conservée (clé ew_learn_v1). © 2026 Sébastien Chevrier. Tous droits réservés.
   Écrans (routes du portail) :
     #/learn                 tableau de bord
     #/learn/apprendre       choix de la langue, du niveau, liste des leçons
     #/learn/lecon/<id>      leçon : vocabulaire, expressions, exercices, résultat
     #/learn/reviser         révision (mots ratés et leçons terminées)
     #/learn/defi            défi rapide
     #/learn/progression     suivi de progression
     #/learn/conversation    conversation avec l'IA (à venir, besoin identifié)
     #/learn/cultures        cultures du monde (à venir)
   Contenus : learn/content/catalogue.json + un fichier par langue. Progression : learn/progress.js. Exercices : learn/exercises.js. */
(function () {
  "use strict";
  var P = window.EWProgress, X = window.EWExercises;
  var esc = X.esc;
  var BASE = "learn/content/";
  var cat = null, catP = null, langs = {}, langP = {};
  var token = 0;        // évite qu'un ancien chargement n'écrase un écran plus récent
  var lang = "fr", T = null;

  var STR = {
    fr: {
      title: "Apprendre", sub: "Apprendre sans limites.", loading: "Chargement…", load_err: "Le contenu n'a pas pu être chargé.", retry: "Réessayer",
      start_title: "Quelle langue voulez-vous apprendre ?", start_txt: "Choisissez une langue et un niveau : votre première leçon vous attend.", choose_lang: "Choisir une langue",
      continue: "Continuer", start: "Commencer", next_lesson: "Prochaine leçon", all_done: "Toutes les leçons de ce niveau sont terminées. Bravo !",
      today: "Objectif du jour", streak_1: "{n} jour d'affilée", streak_n: "{n} jours d'affilée", xp: "{n} XP",
      m_learn: "Apprendre une langue", m_learn_d: "Leçons par thèmes, vocabulaire, expressions", m_ex: "Exercices et défis", m_ex_d: "Défi rapide sur vos mots",
      m_rev: "Réviser", m_rev_d: "Vos erreurs et vos leçons terminées", m_ai: "Conversation avec l'IA", m_ai_d: "Pratiquer en discutant",
      m_cult: "Cultures du monde", m_cult_d: "Pays, traditions, histoires", m_prog: "Ma progression", m_prog_d: "Leçons, exercices, objectifs",
      soon: "Bientôt", local_note: "Votre progression est enregistrée sur cet appareil. La synchronisation avec votre compte est la prochaine étape.",
      learn_h: "Apprendre une langue", lang_h: "Langue", level_h: "Niveau", lessons_h: "Leçons", no_lesson: "Pas encore de leçon à ce niveau.",
      done_badge: "Terminée · {s}/{t}", new_badge: "Nouvelle", ex_count: "{n} exercices",
      vocab_h: "Vocabulaire", phrases_h: "Expressions courantes", listen: "Écouter", listen_slow: "Écouter lentement", go_ex: "Commencer les exercices ({n})",
      ex_of: "Exercice {i} sur {n}", quit: "Quitter", next: "Continuer", see_result: "Voir le résultat",
      ok_1: "Bravo !", ok_2: "Exact !", ok_3: "Parfait !", bad: "Pas tout à fait. La bonne réponse : {a}", match_ok: "Toutes les paires sont trouvées !", match_bad: "Terminé, avec {n} erreur(s) en chemin.",
      result_h: "Résultat", score: "{s} bonnes réponses sur {t}", res_great: "Excellent travail !", res_good: "Bien joué, continuez ainsi !", res_try: "Chaque essai vous fait progresser. Recommencez quand vous voulez.",
      xp_won: "+{n} XP", review_h: "À revoir", again: "Recommencer", home: "Tableau de bord", see_prog: "Voir ma progression", lesson_next: "Leçon suivante",
      rev_h: "Réviser", rev_txt: "Questions tirées de vos erreurs et de vos leçons terminées.", rev_empty: "Terminez d'abord une leçon : la révision reprendra ses mots.",
      def_h: "Défi rapide", def_txt: "8 questions sur les mots de votre niveau. Prêt ?",
      q_how: "Comment dit-on « {t} » ?", q_mean: "Que veut dire « {w} » ?", q_listen: "Écoutez, puis choisissez ce que vous entendez.",
      prog_h: "Ma progression", st_xp: "Points (XP)", st_lessons: "Leçons terminées", st_ex: "Exercices réalisés", st_rate: "Réussite", st_streak: "Série",
      goal_h: "Objectif quotidien", goal_txt: "{d} / {g} XP aujourd'hui", per_lang: "Progression par langue", lessons_of: "{d} leçon(s) sur {t}",
      hist_h: "Historique", hist_empty: "Aucune activité pour l'instant.", k_lesson: "Leçon", k_review: "Révision", k_challenge: "Défi",
      reset: "Effacer ma progression sur cet appareil", reset_sure: "Confirmer l'effacement", reset_done: "Progression effacée.",
      ai_h: "Conversation avec l'IA", ai_p1: "Bientôt : discuter par écrit avec une IA bienveillante, dans la langue et au niveau de votre choix, sur un thème (voyage, travail, vie courante). La voix viendra ensuite.",
      ai_p2: "Pourquoi pas tout de suite ? Une IA de conversation demande un service externe. Sa clé doit rester secrète sur un serveur, jamais dans le site. Rien n'est activé et aucune dépense n'est engagée sans votre accord.",
      cult_h: "Cultures du monde", cult_p1: "Bientôt : pays et régions, traditions, histoires, articles et vidéos, découverte des langues.",
      cult_p2: "La structure des contenus est prévue comme celle des leçons : un fichier par thème, ajouté sans modifier l'application.",
      back: "Retour", k_expr: "Comprendre une expression", k_complete: "Compléter une phrase", k_listen: "Écoute", k_match: "Associer",
      choose: "Choisissez la bonne réponse.", right_answer: "bonne réponse", your_answer: "votre réponse", blank: "mot manquant", col_word: "Mots", col_tr: "Traductions",
      match_how: "Touchez un mot, puis sa traduction.", pair_ok: "Paire trouvée.", pair_bad: "Ce n'est pas la bonne paire.",
      no_voice: "La lecture vocale n'est pas disponible sur cet appareil. Le texte à entendre :", unknown: "Leçon introuvable.", progress_lbl: "Progression"
    },
    en: {
      title: "Learn", sub: "Learn without limits.", loading: "Loading…", load_err: "The content could not be loaded.", retry: "Try again",
      start_title: "Which language do you want to learn?", start_txt: "Pick a language and a level: your first lesson is waiting.", choose_lang: "Choose a language",
      continue: "Continue", start: "Start", next_lesson: "Next lesson", all_done: "All lessons at this level are done. Well done!",
      today: "Today's goal", streak_1: "{n} day in a row", streak_n: "{n} days in a row", xp: "{n} XP",
      m_learn: "Learn a language", m_learn_d: "Lessons by theme, vocabulary, phrases", m_ex: "Exercises and challenges", m_ex_d: "Quick challenge on your words",
      m_rev: "Review", m_rev_d: "Your mistakes and finished lessons", m_ai: "Chat with AI", m_ai_d: "Practise by talking",
      m_cult: "World cultures", m_cult_d: "Countries, traditions, stories", m_prog: "My progress", m_prog_d: "Lessons, exercises, goals",
      soon: "Soon", local_note: "Your progress is saved on this device. Syncing it with your account is the next step.",
      learn_h: "Learn a language", lang_h: "Language", level_h: "Level", lessons_h: "Lessons", no_lesson: "No lesson at this level yet.",
      done_badge: "Done · {s}/{t}", new_badge: "New", ex_count: "{n} exercises",
      vocab_h: "Vocabulary", phrases_h: "Common phrases", listen: "Listen", listen_slow: "Listen slowly", go_ex: "Start the exercises ({n})",
      ex_of: "Exercise {i} of {n}", quit: "Quit", next: "Continue", see_result: "See result",
      ok_1: "Well done!", ok_2: "Correct!", ok_3: "Perfect!", bad: "Not quite. The right answer: {a}", match_ok: "All pairs found!", match_bad: "Done, with {n} mistake(s) along the way.",
      result_h: "Result", score: "{s} correct answers out of {t}", res_great: "Excellent work!", res_good: "Well done, keep going!", res_try: "Every try helps you progress. Try again whenever you like.",
      xp_won: "+{n} XP", review_h: "To review", again: "Try again", home: "Dashboard", see_prog: "See my progress", lesson_next: "Next lesson",
      rev_h: "Review", rev_txt: "Questions taken from your mistakes and finished lessons.", rev_empty: "Finish a lesson first: review will use its words.",
      def_h: "Quick challenge", def_txt: "8 questions on words from your level. Ready?",
      q_how: "How do you say “{t}”?", q_mean: "What does “{w}” mean?", q_listen: "Listen, then choose what you hear.",
      prog_h: "My progress", st_xp: "Points (XP)", st_lessons: "Lessons done", st_ex: "Exercises done", st_rate: "Success", st_streak: "Streak",
      goal_h: "Daily goal", goal_txt: "{d} / {g} XP today", per_lang: "Progress by language", lessons_of: "{d} lesson(s) of {t}",
      hist_h: "History", hist_empty: "No activity yet.", k_lesson: "Lesson", k_review: "Review", k_challenge: "Challenge",
      reset: "Erase my progress on this device", reset_sure: "Confirm erase", reset_done: "Progress erased.",
      ai_h: "Chat with AI", ai_p1: "Soon: chat in writing with a friendly AI, in the language and at the level you choose, on a theme (travel, work, daily life). Voice will come next.",
      ai_p2: "Why not now? A conversation AI needs an external service. Its key must stay secret on a server, never in the website. Nothing is switched on and no cost is incurred without your approval.",
      cult_h: "World cultures", cult_p1: "Soon: countries and regions, traditions, stories, articles and videos, discovering languages.",
      cult_p2: "Content is organised like the lessons: one file per theme, added without changing the app.",
      back: "Back", k_expr: "Understand a phrase", k_complete: "Fill in the blank", k_listen: "Listening", k_match: "Match",
      choose: "Choose the right answer.", right_answer: "right answer", your_answer: "your answer", blank: "missing word", col_word: "Words", col_tr: "Translations",
      match_how: "Tap a word, then its translation.", pair_ok: "Pair found.", pair_bad: "That's not the right pair.",
      no_voice: "Speech is not available on this device. The text to hear:", unknown: "Lesson not found.", progress_lbl: "Progress"
    }
  };
  // Autres langues de l'interface (0.8.3) : langues-ecrans.js.
  (function (x) { if (x) Object.keys(x).forEach(function (k) { STR[k] = x[k]; }); })(window.EW_SCREEN_STR && window.EW_SCREEN_STR.learn);
  function t(k, v) {
    var s = (T && T[k]) || STR.en[k] || STR.fr[k] || k;
    if (v) Object.keys(v).forEach(function (n) { s = s.split("{" + n + "}").join(v[n]); });
    return s;
  }
  function loc(v) { return v && typeof v === "object" ? (v[lang] || v.en || v.fr || "") : (v || ""); }

  // ---------- Contenus ----------
  function getJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }
  function loadCat() {
    if (cat) return Promise.resolve(cat);
    if (!catP) catP = getJSON(BASE + "catalogue.json").then(function (c) { cat = c; return c; }, function (e) { catP = null; throw e; });
    return catP;
  }
  function loadLang(id) {
    if (langs[id]) return Promise.resolve(langs[id]);
    if (!langP[id]) {
      langP[id] = loadCat().then(function (c) {
        var L = c.languages.filter(function (l) { return l.id === id && l.status === "available"; })[0];
        if (!L) throw new Error("langue indisponible");
        return getJSON(BASE + L.file);
      }).then(function (d) { langs[id] = d; return d; }, function (e) { langP[id] = null; throw e; });
    }
    return langP[id];
  }
  function availableLangs() { return cat.languages.filter(function (l) { return l.status === "available"; }); }
  function langMeta(id) { return cat.languages.filter(function (l) { return l.id === id; })[0]; }
  function levelIdx(id) { return cat.levels.map(function (l) { return l.id; }).indexOf(id); }
  function findLesson(id) {
    var code = String(id).split("-")[0];
    return loadLang(code).then(function (d) { return { lang: code, lesson: d.lessons.filter(function (l) { return l.id === id; })[0], all: d.lessons }; });
  }
  function nextLesson(d, level) {
    var done = P.get().lessons;
    var inLevel = d.lessons.filter(function (l) { return l.level === level; });
    return inLevel.filter(function (l) { return !(done[l.id] && done[l.id].done); })[0] || null;
  }

  // ---------- Petits éléments ----------
  var ICON = {
    learn: "📘", ex: "🎯", rev: "🔁", ai: "💬", cult: "🌍", prog: "📈"
  };
  function bar(v, max, label) {
    var pc = max ? Math.min(100, Math.round(v / max * 100)) : 0;
    return '<div class="lx-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + max + '" aria-valuenow="' + Math.min(v, max) + '" aria-label="' + esc(label) + '"><span style="width:' + pc + '%"></span></div>';
  }
  function backLink(href) { return '<a class="lx-back" href="' + href + '">' + (document.documentElement.dir === "rtl" ? "→ " : "← ") + esc(t("back")) + "</a>"; }
  function stars(s, n) {
    var k = n ? (s / n >= 0.99 ? 3 : s / n >= 0.6 ? 2 : s / n > 0 ? 1 : 0) : 0;
    return '<p class="lx-stars" aria-label="' + k + ' / 3">' + "★★★".slice(0, k) + '<span>' + "★★★".slice(0, 3 - k) + "</span></p>";
  }
  function loadingHtml() { return '<div class="state"><div class="spinner" aria-hidden="true"></div><p>' + esc(t("loading")) + "</p></div>"; }
  function errorHtml() {
    return '<div class="state" role="alert"><p><b>' + esc(t("load_err")) + '</b></p><button type="button" class="btn primary" data-lx-retry>' + esc(t("retry")) + "</button></div>";
  }
  function focusH1(root) { var h = root.querySelector("h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } }

  // ---------- Écrans ----------
  function dashboard(root, my) {
    loadCat().then(function () {
      var p = P.get();
      var L = p.lang && langMeta(p.lang);
      var hero;
      var done = function (html) {
        if (my !== token) return;
        var mods = [
          ["learn", "#/learn/apprendre", "m_learn", "m_learn_d", true],
          ["ex", "#/learn/defi", "m_ex", "m_ex_d", true],
          ["rev", "#/learn/reviser", "m_rev", "m_rev_d", true],
          ["ai", "#/learn/conversation", "m_ai", "m_ai_d", false],
          ["cult", "#/learn/cultures", "m_cult", "m_cult_d", false],
          ["prog", "#/learn/progression", "m_prog", "m_prog_d", true]
        ];
        root.innerHTML = '<div class="lx-head"><span class="lx-logo" aria-hidden="true">' + '<svg viewBox="0 0 24 24">' + window.EWShell.icons.globe + "</svg></span>" +
          '<div><h1 id="h-ew">' + esc(t("title")) + '</h1><p class="muted">' + esc(t("sub")) + "</p></div></div>" + html +
          '<h2 class="h2">' + "Modules" + "</h2>" +
          '<div class="lx-mods">' + mods.map(function (m) {
            return '<a class="lx-mod' + (m[4] ? "" : " soon") + '" href="' + m[1] + '"><span class="lx-mod-ic" aria-hidden="true">' + ICON[m[0]] + "</span>" +
              "<span><b>" + esc(t(m[2])) + "</b><small>" + esc(t(m[3])) + "</small></span>" + (m[4] ? "" : '<span class="badge">' + esc(t("soon")) + "</span>") + "</a>";
          }).join("") + "</div>" + '<p class="note">' + esc(t("local_note")) + "</p>";
      };
      if (!L) {
        hero = '<div class="lx-hero"><h2>' + esc(t("start_title")) + "</h2><p>" + esc(t("start_txt")) + '</p><a class="btn primary wide" id="lxStart" href="#/learn/apprendre">' + esc(t("choose_lang")) + "</a></div>";
        done(hero);
        return;
      }
      loadLang(L.id).then(function (d) {
        var nx = nextLesson(d, p.level);
        var lvl = cat.levels[levelIdx(p.level)] || cat.levels[0];
        var st = P.streak();
        var today = P.todayXp();
        hero = '<div class="lx-hero"><p class="lx-hero-k"><span aria-hidden="true">' + L.flag + "</span> " + esc(loc(L.name)) + " · " + esc(loc(lvl.name)) + "</p>" +
          (nx ? "<h2>" + esc(t("next_lesson")) + " : " + esc(nx.title) + '</h2><p>' + esc(nx.goal) + '</p><a class="btn primary wide" id="lxContinue" href="#/learn/lecon/' + esc(nx.id) + '">' +
            esc(P.doneIn(L.id).length ? t("continue") : t("start")) + "</a>"
            : "<h2>" + esc(t("all_done")) + '</h2><a class="btn primary wide" href="#/learn/apprendre">' + esc(t("m_learn")) + "</a>") +
          '<div class="lx-today"><span>' + esc(t("today")) + " · " + esc(t("goal_txt", { d: today, g: p.goal })) + "</span>" + bar(today, p.goal, t("today")) +
          (st ? '<span class="lx-streak">🔥 ' + esc(t(st > 1 ? "streak_n" : "streak_1", { n: st })) + "</span>" : "") + "</div></div>";
        done(hero);
      }, function () { if (my === token) root.innerHTML = errorHtml(); });
    }, function () { if (my === token) root.innerHTML = errorHtml(); });
  }

  function learnScreen(root, my) {
    loadCat().then(function () {
      var p = P.get();
      var cur = p.lang && langMeta(p.lang) && langMeta(p.lang).status === "available" ? p.lang : null;
      var head = backLink("#/learn") + '<h1 id="h-ew">' + esc(t("learn_h")) + "</h1>" +
        '<h2 class="h2" id="lxLangH">' + esc(t("lang_h")) + '</h2><div class="lx-langs seg-grid" role="radiogroup" aria-labelledby="lxLangH">' +
        cat.languages.map(function (l) {
          var on = l.id === cur, ok = l.status === "available";
          return '<button type="button" role="radio" class="lx-lang" data-lang="' + esc(l.id) + '" aria-checked="' + on + '"' + (ok ? "" : " disabled") + ">" +
            '<span class="flag" aria-hidden="true">' + l.flag + "</span><b>" + esc(loc(l.name)) + "</b><small lang=\"" + esc(l.id) + "\">" + esc(l.native) + "</small>" +
            (ok ? "" : '<span class="badge">' + esc(t("soon")) + "</span>") + "</button>";
        }).join("") + "</div>" +
        '<h2 class="h2" id="lxLvlH">' + esc(t("level_h")) + '</h2><div class="lx-levels seg-grid" role="radiogroup" aria-labelledby="lxLvlH">' +
        cat.levels.map(function (l) {
          return '<button type="button" role="radio" class="lx-level" data-level="' + esc(l.id) + '" aria-checked="' + (l.id === p.level) + '"><b>' + esc(loc(l.name)) + "</b><small>" + esc(loc(l.hint)) + "</small></button>";
        }).join("") + "</div>" +
        '<h2 class="h2">' + esc(t("lessons_h")) + '</h2><div id="lxLessons" aria-live="polite"></div>';
      if (my !== token) return;
      root.innerHTML = head;
      paintLessons(root, my);
    }, function () { if (my === token) root.innerHTML = errorHtml(); });
  }
  function paintLessons(root, my) {
    var box = root.querySelector("#lxLessons");
    var p = P.get();
    if (!p.lang) { box.innerHTML = '<p class="muted">' + esc(t("start_txt")) + "</p>"; return; }
    box.innerHTML = loadingHtml();
    loadLang(p.lang).then(function (d) {
      if (my !== token) return;
      var list = d.lessons.filter(function (l) { return l.level === p.level; });
      var done = p.lessons;
      box.innerHTML = list.length ? '<div class="lx-lessons">' + list.map(function (l) {
        var r = done[l.id];
        return '<a class="lx-lesson" href="#/learn/lecon/' + esc(l.id) + '"><span class="lx-l-ic" aria-hidden="true">' + l.icon + "</span>" +
          "<span><small>" + esc(l.theme) + "</small><b>" + esc(l.title) + "</b><small>" + esc(t("ex_count", { n: l.exercises.length })) + "</small></span>" +
          '<span class="badge' + (r && r.done ? " ok" : "") + '">' + esc(r && r.done ? "✓ " + t("done_badge", { s: r.best, t: r.total }) : t("new_badge")) + "</span></a>";
      }).join("") + "</div>" : '<p class="muted">' + esc(t("no_lesson")) + "</p>";
    }, function () { if (my === token) box.innerHTML = errorHtml(); });
  }

  // ---------- Leçon et séries d'exercices ----------
  var run = null; // { kind, lang, voice, lesson, items, i, score, mistakes, rights, root }
  function lessonScreen(root, my, id) {
    root.innerHTML = loadingHtml();
    findLesson(id).then(function (r) {
      if (my !== token) return;
      if (!r.lesson) { root.innerHTML = backLink("#/learn/apprendre") + '<h1 id="h-ew">' + esc(t("unknown")) + "</h1>"; return; }
      var L = langMeta(r.lang), les = r.lesson;
      if (P.get().lang !== r.lang) P.setLang(r.lang);
      root.setAttribute("data-voice", L.voice);
      var item = function (v) {
        return '<li class="lx-word"><span><b lang="' + esc(r.lang) + '">' + esc(v.w) + "</b><small>" + esc(v.t) + "</small></span>" + X.speakBtn(v.w, t("listen") + " : " + v.w) + "</li>";
      };
      root.innerHTML = backLink("#/learn/apprendre") +
        '<p class="lx-hero-k"><span aria-hidden="true">' + L.flag + "</span> " + esc(loc(L.name)) + " · " + esc(loc(cat.levels[levelIdx(les.level)].name)) + " · " + esc(les.theme) + "</p>" +
        '<h1 id="h-ew"><span aria-hidden="true">' + les.icon + "</span> " + esc(les.title) + '</h1><p class="muted">' + esc(les.goal) + "</p>" +
        '<h2 class="h2">' + esc(t("vocab_h")) + '</h2><ul class="lx-words">' + les.vocab.map(item).join("") + "</ul>" +
        (les.phrases && les.phrases.length ? '<h2 class="h2">' + esc(t("phrases_h")) + '</h2><ul class="lx-words">' + les.phrases.map(item).join("") + "</ul>" : "") +
        '<button type="button" class="btn primary wide" id="lxGo">' + esc(t("go_ex", { n: les.exercises.length })) + "</button>";
      root.querySelector("#lxGo").addEventListener("click", function () {
        startRun(root, { kind: "lesson", lang: r.lang, voice: L.voice, lesson: les, items: les.exercises, all: r.all });
      });
    }, function () { if (my === token) root.innerHTML = errorHtml(); });
  }
  function startRun(root, o) {
    run = Object.assign({ i: 0, score: 0, mistakes: [], rights: [], root: root, tok: token }, o);
    root.setAttribute("data-voice", o.voice);
    showItem();
  }
  // Retrouve le mot de vocabulaire concerné par un exercice (pour la révision des erreurs).
  function vocabFor(key, lesson) {
    if (!key || !lesson) return null;
    var all = (lesson.vocab || []).concat(lesson.phrases || []);
    return all.filter(function (v) { return v.w === key || v.t === key; })[0] || null;
  }
  function showItem() {
    var r = run, root = r.root, ex = r.items[r.i];
    root.innerHTML = '<div class="lx-run-top"><a class="lx-back" href="' + (r.kind === "lesson" ? "#/learn/apprendre" : "#/learn") + '">✕ ' + esc(t("quit")) + "</a>" +
      '<span class="lx-count">' + esc(t("ex_of", { i: r.i + 1, n: r.items.length })) + "</span></div>" + bar(r.i, r.items.length, t("progress_lbl")) +
      '<div class="lx-ex" id="lxEx"></div><div class="lx-fb" id="lxFb" role="status" aria-live="polite"></div>' +
      '<button type="button" class="btn primary wide" id="lxNext" hidden>' + esc(r.i + 1 < r.items.length ? t("next") : t("see_result")) + "</button>";
    var fb = root.querySelector("#lxFb"), nextBtn = root.querySelector("#lxNext");
    X.render(root.querySelector("#lxEx"), ex, {
      lang: r.voice, T: T,
      done: function (res) {
        if (run !== r) return;
        var okMsgs = [t("ok_1"), t("ok_2"), t("ok_3")];
        if (res.pairs) {
          if (res.ok) r.score += 1;
          r.mistakes = r.mistakes.concat(res.mistakes);
          if (res.ok) ex.pairs.forEach(function (p) { r.rights.push(p[0]); });
          fb.className = "lx-fb " + (res.ok ? "ok" : "bad");
          fb.textContent = res.ok ? t("match_ok") : t("match_bad", { n: res.mistakes.length });
        } else {
          var v = vocabFor(res.key, r.lesson) || ex._v || null;
          if (res.ok) { r.score += 1; if (v) r.rights.push(v.w); }
          else r.mistakes.push(v ? { w: v.w, t: v.t } : { w: res.key || res.answer, t: ex.hint || (res.key !== res.answer ? res.answer : "") });
          fb.className = "lx-fb " + (res.ok ? "ok" : "bad");
          fb.textContent = res.ok ? okMsgs[Math.floor(Math.random() * okMsgs.length)] : t("bad", { a: res.answer });
          if (!res.ok) r.wrong = (r.wrong || []).concat([{ q: ex.expr || ex.say || ex.sentence || ex.prompt, a: res.answer }]);
        }
        nextBtn.hidden = false;
        nextBtn.focus({ preventScroll: true });
        try { nextBtn.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { nextBtn.scrollIntoView(false); }
      }
    });
    nextBtn.addEventListener("click", function () {
      if (run !== r) return;
      r.i += 1;
      if (r.i < r.items.length) showItem(); else showResult();
    });
  }
  function showResult() {
    var r = run, root = r.root, n = r.items.length;
    var xp = r.kind === "lesson" ? P.recordLesson(r.lang, r.lesson, r.score, n, r.mistakes, r.rights)
      : P.recordPractice(r.kind, r.lang, r.score, n, r.mistakes, r.rights);
    var ratio = r.score / n;
    var nxt = null;
    if (r.kind === "lesson") {
      var idx = r.all.indexOf(r.lesson);
      nxt = r.all.slice(idx + 1).filter(function (l) { return l.level === r.lesson.level; })[0] || null;
    }
    root.innerHTML = '<div class="lx-result"><h1 id="h-ew">' + esc(t("result_h")) + "</h1>" + stars(r.score, n) +
      '<p class="lx-score" id="lxScore">' + esc(t("score", { s: r.score, t: n })) + "</p>" +
      '<p class="lx-msg">' + esc(ratio >= 0.99 ? t("res_great") : ratio >= 0.6 ? t("res_good") : t("res_try")) + "</p>" +
      '<p class="lx-xp">' + esc(t("xp_won", { n: xp })) + "</p></div>" +
      (r.wrong && r.wrong.length ? '<h2 class="h2">' + esc(t("review_h")) + '</h2><ul class="lx-words">' + r.wrong.map(function (w) {
        return '<li class="lx-word"><span><b>' + esc(w.q) + "</b><small>→ " + esc(w.a) + "</small></span></li>";
      }).join("") + "</ul>" : "") +
      '<div class="lx-actions">' +
      (nxt ? '<a class="btn primary" id="lxNextLesson" href="#/learn/lecon/' + esc(nxt.id) + '">' + esc(t("lesson_next")) + "</a>" : "") +
      '<button type="button" class="btn' + (nxt ? "" : " primary") + '" id="lxAgain">' + esc(t("again")) + "</button>" +
      '<a class="btn" href="#/learn/progression">' + esc(t("see_prog")) + "</a>" +
      '<a class="btn" href="#/learn">' + esc(t("home")) + "</a></div>";
    var o = { kind: r.kind, lang: r.lang, voice: r.voice, lesson: r.lesson, all: r.all, items: r.kind === "lesson" ? r.items : null };
    root.querySelector("#lxAgain").addEventListener("click", function () {
      if (o.kind === "lesson") startRun(root, o);
      else practice(root, token, o.kind);
    });
    focusH1(root);
  }

  // Révision et défi : questions fabriquées à partir du vocabulaire (aucun contenu à écrire en plus).
  function makeQuestions(pool, lang, n, weights) {
    var items = [], used = {};
    var sorted = pool.slice().sort(function (a, b) { return (weights[b.w] || 0) - (weights[a.w] || 0) || Math.random() - 0.5; });
    var picks = sorted.filter(function (v) { if (used[v.w]) return false; used[v.w] = 1; return true; }).slice(0, n);
    picks = X.shuffle(picks.slice(0, Math.min(picks.length, n)));
    picks.forEach(function (v, i) {
      var others = X.shuffle(pool.filter(function (o) { return o.w !== v.w && o.t !== v.t; })).slice(0, 3);
      var kind = i % 3;
      if (kind === 0) items.push({ type: "choice", prompt: t("q_how", { t: v.t }), answer: v.w, options: [v.w].concat(others.map(function (o) { return o.w; })), _v: v });
      else if (kind === 1) items.push({ type: "choice", kind: "expression", expr: v.w, prompt: t("q_mean", { w: v.w }), answer: v.t, options: [v.t].concat(others.map(function (o) { return o.t; })), _v: v });
      else items.push({ type: "listen", prompt: t("q_listen"), say: v.w, answer: v.w, options: [v.w].concat(others.slice(0, 2).map(function (o) { return o.w; })), _v: v });
    });
    return items;
  }
  function practice(root, my, kind) {
    root.innerHTML = loadingHtml();
    loadCat().then(function () {
      var p = P.get();
      var code = p.lang && langMeta(p.lang) && langMeta(p.lang).status === "available" ? p.lang : availableLangs()[0].id;
      return loadLang(code).then(function (d) {
        if (my !== token) return;
        var L = langMeta(code);
        var doneIds = P.doneIn(code);
        var lvl = levelIdx(p.level);
        var src = kind === "review" ? d.lessons.filter(function (l) { return doneIds.indexOf(l.id) !== -1; })
          : d.lessons.filter(function (l) { return levelIdx(l.level) <= Math.max(0, lvl); });
        var pool = [];
        src.forEach(function (l) { pool = pool.concat(l.vocab); });
        var h = kind === "review" ? t("rev_h") : t("def_h");
        if (pool.length < 4) {
          root.innerHTML = backLink("#/learn") + '<h1 id="h-ew">' + esc(h) + '</h1><p class="muted">' + esc(t("rev_empty")) + '</p><a class="btn primary wide" href="#/learn/apprendre">' + esc(t("m_learn")) + "</a>";
          focusH1(root);
          return;
        }
        var miss = P.mistakes(code), weights = {};
        Object.keys(miss).forEach(function (w) { weights[w] = miss[w].n; });
        var items = makeQuestions(pool, code, kind === "review" ? 6 : 8, kind === "review" ? weights : {});
        root.innerHTML = backLink("#/learn") + '<p class="lx-hero-k"><span aria-hidden="true">' + L.flag + "</span> " + esc(loc(L.name)) + "</p>" +
          '<h1 id="h-ew">' + esc(h) + '</h1><p class="muted">' + esc(kind === "review" ? t("rev_txt") : t("def_txt")) + "</p>" +
          '<button type="button" class="btn primary wide" id="lxGo">' + esc(t("start")) + "</button>";
        root.querySelector("#lxGo").addEventListener("click", function () {
          startRun(root, { kind: kind, lang: code, voice: L.voice, lesson: null, items: items, all: [] });
        });
        focusH1(root);
      });
    }).catch(function () { if (my === token) root.innerHTML = errorHtml(); });
  }

  function progressScreen(root, my) {
    loadCat().then(function () {
      var av = availableLangs();
      return Promise.all(av.map(function (l) { return loadLang(l.id); })).then(function (ds) {
        if (my !== token) return;
        var p = P.get();
        var nDone = Object.keys(p.lessons).filter(function (k) { return p.lessons[k].done; }).length;
        var rate = p.ex.done ? Math.round(p.ex.ok / p.ex.done * 100) + " %" : "—";
        var st = P.streak(), today = P.todayXp();
        var tile = function (v, k, id) { return '<div class="lx-stat"' + (id ? ' id="' + id + '"' : "") + "><b>" + esc(v) + "</b><small>" + esc(t(k)) + "</small></div>"; };
        var kinds = { lesson: t("k_lesson"), review: t("k_review"), challenge: t("k_challenge") };
        var fmt = function (ts) { try { return new Date(ts).toLocaleString(lang === "en" ? "en-GB" : lang === "fr" ? "fr-FR" : lang, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
        root.innerHTML = backLink("#/learn") + '<h1 id="h-ew">' + esc(t("prog_h")) + "</h1>" +
          '<div class="lx-stats">' + tile(p.xp, "st_xp", "lxStXp") + tile(nDone, "st_lessons", "lxStLessons") + tile(p.ex.done, "st_ex", "lxStEx") + tile(rate, "st_rate") +
          tile(st ? (st > 1 ? t("streak_n", { n: st }) : t("streak_1", { n: st })) : "—", "st_streak") + "</div>" +
          '<div class="card"><h2 class="cx-h" id="lxGoalH">' + esc(t("goal_h")) + "</h2><p>" + esc(t("goal_txt", { d: today, g: p.goal })) + "</p>" + bar(today, p.goal, t("goal_h")) +
          '<div class="seg" role="radiogroup" aria-labelledby="lxGoalH">' + [10, 30, 50].map(function (g) {
            return '<button type="button" role="radio" data-goal="' + g + '" aria-checked="' + (p.goal === g) + '">' + g + " XP</button>";
          }).join("") + "</div></div>" +
          '<div class="card"><h2 class="cx-h">' + esc(t("per_lang")) + "</h2>" + av.map(function (l, i) {
            var all = ds[i].lessons, d = all.filter(function (x) { return p.lessons[x.id] && p.lessons[x.id].done; }).length;
            return '<div class="lx-lang-prog"><span><span aria-hidden="true">' + l.flag + "</span> <b>" + esc(loc(l.name)) + "</b> · " + esc(t("lessons_of", { d: d, t: all.length })) + "</span>" + bar(d, all.length, loc(l.name)) + "</div>";
          }).join("") + "</div>" +
          '<div class="card"><h2 class="cx-h">' + esc(t("hist_h")) + "</h2>" + (p.hist.length ? '<ul class="lx-hist" id="lxHist">' + p.hist.slice(0, 15).map(function (h) {
            var L = langMeta(h.lang);
            return "<li><span><b>" + esc(kinds[h.kind] || h.kind) + (h.title ? " · " + esc(h.title) : "") + "</b><small>" + (L ? L.flag + " " : "") + esc(fmt(h.at)) + "</small></span><span>" + h.score + "/" + h.total + "</span></li>";
          }).join("") + "</ul>" : '<p class="muted">' + esc(t("hist_empty")) + "</p>") + "</div>" +
          '<p class="note">' + esc(t("local_note")) + "</p>" +
          '<button type="button" class="link-btn lx-reset" id="lxReset">' + esc(t("reset")) + "</button>";
        root.querySelector(".lx-stats").setAttribute("aria-label", t("prog_h"));
        root.querySelectorAll("[data-goal]").forEach(function (b) {
          b.addEventListener("click", function () { P.setGoal(+b.getAttribute("data-goal")); progressScreen(root, token); });
        });
        var rs = root.querySelector("#lxReset");
        rs.addEventListener("click", function () {
          if (!rs.classList.contains("sure")) { rs.classList.add("sure"); rs.textContent = t("reset_sure"); return; }
          P.reset();
          progressScreen(root, token);
        });
      });
    }).catch(function () { if (my === token) root.innerHTML = errorHtml(); });
  }

  function infoScreen(root, h, p1, p2, icon) {
    root.innerHTML = backLink("#/learn") + '<div class="lx-soon"><span class="lx-soon-ic" aria-hidden="true">' + icon + '</span><h1 id="h-ew">' + esc(t(h)) + '</h1><span class="badge">' + esc(t("soon")) + "</span>" +
      "<p>" + esc(t(p1)) + '</p><p class="muted">' + esc(t(p2)) + "</p></div>" +
      '<a class="btn primary wide" href="#/learn/apprendre">' + esc(t("m_learn")) + "</a>";
  }

  // ---------- Point d'entrée (appelé par app.js à chaque changement d'adresse) ----------
  var lastRoot = null, lastParts = [];
  function show(root, parts, uiLang) {
    lang = STR[uiLang] ? uiLang : "fr";
    T = STR[lang];
    token += 1;
    var my = token;
    run = null;
    if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) { /* rien */ } }
    lastRoot = root; lastParts = parts || [];
    root.removeAttribute("data-voice");
    var s = lastParts[0] || "";
    root.innerHTML = loadingHtml();
    if (s === "") { dashboard(root, my); return t("title"); }
    if (s === "apprendre") { learnScreen(root, my); return t("learn_h"); }
    if (s === "lecon") { lessonScreen(root, my, lastParts[1] || ""); return t("title"); }
    if (s === "reviser") { practice(root, my, "review"); return t("rev_h"); }
    if (s === "defi") { practice(root, my, "challenge"); return t("def_h"); }
    if (s === "progression") { progressScreen(root, my); return t("prog_h"); }
    if (s === "conversation") { infoScreen(root, "ai_h", "ai_p1", "ai_p2", ICON.ai); return t("ai_h"); }
    if (s === "cultures") { infoScreen(root, "cult_h", "cult_p1", "cult_p2", ICON.cult); return t("cult_h"); }
    root.innerHTML = backLink("#/learn") + '<h1 id="h-ew">' + esc(t("unknown")) + "</h1>";
    return t("title");
  }

  // Choix de langue et de niveau (écran « Apprendre ») ; bouton « Réessayer ».
  document.addEventListener("click", function (e) {
    if (!e.target.closest || !lastRoot) return;
    var b = e.target.closest("[data-lang], [data-level], [data-lx-retry]");
    if (!b || !lastRoot.contains(b)) return;
    if (b.hasAttribute("data-lx-retry")) { show(lastRoot, lastParts, lang); return; }
    if (b.hasAttribute("data-lang")) P.setLang(b.getAttribute("data-lang"));
    else P.setLevel(b.getAttribute("data-level"));
    lastRoot.querySelectorAll(b.hasAttribute("data-lang") ? "[data-lang]" : "[data-level]").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
    paintLessons(lastRoot, token);
  });

  window.EWLearn = { show: show, _strings: STR };
})();

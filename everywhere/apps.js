/* 24/24 ONE WORLD — registre des interfaces (une application, un compte, trois interfaces : TALK, EVERYWHERE, LEARN). © 2026 Sébastien Chevrier.
   Ajouter une application = ajouter une entrée ici (et son dossier). Le portail crée tout seul
   sa carte, sa route (#/app/<id>) et son cadre ; rien d'autre à modifier.

   Champs :
   - id       : identifiant court, utilisé dans l'adresse (#/app/talk)
   - name     : nom affiché
   - tagline  : une phrase, { fr, en, … } (les 11 langues du portail depuis 0.8.3)
   - status   : "available" (ouvrable), "soon" (annoncé « Bientôt », page d'information seulement)
                ou "reserved" (emplacement réservé) ; rien n'est simulé
   - src      : page de l'application, relative à EW_CONFIG.basePath (application ouverte en pleine page)
   - route    : OU écran interne du portail (#/…), pour un module construit dans le portail lui-même
   - accent   : couleur de la carte
   - icon     : clé d'icône (voir ICONS dans app.js) */
window.EW_APPS = [
  {
    id: "talk",
    name: { fr: "Messagerie", en: "Messages", es: "Mensajes", pt: "Mensagens", de: "Nachrichten", it: "Messaggi", zh: "消息", ja: "メッセージ", ar: "الرسائل", ru: "Сообщения", mg: "Hafatra" },
    tagline: { fr: "Communiquer sans barrières : appels et messages traduits, 112 langues.", en: "Communicate without barriers: translated calls and messages, 112 languages.", es: "Comunicarse sin barreras: llamadas y mensajes traducidos, 112 idiomas.", pt: "Comunicar sem barreiras: chamadas e mensagens traduzidas, 112 línguas.", de: "Ohne Grenzen kommunizieren: übersetzte Anrufe und Nachrichten, 112 Sprachen.", it: "Comunicare senza barriere: chiamate e messaggi tradotti, 112 lingue.", zh: "无障碍沟通：通话和消息自动翻译，支持 112 种语言。", ja: "言葉の壁なくつながる：通話とメッセージを翻訳、112 言語に対応。", ar: "تواصل بلا حواجز: مكالمات ورسائل مترجمة، 112 لغة.", ru: "Общение без барьеров: переведённые звонки и сообщения, 112 языков.", mg: "Mifandray tsy misy sakana: antso sy hafatra voadika, fiteny 112." },
    status: "available",
    src: "index.html?embed=1",
    accent: "#1f5fe0",
    icon: "talk",
    bottomNav: true
  },
  {
    id: "everywhere",
    name: { fr: "Face à face", en: "Face to face", es: "Cara a cara", pt: "Frente a frente", de: "Gegenüber", it: "Faccia a faccia", zh: "面对面", ja: "対面", ar: "وجهًا لوجه", ru: "Лицом к лицу", mg: "Mifanatrika" },
    tagline: { fr: "Parler avec quelqu'un qui ne parle pas votre langue : conversation côte à côte, appel traduit avec un contact.", en: "Talk with someone who doesn't speak your language: side-by-side conversation, translated call with a contact.", es: "Habla con alguien que no habla tu idioma: conversación cara a cara, llamada traducida con un contacto.", pt: "Fale com alguém que não fala a sua língua: conversa lado a lado, chamada traduzida com um contacto.", de: "Sprich mit jemandem, der deine Sprache nicht spricht: Gespräch von Angesicht zu Angesicht, übersetzter Anruf mit einem Kontakt.", it: "Parla con qualcuno che non parla la tua lingua: conversazione faccia a faccia, chiamata tradotta con un contatto.", zh: "与不说你语言的人交谈：面对面对话，与联系人进行翻译通话。", ja: "あなたの言語を話さない人と話す：対面での会話、連絡先との翻訳通話。", ar: "تحدّث مع شخص لا يتكلم لغتك: محادثة وجهًا لوجه، ومكالمة مترجمة مع جهة اتصال.", ru: "Говорите с тем, кто не говорит на вашем языке: разговор лицом к лицу, звонок с переводом контакту.", mg: "Miresaka amin'olona tsy miteny ny fiteninao: resaka mifanatrika, antso voadika amin'ny mpifandray aminao." },
    status: "available",
    route: "#/everywhere",
    accent: "#13a05a",
    icon: "globe"
  },
  {
    id: "learn",
    name: { fr: "Apprendre", en: "Learn", es: "Aprender", pt: "Aprender", de: "Lernen", it: "Imparare", zh: "学习", ja: "学ぶ", ar: "تعلّم", ru: "Учиться", mg: "Mianara" },
    tagline: { fr: "Apprendre sans limites : leçons, exercices, progression.", en: "Learn without limits: lessons, exercises, progress.", es: "Aprender sin límites: lecciones, ejercicios, progreso.", pt: "Aprender sem limites: lições, exercícios, progresso.", de: "Lernen ohne Grenzen: Lektionen, Übungen, Fortschritt.", it: "Imparare senza limiti: lezioni, esercizi, progressi.", zh: "无限学习：课程、练习、进度。", ja: "限界なく学ぶ：レッスン、練習問題、進み具合。", ar: "تعلّم بلا حدود: دروس وتمارين وتقدّم.", ru: "Учитесь без ограничений: уроки, упражнения, прогресс.", mg: "Mianara tsy misy fetra: lesona, fanazaran-tena, fandrosoana." },
    status: "available",
    route: "#/learn",
    accent: "#6b3fd6",
    icon: "learn"
  },
  {
    id: "ailab",
    name: "24/24 AI LAB",
    tagline: { fr: "Innover avec l'IA : espace d'expérimentation, bientôt disponible.", en: "Innovating with AI: an experimentation space, coming soon.", es: "Innovar con la IA: un espacio de experimentación, próximamente.", pt: "Inovar com a IA: um espaço de experimentação, em breve.", de: "Mit KI Neues schaffen: ein Raum zum Experimentieren, bald verfügbar.", it: "Innovare con l'IA: uno spazio di sperimentazione, presto disponibile.", zh: "用 AI 创新：实验空间，即将推出。", ja: "AI でイノベーション：実験の場、近日公開。", ar: "الابتكار بالذكاء الاصطناعي: مساحة للتجربة، قريبًا.", ru: "Инновации с ИИ: пространство для экспериментов, скоро.", mg: "Manavao miaraka amin'ny AI: toerana fanandramana, ho avy tsy ho ela." },
    status: "soon",
    route: "#/ailab",
    accent: "#b4570f",
    icon: "lab"
  }
];

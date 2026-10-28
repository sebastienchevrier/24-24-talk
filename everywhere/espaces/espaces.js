/* 24/24 ONE WORLD — espaces COMMUNITY, LIVE, BUSINESS et Avantages. © 2026 Sébastien Chevrier. Tous droits réservés.
   Routes du portail :
     #/community, #/community/<id>   communautés : salons publics, chacun lit chaque message dans sa langue
     #/live, #/live/<id>             directs : l'animateur parle, chaque spectateur lit (et peut écouter) dans sa langue,
                                     caméra de l'animateur envoyée en direct d'un téléphone à l'autre (12 spectateurs au plus)
     #/business, #/business/new      petites annonces traduites ; le contact passe par la Messagerie (lien d'ajout du vendeur)
     #/avantages                     partenaires (liens d'affiliation, partenaires.js) et parrainage (lien d'invitation)
   Serveur : tables ow_rooms, ow_room_members, ow_room_msgs, ow_listings (supabase/20-espaces-community-live-business.sql).
   Traduction : moteur.js (service gratuit MyMemory), sur le téléphone de celui qui lit. Rien n'est payant. */
(function () {
  "use strict";
  var STR = {
    fr: {
      community: "Community", community_sub: "Des communautés sans frontière de langue : chacun écrit dans sa langue, tout le monde lit dans la sienne.",
      live: "Live", live_sub: "Des directs suivis dans votre langue : sous-titres traduits, et la voix traduite si vous le voulez.",
      business: "Business", business_sub: "Tous les échanges du monde : vendre, acheter, trouver un fournisseur, proposer un service, s'associer. Chaque annonce se lit dans votre langue.",
      avantages: "Avantages", avantages_sub: "Ce que 24/24 ONE WORLD vous apporte en plus.",
      create_c: "＋ Créer une communauté", create_l: "＋ Lancer un direct", f_title: "Nom", f_about: "Description (facultatif)",
      f_title_ph_c: "ex. : Cuisine du monde", f_title_ph_l: "ex. : Visite de Bali en direct", create: "Créer", cancel: "Annuler",
      none_c: "Aucune communauté pour l'instant. Créez la première !", none_l: "Aucun direct pour l'instant. Lancez le premier !",
      members: "{n} membre(s)", on_air: "🔴 En direct", by: "par {n}", back_c: "← Communautés", back_l: "← Directs", back_b: "← Annonces",
      join: "Rejoindre", leave: "Quitter", joined: "Vous êtes membre.", join_to_write: "Rejoignez pour écrire.",
      write_ph: "Écrivez dans votre langue…", send: "Envoyer", empty_room: "Pas encore de message. Lancez la conversation !",
      orig: "Original", translating: "Traduction…", delete_room: "Supprimer", delete_room_q: "Supprimer définitivement « {t} » et tous ses messages ?",
      live_start: "▶ Démarrer le direct", live_stop: "⏹ Arrêter le direct", cam: "📹 Caméra", cam_off: "📹 Couper la caméra",
      live_voice: "🔊 Écouter la voix traduite", live_voice_off: "🔇 Couper la voix", live_wait: "Le direct n'a pas encore commencé.",
      live_host_hint: "Parlez : vos phrases s'affichent en sous-titres, traduites pour chaque spectateur.",
      live_watch: "Rejoignez pour voir la caméra et écrire.", live_mic_denied: "Micro refusé : autorisez-le dans Chrome (cadenas ▸ Autorisations).",
      live_no_mic: "Ce navigateur ne sait pas écouter : écrivez vos sous-titres ci-dessous.", caption_ph: "Sous-titre à envoyer…",
      live_viewers: "{n} spectateur(s) en vidéo", cam_fail: "Caméra indisponible : autorisez-la dans Chrome.",
      b_all: "Tout", b_sell: "Vente", b_buy: "Achat", b_wholesale: "Gros / fournisseur", b_sourcing: "Sourcing", b_service: "Service", b_job: "Emploi", b_mission: "Mission à distance", b_logistics: "Transport", b_customs: "Douane", b_partner: "Partenariat",
      b_kind_wholesale: "Je fournis en gros (fournisseur, fabricant)", b_kind_sourcing: "Je cherche un fournisseur (sourcing)", b_kind_partner: "Partenariat, associé", b_kind_job: "J'embauche (offre d'emploi)", b_kind_logistics: "Transport, fret, logistique (j'offre ou je cherche)", b_kind_customs: "Douane, transitaire, import-export (j'offre ou je cherche)",
      rg_t: "⚖️ Règles du commerce, pays par pays", rg_d: "Douane, normes des produits, création d'entreprise, plateformes d'investissement : les sources officielles de chaque pays.", rg_open: "Choisir un pays",
      rg_sub: "Les règles changent souvent : ONE WORLD ne les recopie pas, il vous ouvre les sources officielles à jour, puis vous les lisez dans votre langue.", rg_cc: "Pays", rg_pick: "Choisissez un pays",
      rg_trade: "Importer et exporter", rg_g1: "Global Trade Helpdesk (ITC, CNUCED, OMC) : pour un produit et un pays, droits, taxes, règles et démarches sur une seule page",
      rg_g2: "Market Access Map (ITC) : droits de douane et règles d'origine", rg_g3: "ePing (OMC) : normes, étiquetage, règles sanitaires que ce pays impose aux produits",
      rg_eu: "Pays de l'Union européenne", rg_e1: "Access2Markets : commercer avec l'UE et depuis l'UE, pas à pas", rg_e2: "TARIC : code douanier et droits à l'entrée de l'UE",
      rg_biz: "Créer et gérer une entreprise", rg_b1: "Business Ready (Banque mondiale) : création d'entreprise, impôts, commerce international, pays par pays",
      rg_inv: "Investir et trading", rg_i1: "I-SCAN (OICV-IOSCO) : vérifier qu'une plateforme n'est pas signalée par un régulateur avant de confier de l'argent",
      rg_note: "Un site s'ouvre dans sa langue : utilisez la traduction de votre navigateur, ou « Comprendre un papier » pour un document. Pour une décision importante, demandez à un professionnel du pays.",
      rg_ask: "Demander à la communauté Marchés", rg_read: "Lire un document étranger",
      cu_t: "🛃 Douane et import-export", cu_d: "Droits de douane, documents, Incoterms, outils officiels gratuits, transitaires et transporteurs.", cu_open: "Ouvrir le guide",
      cu_sub: "Le guide pour acheter et vendre entre pays. 24/24 ONE WORLD ne fait pas les déclarations en douane : un commissionnaire en douane (transitaire) agréé peut les faire pour vous.",
      cu_tools: "Outils officiels gratuits", cu_t1: "Market Access Map (ITC, ONU-OMC) : droits de douane et règles de presque tous les pays", cu_t2: "Access2Markets (Union européenne) : droits, taxes, règles d'origine, pas à pas", cu_t3: "TARIC : code douanier (code SH) et droits à l'entrée de l'Union européenne", cu_t4: "Douane française : EORI, dédouanement, simulateurs",
      cu_docs: "Documents habituels", cu_d1: "Facture commerciale (valeur, origine, Incoterm)", cu_d2: "Liste de colisage (poids, colis, contenu)", cu_d3: "Document de transport : connaissement (bateau), LTA (avion), CMR (route)", cu_d4: "Certificat d'origine (pour profiter des droits réduits)", cu_d5: "Numéro EORI (entreprises qui importent ou exportent dans l'UE)", cu_d6: "Selon le produit : certificat sanitaire, phytosanitaire, licence, normes CE",
      cu_inco: "Incoterms 2020 : qui paie quoi", cu_i1: "EXW : l'acheteur prend tout en charge dès l'usine du vendeur.", cu_i2: "FCA : le vendeur remet la marchandise dédouanée export au transporteur de l'acheteur.", cu_i3: "FOB : le vendeur charge sur le bateau ; ensuite, risques et frais pour l'acheteur.", cu_i4: "CIF : le vendeur paie le fret et l'assurance jusqu'au port d'arrivée.", cu_i5: "DAP : le vendeur livre à destination, l'acheteur paie la douane d'import.", cu_i6: "DDP : le vendeur paie tout, douane d'import comprise.",
      cu_ban: "Interdits ou contrôlés partout : armes, drogues, contrefaçons, espèces protégées (CITES), certains médicaments. Ces annonces sont refusées et peuvent être signalées (🚩).",
      cu_find: "Trouver un transitaire ou un transporteur", cu_read: "Lire un document étranger (photo)", cu_src: "Sources : CCI (Incoterms 2020), ITC, Commission européenne, douane.gouv.fr. Vérifiez toujours les règles exactes de votre produit.", b_kind_mission: "Mission ou travail à distance (j'offre ou je cherche)",
      mk_t: "📈 Marchés et trading", mk_d: "Discutez des marchés avec le monde entier dans les communautés, et apprenez les bases dans Apprendre. 24/24 ONE WORLD n'exécute aucun ordre et ne donne aucun conseil en investissement.",
      mk_c: "Communautés", mk_l: "Apprendre", b_new: "＋ Publier une annonce",
      mt_t: "💸 Envoyer de l'argent à l'étranger", mt_d: "Western Union, MoneyGram, Wise, Remitly… comparez les frais pour votre pays avant d'envoyer.", mt_open: "Comparer", mt_sub: "24/24 ONE WORLD n'envoie pas d'argent lui-même et ne touche rien sur ces liens : vous comparez ici, puis l'envoi se fait chez le service choisi.", mt_cmp: "Comparer les prix de votre pays", mt_wb: "Remittance Prices Worldwide (Banque mondiale) : le vrai coût d'un envoi, pays par pays, service par service", mt_prov: "Services d'envoi", mt_p_wu: "Retrait en espèces dans de très nombreux pays, virement, portefeuille mobile", mt_p_mg: "Retrait en espèces, virement, portefeuille mobile", mt_p_ria: "Retrait en espèces, virement", mt_p_wise: "Virement au taux de change du marché, frais affichés avant d'envoyer", mt_p_rem: "Virement, portefeuille mobile, retrait en espèces", mt_p_wr: "Portefeuille mobile, virement, retrait en espèces", mt_p_tt: "Envoi vers portefeuille mobile ou compte bancaire", mt_tips: "Avant d'envoyer", mt_k1: "Regardez le total reçu : frais + taux de change. Un taux moins bon que celui du marché est un coût caché.", mt_k2: "Choisissez comment la personne reçoit : espèces, compte bancaire ou portefeuille mobile (M-Pesa, Orange Money, MTN…).", mt_k3: "Une pièce d'identité est souvent demandée, à l'envoi comme au retrait.", mt_k4: "N'envoyez jamais d'argent à quelqu'un rencontré seulement en ligne, ni pour « débloquer » un gain, un colis, un prêt ou un visa : c'est presque toujours une arnaque.", mt_note: "Les services et leurs prix changent : vérifiez toujours sur leur site au moment d'envoyer.", ds_t: "📦 Dropshipping et vente en ligne", ds_d: "Vendre sans stock : trouver un fournisseur, calculer le vrai prix, rester dans la loi.", ds_open: "Ouvrir le guide", ds_sub: "Le dropshipping, c'est vendre un produit que le fournisseur envoie directement à votre client. Simple à lancer, mais vous restez responsable de la vente.", ds_steps: "Les étapes", ds_s1: "Choisissez un produit autorisé dans le pays de vos clients : pas de contrefaçon, pas de produit réglementé sans autorisation.", ds_s2: "Trouvez un fournisseur (annonces « Gros / fournisseur » ici ou plateformes de gros) et commandez un échantillon avant de vendre.", ds_s3: "Calculez le vrai prix : produit, livraison, droits de douane, TVA du pays du client, frais de paiement et retours.", ds_s4: "Annoncez le vrai délai de livraison à vos clients.", ds_s5: "Déclarez votre activité : statut d'entreprise, TVA et impôts selon votre pays (voir Règles du commerce).", ds_s6: "Respectez les droits des clients : prix clairs taxes comprises, droit de retour, garantie, protection des données.", ds_warn: "Pièges fréquents", ds_w1: "Fournisseur qui veut tout le paiement par virement non protégé ou en cryptomonnaie.", ds_w2: "Formations payantes qui promettent de devenir riche vite.", ds_w3: "Photos volées et faux avis : interdits et punis.", ds_w4: "Dans l'Union européenne, un colis venant d'un pays hors UE paie la TVA dès le premier euro.", ds_plat: "Plateformes de gros (privées, sans lien avec 24/24 ONE WORLD)", ds_find: "Trouver un fournisseur ici", ds_cu: "Douane et import-export", bo_t: "📈 Bourse en direct", bo_d: "Indices, actions, devises, matières premières et cryptomonnaies du monde entier, avec graphiques.", bo_open: "Voir les cours", bo_sub: "Les cours sont fournis gratuitement par TradingView, parfois avec un léger différé selon la place boursière.", bo_load: "Afficher les cours", bo_priv: "En touchant ce bouton, les cours se chargent depuis TradingView (service externe), dans une zone isolée qui n'a pas accès à votre compte.", bo_ov: "Les marchés du monde", bo_chart: "Graphique d'une action (cherchez son nom en haut du graphique)", bo_risk: "Investir peut faire perdre de l'argent. 24/24 ONE WORLD ne passe aucun ordre, ne garde pas d'argent et ne donne pas de conseil en investissement. Pour acheter ou vendre, passez par un intermédiaire agréé dans votre pays.", bo_check: "Avant de confier de l'argent", bo_amf: "Listes noires de l'AMF (France) : sites de trading, Forex et crypto non autorisés", bo_learn: "Apprendre les bases", bo_talk: "En parler dans les communautés", bo_fail: "Les cours n'ont pas pu se charger. Vérifiez votre connexion et réessayez.", bo_web: "Ouvrir les cours dans le navigateur",
      b_none: "Aucune annonce pour l'instant. Publiez la première !", b_contact: "💬 Contacter", b_mine: "Votre annonce", b_close: "Retirer",
      b_kind: "Type", b_ttl: "Titre", b_ttl_ph: "ex. : Vélo de ville, très bon état", b_body: "Description", b_price: "Prix (facultatif)",
      b_cur: "Monnaie", b_place: "Lieu (facultatif)", b_place_ph: "ex. : Antananarivo", b_publish: "Publier",
      b_safety: "Prudence : ne payez jamais d'avance une personne que vous ne connaissez pas. 24/24 ONE WORLD met les personnes en relation et n'intervient pas dans les ventes.",
      av_partners: "Voyager moins cher", av_partners_sub: "Nos partenaires, au même prix pour vous.",
      av_invite: "Inviter mes proches", av_invite_sub: "Partagez votre lien : vos proches vous retrouvent tout de suite dans la Messagerie.",
      av_invite_btn: "↗ Partager mon lien", av_copied: "Lien copié : collez-le où vous voulez.",
      av_note: "Liens partenaires : une réservation peut rapporter une commission à 24/24 ONE WORLD, sans frais en plus pour vous. Cela finance un réseau libre et gratuit.",
      av_soon: "Bientôt : des réductions réservées aux membres, négociées avec nos partenaires.",
      need_account: "Créez d'abord votre compte (gratuit) dans la Messagerie.", open_msg: "Ouvrir la Messagerie",
      e_net: "Pas de connexion au serveur. Réessayez.", e_rate: "Trop d'envois d'un coup : patientez un peu.", e_other: "Impossible pour l'instant ({m}).",
      retry: "Réessayer", loading: "Chargement…", auto_tr: "Traduction automatique : vérifiez les informations importantes.",
      open_new: "{b} (s'ouvre dans un nouvel onglet)",
      tp_all: "Tous", tp_friends: "Amitié", tp_women: "Femmes", tp_support: "Soutien et écoute", tp_family: "Familles et parents", tp_culture: "Culture et passions",
      tp_languages: "Langues", tp_faith: "Foi et spiritualité", tp_work: "Travail et études", tp_markets: "Marchés et business", tp_travel: "Voyage", tp_school: "École et classes jumelées", tp_other: "Autre",
      f_topic: "Thème", speak: "🔊 Écouter", more: "Plus d'actions", report: "🚩 Signaler", block: "⛔ Bloquer cette personne",
      report_done: "Merci : signalement envoyé à la modération.", block_q: "Bloquer {n} ? Vous ne verrez plus ses messages, ici ni dans la Messagerie.", block_done: "{n} est bloqué(e).",
      mic: "🎤", mic_t: "Dicter dans ma langue",
      entraide: "Entraide", entraide_sub: "Demander de l'aide, en offrir, donner ce qui ne sert plus : gratuitement, avec le monde entier, chacun dans sa langue.",
      h_new: "＋ Demander ou offrir de l'aide", h_none: "Aucune demande pour l'instant. Soyez le premier à aider ou à demander.",
      b_help_need: "Besoin d'aide", b_help_offer: "J'offre mon aide", b_give: "Don gratuit",
      h_kind_need: "J'ai besoin d'aide", h_kind_offer: "J'offre mon aide (gratuit)", h_kind_give: "Je donne un objet (gratuit)", h_ttl_ph: "ex. : Je cherche quelqu'un pour m'aider à remplir un papier en anglais", back_h: "← Entraide",
      h_safety: "L'entraide est gratuite : personne ne doit vous demander d'argent. Rencontrez-vous dans un lieu public, prévenez un proche, et signalez tout abus (🚩).",
      sos: "SOS", sos_sub: "En cas d'urgence, appelez d'abord les secours. Ces numéros marchent sans application.",
      sos_country: "Pays où vous êtes", sos_other: "Autre pays", sos_general: "Numéro d'urgence général", sos_police: "Police", sos_amb: "Ambulance, urgences médicales", sos_fire: "Pompiers",
      sos_women: "Violences faites aux femmes (écoute, gratuit, anonyme)", sos_deaf: "Urgence par SMS (personnes sourdes ou qui ne peuvent pas parler)",
      sos_112: "Votre pays n'est pas dans la liste : sur un téléphone mobile, le 112 fonctionne dans de nombreux pays. Vérifiez le numéro local dès que possible.",
      sos_phr: "Montrer ou faire écouter", sos_phr_sub: "Phrases traduites dans la langue du pays choisi.",
      sp1: "J'ai besoin d'aide, s'il vous plaît.", sp2: "Appelez une ambulance.", sp3: "Appelez la police.", sp4: "Je suis en danger.", sp5: "Où est l'hôpital le plus proche ?", sp6: "Je suis perdu(e).",
      sos_med: "🩺 Chez le médecin ou à la pharmacie", sos_med_sub: "Traduction seulement : ce n'est pas un avis médical.",
      hp1: "J'ai mal ici.", hp2: "Je suis allergique à ce médicament.", hp3: "Je prends ce traitement tous les jours.", hp4: "Je suis enceinte.", hp5: "Je suis diabétique.", hp6: "Je ne comprends pas. Pouvez-vous l'écrire, s'il vous plaît ?",
      sos_tr_lang: "Langue des phrases", sos_offline: "Sans connexion, les phrases ne peuvent pas être traduites : montrez les numéros ci-dessus.",
      call: "Appeler {n}",
    },
    en: {
      community: "Community", community_sub: "Communities without language borders: everyone writes in their language, everyone reads in theirs.",
      live: "Live", live_sub: "Live streams in your language: translated subtitles, and the translated voice if you like.",
      business: "Business", business_sub: "All the world's trade: sell, buy, find a supplier, offer a service, team up. Every listing reads in your language.",
      avantages: "Benefits", avantages_sub: "What 24/24 ONE WORLD gives you on top.",
      create_c: "＋ Create a community", create_l: "＋ Start a live", f_title: "Name", f_about: "Description (optional)",
      f_title_ph_c: "e.g. World cooking", f_title_ph_l: "e.g. Live tour of Bali", create: "Create", cancel: "Cancel",
      none_c: "No community yet. Create the first one!", none_l: "No live yet. Start the first one!",
      members: "{n} member(s)", on_air: "🔴 Live", by: "by {n}", back_c: "← Communities", back_l: "← Lives", back_b: "← Listings",
      join: "Join", leave: "Leave", joined: "You are a member.", join_to_write: "Join to write.",
      write_ph: "Write in your language…", send: "Send", empty_room: "No message yet. Start the conversation!",
      orig: "Original", translating: "Translating…", delete_room: "Delete", delete_room_q: "Permanently delete “{t}” and all its messages?",
      live_start: "▶ Start the live", live_stop: "⏹ Stop the live", cam: "📹 Camera", cam_off: "📹 Turn camera off",
      live_voice: "🔊 Hear the translated voice", live_voice_off: "🔇 Mute the voice", live_wait: "The live hasn't started yet.",
      live_host_hint: "Speak: your sentences appear as subtitles, translated for each viewer.",
      live_watch: "Join to see the camera and write.", live_mic_denied: "Microphone blocked: allow it in your browser settings.",
      live_no_mic: "This browser can't listen: type your subtitles below.", caption_ph: "Subtitle to send…",
      live_viewers: "{n} viewer(s) on video", cam_fail: "Camera unavailable: allow it in your browser settings.",
      b_all: "All", b_sell: "For sale", b_buy: "Wanted", b_wholesale: "Wholesale / supplier", b_sourcing: "Sourcing", b_service: "Service", b_job: "Job", b_mission: "Remote work", b_logistics: "Shipping", b_customs: "Customs", b_partner: "Partnership",
      b_kind_wholesale: "I supply wholesale (supplier, manufacturer)", b_kind_sourcing: "I'm looking for a supplier (sourcing)", b_kind_partner: "Partnership, associate", b_kind_job: "I'm hiring (job offer)", b_kind_logistics: "Shipping, freight, logistics (offering or looking)", b_kind_customs: "Customs, freight forwarder, import-export (offering or looking)",
      rg_t: "⚖️ Trade rules, country by country", rg_d: "Customs, product standards, starting a business, investment platforms: each country's official sources.", rg_open: "Choose a country",
      rg_sub: "Rules change often: ONE WORLD does not copy them, it opens the up-to-date official sources, then you read them in your language.", rg_cc: "Country", rg_pick: "Choose a country",
      rg_trade: "Import and export", rg_g1: "Global Trade Helpdesk (ITC, UNCTAD, WTO): for a product and a country, duties, taxes, rules and procedures on one page",
      rg_g2: "Market Access Map (ITC): customs duties and rules of origin", rg_g3: "ePing (WTO): standards, labelling and health rules this country sets for products",
      rg_eu: "European Union countries", rg_e1: "Access2Markets: trading with and from the EU, step by step", rg_e2: "TARIC: customs code and duties when entering the EU",
      rg_biz: "Start and run a business", rg_b1: "Business Ready (World Bank): starting a business, taxes, international trade, country by country",
      rg_inv: "Investing and trading", rg_i1: "I-SCAN (IOSCO): check that a platform has not been flagged by a regulator before trusting it with money",
      rg_note: "A site opens in its own language: use your browser's translation, or « Understand a document » for a document. For an important decision, ask a professional in that country.",
      rg_ask: "Ask the Markets community", rg_read: "Read a foreign document",
      cu_t: "🛃 Customs and import-export", cu_d: "Duties, documents, Incoterms, free official tools, forwarders and carriers.", cu_open: "Open the guide",
      cu_sub: "The guide to buying and selling between countries. 24/24 ONE WORLD does not file customs declarations: a licensed customs broker (freight forwarder) can do it for you.",
      cu_tools: "Free official tools", cu_t1: "Market Access Map (ITC, UN-WTO): duties and rules for almost every country", cu_t2: "Access2Markets (European Union): duties, taxes, rules of origin, step by step", cu_t3: "TARIC: customs code (HS code) and duties when entering the European Union", cu_t4: "French customs: EORI, clearance, simulators",
      cu_docs: "Usual documents", cu_d1: "Commercial invoice (value, origin, Incoterm)", cu_d2: "Packing list (weight, parcels, contents)", cu_d3: "Transport document: bill of lading (sea), air waybill (air), CMR (road)", cu_d4: "Certificate of origin (to get reduced duties)", cu_d5: "EORI number (businesses importing or exporting in the EU)", cu_d6: "Depending on the product: health or phytosanitary certificate, licence, CE standards",
      cu_inco: "Incoterms 2020: who pays what", cu_i1: "EXW: the buyer handles everything from the seller's factory.", cu_i2: "FCA: the seller hands the export-cleared goods to the buyer's carrier.", cu_i3: "FOB: the seller loads onto the ship; after that, risks and costs are the buyer's.", cu_i4: "CIF: the seller pays freight and insurance to the port of arrival.", cu_i5: "DAP: the seller delivers to destination, the buyer pays import duties.", cu_i6: "DDP: the seller pays everything, import duties included.",
      cu_ban: "Banned or controlled everywhere: weapons, drugs, counterfeits, protected species (CITES), some medicines. Such listings are refused and can be reported (🚩).",
      cu_find: "Find a forwarder or a carrier", cu_read: "Read a foreign document (photo)", cu_src: "Sources: ICC (Incoterms 2020), ITC, European Commission, douane.gouv.fr. Always check the exact rules for your product.", b_kind_mission: "Remote job or gig (offering or looking)",
      mk_t: "📈 Markets and trading", mk_d: "Talk about the markets with the whole world in the communities, and learn the basics in Learn. 24/24 ONE WORLD executes no orders and gives no investment advice.",
      mk_c: "Communities", mk_l: "Learn", b_new: "＋ Post a listing",
      mt_t: "💸 Send money abroad", mt_d: "Western Union, MoneyGram, Wise, Remitly… compare the fees for your country before you send.", mt_open: "Compare", mt_sub: "24/24 ONE WORLD does not send money itself and earns nothing from these links: you compare here, then you send with the service you choose.", mt_cmp: "Compare prices for your country", mt_wb: "Remittance Prices Worldwide (World Bank): the real cost of sending money, country by country, service by service", mt_prov: "Money transfer services", mt_p_wu: "Cash pickup in very many countries, bank transfer, mobile wallet", mt_p_mg: "Cash pickup, bank transfer, mobile wallet", mt_p_ria: "Cash pickup, bank transfer", mt_p_wise: "Bank transfer at the market exchange rate, fees shown before you send", mt_p_rem: "Bank transfer, mobile wallet, cash pickup", mt_p_wr: "Mobile wallet, bank transfer, cash pickup", mt_p_tt: "Send to a mobile wallet or bank account", mt_tips: "Before you send", mt_k1: "Look at the total received: fees + exchange rate. A rate worse than the market rate is a hidden cost.", mt_k2: "Choose how the person receives it: cash, bank account or mobile wallet (M-Pesa, Orange Money, MTN…).", mt_k3: "An ID document is often required, both to send and to collect.", mt_k4: "Never send money to someone you only met online, or to \"unlock\" a prize, a parcel, a loan or a visa: it is almost always a scam.", mt_note: "Services and prices change: always check on their website when you send.", ds_t: "📦 Dropshipping and online selling", ds_d: "Sell without stock: find a supplier, work out the real price, stay within the law.", ds_open: "Open the guide", ds_sub: "Dropshipping means selling a product that the supplier ships directly to your customer. Easy to start, but you remain responsible for the sale.", ds_steps: "The steps", ds_s1: "Choose a product that is allowed in your customers' country: no counterfeits, no regulated product without authorisation.", ds_s2: "Find a supplier (\"Wholesale / supplier\" listings here or wholesale platforms) and order a sample before you sell.", ds_s3: "Work out the real price: product, shipping, customs duties, VAT of the customer's country, payment fees and returns.", ds_s4: "Tell your customers the real delivery time.", ds_s5: "Register your activity: business status, VAT and taxes according to your country (see Trade rules).", ds_s6: "Respect customers' rights: clear prices including taxes, right of return, warranty, data protection.", ds_warn: "Common traps", ds_w1: "A supplier who wants full payment by unprotected bank transfer or in cryptocurrency.", ds_w2: "Paid courses that promise to make you rich fast.", ds_w3: "Stolen photos and fake reviews: forbidden and punished.", ds_w4: "In the European Union, a parcel from outside the EU pays VAT from the first euro.", ds_plat: "Wholesale platforms (private, not linked to 24/24 ONE WORLD)", ds_find: "Find a supplier here", ds_cu: "Customs and import-export", bo_t: "📈 Live stock market", bo_d: "Indices, stocks, currencies, commodities and cryptocurrencies from around the world, with charts.", bo_open: "See prices", bo_sub: "Prices are provided free of charge by TradingView, sometimes with a short delay depending on the stock exchange.", bo_load: "Show prices", bo_priv: "When you tap this button, prices load from TradingView (an external service), in an isolated area that has no access to your account.", bo_ov: "World markets", bo_chart: "Chart of a stock (search for its name at the top of the chart)", bo_risk: "Investing can lose you money. 24/24 ONE WORLD places no orders, holds no money and gives no investment advice. To buy or sell, use an authorised intermediary in your country.", bo_check: "Before you entrust money", bo_amf: "AMF blacklists (France): unauthorised trading, Forex and crypto websites", bo_learn: "Learn the basics", bo_talk: "Talk about it in communities", bo_fail: "Prices could not load. Check your connection and try again.", bo_web: "Open prices in the browser",
      b_none: "No listing yet. Post the first one!", b_contact: "💬 Contact", b_mine: "Your listing", b_close: "Remove",
      b_kind: "Type", b_ttl: "Title", b_ttl_ph: "e.g. City bike, very good condition", b_body: "Description", b_price: "Price (optional)",
      b_cur: "Currency", b_place: "Place (optional)", b_place_ph: "e.g. Antananarivo", b_publish: "Publish",
      b_safety: "Be careful: never pay a stranger in advance. 24/24 ONE WORLD connects people and takes no part in sales.",
      av_partners: "Travel for less", av_partners_sub: "Our partners, same price for you.",
      av_invite: "Invite my loved ones", av_invite_sub: "Share your link: your loved ones find you right away in Messages.",
      av_invite_btn: "↗ Share my link", av_copied: "Link copied: paste it wherever you like.",
      av_note: "Partner links: a booking may earn 24/24 ONE WORLD a commission, at no extra cost to you. It funds a free, open network.",
      av_soon: "Coming soon: member-only discounts negotiated with our partners.",
      need_account: "First create your free account in Messages.", open_msg: "Open Messages",
      e_net: "No connection to the server. Try again.", e_rate: "Too many posts at once: wait a moment.", e_other: "Not possible right now ({m}).",
      retry: "Try again", loading: "Loading…", auto_tr: "Machine translation: check important information.",
      open_new: "{b} (opens in a new tab)",
      tp_all: "All", tp_friends: "Friendship", tp_women: "Women", tp_support: "Support and listening", tp_family: "Families and parents", tp_culture: "Culture and hobbies",
      tp_languages: "Languages", tp_faith: "Faith and spirituality", tp_work: "Work and studies", tp_markets: "Markets and business", tp_travel: "Travel", tp_school: "School and twinned classes", tp_other: "Other",
      f_topic: "Topic", speak: "🔊 Listen", more: "More actions", report: "🚩 Report", block: "⛔ Block this person",
      report_done: "Thank you: report sent to moderation.", block_q: "Block {n}? You will no longer see their messages, here or in Messages.", block_done: "{n} is blocked.",
      mic: "🎤", mic_t: "Dictate in my language",
      entraide: "Mutual aid", entraide_sub: "Ask for help, offer it, give away what you no longer use: free, with the whole world, each in their language.",
      h_new: "＋ Ask for or offer help", h_none: "No request yet. Be the first to help or to ask.",
      b_help_need: "Needs help", b_help_offer: "Offering help", b_give: "Free gift",
      h_kind_need: "I need help", h_kind_offer: "I offer my help (free)", h_kind_give: "I give an item away (free)", h_ttl_ph: "e.g. Looking for someone to help me fill in a form in English", back_h: "← Mutual aid",
      h_safety: "Mutual aid is free: nobody should ask you for money. Meet in a public place, tell someone close, and report any abuse (🚩).",
      sos: "SOS", sos_sub: "In an emergency, call the emergency services first. These numbers work without any app.",
      sos_country: "Country you are in", sos_other: "Other country", sos_general: "General emergency number", sos_police: "Police", sos_amb: "Ambulance, medical emergency", sos_fire: "Fire brigade",
      sos_women: "Violence against women (listening, free, anonymous)", sos_deaf: "Emergency by text message (deaf people or people who cannot speak)",
      sos_112: "Your country is not listed: on a mobile phone, 112 works in many countries. Check the local number as soon as you can.",
      sos_phr: "Show or play aloud", sos_phr_sub: "Sentences translated into the language of the chosen country.",
      sp1: "I need help, please.", sp2: "Call an ambulance.", sp3: "Call the police.", sp4: "I am in danger.", sp5: "Where is the nearest hospital?", sp6: "I am lost.",
      sos_med: "🩺 At the doctor or the pharmacy", sos_med_sub: "Translation only: this is not medical advice.",
      hp1: "It hurts here.", hp2: "I am allergic to this medicine.", hp3: "I take this treatment every day.", hp4: "I am pregnant.", hp5: "I am diabetic.", hp6: "I don't understand. Could you write it down, please?",
      sos_tr_lang: "Language of the sentences", sos_offline: "Without a connection the sentences cannot be translated: show the numbers above.",
      call: "Call {n}",
    }
  };
  var CUR = ["EUR", "USD", "GBP", "CHF", "CAD", "AUD", "JPY", "CNY", "INR", "BRL", "MXN", "MGA", "MUR", "XOF", "XAF", "MAD", "IDR", "THB", "AED", "RUB"];
  var MAX_VIEWERS = 12;
  var TOPICS = ["friends", "women", "support", "family", "culture", "languages", "faith", "work", "school", "markets", "travel", "other"];
  // SOS : numéros d'urgence publics (g = général, p = police, a = ambulance, f = pompiers, w = violences faites aux femmes, s = urgence par SMS).
  // l = langue des phrases traduites. Pays de l'Union européenne : 112 partout.
  var SOS = {
    FR: { n: "France", g: "112", p: "17", a: "15", f: "18", w: "3919", s: "114", l: "fr" }, RE: { n: "La Réunion", g: "112", p: "17", a: "15", f: "18", w: "3919", s: "114", l: "fr" },
    BE: { n: "Belgique", g: "112", p: "101", a: "112", f: "112", l: "fr" }, CH: { n: "Suisse", g: "112", p: "117", a: "144", f: "118", l: "fr" },
    DE: { n: "Deutschland", g: "112", p: "110", a: "112", f: "112", l: "de" }, ES: { n: "España", g: "112", p: "091", a: "112", f: "112", w: "016", l: "es" },
    IT: { n: "Italia", g: "112", p: "112", a: "118", f: "115", w: "1522", l: "it" }, PT: { n: "Portugal", g: "112", l: "pt" }, NL: { n: "Nederland", g: "112", l: "nl" },
    GB: { n: "United Kingdom", g: "999", p: "999", a: "999", f: "999", l: "en" }, IE: { n: "Ireland", g: "112", l: "en" },
    US: { n: "United States", g: "911", l: "en" }, CA: { n: "Canada", g: "911", l: "en" }, MX: { n: "México", g: "911", l: "es" },
    AR: { n: "Argentina", g: "911", a: "107", f: "100", l: "es" }, BR: { n: "Brasil", g: "190", p: "190", a: "192", f: "193", l: "pt" },
    AU: { n: "Australia", g: "000", l: "en" }, NZ: { n: "New Zealand", g: "111", l: "en" },
    JP: { n: "日本", g: "110", p: "110", a: "119", f: "119", l: "ja" }, CN: { n: "中国", g: "110", p: "110", a: "120", f: "119", l: "zh" },
    KR: { n: "대한민국", g: "112", p: "112", a: "119", f: "119", l: "ko" }, IN: { n: "India", g: "112", l: "hi" },
    ID: { n: "Indonesia", g: "112", p: "110", a: "118", f: "113", l: "id" }, TH: { n: "ประเทศไทย", g: "191", p: "191", a: "1669", f: "199", l: "th" },
    PH: { n: "Philippines", g: "911", l: "en" }, RU: { n: "Россия", g: "112", l: "ru" }, ZA: { n: "South Africa", g: "10111", p: "10111", a: "10177", l: "en" }
  };
  var ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];

  var ui = "fr", cur = null, uidP = null, myLang = null;
  function t(k, v) {
    var s = (STR[ui] && STR[ui][k]) || (window.EW_SCREEN_STR && window.EW_SCREEN_STR.espaces && window.EW_SCREEN_STR.espaces[ui] && window.EW_SCREEN_STR.espaces[ui][k]) || STR.en[k] || STR.fr[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function base(l) { return String(l || "").toLowerCase().split(/[-_]/)[0]; }
  function flag(l) { var x = window.EWMoteur && window.EWMoteur.lang(base(l)); return (x && x.flag) || ""; }
  function errText(e) {
    var m = String((e && (e.message || e.code)) || e || "");
    if (/OW_RATE/.test(m)) return t("e_rate");
    if (/fetch|network|NETWORK|OFF/i.test(m)) return t("e_net");
    return t("e_other", { m: m.slice(0, 60) });
  }
  function sb() { return window.EWConnect && window.EWConnect.client ? window.EWConnect.client() : Promise.reject(new Error("OFF")); }
  // Mon compte (identifiant, langue de lecture) : celui de la Messagerie, sur ce téléphone.
  function account() {
    if (!uidP) uidP = sb().then(function (c) {
      return c.auth.getSession().then(function (r) {
        var u = r && r.data && r.data.session && r.data.session.user;
        if (!u) return null;
        return c.from("profiles").select("id,pseudo,lang").eq("id", u.id).maybeSingle().then(function (p) {
          var prof = p && p.data;
          if (!prof) return null;
          myLang = base(prof.lang) || ui;
          return { id: u.id, pseudo: prof.pseudo, lang: myLang };
        });
      });
    }).catch(function (e) { uidP = null; throw e; });
    return uidP;
  }
  // Traduction pour moi : rien à faire si le texte est déjà dans ma langue.
  function tr(text, from) {
    var to = myLang || ui;
    if (!text || base(from) === base(to) || !window.EWMoteur) return Promise.resolve(text);
    return window.EWMoteur.translate(text, base(from), base(to)).catch(function () { return text; });
  }
  // Remplit chaque élément [data-tr] avec sa traduction (original gardé dans [data-orig] si différent).
  function fillTr(box) {
    box.querySelectorAll("[data-tr]").forEach(function (el) {
      var text = el.getAttribute("data-tr"), from = el.getAttribute("data-from");
      el.removeAttribute("data-tr");
      if (base(from) === base(myLang || ui)) { el.textContent = text; return; }
      el.textContent = text;
      el.classList.add("es-pending");
      var tok = cur && cur.token;
      tr(text, from).then(function (out) {
        if (!cur || cur.token !== tok) return;
        el.classList.remove("es-pending");
        el.textContent = out;
        if (out !== text && el.getAttribute("data-show-orig") !== "no") {
          var o = document.createElement("small");
          o.className = "es-orig";
          o.setAttribute("dir", "auto");
          o.textContent = flag(from) + " " + text;
          el.insertAdjacentElement("afterend", o);
        }
      });
    });
  }
  function busy(root) { root.innerHTML = '<div class="card"><p class="muted">' + esc(t("loading")) + "</p></div>"; }
  function fail(root, e, again) {
    root.innerHTML = '<div class="card"><p class="tr-err">' + esc(errText(e)) + '</p><button type="button" class="btn" id="esRetry">' + esc(t("retry")) + "</button></div>";
    root.querySelector("#esRetry").addEventListener("click", again);
  }
  function noAccount(root) {
    root.innerHTML = '<div class="card"><p>' + esc(t("need_account")) + '</p><a class="btn primary" href="../index.html?b=msg">' + esc(t("open_msg")) + "</a></div>";
  }
  function head(kind) {
    return '<div class="tr-head es-head"><div><h1 id="h-es">' + esc(t(kind)) + '</h1><p class="muted">' + esc(t(kind + "_sub")) + "</p></div></div>";
  }
  function when(d) {
    try { return new Date(d).toLocaleString(ui, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; }
  }

  // ---------- Listes de salons (Community, Live) ----------
  function roomsList(root, kind, topic) {
    var k1 = kind === "live" ? "l" : "c";
    root.innerHTML = head(kind) +
      '<button type="button" class="tr-big es-new ' + kind + '" id="esNewBtn"><span class="tr-big-ic">＋</span><span><b>' + esc(t("create_" + k1).replace(/^＋ /, "")) + "</b></span></button>" +
      '<form class="card es-form" id="esNew" hidden><label class="tr-field">' + esc(t("f_title")) +
      '<input id="esTitle" maxlength="80" required minlength="3" placeholder="' + esc(t("f_title_ph_" + k1)) + '"></label>' +
      '<label class="tr-field">' + esc(t("f_about")) + '<textarea id="esAbout" maxlength="500" rows="3"></textarea></label>' +
      (kind === "community" ? '<label class="tr-field">' + esc(t("f_topic")) + '<select id="esTopic">' + TOPICS.map(function (k) { return '<option value="' + k + '"' + (k === "other" ? " selected" : "") + ">" + esc(t("tp_" + k)) + "</option>"; }).join("") + "</select></label>" : "") +
      '<p class="tr-err" id="esErr"></p><div class="es-row"><button class="btn primary" type="submit">' + esc(t("create")) + '</button><button class="btn" type="button" id="esCancel">' + esc(t("cancel")) + "</button></div></form>" +
      (kind === "community" ? '<div class="es-chips" role="tablist">' + ["all"].concat(TOPICS).map(function (k) {
        return '<button type="button" role="tab" class="es-chip" data-f="' + k + '" aria-selected="' + (k === (topic || "all")) + '">' + esc(t("tp_" + k)) + "</button>";
      }).join("") + "</div>" : "") +
      '<div id="esList" class="es-list"><p class="muted">' + esc(t("loading")) + "</p></div>";
    root.querySelectorAll(".es-chip").forEach(function (b) { b.addEventListener("click", function () { roomsList(root, kind, b.getAttribute("data-f")); }); });
    var form = root.querySelector("#esNew");
    root.querySelector("#esNewBtn").addEventListener("click", function () { form.hidden = false; root.querySelector("#esTitle").focus(); });
    root.querySelector("#esCancel").addEventListener("click", function () { form.hidden = true; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var title = root.querySelector("#esTitle").value.trim(), about = root.querySelector("#esAbout").value.trim();
      if (title.length < 3) return;
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      Promise.all([sb(), account()]).then(function (r) {
        if (!r[1]) throw new Error("ACCOUNT");
        var row = { kind: kind, title: title, about: about, lang: r[1].lang };
        if (kind === "community") row.topic = root.querySelector("#esTopic").value;
        return r[0].from("ow_rooms").insert(row).select("id").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        location.hash = "#/" + kind + "/" + res.data.id;
      }).catch(function (err) { btn.disabled = false; root.querySelector("#esErr").textContent = errText(err); });
    });
    var tok = cur.token;
    Promise.all([sb(), account()]).then(function (r) {
      if (!r[1]) { noAccount(root.querySelector("#esList")); root.querySelector("#esNewBtn").hidden = true; return; }
      var q = r[0].from("ow_rooms").select("*").eq("kind", kind);
      if (topic && topic !== "all") q = q.eq("topic", topic);
      if (kind === "live") q = q.order("live_on", { ascending: false });
      return q.order("last_at", { ascending: false }).limit(60).then(function (res) {
        if (!cur || cur.token !== tok) return;
        if (res.error) throw res.error;
        var list = root.querySelector("#esList");
        if (!res.data.length) { list.innerHTML = '<div class="card es-empty"><p>' + esc(t("none_" + k1)) + "</p></div>"; return; }
        list.innerHTML = res.data.map(function (r) {
          return '<a class="card es-room" href="#/' + kind + "/" + esc(r.id) + '">' +
            (r.live_on ? '<span class="es-live">' + esc(t("on_air")) + "</span>" : "") +
            '<b dir="auto" data-tr="' + esc(r.title) + '" data-from="' + esc(r.lang) + '" data-show-orig="no"></b>' +
            (r.about ? '<span class="es-about" dir="auto" data-tr="' + esc(r.about) + '" data-from="' + esc(r.lang) + '" data-show-orig="no"></span>' : "") +
            '<small class="muted">' + esc(flag(r.lang)) + " " + (r.topic && r.topic !== "other" ? esc(t("tp_" + r.topic)) + " · " : "") + esc(t("members", { n: r.members })) + " · " + esc(t("by", { n: r.owner_name || "?" })) + "</small></a>";
        }).join("");
        fillTr(list);
      });
    }).catch(function (e) { if (cur && cur.token === tok) fail(root.querySelector("#esList"), e, function () { roomsList(root, kind, topic); }); });
  }

  // ---------- Un salon (communauté ou direct) ----------
  function room(root, kind, id) {
    var tok = cur.token;
    busy(root);
    Promise.all([sb(), account()]).then(function (r) {
      var c = r[0], me = r[1];
      if (!me) { noAccount(root); return; }
      return Promise.all([
        c.from("ow_rooms").select("*").eq("id", id).maybeSingle(),
        c.from("ow_room_members").select("room_id").eq("room_id", id).eq("user_id", me.id).maybeSingle(),
        c.from("ow_room_msgs").select("*").eq("room_id", id).order("id", { ascending: false }).limit(60)
      ]).then(function (res) {
        if (!cur || cur.token !== tok) return;
        if (res[0].error) throw res[0].error;
        if (!res[0].data) { location.replace("#/" + kind); return; }
        cur.c = c; cur.me = me; cur.room = res[0].data; cur.member = !!res[1].data; cur.lastId = 0;
        paintRoom(root, kind, (res[2].data || []).slice().reverse());
      });
    }).catch(function (e) { if (cur && cur.token === tok) fail(root, e, function () { room(root, kind, id); }); });
  }
  function paintRoom(root, kind, msgs) {
    var rm = cur.room, owner = rm.owner_id === cur.me.id, live = kind === "live";
    root.innerHTML = '<a class="tr-back" href="#/' + kind + '">' + esc(t(live ? "back_l" : "back_c")) + "</a>" +
      '<div class="card es-roomhead"><h1 id="h-es" dir="auto" data-tr="' + esc(rm.title) + '" data-from="' + esc(rm.lang) + '"></h1>' +
      (rm.about ? '<p class="muted" dir="auto" data-tr="' + esc(rm.about) + '" data-from="' + esc(rm.lang) + '"></p>' : "") +
      '<p class="muted"><span id="esLiveBadge">' + (rm.live_on ? esc(t("on_air")) + " · " : "") + "</span>" + esc(t("members", { n: rm.members })) + " · " + esc(t("by", { n: rm.owner_name || "?" })) + "</p>" +
      '<div class="es-row">' + (owner ? "" : '<button type="button" class="btn' + (cur.member ? "" : " primary") + '" id="esJoin">' + esc(t(cur.member ? "leave" : "join")) + "</button>") +
      (owner ? '<button type="button" class="btn es-danger" id="esDel">' + esc(t("delete_room")) + "</button>" : "") + "</div></div>" +
      (live ? liveHtml(owner) : "") +
      '<div class="card es-chat"><div class="es-msgs" id="esMsgs" aria-live="polite"></div>' +
      (cur.member ? '<form class="es-compose" id="esCompose"><button type="button" class="es-mic" id="esMic" aria-label="' + esc(t("mic_t")) + '">' + esc(t("mic")) + '</button><input id="esInput" dir="auto" maxlength="1000" autocomplete="off" placeholder="' + esc(t("write_ph")) + '"><button class="btn primary" type="submit">' + esc(t("send")) + "</button></form>" +
        '<p class="tr-err" id="esErr"></p>'
        : '<p class="muted">' + esc(t(live ? "live_watch" : "join_to_write")) + "</p>") +
      '<p class="muted es-small">' + esc(t("auto_tr")) + "</p></div>";
    fillTr(root.querySelector(".es-roomhead"));
    msgs.forEach(function (m) { addMsg(m); });
    if (!msgs.filter(function (m) { return m.kind !== "caption"; }).length) root.querySelector("#esMsgs").innerHTML = '<p class="muted es-empty-msg">' + esc(t("empty_room")) + "</p>";
    var join = root.querySelector("#esJoin");
    if (join) join.addEventListener("click", function () {
      join.disabled = true;
      var q = cur.member ? cur.c.from("ow_room_members").delete().eq("room_id", rm.id).eq("user_id", cur.me.id)
        : cur.c.from("ow_room_members").insert({ room_id: rm.id, user_id: cur.me.id });
      q.then(function (res) { if (res.error) throw res.error; room(root, kind, rm.id); }).catch(function (e) { join.disabled = false; alert(errText(e)); });
    });
    var del = root.querySelector("#esDel");
    if (del) del.addEventListener("click", function () {
      if (!confirm(t("delete_room_q", { t: rm.title }))) return;
      stopLive();
      cur.c.from("ow_rooms").delete().eq("id", rm.id).then(function (res) { if (res.error) throw res.error; location.hash = "#/" + kind; }).catch(function (e) { alert(errText(e)); });
    });
    var form = root.querySelector("#esCompose");
    if (form) bindMic(root.querySelector("#esMic"), root.querySelector("#esInput"));
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inp = root.querySelector("#esInput"), body = inp.value.trim();
      if (!body) return;
      inp.value = "";
      post(body, "text").catch(function (err) { inp.value = body; root.querySelector("#esErr").textContent = errText(err); });
    });
    // Nouveaux messages : temps réel, et relève toutes les 10 s au cas où le temps réel serait coupé.
    var tok = cur.token;
    try {
      cur.rt = cur.c.channel("ow-room-" + rm.id).on("postgres_changes", { event: "INSERT", schema: "public", table: "ow_room_msgs", filter: "room_id=eq." + rm.id },
        function (p) { if (cur && cur.token === tok && p && p.new) addMsg(p.new); }).subscribe();
    } catch (e) { cur.rt = null; }
    cur.poll = setInterval(function () {
      if (!cur || cur.token !== tok) return;
      cur.c.from("ow_room_msgs").select("*").eq("room_id", rm.id).gt("id", cur.lastId).order("id", { ascending: true }).limit(50)
        .then(function (res) { if (cur && cur.token === tok && res.data) res.data.forEach(addMsg); });
    }, 10000);
    if (live) bindLive(root, owner);
  }
  // Sous chaque message ou annonce d'une autre personne : écouter (voix du téléphone, dans ma langue), signaler, bloquer.
  function actsHtml() {
    return '<span class="es-acts">' + (window.EWMoteur && window.EWMoteur.canSpeak ? '<button type="button" class="es-act" data-a="speak">' + esc(t("speak")) + "</button>" : "") +
      '<button type="button" class="es-act" data-a="report">' + esc(t("report")) + '</button><button type="button" class="es-act" data-a="block">' + esc(t("block")) + "</button></span>";
  }
  function bindActs(el, target) {
    el.querySelectorAll(".es-act").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.getAttribute("data-a");
        if (a === "speak") {
          var body = el.querySelector(".es-body, [data-body]");
          window.EWMoteur.speak((body && body.textContent) || target.copy, myLang || ui, 1);
        } else if (a === "report") {
          b.disabled = true;
          Promise.all([sb(), account()]).then(function (r) {
            return r[0].from("ow_reports").insert({ target_kind: target.kind, target_id: target.id, target_user: target.user || null, body_copy: String(target.copy || "").slice(0, 1500) });
          }).then(function (res) { if (res && res.error) throw res.error; b.textContent = t("report_done"); })
            .catch(function (e) { b.disabled = false; alert(errText(e)); });
        } else if (a === "block") {
          if (!target.user || !confirm(t("block_q", { n: target.name || "?" }))) return;
          Promise.all([sb(), account()]).then(function (r) {
            return r[0].from("blocks").insert({ blocker: r[1].id, blocked: target.user });
          }).then(function (res) {
            if (res && res.error && !/duplicate|23505/.test(res.error.message + res.error.code)) throw res.error;
            document.querySelectorAll('[data-user="' + target.user + '"]').forEach(function (x) { x.remove(); });
            el.remove();
            alert(t("block_done", { n: target.name || "?" }));
          }).catch(function (e) { alert(errText(e)); });
        }
      });
    });
  }
  // Dictée : pour celles et ceux qui écrivent difficilement, le micro remplit le message dans leur langue.
  function bindMic(btn, input) {
    if (!btn) return;
    if (!window.EWMoteur || !window.EWMoteur.canListen) { btn.remove(); return; }
    btn.addEventListener("click", function () {
      if (btn._l) { btn._l.stop(); return; }
      window.EWMoteur.askMic().then(function (ok) {
        if (!ok) return;
        btn.classList.add("on");
        btn._l = window.EWMoteur.listen(myLang || ui, {
          interim: function (x) { input.value = x; },
          final: function (x) { input.value = x; },
          error: function () {},
          end: function () { btn._l = null; btn.classList.remove("on"); input.focus(); }
        });
        if (!btn._l) btn.classList.remove("on");
      });
    });
  }
  function post(body, kind) {
    return cur.c.from("ow_room_msgs").insert({ room_id: cur.room.id, body: body.slice(0, 1000), lang: cur.me.lang, kind: kind }).select("*").single()
      .then(function (res) { if (res.error) throw res.error; addMsg(res.data); });
  }
  function addMsg(m) {
    if (!cur || !cur.room || !m || m.room_id !== cur.room.id) return;
    cur.seen = cur.seen || {};
    if (cur.seen[m.id]) return;
    cur.seen[m.id] = true;
    if (m.id > cur.lastId) cur.lastId = m.id;
    if (m.kind === "caption") { onCaption(m); return; }
    var box = document.getElementById("esMsgs");
    if (!box) return;
    var empty = box.querySelector(".es-empty-msg");
    if (empty) empty.remove();
    var mine = cur.me && m.sender_id === cur.me.id;
    var div = document.createElement("div");
    div.className = "es-msg" + (mine ? " me" : "");
    div.setAttribute("data-user", m.sender_id);
    div.innerHTML = '<span class="es-who">' + esc(mine ? "" : (m.sender_name || "?")) + ' <small class="muted">' + esc(when(m.created_at)) + "</small></span>" +
      '<span class="es-body" dir="auto" ' + (mine ? ">" + esc(m.body) : 'data-tr="' + esc(m.body) + '" data-from="' + esc(m.lang) + '">') + "</span>" +
      (mine ? "" : actsHtml());
    box.appendChild(div);
    if (!mine) { fillTr(div); bindActs(div, { kind: "msg", id: String(m.id), user: m.sender_id, name: m.sender_name, copy: m.body }); }
    box.scrollTop = box.scrollHeight;
  }

  // ---------- LIVE : sous-titres traduits, voix traduite, caméra de l'animateur ----------
  function liveHtml(owner) {
    return '<div class="card es-livebox"><div class="es-stage" id="esStage"><video id="esVideo" autoplay playsinline muted hidden></video>' +
      '<div class="es-caption" id="esCaption" dir="auto">' + esc(owner ? t("live_host_hint") : (cur.room.live_on ? "" : t("live_wait"))) + "</div></div>" +
      '<p class="muted es-small" id="esInterim" dir="auto"></p>' +
      '<div class="es-row">' + (owner
        ? '<button type="button" class="btn primary" id="esLiveGo">' + esc(t(cur.room.live_on ? "live_stop" : "live_start")) + '</button><button type="button" class="btn" id="esCam">' + esc(t("cam")) + "</button>"
        : '<button type="button" class="btn" id="esVoice">' + esc(t("live_voice")) + "</button>") + "</div>" +
      (owner ? '<form class="es-compose" id="esCapForm"><input id="esCapInput" dir="auto" maxlength="300" autocomplete="off" placeholder="' + esc(t("caption_ph")) + '"><button class="btn" type="submit">' + esc(t("send")) + "</button></form>" : "") +
      '<p class="muted es-small" id="esLiveMsg"></p></div>';
  }
  function onCaption(m) {
    var el = document.getElementById("esCaption");
    if (!el) return;
    var mine = cur.me && m.sender_id === cur.me.id;
    if (mine) { el.textContent = m.body; return; }
    var tok = cur.token;
    tr(m.body, m.lang).then(function (out) {
      if (!cur || cur.token !== tok) return;
      el.textContent = out;
      if (cur.voice && window.EWMoteur) window.EWMoteur.speak(out, myLang || ui, 1);
    });
    if (cur.room && !cur.room.live_on) { cur.room.live_on = true; var b = document.getElementById("esLiveBadge"); if (b) b.textContent = t("on_air") + " · "; }
  }
  function bindLive(root, owner) {
    var msg = root.querySelector("#esLiveMsg");
    if (owner) {
      var go = root.querySelector("#esLiveGo"), cam = root.querySelector("#esCam");
      go.addEventListener("click", function () {
        var on = !cur.room.live_on;
        go.disabled = true;
        cur.c.from("ow_rooms").update({ live_on: on }).eq("id", cur.room.id).then(function (res) {
          go.disabled = false;
          if (res.error) throw res.error;
          cur.room.live_on = on;
          go.textContent = t(on ? "live_stop" : "live_start");
          root.querySelector("#esLiveBadge").textContent = on ? t("on_air") + " · " : "";
          if (on) startCaptions(root); else stopCaptions();
          signal({ t: on ? "live" : "end" });
        }).catch(function (e) { go.disabled = false; msg.textContent = errText(e); });
      });
      cam.addEventListener("click", function () { toggleHostCam(root); });
      root.querySelector("#esCapForm").addEventListener("submit", function (e) {
        e.preventDefault();
        var inp = root.querySelector("#esCapInput"), v = inp.value.trim();
        if (!v) return;
        inp.value = "";
        post(v, "caption").catch(function (err) { msg.textContent = errText(err); });
      });
      if (cur.room.live_on) startCaptions(root);
    } else {
      var vb = root.querySelector("#esVoice");
      vb.addEventListener("click", function () {
        cur.voice = !cur.voice;
        vb.textContent = t(cur.voice ? "live_voice_off" : "live_voice");
        if (!cur.voice && window.EWMoteur) window.EWMoteur.stopSpeaking();
      });
    }
    if (cur.member) openSignal(owner);
  }
  // Sous-titres de l'animateur : le micro écoute phrase par phrase, chaque phrase part aux spectateurs.
  function startCaptions(root) {
    if (cur.cap || !window.EWMoteur || !window.EWMoteur.canListen) {
      if (!window.EWMoteur || !window.EWMoteur.canListen) root.querySelector("#esLiveMsg").textContent = t("live_no_mic");
      return;
    }
    var tok = cur.token;
    cur.cap = { on: true, l: null };
    function next() {
      if (!cur || cur.token !== tok || !cur.cap || !cur.cap.on) return;
      cur.cap.l = window.EWMoteur.listen(cur.me.lang, {
        interim: function (x) { var el = document.getElementById("esInterim"); if (el) el.textContent = x; },
        final: function (x) {
          var el = document.getElementById("esInterim"); if (el) el.textContent = "";
          post(x, "caption").catch(function () { /* phrase perdue : la suivante repart */ });
          setTimeout(next, 120);
        },
        error: function (code) {
          if (code === "DENIED") { cur.cap.on = false; var m = document.getElementById("esLiveMsg"); if (m) m.textContent = t("live_mic_denied"); }
        },
        end: function () { setTimeout(next, 300); }
      });
      if (!cur.cap.l) setTimeout(next, 1500);
    }
    window.EWMoteur.askMic().then(function (ok) {
      if (!ok) { cur.cap.on = false; root.querySelector("#esLiveMsg").textContent = t("live_mic_denied"); return; }
      if (window.EWEcoute) window.EWEcoute.keepAwake("live");
      next();
    });
  }
  function stopCaptions() {
    if (!cur || !cur.cap) return;
    cur.cap.on = false;
    try { if (cur.cap.l) cur.cap.l.stop(); } catch (e) { /* déjà arrêté */ }
    cur.cap = null;
    if (window.EWEcoute) window.EWEcoute.release("live");
  }
  // Vidéo : canal privé « room:<id> » (membres du salon) ; l'animateur envoie sa caméra à chaque spectateur (un lien par spectateur).
  function openSignal(owner) {
    var tok = cur.token;
    cur.peers = {};
    try {
      cur.sig = cur.c.channel("room:" + cur.room.id, { config: { private: true } })
        .on("broadcast", { event: "sig" }, function (p) { if (cur && cur.token === tok) onSig(p && p.payload, owner); })
        .subscribe(function (st) { if (st === "SUBSCRIBED" && !owner && cur && cur.token === tok) signal({ t: "hello" }); });
    } catch (e) { cur.sig = null; }
  }
  function signal(p) {
    if (!cur || !cur.sig) return;
    p.from = cur.me.id;
    try { cur.sig.send({ type: "broadcast", event: "sig", payload: p }); } catch (e) { /* ignoré */ }
  }
  function onSig(p, owner) {
    if (!p || !p.from || p.from === cur.me.id) return;
    if (p.to && p.to !== cur.me.id) return;
    if (owner) {
      if (p.t === "hello" && cur.camStream) offerTo(p.from);
      else if (p.t === "answer" && cur.peers[p.from]) cur.peers[p.from].setRemoteDescription(p.sdp).catch(function () {});
      else if (p.t === "ice" && cur.peers[p.from]) cur.peers[p.from].addIceCandidate(p.ice).catch(function () {});
      else if (p.t === "bye" && cur.peers[p.from]) { try { cur.peers[p.from].close(); } catch (e) {} delete cur.peers[p.from]; countViewers(); }
    } else {
      if (p.t === "live" || p.t === "cam") signal({ t: "hello" });
      else if (p.t === "camoff" || p.t === "end") closeViewer();
      else if (p.t === "offer") answerOffer(p);
      else if (p.t === "ice" && cur.vpc) cur.vpc.addIceCandidate(p.ice).catch(function () {});
    }
  }
  function offerTo(viewer) {
    if (cur.peers[viewer]) { try { cur.peers[viewer].close(); } catch (e) {} delete cur.peers[viewer]; }
    if (Object.keys(cur.peers).length >= MAX_VIEWERS) return;
    var pc = new RTCPeerConnection({ iceServers: ICE });
    cur.peers[viewer] = pc;
    cur.camStream.getTracks().forEach(function (tr) { pc.addTrack(tr, cur.camStream); });
    pc.onicecandidate = function (e) { if (e.candidate) signal({ t: "ice", to: viewer, ice: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    pc.onconnectionstatechange = function () {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") { if (cur && cur.peers && cur.peers[viewer] === pc) { delete cur.peers[viewer]; countViewers(); } }
      else if (pc.connectionState === "connected") countViewers();
    };
    pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }).then(function () {
      signal({ t: "offer", to: viewer, sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
    }).catch(function () {});
  }
  function countViewers() {
    var el = document.getElementById("esLiveMsg");
    if (!el || !cur || !cur.peers) return;
    var n = Object.keys(cur.peers).filter(function (k) { return cur.peers[k].connectionState === "connected"; }).length;
    el.textContent = cur.camStream ? t("live_viewers", { n: n }) : "";
  }
  function answerOffer(p) {
    closeViewer();
    var pc = new RTCPeerConnection({ iceServers: ICE });
    cur.vpc = pc;
    pc.onicecandidate = function (e) { if (e.candidate) signal({ t: "ice", to: p.from, ice: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    pc.ontrack = function (e) {
      var v = document.getElementById("esVideo");
      if (!v) return;
      v.srcObject = (e.streams && e.streams[0]) || new MediaStream([e.track]);
      v.hidden = false;
      document.getElementById("esStage").classList.add("has-video");
      var pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
    };
    pc.setRemoteDescription(p.sdp).then(function () { return pc.createAnswer(); }).then(function (a) { return pc.setLocalDescription(a); }).then(function () {
      signal({ t: "answer", to: p.from, sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
    }).catch(function () {});
  }
  function closeViewer() {
    if (cur && cur.vpc) { try { cur.vpc.close(); } catch (e) {} cur.vpc = null; }
    var v = document.getElementById("esVideo");
    if (v) { v.srcObject = null; v.hidden = true; }
    var st = document.getElementById("esStage");
    if (st) st.classList.remove("has-video");
  }
  function toggleHostCam(root) {
    var btn = root.querySelector("#esCam"), v = root.querySelector("#esVideo"), msg = root.querySelector("#esLiveMsg");
    if (cur.camStream) {
      cur.camStream.getTracks().forEach(function (tr) { tr.stop(); });
      cur.camStream = null;
      Object.keys(cur.peers || {}).forEach(function (k) { try { cur.peers[k].close(); } catch (e) {} });
      cur.peers = {};
      v.srcObject = null; v.hidden = true;
      root.querySelector("#esStage").classList.remove("has-video");
      btn.textContent = t("cam");
      msg.textContent = "";
      signal({ t: "camoff" });
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } }).then(function (st) {
      if (!cur || !cur.room) { st.getTracks().forEach(function (tr) { tr.stop(); }); return; }
      cur.camStream = st;
      v.srcObject = st; v.hidden = false;
      root.querySelector("#esStage").classList.add("has-video", "mine");
      var pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
      btn.textContent = t("cam_off");
      countViewers();
      signal({ t: "cam" });
    }).catch(function () { msg.textContent = t("cam_fail"); });
  }
  function stopLive() {
    if (!cur) return;
    stopCaptions();
    if (cur.camStream) { cur.camStream.getTracks().forEach(function (tr) { tr.stop(); }); cur.camStream = null; signal({ t: "camoff" }); }
    Object.keys(cur.peers || {}).forEach(function (k) { try { cur.peers[k].close(); } catch (e) {} });
    cur.peers = {};
    if (cur.vpc) signal({ t: "bye" });
    closeViewer();
    if (window.EWMoteur) window.EWMoteur.stopSpeaking();
  }

  // ---------- BUSINESS : petites annonces ----------
  function price(l) {
    if (l.price == null) return "";
    try { return new Intl.NumberFormat(ui, { style: "currency", currency: l.currency, maximumFractionDigits: 2 }).format(l.price); } catch (e) { return l.price + " " + l.currency; }
  }
  var HELP = ["help_need", "help_offer", "give"], BIZ = ["sell", "buy", "wholesale", "sourcing", "service", "logistics", "customs", "job", "mission", "partner"];
  function tile(route, p) {
    return '<a class="card es-customs" href="#/business/' + route + '"><b>' + esc(t(p + "_t")) + '</b><small class="muted">' + esc(t(p + "_d")) + '</small><span class="btn">' + esc(t(p + "_open")) + "</span></a>";
  }
  function business(root, filter, help) {
    var tok = cur.token, sp = help ? "entraide" : "business";
    filter = filter || "all";
    root.innerHTML = head(sp) +
      '<a class="tr-big es-new ' + sp + '" href="#/' + sp + '/new"><span class="tr-big-ic">＋</span><span><b>' + esc(t(help ? "h_new" : "b_new").replace(/^＋ /, "")) + "</b></span></a>" +
      '<div class="es-chips" role="tablist">' + ["all"].concat(help ? HELP : BIZ).map(function (k) {
        return '<button type="button" role="tab" class="es-chip" data-f="' + k + '" aria-selected="' + (k === filter) + '">' + esc(t("b_" + k)) + "</button>";
      }).join("") + "</div>" +
      '<div id="esList" class="es-list"><p class="muted">' + esc(t("loading")) + '</p></div>' +
      (help ? "" : '<a class="card es-customs" href="#/business/douane"><b>' + esc(t("cu_t")) + '</b><small class="muted">' + esc(t("cu_d")) + '</small><span class="btn">' + esc(t("cu_open")) + "</span></a>") +
      (help ? "" : '<a class="card es-customs" href="#/business/regles"><b>' + esc(t("rg_t")) + '</b><small class="muted">' + esc(t("rg_d")) + '</small><span class="btn">' + esc(t("rg_open")) + "</span></a>") +
      (help ? "" : tile("argent", "mt") + tile("dropshipping", "ds") + tile("bourse", "bo")) +
      '<p class="muted es-small">' + esc(t(help ? "h_safety" : "b_safety")) + "</p>";
    root.querySelectorAll(".es-chip").forEach(function (b) { b.addEventListener("click", function () { business(root, b.getAttribute("data-f"), help); }); });
    Promise.all([sb(), account()]).then(function (r) {
      if (!r[1]) { noAccount(root.querySelector("#esList")); return; }
      var q = r[0].from("ow_listings").select("*").eq("status", "open");
      if (filter !== "all") q = q.eq("kind", filter);
      else q = q.in("kind", help ? HELP : BIZ);
      return q.order("created_at", { ascending: false }).limit(80).then(function (res) {
        if (!cur || cur.token !== tok) return;
        if (res.error) throw res.error;
        var list = root.querySelector("#esList"), me = r[1];
        var rows = res.data.filter(function (l) { return (HELP.indexOf(l.kind) !== -1) === !!help; });
        if (!rows.length) { list.innerHTML = '<div class="card es-empty"><p>' + esc(t(help ? "h_none" : "b_none")) + "</p></div>"; return; }
        list.innerHTML = rows.map(function (l) {
          var mine = l.seller_id === me.id;
          return '<div class="card es-ad" data-id="' + esc(l.id) + '" data-user="' + esc(l.seller_id) + '"><span class="es-kind ' + esc(l.kind) + '">' + esc(t("b_" + l.kind)) + "</span>" +
            (l.price != null ? '<span class="es-price">' + esc(price(l)) + "</span>" : "") +
            '<b dir="auto" data-tr="' + esc(l.title) + '" data-from="' + esc(l.lang) + '" data-show-orig="no"></b>' +
            (l.body ? '<p dir="auto" data-tr="' + esc(l.body) + '" data-from="' + esc(l.lang) + '"></p>' : "") +
            '<small class="muted">' + esc([flag(l.lang), l.place, l.seller_name, when(l.created_at)].filter(Boolean).join(" · ")) + "</small>" +
            '<div class="es-row">' + (mine ? '<span class="muted">' + esc(t("b_mine")) + '</span><button type="button" class="btn es-close">' + esc(t("b_close")) + "</button>"
              : (l.seller_pseudo ? '<a class="btn primary" href="../index.html?ajouter=' + encodeURIComponent(l.seller_pseudo) + '">' + esc(t("b_contact")) + "</a>" : "")) + "</div>" +
            (mine ? "" : actsHtml()) + "</div>";
        }).join("");
        fillTr(list);
        list.querySelectorAll(".es-ad").forEach(function (el) {
          var l = rows.filter(function (x) { return x.id === el.getAttribute("data-id"); })[0];
          if (l && l.seller_id !== me.id) bindActs(el, { kind: "listing", id: l.id, user: l.seller_id, name: l.seller_name, copy: l.title + "\n" + (l.body || "") });
        });
        list.querySelectorAll(".es-close").forEach(function (b) {
          b.addEventListener("click", function () {
            var id = b.closest(".es-ad").getAttribute("data-id");
            b.disabled = true;
            r[0].from("ow_listings").update({ status: "closed" }).eq("id", id).then(function (res) { if (res.error) throw res.error; business(root, filter, help); })
              .catch(function (e) { b.disabled = false; alert(errText(e)); });
          });
        });
      });
    }).catch(function (e) { if (cur && cur.token === tok) fail(root.querySelector("#esList"), e, function () { business(root, filter, help); }); });
  }
  function businessNew(root, help) {
    var defCur = "EUR";
    try { var loc = (navigator.language || "").split("-")[1]; var m = { US: "USD", GB: "GBP", CH: "CHF", CA: "CAD", AU: "AUD", JP: "JPY", CN: "CNY", IN: "INR", BR: "BRL", MX: "MXN", MG: "MGA", MU: "MUR", SN: "XOF", CI: "XOF", CM: "XAF", MA: "MAD", ID: "IDR", TH: "THB", AE: "AED", RU: "RUB" }; if (m[loc]) defCur = m[loc]; } catch (e) { /* euro par défaut */ }
    var sp = help ? "entraide" : "business";
    root.innerHTML = '<a class="tr-back" href="#/' + sp + '">' + esc(t(help ? "back_h" : "back_b")) + "</a>" +
      '<form class="card es-form" id="esAd"><h1 id="h-es">' + esc(t(help ? "h_new" : "b_new").replace(/^＋ /, "")) + "</h1>" +
      '<label class="tr-field">' + esc(t("b_kind")) + '<select id="adKind">' + (help
        ? '<option value="help_need">' + esc(t("h_kind_need")) + '</option><option value="help_offer">' + esc(t("h_kind_offer")) + '</option><option value="give">' + esc(t("h_kind_give")) + "</option></select></label>"
        : '<option value="sell">' + esc(t("b_sell")) + '</option><option value="buy">' + esc(t("b_buy")) + '</option><option value="wholesale">' + esc(t("b_kind_wholesale")) + '</option><option value="sourcing">' + esc(t("b_kind_sourcing")) + '</option><option value="service">' + esc(t("b_service")) + '</option><option value="logistics">' + esc(t("b_kind_logistics")) + '</option><option value="customs">' + esc(t("b_kind_customs")) + '</option><option value="job">' + esc(t("b_kind_job")) + '</option><option value="mission">' + esc(t("b_kind_mission")) + '</option><option value="partner">' + esc(t("b_kind_partner")) + "</option></select></label>") +
      '<label class="tr-field">' + esc(t("b_ttl")) + '<input id="adTitle" required minlength="3" maxlength="90" placeholder="' + esc(t(help ? "h_ttl_ph" : "b_ttl_ph")) + '"></label>' +
      '<label class="tr-field">' + esc(t("b_body")) + '<textarea id="adBody" maxlength="1500" rows="4"></textarea></label>' +
      '<div class="es-row"' + (help ? " hidden" : "") + '><label class="tr-field es-grow">' + esc(t("b_price")) + '<input id="adPrice" type="number" inputmode="decimal" min="0" step="0.01"></label>' +
      '<label class="tr-field">' + esc(t("b_cur")) + '<select id="adCur">' + CUR.map(function (c) { return "<option" + (c === defCur ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></label></div>" +
      '<label class="tr-field">' + esc(t("b_place")) + '<input id="adPlace" maxlength="80" placeholder="' + esc(t("b_place_ph")) + '"></label>' +
      '<p class="tr-err" id="esErr"></p><button class="btn primary" type="submit">' + esc(t("b_publish")) + '</button><p class="muted es-small">' + esc(t(help ? "h_safety" : "b_safety")) + "</p></form>";
    var form = root.querySelector("#esAd");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var title = root.querySelector("#adTitle").value.trim();
      if (title.length < 3) return;
      var p = root.querySelector("#adPrice").value;
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      Promise.all([sb(), account()]).then(function (r) {
        if (!r[1]) throw new Error("ACCOUNT");
        return r[0].from("ow_listings").insert({ kind: root.querySelector("#adKind").value, title: title, body: root.querySelector("#adBody").value.trim(),
          price: help || p === "" ? null : Math.max(0, Number(p)), currency: root.querySelector("#adCur").value, place: root.querySelector("#adPlace").value.trim(), lang: r[1].lang });
      }).then(function (res) {
        if (res.error) throw res.error;
        location.hash = "#/" + sp;
      }).catch(function (err) { btn.disabled = false; root.querySelector("#esErr").textContent = errText(err); });
    });
  }

  // ---------- Avantages : partenaires et parrainage ----------
  function avantages(root) {
    var parts = window.EW_PARTNERS || [];
    var vy = (window.EW_SCREEN_STR && window.EW_SCREEN_STR.voyage) || {};
    function vt(k) { return (vy[ui] && vy[ui][k]) || (vy.en && vy.en[k]) || k; }
    root.innerHTML = head("avantages") +
      '<div class="card"><h2 class="tr-h2">' + esc(t("av_invite")) + '</h2><p class="muted">' + esc(t("av_invite_sub")) + "</p>" +
      '<button type="button" class="btn primary" id="esInvite">' + esc(t("av_invite_btn")) + '</button><p class="tr-ok" id="esInvOk"></p></div>' +
      (parts.length ? '<div class="card"><h2 class="tr-h2">' + esc(t("av_partners")) + '</h2><p class="muted">' + esc(t("av_partners_sub")) + '</p><div class="vy-bk-grid">' +
        parts.map(function (p) {
          var href = p.url || p.site, name = vt("bk_" + p.id);
          return '<a class="vy-bk" href="' + esc(href) + '" target="_blank" rel="sponsored noopener" aria-label="' + esc(t("open_new", { b: p.brand })) + '">' +
            '<span class="vy-bk-ic" aria-hidden="true">' + esc(p.icon) + "</span><b>" + esc(name === "bk_" + p.id ? p.brand : name) + '</b><small class="muted">' + esc(vt("bk_" + p.id + "_d").indexOf("bk_") === 0 ? "" : vt("bk_" + p.id + "_d")) +
            '</small><span class="vy-bk-br">' + esc(p.brand) + " ↗</span></a>";
        }).join("") + '</div><p class="muted es-small">' + esc(t("av_note")) + "</p></div>" : "") +
      '<div class="card"><p class="muted">' + esc(t("av_soon")) + "</p></div>";
    root.querySelector("#esInvite").addEventListener("click", function () {
      account().then(function (me) {
        if (!me) { location.href = "../index.html?b=msg"; return; }
        var link = new URL("../?ajouter=" + encodeURIComponent(me.pseudo) + "&i=5", location.href).href;
        if (navigator.share) return navigator.share({ url: link }).catch(function (e) { if (!(e && e.name === "AbortError")) copy(link); });
        copy(link);
      }).catch(function () { location.href = "../index.html?b=msg"; });
    });
    function copy(link) {
      var ok = root.querySelector("#esInvOk");
      (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { ok.textContent = t("av_copied"); }, function () { ok.textContent = link; });
    }
  }

  // ---------- SOS : numéros d'urgence du pays et phrases traduites à montrer ou faire écouter ----------
  var CU_LINKS = [["cu_t1", "https://www.macmap.org/"], ["cu_t2", "https://trade.ec.europa.eu/access-to-markets/fr/home"],
    ["cu_t3", "https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp"], ["cu_t4", "https://www.douane.gouv.fr/"]];
  function customs(root) {
    function li(keys) { return "<ul class=\"es-cu-list\">" + keys.map(function (k) { return "<li>" + esc(t(k)) + "</li>"; }).join("") + "</ul>"; }
    root.innerHTML = '<a class="tr-back" href="#/business">' + esc(t("back_b")) + "</a>" +
      '<div class="tr-head es-head"><div><h1 id="h-es">' + esc(t("cu_t")) + '</h1><p class="muted">' + esc(t("cu_sub")) + "</p></div></div>" +
      '<div class="card"><h2 class="tr-h2">' + esc(t("cu_tools")) + "</h2>" + CU_LINKS.map(function (l) {
        return '<a class="tr-row es-cu-link" href="' + l[1] + '" target="_blank" rel="noopener"><b>' + esc(t(l[0]).split(" : ")[0].split(": ")[0]) + "</b><span>" + esc(t(l[0]).replace(/^[^:]*:\s*/, "")) + "</span></a>";
      }).join("") + "</div>" +
      '<div class="card"><h2 class="tr-h2">' + esc(t("cu_docs")) + "</h2>" + li(["cu_d1", "cu_d2", "cu_d3", "cu_d4", "cu_d5", "cu_d6"]) + "</div>" +
      '<div class="card"><h2 class="tr-h2">' + esc(t("cu_inco")) + "</h2>" + li(["cu_i1", "cu_i2", "cu_i3", "cu_i4", "cu_i5", "cu_i6"]) + "</div>" +
      '<div class="card es-cu-ban"><p>' + esc(t("cu_ban")) + "</p></div>" +
      '<div class="es-row"><a class="btn primary" id="cuFind" href="#/business/f-customs">' + esc(t("cu_find")) + '</a><a class="btn" href="#/business/regles">' + esc(t("rg_open")) + '</a><a class="btn" href="#/everywhere/papier">' + esc(t("cu_read")) + "</a></div>" +
      '<p class="muted es-small">' + esc(t("cu_src")) + "</p>";
  }
  function linkRow(k, url) { var s = t(k), i = s.indexOf(":"); return '<a class="tr-row es-cu-link" href="' + url + '" target="_blank" rel="noopener"><b>' + esc(i > 0 ? s.slice(0, i).trim() : s) + "</b><span>" + esc(i > 0 ? s.slice(i + 1).trim() : "") + "</span></a>"; }
  function bullets(keys) { return "<ul class=\"es-cu-list\">" + keys.map(function (k) { return "<li>" + esc(t(k)) + "</li>"; }).join("") + "</ul>"; }
  function backB() { return '<a class="tr-back" href="#/business">' + esc(t("back_b")) + "</a>"; }
  function headB(k, sub) { return '<div class="tr-head es-head"><div><h1 id="h-es">' + esc(t(k)) + '</h1><p class="muted">' + esc(t(sub)) + "</p></div></div>"; }

  // ---------- Envoyer de l'argent : comparer, puis envoyer chez le service choisi (aucun argent ne passe par ONE WORLD) ----------
  var MT = [["Western Union", "mt_p_wu", "https://www.westernunion.com/"], ["MoneyGram", "mt_p_mg", "https://www.moneygram.com/"],
    ["Ria", "mt_p_ria", "https://www.riamoneytransfer.com/"], ["Wise", "mt_p_wise", "https://wise.com/"], ["Remitly", "mt_p_rem", "https://www.remitly.com/"],
    ["WorldRemit", "mt_p_wr", "https://www.worldremit.com/"], ["Taptap Send", "mt_p_tt", "https://www.taptapsend.com/"]];
  function money(root) {
    root.innerHTML = backB() + headB("mt_t", "mt_sub") +
      '<div class="card"><h2 class="tr-h2">' + esc(t("mt_cmp")) + "</h2>" + linkRow("mt_wb", "https://remittanceprices.worldbank.org/") + "</div>" +
      '<div class="card"><h2 class="tr-h2">' + esc(t("mt_prov")) + "</h2>" + MT.map(function (m) {
        return '<a class="tr-row es-cu-link" href="' + m[2] + '" target="_blank" rel="noopener"><b>' + esc(m[0]) + "</b><span>" + esc(t(m[1])) + "</span></a>";
      }).join("") + "</div>" +
      '<div class="card"><h2 class="tr-h2">' + esc(t("mt_tips")) + "</h2>" + bullets(["mt_k1", "mt_k2", "mt_k3"]) + "</div>" +
      '<div class="card es-cu-ban"><p>' + esc(t("mt_k4")) + "</p></div>" +
      '<p class="muted es-small">' + esc(t("mt_note")) + "</p>";
  }

  // ---------- Dropshipping : guide pas à pas, pièges, liens vers fournisseurs, douane et règles ----------
  function dropship(root) {
    root.innerHTML = backB() + headB("ds_t", "ds_sub") +
      '<div class="card"><h2 class="tr-h2">' + esc(t("ds_steps")) + "</h2>" + bullets(["ds_s1", "ds_s2", "ds_s3", "ds_s4", "ds_s5", "ds_s6"]).replace("<ul", "<ol").replace(/<\/ul>$/, "</ol>") + "</div>" +
      '<div class="card es-cu-ban"><h2 class="tr-h2">' + esc(t("ds_warn")) + "</h2>" + bullets(["ds_w1", "ds_w2", "ds_w3", "ds_w4"]) + "</div>" +
      '<div class="card"><h2 class="tr-h2">' + esc(t("ds_plat")) + "</h2>" +
        '<a class="tr-row es-cu-link" href="https://www.alibaba.com/" target="_blank" rel="noopener"><b>Alibaba.com</b><span></span></a>' +
        '<a class="tr-row es-cu-link" href="https://www.aliexpress.com/" target="_blank" rel="noopener"><b>AliExpress</b><span></span></a></div>' +
      '<div class="es-row"><a class="btn primary" href="#/business/f-wholesale">' + esc(t("ds_find")) + '</a><a class="btn" href="#/business/douane">' + esc(t("ds_cu")) + '</a><a class="btn" href="#/business/regles">' + esc(t("rg_open")) + "</a></div>";
  }

  // ---------- Bourse : cours gratuits TradingView, chargés seulement sur demande, dans un cadre isolé (sandbox sans
  // allow-same-origin : le script externe n'a accès ni au compte ni aux données de l'appli). Aucun ordre, aucun conseil. ----------
  var TV_LOC = { fr: "fr", en: "en", es: "es", it: "it", de: "de_DE", pt: "br", ru: "ru", ja: "ja", zh: "zh_CN", "zh-TW": "zh_TW", ar: "ar_AE", tr: "tr",
    ko: "kr", id: "id", th: "th_TH", vi: "vi_VN", pl: "pl", he: "he_IL", ms: "ms_MY", sv: "sv_SE", nl: "nl_NL", cs: "cs", hu: "hu_HU", ro: "ro", uk: "uk", fa: "fa_IR" };
  function tvFrame(widget, conf, h) {
    var code = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>html,body{margin:0;height:100%;background:transparent}</style></head><body>' +
      '<div class="tradingview-widget-container" style="height:100%"><div class="tradingview-widget-container__widget" style="height:100%"></div>' +
      '<script src="https://s3.tradingview.com/external-embedding/embed-widget-' + widget + '.js" async>' + JSON.stringify(conf).replace(/</g, "\\u003c") + "<\/script></div></body></html>";
    var f = document.createElement("iframe");
    f.className = "es-tv";
    f.setAttribute("sandbox", "allow-scripts allow-popups allow-popups-to-escape-sandbox");
    f.setAttribute("referrerpolicy", "no-referrer");
    f.setAttribute("loading", "lazy");
    f.style.height = h + "px";
    f.srcdoc = code;
    return f;
  }
  function bourse(root) {
    var loc = TV_LOC[ui] || TV_LOC[base(ui)] || "en";
    var dark = !(window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches);
    root.innerHTML = backB() + headB("bo_t", "bo_sub") +
      '<div class="card" id="boBox"><button type="button" class="btn primary" id="boLoad">' + esc(t("bo_load")) + '</button><p class="muted es-small">' + esc(t("bo_priv")) + "</p></div>" +
      '<div class="card"><h2 class="tr-h2">' + esc(t("bo_web")) + "</h2>" +
        '<a class="tr-row es-cu-link" href="https://www.tradingview.com/markets/" target="_blank" rel="noopener"><b>TradingView</b><span></span></a>' +
        '<a class="tr-row es-cu-link" href="https://www.google.com/finance/" target="_blank" rel="noopener"><b>Google Finance</b><span></span></a></div>' +
      '<div class="card es-cu-ban"><p>' + esc(t("bo_risk")) + "</p></div>" +
      '<div class="card"><h2 class="tr-h2">' + esc(t("bo_check")) + "</h2>" + linkRow("rg_i1", "https://www.iosco.org/i-scan/") +
        linkRow("bo_amf", "https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/listes-noires-et-mises-en-garde") + "</div>" +
      '<div class="es-row"><a class="btn" href="#/learn">' + esc(t("bo_learn")) + '</a><a class="btn" href="#/community">' + esc(t("bo_talk")) + "</a></div>";
    root.querySelector("#boLoad").addEventListener("click", function () {
      if (!navigator.onLine) { root.querySelector("#boBox .es-small").textContent = t("bo_fail"); return; }
      var box = root.querySelector("#boBox"), theme = dark ? "dark" : "light";
      box.innerHTML = '<h2 class="tr-h2">' + esc(t("bo_ov")) + "</h2>";
      box.appendChild(tvFrame("market-overview", { colorTheme: theme, dateRange: "1D", showChart: true, locale: loc, width: "100%", height: "100%", isTransparent: true, showSymbolLogo: true }, 520));
      var h = document.createElement("h2"); h.className = "tr-h2"; h.textContent = t("bo_chart"); box.appendChild(h);
      box.appendChild(tvFrame("advanced-chart", { autosize: true, symbol: "NASDAQ:AAPL", interval: "D", timezone: "Etc/UTC", theme: theme, style: "1", locale: loc, allow_symbol_change: true, hide_side_toolbar: true, support_host: "https://www.tradingview.com" }, 460));
    });
  }

  // Codes pays ISO 3166-1 ; le nom s'affiche dans la langue de l'interface (Intl.DisplayNames).
  var ISO = ("AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ " +
    "DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH " +
    "KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM " +
    "PA PE PG PH PK PL PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ " +
    "UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW").split(" ");
  var EU = "AT BE BG CY CZ DE DK EE ES FI FR GR HR HU IE IT LT LU LV MT NL PL PT RE RO SE SI SK".split(" ");
  function ccName(cc) { try { return new Intl.DisplayNames([ui], { type: "region" }).of(cc) || cc; } catch (e) { return cc; } }
  function rules(root, cc) {
    cc = String(cc || "").toUpperCase();
    if (ISO.indexOf(cc) === -1) { try { cc = String((navigator.language || "").split("-")[1] || "").toUpperCase(); } catch (e) { cc = ""; } }
    if (ISO.indexOf(cc) === -1) cc = "";
    function link(k, url) { var s = t(k), i = s.indexOf(":"); return '<a class="tr-row es-cu-link" href="' + url + '" target="_blank" rel="noopener"><b>' + esc(i > 0 ? s.slice(0, i).trim() : s) + "</b><span>" + esc(i > 0 ? s.slice(i + 1).trim() : "") + "</span></a>"; }
    var names = ISO.map(function (c) { return [c, ccName(c)]; }).sort(function (a, b) { return a[1].localeCompare(b[1], ui); });
    root.innerHTML = '<a class="tr-back" href="#/business">' + esc(t("back_b")) + "</a>" +
      '<div class="tr-head es-head"><div><h1 id="h-es">' + esc(t("rg_t")) + '</h1><p class="muted">' + esc(t("rg_sub")) + "</p></div></div>" +
      '<label class="tr-field">' + esc(t("rg_cc")) + '<select id="rgCc"><option value="">' + esc(t("rg_pick")) + "</option>" +
      names.map(function (n) { return '<option value="' + n[0] + '"' + (n[0] === cc ? " selected" : "") + ">" + esc(n[1]) + "</option>"; }).join("") + "</select></label>" +
      (cc ? '<h2 class="tr-h2 es-rg-cc">' + esc(ccName(cc)) + "</h2>" +
        '<div class="card"><h2 class="tr-h2">' + esc(t("rg_trade")) + "</h2>" + link("rg_g1", "https://globaltradehelpdesk.org/") + link("rg_g2", "https://www.macmap.org/") + link("rg_g3", "https://www.epingalert.org/") + "</div>" +
        (EU.indexOf(cc) !== -1 ? '<div class="card es-rg-eu"><h2 class="tr-h2">' + esc(t("rg_eu")) + "</h2>" + link("rg_e1", "https://trade.ec.europa.eu/access-to-markets/fr/home") + link("rg_e2", "https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp") + "</div>" : "") +
        '<div class="card"><h2 class="tr-h2">' + esc(t("rg_biz")) + "</h2>" + link("rg_b1", "https://www.worldbank.org/en/businessready") + "</div>" +
        '<div class="card"><h2 class="tr-h2">' + esc(t("rg_inv")) + "</h2>" + link("rg_i1", "https://www.iosco.org/i-scan/") + "</div>" +
        '<div class="es-row"><a class="btn primary" href="#/community">' + esc(t("rg_ask")) + '</a><a class="btn" href="#/everywhere/papier">' + esc(t("rg_read")) + "</a></div>" +
        '<p class="muted es-small">' + esc(t("rg_note")) + "</p>" : "");
    root.querySelector("#rgCc").addEventListener("change", function (e) { location.hash = "#/business/regles" + (e.target.value ? "/" + e.target.value : ""); });
  }
  function sos(root, cc) {
    if (!cc) { try { cc = (navigator.language || "").split("-")[1]; } catch (e) { cc = ""; } cc = String(cc || "").toUpperCase(); }
    var c = SOS[cc];
    function num(label, n) { return n ? '<a class="es-sosnum" href="tel:' + esc(n) + '" aria-label="' + esc(t("call", { n: n })) + '"><b>' + esc(n) + "</b><span>" + esc(label) + "</span></a>" : ""; }
    root.innerHTML = '<div class="tr-head es-head"><div><h1 id="h-es">🆘 ' + esc(t("sos")) + '</h1><p class="muted">' + esc(t("sos_sub")) + "</p></div></div>" +
      '<label class="tr-field">' + esc(t("sos_country")) + '<select id="sosCc"><option value="">' + esc(t("sos_other")) + "</option>" +
      Object.keys(SOS).sort(function (a, b) { return SOS[a].n.localeCompare(SOS[b].n); }).map(function (k) { return '<option value="' + k + '"' + (k === cc ? " selected" : "") + ">" + esc(SOS[k].n) + "</option>"; }).join("") + "</select></label>" +
      '<div class="card es-sos">' + (c
        ? num(t("sos_general"), c.g) + (c.p && c.p !== c.g ? num(t("sos_police"), c.p) : "") + (c.a && c.a !== c.g ? num(t("sos_amb"), c.a) : "") + (c.f && c.f !== c.g ? num(t("sos_fire"), c.f) : "") +
          num(t("sos_women"), c.w) + (c.s ? '<a class="es-sosnum" href="sms:' + esc(c.s) + '"><b>' + esc(c.s) + "</b><span>" + esc(t("sos_deaf")) + "</span></a>" : "")
        : num(t("sos_general"), "112") + '<p class="muted">' + esc(t("sos_112")) + "</p>") + "</div>" +
      '<div class="card"><h2 class="tr-h2">' + esc(t("sos_phr")) + '</h2><p class="muted">' + esc(t("sos_phr_sub")) + "</p>" +
      '<label class="tr-field">' + esc(t("sos_tr_lang")) + '<select id="sosLang"></select></label><div id="sosPhr" class="es-list"></div><p class="muted es-small" id="sosMsg"></p></div>';
    root.querySelector("#sosCc").addEventListener("change", function (e) { sos(root, e.target.value || "ZZ"); });
    var sel = root.querySelector("#sosLang"), langs = (window.EWMoteur && window.EWMoteur.langs) || [];
    var target = (c && c.l) || "en";
    sel.innerHTML = langs.map(function (l) { return '<option value="' + esc(l.code) + '"' + (l.code === target ? " selected" : "") + ">" + esc((l.flag ? l.flag + " " : "") + l.name) + "</option>"; }).join("") || '<option value="en">English</option>';
    function phrases() {
      var to = sel.value, box = root.querySelector("#sosPhr"), tok = cur.token, msg = root.querySelector("#sosMsg");
      msg.textContent = "";
      box.innerHTML = ["sp1", "sp2", "sp3", "sp4", "sp5", "sp6", "-", "hp1", "hp2", "hp3", "hp4", "hp5", "hp6"].map(function (k) {
        if (k === "-") return '<h3 class="tr-h2 es-sosmed">' + esc(t("sos_med")) + '</h3><p class="muted es-small">' + esc(t("sos_med_sub")) + "</p>";
        return '<div class="es-sosph" data-k="' + k + '"><b dir="auto" class="es-sosbig">' + esc(t(k)) + '</b><small class="muted">' + esc(t(k)) + '</small><span class="es-row"><button type="button" class="btn es-say">' + esc(t("speak")) + "</button></span></div>";
      }).join("");
      box.querySelectorAll(".es-sosph").forEach(function (el) {
        var src = t(el.getAttribute("data-k")), big = el.querySelector(".es-sosbig");
        var from = STR[ui] || (window.EW_SCREEN_STR && window.EW_SCREEN_STR.espaces && window.EW_SCREEN_STR.espaces[ui] && window.EW_SCREEN_STR.espaces[ui][el.getAttribute("data-k")]) ? ui : "en";
        (base(from) === base(to) || !window.EWMoteur ? Promise.resolve(src) : window.EWMoteur.translate(src, base(from), base(to))).then(function (out) {
          if (!cur || cur.token !== tok) return;
          big.textContent = out;
        }).catch(function () { if (cur && cur.token === tok) msg.textContent = t("sos_offline"); });
        el.querySelector(".es-say").addEventListener("click", function () { if (window.EWMoteur) window.EWMoteur.speak(big.textContent, to, 1); });
      });
    }
    sel.addEventListener("change", phrases);
    phrases();
  }

  // ---------- Entrée ----------
  function leave() {
    if (!cur) return;
    stopLive();
    if (cur.poll) clearInterval(cur.poll);
    try { if (cur.rt && cur.c) cur.c.removeChannel(cur.rt); } catch (e) { /* ignoré */ }
    try { if (cur.sig && cur.c) cur.c.removeChannel(cur.sig); } catch (e) { /* ignoré */ }
    cur.token = -1;
    cur = null;
  }
  function show(root, parts, uiLang) {
    leave();
    ui = uiLang || "fr";
    cur = { token: Date.now() + Math.random() };
    var kind = parts[0], sub = parts[1];
    if (!myLang) myLang = ui;
    if (kind === "community" || kind === "live") { if (sub) room(root, kind, sub); else roomsList(root, kind); }
    else if (kind === "business" || kind === "entraide") { if (sub === "new") businessNew(root, kind === "entraide"); else if (sub === "douane" && kind === "business") customs(root); else if (sub === "regles" && kind === "business") rules(root, parts[2]); else if (sub === "argent" && kind === "business") money(root); else if (sub === "dropshipping" && kind === "business") dropship(root); else if (sub === "bourse" && kind === "business") bourse(root); else business(root, sub && sub.indexOf("f-") === 0 && BIZ.indexOf(sub.slice(2)) !== -1 ? sub.slice(2) : null, kind === "entraide"); }
    else if (kind === "sos") sos(root);
    else avantages(root);
    return t(kind);
  }
  window.EWEspaces = { show: show, leave: leave, _str: STR };
})();

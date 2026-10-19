/* 24/24 Talk — notifications d'appel quand l'appli est fermée. © 2026 Sébastien Chevrier. Tous droits réservés.
   Ce fichier ne garde rien en mémoire et ne touche pas au fonctionnement de l'appli : il affiche seulement
   « @pseudo vous appelle » quand un contact appelle, et ouvre 24/24 Talk quand on touche la notification. */
var TXT = {
  fr: ["vous appelle", "Touchez pour répondre", "Appel manqué"],
  en: ["is calling you", "Tap to answer", "Missed call"],
  es: ["te está llamando", "Toca para responder", "Llamada perdida"],
  pt: ["está a ligar-lhe", "Toque para atender", "Chamada perdida"],
  de: ["ruft dich an", "Tippen zum Annehmen", "Verpasster Anruf"],
  it: ["ti sta chiamando", "Tocca per rispondere", "Chiamata persa"],
  zh: ["正在呼叫你", "点击接听", "未接来电"],
  ja: ["から着信", "タップして応答", "不在着信"],
  ar: ["يتصل بك", "المس للرد", "مكالمة فائتة"],
  ru: ["звонит вам", "Нажмите, чтобы ответить", "Пропущенный звонок"],
  mg: ["miantso anao", "Tsindrio raha hamaly", "Antso tsy voaray"],
};
function txt() {
  var l = String((self.navigator && self.navigator.language) || "en").slice(0, 2).toLowerCase();
  return TXT[l] || TXT.en;
}

self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = {}; }
  var s = txt();
  var call = String(d.call || "").replace(/[^a-z0-9]/g, "").slice(0, 40);
  var who = d.p ? "@" + String(d.p).slice(0, 20) : "24/24 ONE WORLD";
  var tag = "call-" + call;
  var scope = self.registration.scope;
  if (d.t === "cancel") {
    e.waitUntil(
      self.registration.getNotifications({ tag: tag }).then(function (ns) {
        ns.forEach(function (n) { n.close(); });
        return self.registration.showNotification("📞 " + who, {
          body: s[2], tag: tag, icon: "icon-192.png", badge: "badge-72.png", data: { url: scope },
        });
      })
    );
    return;
  }
  e.waitUntil(
    self.registration.showNotification("📞 " + who + " " + s[0], {
      body: s[1],
      tag: tag,
      renotify: true,
      requireInteraction: true,
      vibrate: [600, 300, 600, 300, 600, 300, 600],
      icon: "icon-192.png",
      badge: "badge-72.png",
      data: { url: scope + "?appel=" + call, call: call },
    })
  );
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var data = e.notification.data || {};
  var scope = self.registration.scope;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
      // TALK peut être ouvert seul ou dans le portail 24/24 EVERYWHERE (dans un cadre) : on prévient toutes ses
      // fenêtres, et on met au premier plan la fenêtre principale (pas le cadre).
      var mine = cs.filter(function (c) { return c.url.indexOf(scope) === 0 && c.url.indexOf("/gestion/") < 0; });
      if (!mine.length) return self.clients.openWindow(data.url || scope);
      mine.forEach(function (c) { if (data.call) c.postMessage({ t: "answer", call: data.call }); });
      var top = mine.filter(function (c) { return c.frameType !== "nested" && "focus" in c; })[0] || mine[0];
      return "focus" in top ? top.focus() : undefined;
    })
  );
});

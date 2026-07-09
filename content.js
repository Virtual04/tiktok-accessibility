/*
 * TikTok Akadálymentesítő – tartalom-szkript
 *
 * Fut minden tiktok.com oldalon. Három dolgot csinál:
 *  1. Billentyűparancsok (némítás, hangerő, navigáció, like, kommentek, infó).
 *     Minden parancs egyetlen betű (NVDA fókusz módban), illetve ugyanaz
 *     Alt+Shift-tel böngészőmódból is.
 *  2. Élő régió (aria-live), amin keresztül az NVDA bejelenti a történéseket,
 *     és automatikusan felolvassa az új videó szerzőjét/leírását görgetéskor.
 *  3. Felcímkézi a TikTok címkézetlen ikongombjait (like, komment, megosztás…),
 *     és kikényszeríti a beállított hangerőt/némítást minden videón.
 */
(() => {
  'use strict';

  if (window.__ttA11yLoaded) return;
  window.__ttA11yLoaded = true;

  const ext = typeof browser !== 'undefined' ? browser : chrome;

  // ---------------------------------------------------------------------
  // Beállítások (chrome.storage.local-ban tárolva, munkamenetek közt megmarad)
  // ---------------------------------------------------------------------
  const DEFAULTS = { volume: 0.8, muted: false, autoAnnounce: true };
  let settings = { ...DEFAULTS };

  async function loadSettings() {
    try {
      const stored = await ext.storage.local.get(DEFAULTS);
      settings = { ...DEFAULTS, ...stored };
    } catch (e) {
      /* storage nélkül is működünk, csak nem marad meg a beállítás */
    }
  }

  function saveSettings() {
    try {
      ext.storage.local.set(settings);
    } catch (e) { /* lásd fent */ }
  }

  // ---------------------------------------------------------------------
  // Élő régiók a képernyőolvasós bejelentésekhez
  // ---------------------------------------------------------------------
  let politeRegion = null;
  let assertiveRegion = null;

  function makeRegion(level) {
    const div = document.createElement('div');
    div.setAttribute('aria-live', level);
    div.setAttribute('aria-atomic', 'true');
    // Vizuálisan rejtett, de a képernyőolvasó számára létező elem
    div.style.cssText =
      'position:fixed;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;' +
      'clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;';
    document.body.appendChild(div);
    return div;
  }

  function ensureRegions() {
    if (!politeRegion || !politeRegion.isConnected) politeRegion = makeRegion('polite');
    if (!assertiveRegion || !assertiveRegion.isConnected) assertiveRegion = makeRegion('assertive');
  }

  function announce(message, assertive = false) {
    ensureRegions();
    const region = assertive ? assertiveRegion : politeRegion;
    // Ürítés + késleltetett beírás, hogy azonos szöveg is újra elhangozzon
    region.textContent = '';
    setTimeout(() => { region.textContent = message; }, 60);
  }

  // ---------------------------------------------------------------------
  // Az aktív (képernyőn lévő / éppen játszott) videó megtalálása
  // ---------------------------------------------------------------------
  function getActiveVideo() {
    let best = null;
    let bestScore = -1;
    for (const v of document.querySelectorAll('video')) {
      const r = v.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const visible = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
      if (visible <= 0) continue;
      let score = visible;
      if (!v.paused && !v.ended) score += 100000; // a játszó videó mindent visz
      if (score > bestScore) { bestScore = score; best = v; }
    }
    return best;
  }

  function getContainer(video) {
    if (!video) return null;
    return (
      video.closest('article') ||
      video.closest('[data-e2e="recommend-list-item-container"]') ||
      video.closest('[data-e2e="feed-video"]') ||
      video.closest('div[class*="DivItemContainer"]') ||
      video.parentElement
    );
  }

  // A TikTok data-e2e attribútumai – ha a felület változik, itt kell bővíteni.
  const SEL = {
    author: '[data-e2e="video-author-uniqueid"], [data-e2e="browse-username"], [data-e2e="browser-nickname"]',
    desc: '[data-e2e="video-desc"], [data-e2e="browse-video-desc"], [data-e2e="new-desc-span"]',
    music: '[data-e2e="video-music"], [data-e2e="browse-music"]',
    likeBtn: '[data-e2e="like-icon"], [data-e2e="browse-like-icon"]',
    likeCount: '[data-e2e="like-count"], [data-e2e="browse-like-count"]',
    commentBtn: '[data-e2e="comment-icon"], [data-e2e="browse-comment-icon"]',
    commentCount: '[data-e2e="comment-count"], [data-e2e="browse-comment-count"]',
    shareBtn: '[data-e2e="share-icon"], [data-e2e="browse-share-icon"]',
    favBtn: '[data-e2e="favorite-icon"], [data-e2e="undefined-icon"]',
    commentPanel: '[data-e2e="comment-list"], [class*="DivCommentListContainer"], [class*="DivCommentContainer"]',
    commentInput: '[data-e2e="comment-input"], [class*="DivCommentInputContainer"], [class*="CommentInput"]',
    closeBtn: '[data-e2e="comment-close"], [data-e2e="browse-close"], [class*="CloseIcon"], button[aria-label*="close" i], button[aria-label*="bezár" i]',
  };

  function textOf(scope, selector) {
    const el = scope && scope.querySelector(selector);
    return el ? el.textContent.trim() : '';
  }

  // A szerző neve: előbb a TikTok saját jelölése, ha az nincs, akkor a
  // konténeren belüli első profillinkből ("/@felhasznalonev") olvassuk ki.
  function getAuthor(scope) {
    const direct = textOf(scope, SEL.author) || textOf(document, SEL.author);
    if (direct) return direct;
    const link = (scope || document).querySelector('a[href^="/@"], a[href*="tiktok.com/@"]');
    if (link) {
      const text = link.textContent.trim();
      if (text) return text;
      const m = (link.getAttribute('href') || '').match(/@([^/?#]+)/);
      if (m) return '@' + m[1];
    }
    return '';
  }

  function getInfo(container) {
    const scope = container || document;
    return {
      author: getAuthor(scope),
      desc: textOf(scope, SEL.desc) || textOf(document, SEL.desc),
      music: textOf(scope, SEL.music),
      likes: textOf(scope, SEL.likeCount),
      comments: textOf(scope, SEL.commentCount),
    };
  }

  function shortInfo(container) {
    const i = getInfo(container);
    const parts = [];
    if (i.author) parts.push(i.author);
    if (i.desc) parts.push(i.desc);
    return parts.length ? parts.join('. ') : 'Új videó, adatok nem találhatók.';
  }

  function detailedInfo(container) {
    const i = getInfo(container);
    const parts = [];
    parts.push(i.author ? 'Szerző: ' + i.author : 'Szerző ismeretlen');
    if (i.desc) parts.push('Leírás: ' + i.desc);
    if (i.music) parts.push('Zene: ' + i.music);
    if (i.likes) parts.push('Kedvelések: ' + i.likes);
    if (i.comments) parts.push('Kommentek: ' + i.comments);
    const v = getActiveVideo();
    if (v) {
      parts.push(v.paused ? 'Szüneteltetve' : 'Lejátszás alatt');
      parts.push(settings.muted ? 'Némítva' : 'Hangerő ' + Math.round(settings.volume * 100) + ' százalék');
    }
    return parts.join('. ');
  }

  // ---------------------------------------------------------------------
  // Hangvezérlés – a TikTok saját (hozzáférhetetlen) hangerőgombja helyett
  // közvetlenül a <video> elemet állítjuk, és minden új videón kikényszerítjük.
  // ---------------------------------------------------------------------
  function applyAudio(video) {
    if (!video) return;
    try {
      if (video.muted !== settings.muted) video.muted = settings.muted;
      if (Math.abs(video.volume - settings.volume) > 0.01) video.volume = settings.volume;
    } catch (e) { /* pl. eltávolított elem */ }
  }

  document.addEventListener('play', (e) => {
    if (e.target && e.target.tagName === 'VIDEO') applyAudio(e.target);
  }, true);

  function toggleMute() {
    settings.muted = !settings.muted;
    applyAudio(getActiveVideo());
    saveSettings();
    announce(
      settings.muted
        ? 'Némítva'
        : 'Hang bekapcsolva, hangerő ' + Math.round(settings.volume * 100) + ' százalék',
      true
    );
  }

  function changeVolume(delta) {
    settings.volume = Math.min(1, Math.max(0, Math.round((settings.volume + delta) * 10) / 10));
    if (delta > 0 && settings.muted) settings.muted = false; // hangosítás némításból = feloldás
    applyAudio(getActiveVideo());
    saveSettings();
    announce(
      'Hangerő ' + Math.round(settings.volume * 100) + ' százalék' + (settings.muted ? ', némítva' : ''),
      true
    );
  }

  function playPause() {
    const v = getActiveVideo();
    if (!v) { announce('Nem található videó', true); return; }
    if (v.paused) {
      applyAudio(v);
      v.play().catch(() => {});
      announce('Lejátszás', true);
    } else {
      v.pause();
      announce('Szünet', true);
    }
  }

  // ---------------------------------------------------------------------
  // Navigáció a videók között
  // ---------------------------------------------------------------------
  function getFeedContainers() {
    let items = [...document.querySelectorAll('[data-e2e="recommend-list-item-container"]')];
    if (items.length < 2) items = [...document.querySelectorAll('article')];
    return items;
  }

  function nextVideo(direction) {
    const current = getContainer(getActiveVideo());
    const items = getFeedContainers();
    const idx = items.indexOf(current);
    const target = idx >= 0 ? items[idx + direction] : null;

    if (target) {
      target.scrollIntoView({ behavior: 'auto', block: 'center' });
    } else {
      // Tartalék: a TikTok saját nyílbillentyű-kezelését hívjuk meg
      const key = direction > 0 ? 'ArrowDown' : 'ArrowUp';
      document.body.dispatchEvent(new KeyboardEvent('keydown', {
        key, code: key, keyCode: direction > 0 ? 40 : 38, bubbles: true, cancelable: true,
      }));
    }

    // Az automatikus figyelő úgyis bejelenti az új videót; itt csak jelzünk,
    // ha nem sikerült elmozdulni.
    setTimeout(() => {
      const after = getContainer(getActiveVideo());
      if (after === current) {
        announce(direction > 0 ? 'Nincs következő videó' : 'Nincs előző videó', true);
      } else if (!settings.autoAnnounce) {
        announce(shortInfo(after));
      }
    }, 700);
  }

  // ---------------------------------------------------------------------
  // Interakciók: like, kommentek
  // ---------------------------------------------------------------------
  function clickable(el) {
    return el ? (el.closest('button') || el) : null;
  }

  function likeCurrent() {
    const container = getContainer(getActiveVideo()) || document;
    const btn = clickable(container.querySelector(SEL.likeBtn) || document.querySelector(SEL.likeBtn));
    if (!btn) { announce('Kedvelés gomb nem található', true); return; }
    const wasPressed = btn.getAttribute('aria-pressed');
    btn.click();
    setTimeout(() => {
      const nowPressed = btn.getAttribute('aria-pressed');
      if (nowPressed !== null && nowPressed !== wasPressed) {
        announce(nowPressed === 'true' ? 'Kedvelve' : 'Kedvelés visszavonva', true);
      } else {
        announce('Kedvelés átváltva', true);
      }
    }, 400);
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function findCommentPanel() {
    const matches = [...document.querySelectorAll(SEL.commentPanel)].filter(isVisible);
    if (!matches.length) return null;
    // A legkülső találatot adjuk vissza, hogy a lista ÉS a szerkesztőmező is beleférjen
    let panel = matches[0];
    for (const el of matches) {
      if (el.contains(panel)) panel = el;
    }
    return panel;
  }

  // Ha a kommentíró mező a megtalált panelen kívül van, feljebb lépünk a
  // DOM-ban addig, amíg mindkettő belefér – de csak amíg a hírfolyam nem,
  // különben a csapda értelmét vesztené.
  function expandPanelToIncludeInput(panel) {
    const input = document.querySelector(SEL.commentInput);
    if (!input || !isVisible(input) || panel.contains(input)) return panel;
    const feedItem = getContainer(getActiveVideo());
    let root = panel;
    while (root.parentElement && root.parentElement !== document.body) {
      root = root.parentElement;
      if (feedItem && root.contains(feedItem)) return panel;
      if (root.contains(input)) return root;
    }
    return panel;
  }

  // Amíg a kommentpanel nyitva van, a rajta kívüli tartalmat aria-hidden-nel
  // elrejtjük (mint egy párbeszédablaknál) – így az NVDA olvasókurzora nem tud
  // kiszaladni a panelből, és nem ugrik el a fókusz az aktuális videóról.
  let commentTrap = null; // { panel, probe, hidden: [elem...], toggleBtn }

  function trapComments(listPanel, toggleBtn) {
    const panel = expandPanelToIncludeInput(listPanel);
    const hidden = [];
    let node = panel;
    while (node && node.parentElement) {
      for (const sib of node.parentElement.children) {
        if (sib === node) continue;
        if (sib === politeRegion || sib === assertiveRegion) continue;
        const tag = sib.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK') continue;
        if (sib.getAttribute('aria-hidden') === 'true') continue;
        sib.setAttribute('aria-hidden', 'true');
        hidden.push(sib);
      }
      if (node.parentElement === document.body) break;
      node = node.parentElement;
    }
    if (!panel.getAttribute('aria-label')) panel.setAttribute('aria-label', 'Kommentek');
    if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
    try { panel.focus({ preventScroll: true }); } catch (e) { /* nem kritikus */ }
    // A "probe" a kommentlista maga: az eltűnése jelzi, hogy a panelt bezárták,
    // akkor is, ha a kibővített gyökérelem (panel) megmaradna a DOM-ban.
    commentTrap = { panel, probe: listPanel, hidden, toggleBtn };
  }

  function releaseCommentTrap() {
    if (!commentTrap) return;
    for (const el of commentTrap.hidden) {
      if (el.isConnected) el.removeAttribute('aria-hidden');
    }
    commentTrap = null;
  }

  function toggleComments() {
    if (commentTrap || findCommentPanel()) {
      closeComments();
    } else {
      openComments();
    }
  }

  function openComments() {
    const container = getContainer(getActiveVideo()) || document;
    const btn = clickable(container.querySelector(SEL.commentBtn) || document.querySelector(SEL.commentBtn));
    if (!btn) { announce('Komment gomb nem található', true); return; }
    btn.click();
    setTimeout(() => {
      const panel = findCommentPanel();
      if (panel) {
        trapComments(panel, btn);
        announce('Kommentek megnyitva, az olvasás a panelen belül marad. A szerkesztőmező a panel végén van. Bezárás: C.', true);
      } else {
        announce('Kommentek megnyitva', true);
      }
    }, 600);
  }

  function closeComments() {
    const toggleBtn = commentTrap && commentTrap.toggleBtn;
    releaseCommentTrap();

    // Elsőnek a panel saját bezárógombja, utána a komment gomb, ami váltóként
    // is működik (ugyanaz nyit és zár).
    const close = document.querySelector(SEL.closeBtn);
    if (close && isVisible(close)) {
      clickable(close).click();
    } else if (toggleBtn && toggleBtn.isConnected) {
      toggleBtn.click();
    } else {
      const btn = clickable(document.querySelector(SEL.commentBtn));
      if (btn) btn.click();
    }

    setTimeout(() => {
      if (findCommentPanel()) {
        announce('A kommentpanelt nem sikerült bezárni', true);
      } else {
        announce('Kommentek bezárva', true);
      }
    }, 500);
  }

  function toggleAutoAnnounce() {
    settings.autoAnnounce = !settings.autoAnnounce;
    saveSettings();
    announce(
      settings.autoAnnounce
        ? 'Automatikus videóbejelentés bekapcsolva'
        : 'Automatikus videóbejelentés kikapcsolva',
      true
    );
  }

  function help() {
    announce(
      'TikTok akadálymentesítő billentyűk: ' +
      'M némítás. Vessző halkítás, pont hangosítás. K lejátszás vagy szünet. ' +
      'N következő videó, P előző videó. L kedvelés. C kommentek megnyitása vagy bezárása. ' +
      'I aktuális videó részletes adatai. A automatikus bejelentés ki és be. H ez a súgó. ' +
      'Böngészőmódban ugyanezek Alt plusz Shift lenyomásával használhatók.'
    );
  }

  // ---------------------------------------------------------------------
  // Billentyűkezelés
  // ---------------------------------------------------------------------
  function isTypingTarget(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    const role = el.getAttribute && el.getAttribute('role');
    return role === 'textbox' || role === 'searchbox' || role === 'combobox';
  }

  const COMMANDS = {
    'm': toggleMute,
    ',': () => changeVolume(-0.1),
    '.': () => changeVolume(+0.1),
    'k': playPause,
    'n': () => nextVideo(1),
    'p': () => nextVideo(-1),
    'l': likeCurrent,
    'c': toggleComments,
    'i': () => announce(detailedInfo(getContainer(getActiveVideo()))),
    'a': toggleAutoAnnounce,
    'h': help,
  };

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) return;
    const withModifier = e.altKey && e.shiftKey;
    if (e.altKey && !e.shiftKey) return; // sima Alt kombókat békén hagyjuk

    const target = (e.composedPath && e.composedPath()[0]) || e.target;
    if (!withModifier && isTypingTarget(target)) return; // gépelés közben nem nyúlunk bele

    const command = COMMANDS[e.key.toLowerCase()];
    if (!command) return;

    e.preventDefault();
    e.stopPropagation();
    command();
  }, true);

  // ---------------------------------------------------------------------
  // Címkézetlen ikongombok felcímkézése
  // ---------------------------------------------------------------------
  const LABELS = [
    [SEL.likeBtn, 'Kedvelés'],
    [SEL.commentBtn, 'Kommentek'],
    [SEL.shareBtn, 'Megosztás'],
    [SEL.favBtn, 'Mentés a kedvencekhez'],
    ['[data-e2e="video-music"]', 'Zene'],
  ];

  function labelPass() {
    for (const [selector, label] of LABELS) {
      for (const el of document.querySelectorAll(selector)) {
        const btn = el.closest('button') || el;
        if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', label);
      }
    }
  }

  // ---------------------------------------------------------------------
  // Figyelő: új aktív videó bejelentése + hangbeállítás kikényszerítése
  // ---------------------------------------------------------------------
  let lastContainer = null;

  setInterval(() => {
    // Ha a kommentpanelt nem a C-vel zárták be (pl. egérrel), oldjuk fel a csapdát
    if (commentTrap && !isVisible(commentTrap.probe)) {
      releaseCommentTrap();
      announce('Kommentek bezárva');
    }

    const v = getActiveVideo();
    if (v) {
      applyAudio(v);
      const container = getContainer(v);
      if (container && container !== lastContainer) {
        lastContainer = container;
        // Nyitott kommentpanel mellett nem jelentünk be videóváltást,
        // hogy ne szakítsuk félbe az olvasást.
        if (settings.autoAnnounce && !commentTrap) announce(shortInfo(container));
      }
    }
    labelPass();
  }, 800);

  // ---------------------------------------------------------------------
  // Indulás
  // ---------------------------------------------------------------------
  loadSettings().then(() => {
    setTimeout(() => {
      announce('TikTok akadálymentesítő aktív. Súgó: H billentyű, böngészőmódban Alt plusz Shift plusz H.');
    }, 1500);
  });
})();

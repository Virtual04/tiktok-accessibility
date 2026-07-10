/*
 * TikTok Akadálymentesítő – tartalom-szkript
 * TikTok Accessibility – content script
 *
 * Fut minden tiktok.com oldalon. Három dolgot csinál:
 *  1. Billentyűparancsok (némítás, hangerő, navigáció, like, kommentek, infó).
 *     Minden parancs egyetlen betű (NVDA fókusz módban), illetve ugyanaz
 *     Alt+Shift-tel böngészőmódból is.
 *  2. Élő régió (aria-live), amin keresztül az NVDA bejelenti a történéseket,
 *     és automatikusan felolvassa az új videó szerzőjét/leírását görgetéskor.
 *  3. Felcímkézi a TikTok címkézetlen ikongombjait (like, komment, megosztás…),
 *     és kikényszeríti a beállított hangerőt/némítást minden videón.
 *
 * A felolvasott szövegek a böngésző felületi nyelvéhez igazodnak:
 * magyar böngészőben magyarul, minden más esetben angolul szólalnak meg.
 */
(() => {
  'use strict';

  if (window.__ttA11yLoaded) return;
  window.__ttA11yLoaded = true;

  const ext = typeof browser !== 'undefined' ? browser : chrome;

  // ---------------------------------------------------------------------
  // Nyelvi szótár / language dictionary
  // ---------------------------------------------------------------------
  const LANGS = {
    hu: {
      active: 'A TikTok akadálymentesítő elindult. A súgóhoz nyomd meg a H billentyűt, böngészőmódban az Alt plusz Shift plusz H-t.',
      muted: 'Némítva',
      mutedAction: 'Elnémítottad a videót',
      unmuted: 'Visszakapcsoltad a hangot, a hangerő {pct} százalék',
      volume: 'Hangerő: {pct} százalék',
      volumeMutedSuffix: ', a videó némítva van',
      noVideo: 'Nem találok videót az oldalon',
      play: 'Elindítottad a videót',
      pause: 'Megállítottad a videót',
      noNext: 'Ez az utolsó videó, nincs következő',
      noPrev: 'Ez az első videó, nincs előző',
      likeBtnMissing: 'Nem találom a kedvelés gombot',
      liked: 'Kedvelted a videót',
      unliked: 'Levetted a kedvelést a videóról',
      likeToggled: 'Megnyomtad a kedvelés gombot',
      favBtnMissing: 'Nem találom a kedvencek gombot',
      favAdded: 'Hozzáadtad a videót a kedvenceidhez',
      favRemoved: 'Eltávolítottad a videót a kedvenceid közül',
      favToggled: 'Megnyomtad a kedvencek gombot',
      followBtnMissing: 'Nem találom a követés gombot',
      followed: 'Bekövetted: {name}',
      unfollowed: 'Kikövetted: {name}',
      followToggled: 'Megnyomtad a követés gombot: {name}',
      nameFallback: 'ismeretlen felhasználó',
      linkCopied: 'A videó linkjét a vágólapra másoltam, beillesztheted bárhová',
      linkCopyFailed: 'Nem sikerült a vágólapra másolni a linket',
      linkNotFound: 'Nem találom a videó linkjét',
      commentBtnMissing: 'Nem találom a komment gombot',
      commentsOpenTrap: 'Megnyitottad a kommenteket, az olvasás a panelen belül marad. A hozzászólásíró mező a panel végén van. Bezárás: C.',
      commentsOpen: 'Megnyitottad a kommenteket',
      commentsClosed: 'Bezártad a kommenteket',
      commentsCloseFailed: 'Nem sikerült bezárni a kommentpanelt',
      autoOn: 'Mostantól automatikusan bemondom az új videókat',
      autoOff: 'Kikapcsoltad az automatikus videóbemondást',
      help:
        'A TikTok akadálymentesítő billentyűi: ' +
        'M némítás be és ki. Vessző halkítás, pont hangosítás. K lejátszás vagy megállítás. ' +
        'N a következő videó, P az előző videó. L kedvelés. F hozzáadás a kedvencekhez. ' +
        'B a szerző bekövetése vagy kikövetése. S a videó linkjének másolása a vágólapra. ' +
        'C a kommentek megnyitása vagy bezárása. I az aktuális videó részletes adatai. ' +
        'A az automatikus videóbemondás ki- és bekapcsolása. H ez a súgó. ' +
        'Böngészőmódban ugyanezek az Alt plusz Shift lenyomásával használhatók.',
      authorPrefix: 'Szerző: ',
      authorUnknown: 'A szerzőt nem sikerült felismerni',
      descPrefix: 'Leírás: ',
      musicPrefix: 'Zene: ',
      likesPrefix: 'Kedvelések: ',
      commentsPrefix: 'Kommentek: ',
      statePlaying: 'A videó éppen megy',
      statePaused: 'A videó meg van állítva',
      newVideoNoData: 'Új videó következik, a részleteit nem sikerült felolvasni.',
      labelLike: 'Kedvelés',
      labelComments: 'Kommentek',
      labelShare: 'Megosztás',
      labelFavorite: 'Mentés a kedvencekhez',
      labelMusic: 'Zene',
    },
    en: {
      active: 'TikTok accessibility helper is running. For help, press H, or Alt plus Shift plus H in browse mode.',
      muted: 'Muted',
      mutedAction: 'You muted the video',
      unmuted: 'Sound is back on, volume {pct} percent',
      volume: 'Volume: {pct} percent',
      volumeMutedSuffix: ', the video is muted',
      noVideo: 'No video found on this page',
      play: 'Video playing',
      pause: 'Video paused',
      noNext: 'This is the last video, there is no next one',
      noPrev: 'This is the first video, there is no previous one',
      likeBtnMissing: 'Could not find the like button',
      liked: 'You liked this video',
      unliked: 'You removed your like from this video',
      likeToggled: 'You pressed the like button',
      favBtnMissing: 'Could not find the favorites button',
      favAdded: 'You added this video to your favorites',
      favRemoved: 'You removed this video from your favorites',
      favToggled: 'You pressed the favorites button',
      followBtnMissing: 'Could not find the follow button',
      followed: 'You are now following {name}',
      unfollowed: 'You unfollowed {name}',
      followToggled: 'You pressed the follow button for {name}',
      nameFallback: 'this user',
      linkCopied: 'Video link copied to the clipboard, you can paste it anywhere',
      linkCopyFailed: 'Could not copy the link to the clipboard',
      linkNotFound: 'Could not find the link of this video',
      commentBtnMissing: 'Could not find the comment button',
      commentsOpenTrap: 'Comments are open, reading stays inside the panel. The comment box is at the end of the panel. Close with C.',
      commentsOpen: 'Comments are open',
      commentsClosed: 'You closed the comments',
      commentsCloseFailed: 'Could not close the comment panel',
      autoOn: 'New videos will now be announced automatically',
      autoOff: 'You turned off automatic video announcements',
      help:
        'TikTok accessibility keys: ' +
        'M mute and unmute. Comma volume down, period volume up. K play or pause. ' +
        'N next video, P previous video. L like. F add to favorites. ' +
        'B follow or unfollow the author. S copy the video link to the clipboard. ' +
        'C open or close comments. I detailed info about the current video. ' +
        'A toggle automatic announcements. H this help. ' +
        'In browse mode use the same keys with Alt plus Shift.',
      authorPrefix: 'Author: ',
      authorUnknown: 'Could not identify the author',
      descPrefix: 'Description: ',
      musicPrefix: 'Music: ',
      likesPrefix: 'Likes: ',
      commentsPrefix: 'Comments: ',
      statePlaying: 'The video is playing',
      statePaused: 'The video is paused',
      newVideoNoData: 'New video, but its details could not be read.',
      labelLike: 'Like',
      labelComments: 'Comments',
      labelShare: 'Share',
      labelFavorite: 'Add to favorites',
      labelMusic: 'Music',
    },
  };

  // Automatikus nyelvválasztás: a böngésző nyelvi kódjához (pl. "vi-VN" -> "vi")
  // tartozó szótárat használjuk, ha létezik a LANGS-ban. Az angol a teljes alap,
  // amit a talált szótár bejegyzései felülírnak – így egy részleges fordítás is
  // működik, a hiányzó szövegek angolul szólalnak meg. Új nyelv hozzáadásához
  // elég egy új blokk a LANGS-ba, más kódot nem kell módosítani.
  const uiLang = (ext.i18n && ext.i18n.getUILanguage ? ext.i18n.getUILanguage() : navigator.language) || 'en';
  const langCode = uiLang.toLowerCase().split(/[-_]/)[0];
  const STR = { ...LANGS.en, ...(LANGS[langCode] || {}) };

  function fmt(template, values) {
    return template.replace(/\{(\w+)\}/g, (m, key) => (key in values ? values[key] : m));
  }

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
    followBtn: '[data-e2e="follow-button"], [data-e2e="feed-follow"], [data-e2e="browse-follow"]',
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
    return parts.length ? parts.join('. ') : STR.newVideoNoData;
  }

  function detailedInfo(container) {
    const i = getInfo(container);
    const parts = [];
    parts.push(i.author ? STR.authorPrefix + i.author : STR.authorUnknown);
    if (i.desc) parts.push(STR.descPrefix + i.desc);
    if (i.music) parts.push(STR.musicPrefix + i.music);
    if (i.likes) parts.push(STR.likesPrefix + i.likes);
    if (i.comments) parts.push(STR.commentsPrefix + i.comments);
    const v = getActiveVideo();
    if (v) {
      parts.push(v.paused ? STR.statePaused : STR.statePlaying);
      parts.push(settings.muted ? STR.muted : fmt(STR.volume, { pct: Math.round(settings.volume * 100) }));
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
        ? STR.mutedAction
        : fmt(STR.unmuted, { pct: Math.round(settings.volume * 100) }),
      true
    );
  }

  function changeVolume(delta) {
    settings.volume = Math.min(1, Math.max(0, Math.round((settings.volume + delta) * 10) / 10));
    if (delta > 0 && settings.muted) settings.muted = false; // hangosítás némításból = feloldás
    applyAudio(getActiveVideo());
    saveSettings();
    announce(
      fmt(STR.volume, { pct: Math.round(settings.volume * 100) }) + (settings.muted ? STR.volumeMutedSuffix : ''),
      true
    );
  }

  function playPause() {
    const v = getActiveVideo();
    if (!v) { announce(STR.noVideo, true); return; }
    if (v.paused) {
      applyAudio(v);
      v.play().catch(() => {});
      announce(STR.play, true);
    } else {
      v.pause();
      announce(STR.pause, true);
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

    // Az új videót az automatikus figyelő mondja be (ha be van kapcsolva);
    // itt csak azt jelezzük, ha nem sikerült elmozdulni.
    setTimeout(() => {
      const after = getContainer(getActiveVideo());
      if (after === current) {
        announce(direction > 0 ? STR.noNext : STR.noPrev, true);
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
    if (!btn) { announce(STR.likeBtnMissing, true); return; }
    const wasPressed = btn.getAttribute('aria-pressed');
    btn.click();
    setTimeout(() => {
      const nowPressed = btn.getAttribute('aria-pressed');
      if (nowPressed !== null && nowPressed !== wasPressed) {
        announce(nowPressed === 'true' ? STR.liked : STR.unliked, true);
      } else {
        announce(STR.likeToggled, true);
      }
    }, 400);
  }

  function favoriteCurrent() {
    const container = getContainer(getActiveVideo()) || document;
    const btn = clickable(container.querySelector(SEL.favBtn) || document.querySelector(SEL.favBtn));
    if (!btn) { announce(STR.favBtnMissing, true); return; }
    const wasPressed = btn.getAttribute('aria-pressed');
    btn.click();
    setTimeout(() => {
      const nowPressed = btn.getAttribute('aria-pressed');
      if (nowPressed !== null && nowPressed !== wasPressed) {
        announce(nowPressed === 'true' ? STR.favAdded : STR.favRemoved, true);
      } else {
        announce(STR.favToggled, true);
      }
    }, 400);
  }

  // A szerző bekövetése/kikövetése ugyanazzal a gombbal. Az állapotot a gomb
  // kattintás ELŐTTI feliratából állapítjuk meg (Follow/Követés = még nem
  // követed), mert a TikTok nem tesz rá aria-pressed attribútumot.
  const FOLLOW_WORDS = ['follow', 'követés', 'kövesd'];
  const FOLLOWING_WORDS = ['following', 'friends', 'követed', 'barátok'];

  function followCurrent() {
    const container = getContainer(getActiveVideo()) || document;
    const el = container.querySelector(SEL.followBtn) || document.querySelector(SEL.followBtn);
    const btn = clickable(el);
    if (!btn || !isVisible(btn)) { announce(STR.followBtnMissing, true); return; }
    const before = (btn.textContent || '').trim().toLowerCase();
    const name = getAuthor(container) || STR.nameFallback;
    btn.click();
    setTimeout(() => {
      if (FOLLOW_WORDS.includes(before)) {
        announce(fmt(STR.followed, { name }), true);
      } else if (FOLLOWING_WORDS.includes(before)) {
        announce(fmt(STR.unfollowed, { name }), true);
      } else {
        announce(fmt(STR.followToggled, { name }), true);
      }
    }, 400);
  }

  // ---------------------------------------------------------------------
  // A videó linkjének kimásolása a vágólapra
  // ---------------------------------------------------------------------
  function getVideoUrl(container) {
    // Videó saját oldalán maga a cím a link
    if (location.pathname.includes('/video/') || location.pathname.includes('/photo/')) {
      return location.href.split('?')[0];
    }
    const scope = container || document;
    // A hírfolyam-elemben lévő közvetlen videólink
    const direct = scope.querySelector('a[href*="/video/"], a[href*="/photo/"]');
    if (direct) {
      return new URL(direct.getAttribute('href'), location.origin).href.split('?')[0];
    }
    // Tartalék: a lejátszó-konténer azonosítójából (xgwrapper-...-VIDEÓAZONOSÍTÓ)
    // és a szerző nevéből rakjuk össze a szabványos linket
    const wrapper = scope.querySelector('[id*="xgwrapper"]');
    const idMatch = wrapper && wrapper.id.match(/(\d{8,})/);
    if (idMatch) {
      const author = getAuthor(scope).replace(/^@/, '');
      if (author) return location.origin + '/@' + author + '/video/' + idMatch[1];
    }
    return '';
  }

  async function copyCurrentLink() {
    const url = getVideoUrl(getContainer(getActiveVideo()));
    if (!url) { announce(STR.linkNotFound, true); return; }
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch (e) { /* jön a tartalék módszer */ }
    if (!ok) {
      const focused = document.activeElement;
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.cssText = 'position:fixed;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        ta.remove();
      } catch (e) { /* marad a hibaüzenet */ }
      if (focused && focused.focus) {
        try { focused.focus({ preventScroll: true }); } catch (e) { /* nem kritikus */ }
      }
    }
    announce(ok ? STR.linkCopied : STR.linkCopyFailed, true);
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
    if (!panel.getAttribute('aria-label')) panel.setAttribute('aria-label', STR.labelComments);
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
    if (!btn) { announce(STR.commentBtnMissing, true); return; }
    btn.click();
    setTimeout(() => {
      const panel = findCommentPanel();
      if (panel) {
        trapComments(panel, btn);
        announce(STR.commentsOpenTrap, true);
      } else {
        announce(STR.commentsOpen, true);
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
        announce(STR.commentsCloseFailed, true);
      } else {
        announce(STR.commentsClosed, true);
      }
    }, 500);
  }

  function toggleAutoAnnounce() {
    settings.autoAnnounce = !settings.autoAnnounce;
    saveSettings();
    announce(settings.autoAnnounce ? STR.autoOn : STR.autoOff, true);
  }

  function help() {
    announce(STR.help);
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
    'f': favoriteCurrent,
    'b': followCurrent,
    's': copyCurrentLink,
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
    [SEL.likeBtn, STR.labelLike],
    [SEL.commentBtn, STR.labelComments],
    [SEL.shareBtn, STR.labelShare],
    [SEL.favBtn, STR.labelFavorite],
    ['[data-e2e="video-music"]', STR.labelMusic],
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
      announce(STR.commentsClosed);
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
      announce(STR.active);
    }, 1500);
  });
})();

// ---------- কুরআন বাংলা — Service Worker ----------
// Strategy:
//  - App shell (html/css/js/icons)   -> cache-first, so the app opens instantly offline
//  - Quran text API (alquran.cloud)  -> network-first, falls back to cache when offline
//  - Reciter audio (islamic.network) -> cache-first; once an ayah is played it is
//                                       saved forever so it can be replayed with no data
//  - Google Fonts                    -> stale-while-revalidate
importScripts('./js/data.js');

// ---------- Prayer time push notifications (Firebase Cloud Messaging) ----------
// Handles notifications sent by the server-side script even when the app is
// closed. This does not affect any of the offline caching logic below.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
importScripts('./js/firebase-config.js');

firebase.initializeApp(FIREBASE_CONFIG);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'নামাজের সময়';
  const body = (payload.notification && payload.notification.body) || 'নামাজের জন্য প্রস্তুত হোন।';
  self.registration.showNotification(title, {
    body,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: (payload.data && payload.data.prayer) || 'prayer-notify'
  });
});

const KNOWN_CACHES = [SHELL_CACHE_NAME, API_CACHE_NAME, AUDIO_CACHE_NAME, FONT_CACHE_NAME];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => !KNOWN_CACHES.includes(n)).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// Allow the page to trigger an immediate activation after an update, and to
// ask the worker to pre-cache a batch of audio URLs (used by the "offline
// download" button so the whole surah gets saved, not just what's played).
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'CACHE_AUDIO' && Array.isArray(data.urls)) {
    event.waitUntil(cacheAudioBatch(data.urls, data.requestId));
  }
});

async function cacheAudioBatch(urls, requestId) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  let done = 0;
  for (const url of urls) {
    try {
      const existing = await cache.match(url);
      if (!existing) {
        const res = await fetch(url, { mode: 'no-cors', credentials: 'omit' });
        if (res) await cache.put(url, res.clone());
      }
    } catch (e) { /* skip failed ayah, continue with the rest */ }
    done++;
    broadcast({ type: 'CACHE_AUDIO_PROGRESS', requestId, done, total: urls.length });
  }
  broadcast({ type: 'CACHE_AUDIO_DONE', requestId, total: urls.length });
}

async function broadcast(msg) {
  const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
  clientsList.forEach((c) => c.postMessage(msg));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Full-page navigations: try the network, otherwise serve the cached shell
  // so the app still opens (to the last-known UI) with zero connectivity.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }


const isKnownAudioHost = url.href.startsWith(AUDIO_CDN) ||
    (typeof reciters !== 'undefined' && reciters.some(r => r.audioType === 'surah' && r.surahBase && url.href.startsWith(r.surahBase)));
  if (isKnownAudioHost) {
    event.respondWith(cacheFirstAudio(req));
    return;
  }

  if (url.href.startsWith(API)) {
    event.respondWith(networkFirst(req, API_CACHE_NAME));
    return;
  }

  if (url.href.startsWith(PRAYER_API)) {
    event.respondWith(networkFirst(req, API_CACHE_NAME));
    return;
  }

  if (url.href.startsWith(HADITH_API_BASE)) {
    event.respondWith(networkFirst(req, API_CACHE_NAME));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req, SHELL_CACHE_NAME));
    return;
  }

  // Third-party CDN scripts (font-awesome, the QR library, EmailJS, etc.)
  // — stale-while-revalidate so the first successful load is cached and
  // every later use (including fully offline) is instant, instead of only
  // covering cdnjs and leaving jsdelivr/unpkg to hit the network every time.
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com') ||
      url.hostname.endsWith('cdnjs.cloudflare.com') || url.hostname.endsWith('jsdelivr.net') ||
      url.hostname.endsWith('unpkg.com')) {
    event.respondWith(staleWhileRevalidate(req, FONT_CACHE_NAME));
    return;
  }
  // Anything else (unexpected third-party requests): just let it go to network.
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return cached || Response.error();
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw e;
  }
}

// Audio is stored keyed by its plain URL (no Range header) so that any later
// Range request for the same ayah is served — and byte-range-sliced — straight
// from the single cached copy by the browser's own Cache Storage implementation.
async function cacheFirstAudio(req) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    // IMPORTANT: do NOT force mode:'cors' here. The reciter CDN does not
    // reliably send Access-Control-Allow-Origin, so a cors-mode fetch fails
    // for every single request (every surah, every reciter) and we'd fall
    // into the catch below every time, which is exactly why playback used
    // to just hang on "loading" forever. no-cors matches how an <audio>
    // element would fetch it directly and returns a playable opaque
    // response even without CORS headers.
    const res = await fetch(req.url, { mode: 'no-cors', credentials: 'omit' });
    // Opaque (no-cors) responses always report status 0 / ok:false, so we
    // can't check res.ok — just cache whatever we got back.
    if (res) cache.put(req.url, res.clone());
    return res;
  } catch (e) {
    return new Response('', { status: 503, statusText: 'Offline - অডিও পাওয়া যায়নি' });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return cached || (await networkPromise) || Response.error();
}

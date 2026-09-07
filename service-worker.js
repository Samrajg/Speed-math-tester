/**
 * Service Worker — Speed Maths Tester
 * Strategy:
 *   - HTML:       Network first → cache fallback (always fresh shell)
 *   - JS / CSS:   Stale-while-revalidate (instant from cache, updates in background)
 *   - Icons:      Cache first (static assets, never change)
 */

const CACHE_VERSION = 'speed-maths-v3';

const PRECACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/modal.js',
    './js/sounds.js',
    './js/achievements.js',
    './js/storage.js',
    './js/statistics.js',
    './js/questions.js',
    './js/app.js',
    './js/pwa.js',
    './manifest.json',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png'
];

// ── Install: pre-cache all critical assets ────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

// ── Activate: remove old caches ───────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// ── Fetch: tiered caching strategies ─────────────────────────────────────
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin requests
    if (url.origin !== location.origin) return;

    const ext = url.pathname.split('.').pop().toLowerCase();

    if (ext === 'png' || ext === 'jpg' || ext === 'svg' || ext === 'ico') {
        // Cache First — static icon assets
        event.respondWith(cacheFirst(request));
    } else if (ext === 'js' || ext === 'css') {
        // Stale-While-Revalidate — serve fast from cache, refresh in background
        event.respondWith(staleWhileRevalidate(request));
    } else {
        // Network First (HTML / manifest) — always try to get fresh content
        event.respondWith(networkFirst(request));
    }
});

// ── Strategy implementations ──────────────────────────────────────────────
async function cacheFirst(request) {
    const cached = await caches.match(request);
    return cached || fetch(request);
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return caches.match(request);
    }
}

async function staleWhileRevalidate(request) {
    const cache  = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone());
        return response;
    }).catch(() => null);

    return cached || fetchPromise;
}

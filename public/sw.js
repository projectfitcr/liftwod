/* LIFTwod service worker — deliberately small (see CLAUDE.md).
 * Personalized navigations are never cached so one member's data cannot be
 * shown to another member on a shared device. Static assets remain available
 * and offline navigations land on the neutral offline page.
 * Bump VERSION when changing caching behaviour. */
const VERSION = "v2";
const STATIC_CACHE = `liftwod-static-${VERSION}`;
const PAGES_CACHE = `liftwod-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("liftwod-") && !k.endsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Immutable build assets + fonts + icons: cache-first. This is what makes
  // a cached page actually hydrate offline.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Personalized pages are network-only. The fallback is deliberately generic
  // because cached HTML/RSC responses can contain another member's data.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
  // Everything else (API, RSC fetches): straight to the network.
});

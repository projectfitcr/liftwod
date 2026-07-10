/* LIFTwod service worker — deliberately small (see CLAUDE.md).
 * Offline scope is READ-ONLY: the last-seen Today / Schedule / WOD pages
 * render from cache; writes fail with the app's own bilingual messaging.
 * Bump VERSION when changing caching behaviour. */
const VERSION = "v1";
const STATIC_CACHE = `liftwod-static-${VERSION}`;
const PAGES_CACHE = `liftwod-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

// Navigations worth revisiting offline (prefix match).
const CACHEABLE_PAGES = ["/today", "/schedule", "/wod/", "/whiteboard", "/results"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
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
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
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
          })
      )
    );
    return;
  }

  // Page navigations: network-first with cached fallback, then /offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (
            res.ok &&
            CACHEABLE_PAGES.some((p) => url.pathname === p || url.pathname.startsWith(p))
          ) {
            const copy = res.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => {
          const hit = await caches.match(request);
          return hit || caches.match(OFFLINE_URL);
        })
    );
  }
  // Everything else (API, RSC fetches): straight to the network.
});

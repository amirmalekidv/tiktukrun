const CACHE_VERSION = 'tiktakrun-static-v1';
const STATIC_CACHE = CACHE_VERSION;

const STATIC_PATH_PREFIXES = ['/_next/static/', '/icons/', '/images/'];

const STATIC_EXACT_PATHS = ['/tiktakrun-logo.svg', '/placeholder-game.svg'];

const BLOCKED_PATH_PREFIXES = ['/api/', '/api-bridge/', '/socket.io/', '/_next/data/'];

const STATIC_FILE_EXTENSION = /\.(?:css|js|mjs|png|jpg|jpeg|svg|webp|avif|gif|ico|woff2?)$/i;

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('tiktakrun-') && cacheName !== STATIC_CACHE)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (!shouldHandleRequest(request)) {
    return;
  }

  event.respondWith(cacheStaticAsset(request));
});

function shouldHandleRequest(request) {
  if (request.method !== 'GET') return false;
  if (request.headers.has('authorization')) return false;
  if (request.headers.has('cookie')) return false;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (BLOCKED_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return false;
  if (request.mode === 'navigate') return false;

  return isSafeStaticAsset(url);
}

function isSafeStaticAsset(url) {
  return (
    STATIC_EXACT_PATHS.includes(url.pathname) ||
    STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ||
    (url.pathname.startsWith('/_next/') && STATIC_FILE_EXTENSION.test(url.pathname))
  );
}

async function cacheStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    refreshCachedAsset(cache, request);
    return cachedResponse;
  }

  const networkResponse = await fetch(request);

  if (isCacheableResponse(networkResponse)) {
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

function refreshCachedAsset(cache, request) {
  fetch(request)
    .then((response) => {
      if (isCacheableResponse(response)) {
        return cache.put(request, response);
      }
      return undefined;
    })
    .catch(() => undefined);
}

function isCacheableResponse(response) {
  return response && response.ok && response.type === 'basic';
}

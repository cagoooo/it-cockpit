// IT Cockpit Service Worker
// 策略：HTML network-first（永遠拿最新）、靜態資源 cache-first（offline 友善）
// 新版本部署時 bump CACHE_VERSION，舊快取會被自動清掉
const CACHE_VERSION = '2026-09-23-infographic-1600';
const HTML_CACHE = `it-cockpit-html-${CACHE_VERSION}`;
const ASSET_CACHE = `it-cockpit-asset-${CACHE_VERSION}`;
const GIFTED_CORE_CACHE = `it-cockpit-gifted-core-${CACHE_VERSION}`;
const GIFTED_MANIFEST = './gifted-ai-lab/offline-manifest.json';

// 安裝時不預先下載資優班離線教材：原本每次安裝（含每次改版）都會在背景抓整包教材，
// 跟正在開啟的頁面搶頻寬，連總入口與一般課程的訪客也會被迫下載。
// 改由資優班頁面在閒置時送出 CACHE_GIFTED_CORE（background），逐一補抓缺少的檔案。
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !k.endsWith(CACHE_VERSION))
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data && e.data.type === 'CACHE_GIFTED_CORE') e.waitUntil(cacheGiftedCore({ background: Boolean(e.data.background) }));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.origin !== self.location.origin) return;

  const accept = req.headers.get('accept') || '';
  if (url.pathname.endsWith('.mp4')) {
    e.respondWith(fetch(req).catch(() => new Response('', { status: 503, statusText: 'Video unavailable offline' })));
    return;
  }
  const isHtml = req.mode === 'navigate' ||
    accept.includes('text/html') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/');
  const isGiftedMutable = url.pathname.includes('/gifted-ai-lab/') && /\.(?:js|css|json)$/.test(url.pathname);

  if (isHtml || isGiftedMutable) {
    e.respondWith(networkFirst(req, HTML_CACHE));
  } else {
    e.respondWith(cacheFirst(req, ASSET_CACHE));
  }
});

async function networkFirst(req, cacheName) {
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    if (fresh && fresh.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    const requestUrl = new URL(req.url);
    if (requestUrl.pathname.includes('/gifted-ai-lab/')) {
      return (await caches.match(new URL('./gifted-ai-lab/offline.html', self.registration.scope).href)) || Response.error();
    }
    return (await caches.match(new URL('./index.html', self.registration.scope).href)) || Response.error();
  }
}

let giftedCoreJob = null;
function cacheGiftedCore(options = {}) {
  if (!giftedCoreJob) giftedCoreJob = runGiftedCoreCache(options).finally(() => { giftedCoreJob = null; });
  return giftedCoreJob;
}

// 一次只下載一個檔案，不和頁面搶頻寬。background：只補抓快取裡還沒有的；
// 教師手動按「下載離線教材」時則逐一向伺服器確認是否有新版。
async function runGiftedCoreCache({ background = false } = {}) {
  try {
    const manifestUrl = new URL(GIFTED_MANIFEST, self.registration.scope);
    const response = await fetch(manifestUrl, { cache: 'no-store' });
    if (!response.ok) return;
    const responseCopy = response.clone();
    const manifest = await response.json();
    const cache = await caches.open(GIFTED_CORE_CACHE);
    for (const asset of manifest.assets) {
      const url = new URL(asset, self.registration.scope).href;
      try {
        if (background && await cache.match(url)) continue;
        const fresh = await fetch(new Request(url, { cache: background ? 'default' : 'no-cache' }));
        if (fresh.ok) await cache.put(url, fresh);
      } catch {
        // 單一檔案失敗不影響其他教材
      }
    }
    await cache.put(manifestUrl.href, responseCopy);
  } catch {
    // Existing caches remain available when an update cannot be downloaded.
  }
}

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok && fresh.type === 'basic') {
      const cache = await caches.open(cacheName);
      cache.put(req, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    return Response.error();
  }
}

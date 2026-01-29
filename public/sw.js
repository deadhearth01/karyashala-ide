// Service Worker for offline caching of Pyodide and C compiler assets
const CACHE_NAME = 'wasm-compiler-v2';

// Pyodide CDN URL and files to cache
const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';
const PYODIDE_FILES = [
  'pyodide.js',
  'pyodide.asm.js', 
  'pyodide.asm.wasm',
  'pyodide_py.tar',
  'packages.json',
  'repodata.json',
];

// C compiler files (local) - these will be pre-cached
const C_COMPILER_FILES = [
  '/c-worker.js',
  '/browsercc/clang.js',
  '/browsercc/clang.wasm',
  '/browsercc/lld.js',
  '/browsercc/lld.wasm',
  '/browsercc/sysroot.tar',
  '/browsercc/index.js',
  '/browsercc/index-c.js',
  '/browsercc/browser_wasi_shim.js',
  '/browsercc/wasi.js',
  '/browsercc/wasi_defs.js',
  '/browsercc/fd.js',
  '/browsercc/fs_mem.js',
  '/browsercc/fs_opfs.js',
  '/browsercc/strace.js',
  '/browsercc/debug.js',
];

// Install event - pre-cache C compiler files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Pre-caching C compiler files...');
      
      // Cache C compiler files (these are local, should always work)
      for (const file of C_COMPILER_FILES) {
        try {
          await cache.add(file);
          console.log('[SW] Cached:', file);
        } catch (err) {
          console.warn('[SW] Failed to cache:', file, err);
        }
      }
      
      console.log('[SW] C compiler files cached');
    })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - cache-first for compiler assets, network-first for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle Pyodide CDN requests - cache-first
  if (url.href.startsWith(PYODIDE_CDN)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // Try cache first
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          console.log('[SW] Serving Pyodide from cache:', url.pathname);
          return cachedResponse;
        }
        
        // Try network and cache the response
        try {
          console.log('[SW] Fetching Pyodide from network:', url.pathname);
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.error('[SW] Pyodide fetch failed:', error);
          throw error;
        }
      })
    );
    return;
  }
  
  // Handle C compiler local files - cache-first
  if (url.pathname.startsWith('/browsercc/') || url.pathname === '/c-worker.js') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // Try cache first
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          console.log('[SW] Serving C compiler from cache:', url.pathname);
          return cachedResponse;
        }
        
        // Try network and cache
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.error('[SW] C compiler fetch failed:', url.pathname, error);
          throw error;
        }
      })
    );
    return;
  }
  
  // Handle Next.js static files and app routes - network-first with cache fallback
  if (url.pathname.startsWith('/_next/') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(async () => {
          // Try cache on network failure
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            const offlineResponse = await caches.match('/');
            if (offlineResponse) return offlineResponse;
          }
          throw new Error('Network failed and no cache available');
        })
    );
    return;
  }
  
  // Default: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        throw new Error('Network failed');
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_PYODIDE') {
    console.log('[SW] Starting Pyodide pre-caching...');
    event.waitUntil(preCachePyodide(event.source));
  }
  
  if (event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then((status) => {
      event.source.postMessage({ type: 'CACHE_STATUS', status });
    });
  }
  
  if (event.data.type === 'CACHE_ALL') {
    console.log('[SW] Caching all compiler assets...');
    event.waitUntil(cacheAllAssets(event.source));
  }
});

// Pre-cache Pyodide files
async function preCachePyodide(client) {
  const cache = await caches.open(CACHE_NAME);
  const totalFiles = PYODIDE_FILES.length;
  let cachedCount = 0;
  
  for (const file of PYODIDE_FILES) {
    const url = PYODIDE_CDN + file;
    try {
      const cachedResponse = await cache.match(url);
      if (!cachedResponse) {
        console.log('[SW] Pre-caching Pyodide:', file);
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      }
      cachedCount++;
      if (client) {
        client.postMessage({ 
          type: 'CACHE_PROGRESS', 
          progress: Math.round((cachedCount / totalFiles) * 100),
          file 
        });
      }
    } catch (error) {
      console.error('[SW] Failed to cache Pyodide:', file, error);
    }
  }
  
  if (client) {
    client.postMessage({ type: 'CACHE_COMPLETE' });
  }
}

// Cache all assets (C compiler + Pyodide)
async function cacheAllAssets(client) {
  const cache = await caches.open(CACHE_NAME);
  
  // Cache C compiler files
  for (const file of C_COMPILER_FILES) {
    try {
      const cached = await cache.match(file);
      if (!cached) {
        await cache.add(file);
      }
    } catch (err) {
      console.warn('[SW] Failed to cache C file:', file);
    }
  }
  
  // Cache Pyodide files
  await preCachePyodide(client);
}

// Get cache status
async function getCacheStatus() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  const pyodideCached = PYODIDE_FILES.filter(file => 
    keys.some(req => req.url.includes(file))
  ).length;
  
  const cCached = C_COMPILER_FILES.filter(file =>
    keys.some(req => req.url.includes(file))
  ).length;
  
  return {
    totalCached: keys.length,
    pyodideCached,
    pyodideTotal: PYODIDE_FILES.length,
    cCached,
    cTotal: C_COMPILER_FILES.length,
    isPyodideComplete: pyodideCached === PYODIDE_FILES.length,
    isCComplete: cCached === C_COMPILER_FILES.length,
    isComplete: pyodideCached === PYODIDE_FILES.length && cCached === C_COMPILER_FILES.length,
  };
}

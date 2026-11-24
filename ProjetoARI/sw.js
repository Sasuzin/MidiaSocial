/* =========================================================
   Bem Social — service worker (PWA)

   - Guarda os arquivos do app para ele abrir mesmo sem internet.
   - Arquivos do site: "rede primeiro". Com internet, sempre busca a
     versão mais nova (ex.: o que acabou de ser publicado no GitHub
     Pages) e atualiza a cópia guardada; sem internet, usa a cópia.
   - Fontes do Google: "cache primeiro", porque quase nunca mudam.
   ========================================================= */

const VERSION = 'v1';
const APP_CACHE = `bem-social-app-${VERSION}`;
const FONT_CACHE = 'bem-social-fontes';
const NETWORK_TIMEOUT = 4000;

const APP_SHELL = [
  './',
  './index.html',
  './form.html',
  './home.html',
  './manifest.json',
  './CSS/base.css',
  './CSS/form.css',
  './CSS/home.css',
  './JS/storage.js',
  './JS/ui.js',
  './JS/pwa.js',
  './JS/form.js',
  './JS/drawing.js',
  './JS/home.js',
  './Imagens/favicon.svg',
  './Imagens/icons/icon-192.png',
  './Imagens/icons/icon-512.png',
  './Imagens/icons/icon-maskable-512.png',
  './Imagens/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('bem-social-') && key !== APP_CACHE && key !== FONT_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
  }
});

/* ---------- Estratégias ---------- */

function fetchFresh(request) {
  // Revalida com o servidor (evita a cópia de até 10 min do cache HTTP do GitHub Pages)
  const fresh =
    request.mode === 'navigate'
      ? fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
      : fetch(request, { cache: 'no-cache' });

  return fresh.then((response) => {
    // Navegações não podem receber uma resposta "redirecionada"
    if (!response.redirected) return response;
    return response.blob().then(
      (body) => new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers })
    );
  });
}

async function networkFirst(request) {
  const cache = await caches.open(APP_CACHE);

  const network = fetchFresh(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  network.catch(() => {}); // evita aviso de promessa rejeitada quando usamos a cópia

  try {
    return await withTimeout(network, NETWORK_TIMEOUT);
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      return await network; // sem cópia guardada: espera a rede mais um pouco
    } catch {
      if (request.mode === 'navigate') {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }
      return Response.error();
    }
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
  return response;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

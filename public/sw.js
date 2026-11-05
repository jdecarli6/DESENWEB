// Service worker: deixa o app abrir offline depois da primeira visita.
// O cache troca sozinho quando os arquivos do build mudam; para forçar, mude VERSION.
const VERSION = 'v1';
// Arquivos do build com hash (assets/*.js, *.css...). Preenchido no `npm run build` pelo plugin
// precacheServiceWorker do vite.config.js; no código-fonte (e no `npm run dev`) fica vazio.
const BUILD = { id: 'dev', assets: [] }; // __PRECACHE__
const CACHE = `tarefas-inteligentes-${VERSION}-${BUILD.id}`;
const SHELL = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png'];
const PRECACHE = [...new Set([...SHELL, ...BUILD.assets])];
// O Vite gera <script crossorigin>: a página pede os assets com cabeçalho Origin e o pré-cache
// não. Com "Vary: Origin" na resposta (vite preview, vários hosts) o match falharia offline.
const MATCH = { ignoreVary: true };

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tarefas-inteligentes-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Páginas: rede primeiro (sempre a versão mais nova), cache se estiver offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html', MATCH).then((r) => r || caches.match('./', MATCH)))
    );
    return;
  }

  // JS, CSS, imagens: usa o cache e atualiza em segundo plano.
  event.respondWith(
    caches.match(req, MATCH).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

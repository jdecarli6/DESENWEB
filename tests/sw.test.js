import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { injectPrecache } from '../vite.config.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Avalia o sw.js sem navegador e devolve o que ele pré-cacheia na instalação. */
async function precacheOf(swSource) {
  const listeners = {};
  const added = [];
  const sandbox = {
    self: { addEventListener: (type, fn) => (listeners[type] = fn), skipWaiting: () => {}, location: { origin: 'http://x' } },
    caches: { open: async (name) => ({ name, addAll: async (urls) => added.push(name, ...urls) }) },
    URL
  };
  vm.runInNewContext(swSource, sandbox);
  let done;
  listeners.install({ waitUntil: (p) => (done = p) });
  await done;
  return { cache: added[0], urls: added.slice(1) };
}

test('injectPrecache: troca o marcador pela lista do build, sem mapas nem duplicatas do shell', async () => {
  const src = await readFile(join(ROOT, 'public/sw.js'), 'utf8');
  const out = injectPrecache(src, ['index.html', 'assets/index-AbC123.js', 'assets/index-AbC123.js.map', 'assets/index-Xyz.css', 'sw.js']);
  const { cache, urls } = await precacheOf(out);
  assert.ok(urls.includes('./assets/index-AbC123.js'));
  assert.ok(urls.includes('./assets/index-Xyz.css'));
  assert.ok(urls.includes('./index.html'));
  assert.equal(urls.some((u) => u.endsWith('.map') || u.endsWith('sw.js')), false);
  assert.equal(new Set(urls).size, urls.length); // cache.addAll rejeita entradas repetidas
  assert.match(cache, /^tarefas-inteligentes-v1-[0-9a-f]{10}$/); // muda quando os assets mudam
  assert.throws(() => injectPrecache('// sem marcador', []), /marcador/);
});

test('sw.js lê o cache ignorando Vary (assets com crossorigin pedem com Origin, o pré-cache não)', async () => {
  const src = await readFile(join(ROOT, 'public/sw.js'), 'utf8');
  const listeners = {};
  const options = [];
  const cachedJs = { ok: true, body: 'js' };
  vm.runInNewContext(src, {
    self: { addEventListener: (type, fn) => (listeners[type] = fn), location: { origin: 'http://x' } },
    caches: { match: async (_req, opts) => (options.push(opts), cachedJs), open: async () => ({ put: async () => {} }) },
    fetch: () => Promise.reject(new TypeError('offline')),
    URL
  });
  let response;
  listeners.fetch({ request: { method: 'GET', mode: 'cors', url: 'http://x/assets/index-AbC.js' }, respondWith: (p) => (response = p) });
  assert.equal(await response, cachedJs);
  listeners.fetch({ request: { method: 'GET', mode: 'navigate', url: 'http://x/' }, respondWith: (p) => (response = p) });
  assert.equal(await response, cachedJs); // offline: página vem do cache
  assert.ok(options.length >= 2 && options.every((o) => o?.ignoreVary === true));
});

test('npm run build: dist/sw.js pré-cacheia todos os assets com hash do build', { timeout: 60000 }, async () => {
  const { build } = await import('vite');
  const outDir = await mkdtemp(join(tmpdir(), 'tarefas-build-'));
  try {
    await build({ root: ROOT, logLevel: 'silent', build: { outDir, emptyOutDir: true } });
    const assets = (await readdir(join(outDir, 'assets'))).filter((f) => !f.endsWith('.map'));
    assert.ok(assets.some((f) => f.endsWith('.js')) && assets.some((f) => f.endsWith('.css')));
    const { urls } = await precacheOf(await readFile(join(outDir, 'sw.js'), 'utf8'));
    for (const f of assets) assert.ok(urls.includes(`./assets/${f}`), `faltou ./assets/${f} no pré-cache`);
    // tudo que o index.html do build carrega está no pré-cache
    const html = await readFile(join(outDir, 'index.html'), 'utf8');
    for (const [, ref] of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)) assert.ok(urls.includes(ref), `index.html usa ${ref} fora do pré-cache`);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

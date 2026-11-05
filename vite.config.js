import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const PRECACHE_MARK = /const BUILD = \{[^\n]*\}; \/\/ __PRECACHE__/;

/** Troca o marcador do sw.js pela lista de arquivos do build (e um id que muda junto com ela). */
export function injectPrecache(sw, files) {
  if (!PRECACHE_MARK.test(sw)) throw new Error('sw.js sem o marcador "const BUILD = {...}; // __PRECACHE__".');
  const assets = [...files]
    .filter((f) => !f.endsWith('.map') && f !== 'index.html' && f !== 'sw.js')
    .sort()
    .map((f) => `./${f}`);
  const id = createHash('sha256').update(assets.join('\n')).digest('hex').slice(0, 10);
  return sw.replace(PRECACHE_MARK, () => `const BUILD = ${JSON.stringify({ id, assets })}; // __PRECACHE__`);
}

// Injeta os assets com hash (assets/*.js, *.css...) no dist/sw.js para o service worker
// pré-cacheá-los na instalação: o app abre offline já depois da primeira visita.
export function precacheServiceWorker() {
  return {
    name: 'precache-service-worker',
    apply: 'build',
    async writeBundle(options, bundle) {
      const file = join(options.dir, 'sw.js');
      await writeFile(file, injectPrecache(await readFile(file, 'utf8'), Object.keys(bundle)));
    }
  };
}

// base './' = caminhos relativos: funciona em qualquer subpasta (GitHub Pages) e no Capacitor.
export default defineConfig({
  base: './',
  plugins: [precacheServiceWorker()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: { host: true, port: 5173 }
});

import { defineConfig } from 'vite';

// base './' = caminhos relativos: funciona em qualquer subpasta (GitHub Pages) e no Capacitor.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  server: { host: true, port: 5173 }
});

// Gera o APK de debug em qualquer sistema (Windows, Mac, Linux).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const android = path.join(raiz, 'android');
const windows = process.platform === 'win32';
const npx = windows ? 'npx.cmd' : 'npx';

function rodar(comando, args, cwd) {
  const r = spawnSync(comando, args, { cwd, stdio: 'inherit', shell: windows });
  if (r.error) {
    console.error(`Falha ao executar ${comando}: ${r.error.message}`);
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status ?? 1);
}

rodar(npx, ['vite', 'build'], raiz);
rodar(npx, ['cap', 'sync', 'android'], raiz);
rodar(windows ? '.\\gradlew.bat' : './gradlew', ['assembleDebug'], android);
console.log('\nAPK gerado em: android/app/build/outputs/apk/debug/app-debug.apk');

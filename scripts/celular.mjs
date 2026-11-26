// Serve o app na rede Wi-Fi local e mostra um QR code para abrir no celular.
// Funciona em Windows, Mac e Linux. Nada é publicado na internet.
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const windows = process.platform === 'win32';
const PORTA = Number(process.env.PORT) || 4173;

const VIRTUAL = /vethernet|wsl|hyper-v|virtualbox|vmware|vmnet|docker|veth|br-|virbr|loopback|tailscale|zerotier|bluetooth|tun|tap/i;
const PRIVADO = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/;

/** IPv4 das redes locais reais (Wi-Fi/Ethernet), ignorando adaptadores virtuais. */
export function enderecosLocais(interfaces = os.networkInterfaces()) {
  const achados = [];
  for (const [nome, lista] of Object.entries(interfaces)) {
    if (VIRTUAL.test(nome)) continue;
    for (const i of lista ?? []) {
      if ((i.family === 'IPv4' || i.family === 4) && !i.internal && PRIVADO.test(i.address)) {
        achados.push({ nome, ip: i.address });
      }
    }
  }
  return achados;
}

function rodar(comando, args) {
  const r = spawnSync(comando, args, { cwd: raiz, stdio: 'inherit', shell: windows });
  if (r.error || r.status !== 0) {
    console.error('Falha ao gerar o build do app.');
    process.exit(r.status ?? 1);
  }
}

function abrirNoNavegador(arquivo) {
  try {
    const [cmd, args] = windows ? ['cmd', ['/c', 'start', '""', arquivo]]
      : process.platform === 'darwin' ? ['open', [arquivo]] : ['xdg-open', [arquivo]];
    spawn(cmd, args, { stdio: 'ignore', detached: true, windowsVerbatimArguments: windows }).unref();
  } catch { /* sem navegador: o QR do terminal basta */ }
}

async function esperarServidor() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORTA}/`)).ok) return true; } catch { /* ainda subindo */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

const html = (urls, imgs) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Abrir no celular</title>
<style>body{font-family:system-ui,sans-serif;text-align:center;margin:2rem;color:#222}img{width:min(80vw,420px);image-rendering:pixelated}
code{font-size:1.5rem;background:#eee;padding:.3rem .6rem;border-radius:6px}ol{display:inline-block;text-align:left;font-size:1.1rem}</style></head><body>
<h1>Abrir o Gerenciador de Tarefas no celular</h1>
${urls.map((u, i) => `<div><img src="${imgs[i]}" alt="QR code"><p><code>${u}</code></p></div>`).join('')}
<h2>No iPhone, em 3 passos</h2>
<ol><li>Aponte a <b>câmera</b> para o QR code e toque no link (abre no <b>Safari</b>).</li>
<li>No Safari toque em <b>Compartilhar</b> (quadrado com seta) → <b>Adicionar à Tela de Início</b> → <b>Adicionar</b>.</li>
<li>Abra pelo ícone <b>Tarefas</b>: abre em tela cheia, como um app.</li></ol>
<p><b>Atenção:</b> o computador precisa ficar ligado, com a janela do terminal aberta e no <b>mesmo Wi-Fi</b> do celular. No iPhone use o <b>Safari</b> (outros navegadores podem não ter a opção).</p>
<p>Feche a janela do terminal para desligar.</p></body></html>`;

async function principal() {
  console.log('Gerando o app...');
  rodar(windows ? 'npx.cmd' : 'npx', ['vite', 'build']);

  const vite = path.join(raiz, 'node_modules', 'vite', 'bin', 'vite.js');
  const servidor = spawn(process.execPath, [vite, 'preview', '--host', '--port', String(PORTA), '--strictPort'], { cwd: raiz, stdio: ['ignore', 'ignore', 'inherit'] });
  const encerrar = () => { servidor.kill(); process.exit(0); };
  process.on('SIGINT', encerrar); process.on('SIGTERM', encerrar);
  servidor.on('exit', (c) => { if (c) console.error(`\nO servidor parou (código ${c}). A porta ${PORTA} pode estar ocupada; use PORT=4174 npm run celular.`); process.exit(c ?? 0); });

  if (!(await esperarServidor())) { console.error('O servidor não respondeu.'); servidor.kill(); process.exit(1); }

  const locais = enderecosLocais();
  if (!locais.length) {
    console.log(`Não achei a rede Wi-Fi/Ethernet deste computador. Conecte-se a uma rede e rode de novo.\nNeste computador: http://localhost:${PORTA}`);
    return;
  }
  const urls = locais.map((l) => `http://${l.ip}:${PORTA}`);
  const imgs = await Promise.all(urls.map((u) => QRCode.toDataURL(u, { width: 420, margin: 2 })));
  await QRCode.toFile(path.join(raiz, 'qrcode-celular.png'), urls[0], { width: 600, margin: 2 });
  const pagina = path.join(raiz, 'qrcode-celular.html');
  await writeFile(pagina, html(urls, imgs));

  console.log('\n=== Abra no celular (mesmo Wi-Fi do computador) ===\n');
  locais.forEach((l, i) => {
    console.log(`${urls[i]}   (${l.nome})`);
    qrcodeTerminal.generate(urls[i], { small: false });
  });
  console.log('');
  console.log('No iPhone, em 3 passos:');
  console.log(' 1. Aponte a câmera para o QR code e toque no link (abre no Safari).');
  console.log(' 2. No Safari: Compartilhar (quadrado com seta) > Adicionar à Tela de Início > Adicionar.');
  console.log(' 3. Abra pelo ícone "Tarefas": abre em tela cheia, como um app.');
  console.log('');
  console.log('O computador precisa ficar ligado, com esta janela aberta e no mesmo Wi-Fi do celular.');
  console.log('No iPhone use o Safari (outros navegadores podem não ter a opção).');
  console.log('Feche esta janela para desligar.');
  abrirNoNavegador(pagina);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();

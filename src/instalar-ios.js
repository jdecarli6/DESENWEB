// Aviso "Use como app" para quem abre o sistema no Safari do iPhone/iPad.
export const CHAVE = 'aviso-instalar-ios-fechado-em';
export const DIAS_ATE_REAPARECER = 7;

/** iPhone/iPad (inclui iPad que se apresenta como Mac, mas tem tela de toque). */
export function ehIOS({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  return /iPhone|iPad|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

/** Decide se o aviso aparece. `fechadoEm` = instante (ms) em que a pessoa fechou, ou null. */
export function deveMostrarAvisoIOS({ ios, standalone = false, nativo = false, fechadoEm = null, agora = Date.now() }) {
  if (!ios || standalone || nativo) return false;
  if (fechadoEm == null || !Number.isFinite(fechadoEm)) return true;
  return agora - fechadoEm >= DIAS_ATE_REAPARECER * 86400000;
}

export function iniciarAvisoIOS(doc = document, nav = navigator, win = window, store = win.localStorage) {
  const nativo = !!(win.Capacitor?.isNativePlatform?.());
  const standalone = nav.standalone === true || !!win.matchMedia?.('(display-mode: standalone)').matches;
  let fechadoEm = null;
  try { const v = Number(store.getItem(CHAVE)); fechadoEm = v > 0 ? v : null; } catch { /* sem armazenamento */ }
  if (!deveMostrarAvisoIOS({ ios: ehIOS(nav), standalone, nativo, fechadoEm })) return;

  const aviso = doc.createElement('aside');
  aviso.className = 'ios-aviso';
  aviso.setAttribute('role', 'note');
  aviso.innerHTML = '<div><strong>Use como app</strong><span>Toque em <b>Compartilhar</b> (o quadrado com uma seta) e depois em <b>“Adicionar à Tela de Início”</b>.</span></div><button type="button" aria-label="Fechar aviso">Fechar</button>';
  aviso.querySelector('button').addEventListener('click', () => {
    try { store.setItem(CHAVE, String(Date.now())); } catch { /* ignora */ }
    aviso.remove();
  });
  doc.body.appendChild(aviso);
}

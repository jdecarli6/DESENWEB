// Registra o service worker apenas na web (PWA). No app nativo (Capacitor) e no
// servidor de desenvolvimento do Vite ele não é usado.
export function registerServiceWorker() {
  const isNative = !!(globalThis.Capacitor && globalThis.Capacitor.isNativePlatform && globalThis.Capacitor.isNativePlatform());
  const isDev = import.meta.env?.DEV === true;
  if (isNative || isDev || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker não registrado:', err));
  });
}

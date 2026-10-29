// Persistência local.
// - No iOS (Capacitor): @capacitor/preferences (UserDefaults, mais durável que localStorage).
// - No navegador (dev/testes): localStorage.

const isNative = () => !!(globalThis.Capacitor && globalThis.Capacitor.isNativePlatform && globalThis.Capacitor.isNativePlatform());

export function createStorage() {
  let prefsPromise = null;
  const prefs = () => (prefsPromise ??= import('@capacitor/preferences').then((m) => m.Preferences));

  return {
    async get(key) {
      if (isNative()) {
        const { value } = await (await prefs()).get({ key });
        return value;
      }
      return localStorage.getItem(key);
    },
    async set(key, value) {
      if (isNative()) {
        await (await prefs()).set({ key, value });
        return;
      }
      localStorage.setItem(key, value);
    }
  };
}

/** Armazenamento em memória (testes). */
export function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    async get(key) {
      return data.has(key) ? data.get(key) : null;
    },
    async set(key, value) {
      data.set(key, value);
    }
  };
}

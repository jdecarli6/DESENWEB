// Estado das tarefas (CRUD + persistência). Sem dependência de DOM.
import { CATEGORIES, PRIORITIES } from './smart.js';

export const STORAGE_KEY = 'tarefas-inteligentes:v1';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const defaultUid = () => {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID();
    } catch {
      /* contexto inseguro: usa fallback */
    }
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

/** Valida/normaliza os campos editáveis. Lança Error se o título for inválido. */
export function sanitize(input) {
  const title = String(input.title ?? '').replace(/\s+/g, ' ').trim();
  if (!title) throw new Error('Informe um título para a tarefa.');
  const due = DATE_RE.test(input.due || '') ? input.due : null;
  return {
    title: title.slice(0, 120),
    notes: String(input.notes ?? '').trim().slice(0, 2000),
    category: CATEGORIES.some((c) => c.id === input.category) ? input.category : 'outros',
    priority: PRIORITIES.some((p) => p.id === input.priority) ? input.priority : 'media',
    due,
    time: due && TIME_RE.test(input.time || '') ? input.time : null
  };
}

export function createStore(storage, { now = () => Date.now(), uid = defaultUid } = {}) {
  let saved = []; // último estado gravado com sucesso
  let tasks = []; // o que a tela mostra: `saved` + mudanças ainda em gravação
  const pending = []; // mudanças aplicadas em memória aguardando a gravação
  const listeners = new Set();
  let writing = Promise.resolve();

  const emit = () => listeners.forEach((fn) => fn(tasks));

  // Aplica a mudança na memória na hora e grava em fila (nunca fora de ordem). Cada gravação
  // grava `saved` + a mudança, então uma mudança que falhou nunca vai parar no armazenamento.
  // Se a gravação falhar, a mudança é desfeita (a tela volta a bater com o que está gravado)
  // e a promessa rejeita com Error; a fila continua andando para as próximas.
  const commit = (change) => {
    pending.push(change);
    tasks = change(tasks);
    emit();
    const run = writing.then(async () => {
      const next = change(saved);
      try {
        await storage.set(STORAGE_KEY, JSON.stringify({ version: 1, tasks: next }));
      } catch (e) {
        pending.splice(pending.indexOf(change), 1);
        tasks = pending.reduce((list, fn) => fn(list), saved);
        emit();
        throw new Error('Não foi possível salvar a alteração. Tente novamente.', { cause: e });
      }
      saved = next;
      pending.splice(pending.indexOf(change), 1);
    });
    writing = run.catch(() => {}); // uma falha não trava a fila
    return run;
  };

  const replace = (next) => (list) => list.map((t) => (t.id === next.id ? next : t));

  return {
    async init() {
      const raw = await storage.get(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
        } catch {
          await storage.set(`${STORAGE_KEY}.corrompido`, raw); // preserva para recuperação
          tasks = [];
        }
      }
      saved = tasks;
      emit();
    },
    getAll: () => tasks,
    get: (id) => tasks.find((t) => t.id === id) || null,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    async add(input) {
      const ts = now();
      const task = { id: uid(), ...sanitize(input), done: false, doneAt: null, createdAt: ts, updatedAt: ts };
      await commit((list) => [task, ...list]);
      return task;
    },
    async update(id, patch) {
      const current = tasks.find((t) => t.id === id);
      if (!current) throw new Error('Tarefa não encontrada.');
      const next = { ...current, ...sanitize({ ...current, ...patch }), updatedAt: now() };
      await commit(replace(next));
      return next;
    },
    async toggle(id) {
      const current = tasks.find((t) => t.id === id);
      if (!current) return null;
      const done = !current.done;
      const next = { ...current, done, doneAt: done ? now() : null, updatedAt: now() };
      await commit(replace(next));
      return next;
    },
    async remove(id) {
      await commit((list) => list.filter((t) => t.id !== id));
    }
  };
}

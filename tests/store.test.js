import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, STORAGE_KEY, sanitize } from '../src/store.js';
import { createMemoryStorage } from '../src/storage.js';

const make = (storage = createMemoryStorage()) => {
  let n = 0;
  let t = 1000;
  return { storage, store: createStore(storage, { now: () => ++t, uid: () => `id${++n}` }) };
};

test('criar, editar, concluir e excluir', async () => {
  const { store } = make();
  await store.init();
  const a = await store.add({ title: '  Ligar   para cliente ', category: 'trabalho', priority: 'alta', due: '2026-11-01', time: '09:30' });
  assert.equal(a.title, 'Ligar para cliente');
  assert.equal(store.getAll().length, 1);

  const b = await store.update(a.id, { title: 'Ligar para o cliente X', priority: 'baixa' });
  assert.equal(b.title, 'Ligar para o cliente X');
  assert.equal(b.priority, 'baixa');
  assert.equal(b.category, 'trabalho'); // campos não enviados são preservados

  const c = await store.toggle(a.id);
  assert.equal(c.done, true);
  assert.ok(c.doneAt);
  assert.equal((await store.toggle(a.id)).doneAt, null);

  await store.remove(a.id);
  assert.equal(store.getAll().length, 0);
});

test('persistência: dados sobrevivem a um novo carregamento', async () => {
  const { storage, store } = make();
  await store.init();
  await store.add({ title: 'Tarefa 1', category: 'estudo' });
  await store.add({ title: 'Tarefa 2' });
  const t3 = await store.add({ title: 'Tarefa 3' });
  await store.toggle(t3.id);

  const reopened = createStore(storage);
  await reopened.init();
  assert.equal(reopened.getAll().length, 3);
  assert.equal(reopened.getAll()[0].title, 'Tarefa 3');
  assert.equal(reopened.getAll()[0].done, true);
});

test('validação e normalização', () => {
  assert.throws(() => sanitize({ title: '   ' }), /título/i);
  const s = sanitize({ title: 'x', category: 'invalida', priority: 'xx', due: 'ontem', time: '10:00' });
  assert.deepEqual(s, { title: 'x', notes: '', category: 'outros', priority: 'media', due: null, time: null });
  assert.equal(sanitize({ title: 'x', due: '2026-01-01', time: '25:00' }).time, null);
});

test('dados corrompidos não derrubam o app e são preservados', async () => {
  const storage = createMemoryStorage({ [STORAGE_KEY]: '{quebrado' });
  const store = createStore(storage);
  await store.init();
  assert.deepEqual(store.getAll(), []);
  assert.equal(await storage.get(`${STORAGE_KEY}.corrompido`), '{quebrado');
});

test('assinantes são notificados', async () => {
  const { store } = make();
  let calls = 0;
  store.subscribe(() => calls++);
  await store.init();
  await store.add({ title: 'a' });
  assert.equal(calls, 2);
});

/** Armazenamento que falha nas próximas `failures` gravações. */
const flaky = (initial) => {
  const inner = createMemoryStorage(initial);
  const s = {
    failures: 0,
    get: (key) => inner.get(key),
    async set(key, value) {
      if (s.failures > 0) {
        s.failures--;
        throw new Error('QuotaExceededError');
      }
      return inner.set(key, value);
    }
  };
  return s;
};

const stored = async (storage) => JSON.parse(await storage.get(STORAGE_KEY)).tasks.map((t) => t.title);

test('falha ao salvar: add rejeita, desfaz a mudança e avisa os assinantes', async () => {
  const { storage, store } = make(flaky());
  await store.init();
  await store.add({ title: 'Salva' });
  const seen = [];
  store.subscribe((tasks) => seen.push(tasks.map((t) => t.title)));

  storage.failures = 1;
  await assert.rejects(store.add({ title: 'Perdida' }), (err) => err instanceof Error && /salvar/i.test(err.message) && /Quota/.test(err.cause.message));
  assert.deepEqual(store.getAll().map((t) => t.title), ['Salva']);
  assert.deepEqual(seen, [['Perdida', 'Salva'], ['Salva']]); // otimista e depois desfeito
  assert.deepEqual(await stored(storage), ['Salva']);
});

test('falha ao salvar: update, toggle e remove desfazem a mudança', async () => {
  const { storage, store } = make(flaky());
  await store.init();
  const a = await store.add({ title: 'Original', priority: 'baixa' });

  storage.failures = 1;
  await assert.rejects(store.update(a.id, { title: 'Editada', priority: 'alta' }), Error);
  assert.deepEqual(store.get(a.id), a);

  storage.failures = 1;
  await assert.rejects(store.toggle(a.id), Error);
  assert.equal(store.get(a.id).done, false);

  storage.failures = 1;
  await assert.rejects(store.remove(a.id), Error);
  assert.deepEqual(store.getAll(), [a]);

  const reopened = createStore(storage);
  await reopened.init();
  assert.deepEqual(reopened.getAll(), [a]);
});

test('falha ao salvar: a fila não trava e o que está gravado bate com a tela', async () => {
  const { storage, store } = make(flaky());
  await store.init();
  await store.add({ title: 'A' });

  // gravações concorrentes: a do meio falha, as outras seguem
  const b = store.add({ title: 'B' });
  const c = store.add({ title: 'C' });
  const d = store.add({ title: 'D' });
  const set = storage.set;
  let call = 0;
  storage.set = (k, v) => (++call === 2 ? Promise.reject(new Error('falhou')) : set(k, v));
  const results = await Promise.allSettled([b, c, d]);
  storage.set = set;

  assert.deepEqual(results.map((r) => r.status), ['fulfilled', 'rejected', 'fulfilled']);
  assert.deepEqual(store.getAll().map((t) => t.title), ['D', 'B', 'A']);
  assert.deepEqual(await stored(storage), ['D', 'B', 'A']);

  // depois da falha, novas gravações continuam funcionando
  await store.add({ title: 'E' });
  assert.deepEqual(await stored(storage), ['E', 'D', 'B', 'A']);
});

test('sucesso não muda o contrato: add/update/toggle devolvem a tarefa e remove devolve undefined', async () => {
  const { store } = make();
  await store.init();
  const a = await store.add({ title: 'x' });
  assert.equal(typeof a.id, 'string');
  assert.equal((await store.update(a.id, { title: 'y' })).title, 'y');
  assert.equal((await store.toggle(a.id)).done, true);
  assert.equal(await store.toggle('inexistente'), null);
  assert.equal(await store.remove(a.id), undefined);
});

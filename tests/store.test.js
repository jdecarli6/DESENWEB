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

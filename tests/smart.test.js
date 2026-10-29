import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuickAdd, inferCategory, inferPriority, filterTasks, sortTasks, summarize, dueLabel, addDays, diffDays } from '../src/smart.js';

// Quinta-feira, 29/10/2026 (10:00)
const NOW = new Date(2026, 9, 29, 10, 0, 0);
const TODAY = '2026-10-29';

test('datas auxiliares', () => {
  assert.equal(addDays('2026-10-31', 2), '2026-11-02');
  assert.equal(diffDays('2026-10-29', '2026-11-01'), 3);
  assert.equal(diffDays('2026-03-07', '2026-03-09'), 2);
});

test('quick add: amanhã + hora + tags', () => {
  const r = parseQuickAdd('Entregar relatório amanhã 14h30 #trabalho !alta', NOW);
  assert.equal(r.title, 'Entregar relatório');
  assert.equal(r.due, '2026-10-30');
  assert.equal(r.time, '14:30');
  assert.equal(r.category, 'trabalho');
  assert.equal(r.priority, 'alta');
  assert.deepEqual(r.auto, { category: false, priority: false });
});

test('quick add: infere categoria e prioridade quando não há tags', () => {
  const r = parseQuickAdd('Estudar para a prova de redes sexta', NOW);
  assert.equal(r.due, '2026-10-30'); // sexta-feira
  assert.equal(r.category, 'estudo');
  assert.equal(r.priority, 'alta'); // vence em 1 dia
  assert.deepEqual(r.auto, { category: true, priority: true });
});

test('quick add: dia da semana e "às"', () => {
  const r = parseQuickAdd('Reunião com cliente às 9h segunda', NOW);
  assert.equal(r.title, 'Reunião com cliente');
  assert.equal(r.due, '2026-11-02');
  assert.equal(r.time, '09:00');
  assert.equal(r.category, 'trabalho');
});

test('quick add: dd/mm, hoje que já passou vira próximo ano, dd/mm/aaaa', () => {
  assert.equal(parseQuickAdd('Pagar boleto 05/11', NOW).due, '2026-11-05');
  assert.equal(parseQuickAdd('Pagar boleto 05/11', NOW).category, 'financas');
  assert.equal(parseQuickAdd('Aniversário da mãe 10/03', NOW).due, '2027-03-10');
  assert.equal(parseQuickAdd('Prova 15/12/26', NOW).due, '2026-12-15');
  assert.equal(parseQuickAdd('Algo 31/02', NOW).due, null); // data inválida
});

test('quick add: depois de amanhã, em N dias, hora sem data = hoje', () => {
  assert.equal(parseQuickAdd('Ligar para o dentista depois de amanhã', NOW).due, '2026-10-31');
  assert.equal(parseQuickAdd('Ligar para o dentista depois de amanhã', NOW).category, 'saude');
  assert.equal(parseQuickAdd('Revisar contrato em 3 dias', NOW).due, '2026-11-01');
  const r = parseQuickAdd('Ligar para o fornecedor 15:45', NOW);
  assert.equal(r.due, TODAY);
  assert.equal(r.time, '15:45');
});

test('quick add: texto simples e título vazio após parsing', () => {
  const r = parseQuickAdd('Comprar pão', NOW);
  assert.equal(r.title, 'Comprar pão');
  assert.equal(r.due, null);
  assert.equal(r.category, 'pessoal');
  assert.equal(r.priority, 'media');
  assert.equal(parseQuickAdd('amanhã', NOW).title, 'amanhã');
  assert.equal(parseQuickAdd('Coisa sem pista nenhuma', NOW).category, 'outros');
  assert.equal(parseQuickAdd('Item #inexistente', NOW).title, 'Item #inexistente');
});

test('prioridade por palavras-chave', () => {
  assert.equal(inferPriority('Corrigir bug urgente', null, TODAY), 'alta');
  assert.equal(inferPriority('Arrumar gaveta quando der', null, TODAY), 'baixa');
  assert.equal(inferPriority('Algo', '2026-11-20', TODAY), 'media');
  assert.equal(inferPriority('Algo', '2026-10-01', TODAY), 'alta'); // atrasada
});

test('categoria: banco de dados é trabalho, banco é finanças', () => {
  assert.equal(inferCategory('Backup do banco de dados'), 'trabalho');
  assert.equal(inferCategory('Ir ao banco pagar fatura'), 'financas');
});

const mk = (o) => ({ id: o.title, title: 'x', notes: '', category: 'outros', priority: 'media', due: null, time: null, done: false, doneAt: null, createdAt: 1, ...o });

test('filtros: busca sem acento, status, categoria, prioridade', () => {
  const tasks = [
    mk({ title: 'Relatório mensal', category: 'trabalho', priority: 'alta' }),
    mk({ title: 'Estudar CMMI', category: 'estudo', done: true }),
    mk({ title: 'Comprar pão', notes: 'padaria da esquina', category: 'pessoal', priority: 'baixa' })
  ];
  assert.equal(filterTasks(tasks, { query: 'relatorio' }).length, 1);
  assert.equal(filterTasks(tasks, { query: 'PADARIA' }).length, 1);
  assert.equal(filterTasks(tasks, { status: 'done' })[0].title, 'Estudar CMMI');
  assert.equal(filterTasks(tasks, { status: 'pending' }).length, 2);
  assert.equal(filterTasks(tasks, { category: 'pessoal' }).length, 1);
  assert.equal(filterTasks(tasks, { priority: 'alta' }).length, 1);
  assert.equal(filterTasks(tasks, { query: 'trabalho alta' }).length, 1); // categoria+prioridade na busca
  assert.equal(filterTasks(tasks, { query: 'nada' }).length, 0);
});

test('ordenação inteligente: atrasadas > hoje > prioridade; concluídas por último', () => {
  const tasks = [
    mk({ title: 'baixa sem prazo', priority: 'baixa' }),
    mk({ title: 'feita', done: true, doneAt: 5 }),
    mk({ title: 'alta sem prazo', priority: 'alta' }),
    mk({ title: 'hoje media', due: TODAY }),
    mk({ title: 'atrasada baixa', due: '2026-10-20', priority: 'baixa' })
  ];
  const order = sortTasks(tasks, 'smart', TODAY).map((t) => t.title);
  assert.deepEqual(order, ['atrasada baixa', 'hoje media', 'alta sem prazo', 'baixa sem prazo', 'feita']);
  assert.equal(sortTasks(tasks, 'priority', TODAY)[0].title, 'alta sem prazo');
  assert.equal(sortTasks(tasks, 'due', TODAY)[0].title, 'atrasada baixa');
});

test('resumo e rótulo de prazo', () => {
  const tasks = [mk({ due: TODAY }), mk({ due: '2026-10-01' }), mk({ done: true, due: '2026-10-01' }), mk({})];
  assert.deepEqual(summarize(tasks, TODAY), { total: 4, pending: 3, done: 1, overdue: 1, today: 1 });
  assert.deepEqual(dueLabel({ due: TODAY, time: '14:00' }, NOW), { text: 'Hoje · 14:00', tone: 'today' });
  assert.equal(dueLabel({ due: '2026-10-30' }, NOW).text, 'Amanhã');
  assert.equal(dueLabel({ due: '2026-11-02' }, NOW).text, 'Segunda');
  assert.equal(dueLabel({ due: '2026-12-25' }, NOW).text, '25/12');
  assert.equal(dueLabel({ due: '2026-10-01' }, NOW).tone, 'overdue');
  assert.equal(dueLabel({ due: '2026-10-01', done: true }, NOW).tone, 'normal');
  assert.equal(dueLabel({ due: null }, NOW), null);
});

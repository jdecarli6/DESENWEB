import { CATEGORIES, PRIORITIES, filterTasks, sortTasks, summarize, dueLabel, parseQuickAdd, suggest, getCategory, getPriority, toISO } from './smart.js';
import { createStore } from './store.js';
import { createStorage } from './storage.js';
import { registerServiceWorker } from './pwa.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const store = createStore(createStorage());
const filters = { query: '', status: 'all', category: 'all', priority: 'all', sort: 'smart' };

const CHECK_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

/* =============================== lista =============================== */

function renderChips() {
  const all = [{ id: 'all', label: 'Todas', color: null }, ...CATEGORIES];
  $('chips').innerHTML = all
    .map((c) => `<button type="button" class="chip${filters.category === c.id ? ' on' : ''}" data-cat="${c.id}" aria-pressed="${filters.category === c.id}">${c.color ? `<i style="--c:${c.color}"></i>` : ''}${esc(c.label)}</button>`)
    .join('');
}

function renderSummary(tasks) {
  const s = summarize(tasks);
  if (!s.total) {
    $('summary').textContent = 'Nenhuma tarefa ainda';
    return;
  }
  const parts = [`${s.pending} pendente${s.pending === 1 ? '' : 's'}`];
  if (s.today) parts.push(`${s.today} para hoje`);
  if (s.overdue) parts.push(`<span class="warn">${s.overdue} atrasada${s.overdue === 1 ? '' : 's'}</span>`);
  $('summary').innerHTML = parts.join(' · ');
}

function taskHTML(t) {
  const cat = getCategory(t.category);
  const pri = getPriority(t.priority);
  const due = dueLabel(t);
  return `
    <article class="task${t.done ? ' done' : ''}" data-id="${esc(t.id)}" style="--p:${pri.color}">
      <button type="button" class="check" data-act="toggle" aria-pressed="${t.done}" aria-label="${t.done ? 'Marcar como pendente' : 'Marcar como concluída'}: ${esc(t.title)}">${CHECK_SVG}</button>
      <div class="body" data-act="edit" role="button" tabindex="0" aria-label="Editar tarefa: ${esc(t.title)}">
        <div class="title">${esc(t.title)}</div>
        ${t.notes ? `<div class="notes">${esc(t.notes)}</div>` : ''}
        <div class="meta">
          <span class="tag" style="--c:${cat.color}">${esc(cat.label)}</span>
          ${due ? `<span class="due ${due.tone}">${esc(due.text)}</span>` : ''}
          <span class="prio">${esc(pri.label)}</span>
        </div>
      </div>
    </article>`;
}

function render() {
  const all = store.getAll();
  const visible = sortTasks(filterTasks(all, filters), filters.sort, toISO(new Date()));
  renderSummary(all);
  renderChips();

  if (!visible.length) {
    $('list').innerHTML = all.length
      ? '<div class="empty"><strong>Nada encontrado</strong>Ajuste a busca ou os filtros.</div>'
      : '<div class="empty"><strong>Tudo em dia ✨</strong>Digite abaixo, por exemplo:<br><em>“Pagar boleto sexta #financas”</em><br>e o app entende prazo, categoria e prioridade.</div>';
    return;
  }
  $('list').innerHTML = visible.map(taskHTML).join('');
}

/* =============================== toast =============================== */

let toastTimer;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 3500);
}

/* ============================ adição rápida ============================ */

function describe(task) {
  const bits = [getCategory(task.category).label, `prioridade ${getPriority(task.priority).label.toLowerCase()}`];
  const due = dueLabel(task);
  if (due) bits.push(due.text.replace(/^Atrasada · /, ''));
  return bits.join(' · ');
}

$('quick').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $('quick-input');
  const text = input.value.trim();
  if (!text) return;
  const parsed = parseQuickAdd(text);
  input.value = '';
  const task = await store.add({ ...parsed });
  // se os filtros esconderem a nova tarefa, limpa-os para o usuário ver a nova tarefa
  if (!filterTasks([task], filters).length) resetFilters();
  toast(`Adicionada: ${describe(task)}`);
  input.focus();
});

function resetFilters() {
  Object.assign(filters, { query: '', status: 'all', category: 'all', priority: 'all' });
  $('search').value = '';
  $('f-priority').value = 'all';
  document.querySelectorAll('#status button').forEach((b) => b.classList.toggle('on', b.dataset.status === 'all'));
  render();
}

/* ============================ busca e filtros ============================ */

$('search').addEventListener('input', (e) => {
  filters.query = e.target.value;
  render();
});

$('status').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-status]');
  if (!btn) return;
  filters.status = btn.dataset.status;
  document.querySelectorAll('#status button').forEach((b) => b.classList.toggle('on', b === btn));
  render();
});

$('chips').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-cat]');
  if (!btn) return;
  filters.category = btn.dataset.cat;
  render();
});

$('f-priority').addEventListener('change', (e) => {
  filters.priority = e.target.value;
  render();
});

$('f-sort').addEventListener('change', (e) => {
  filters.sort = e.target.value;
  render();
});

/* ============================ ações na lista ============================ */

$('list').addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  const row = e.target.closest('.task');
  if (!el || !row) return;
  if (el.dataset.act === 'toggle') await store.toggle(row.dataset.id);
  else openSheet(store.get(row.dataset.id));
});

$('list').addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.body[data-act="edit"]')) {
    e.preventDefault();
    openSheet(store.get(e.target.closest('.task').dataset.id));
  }
});

/* ============================= formulário ============================= */

const form = {
  id: null,
  category: 'pessoal',
  priority: 'media',
  touched: { category: false, priority: false }
};

function renderFormChoices() {
  $('t-cats').innerHTML = CATEGORIES.map(
    (c) => `<button type="button" class="chip${form.category === c.id ? ' on' : ''}" role="radio" aria-checked="${form.category === c.id}" data-cat="${c.id}"><i style="--c:${c.color}"></i>${esc(c.label)}</button>`
  ).join('');
  $('t-pri').innerHTML = PRIORITIES.map(
    (p) => `<button type="button" class="${form.priority === p.id ? 'on' : ''}" role="radio" aria-checked="${form.priority === p.id}" data-pri="${p.id}">${esc(p.label)}</button>`
  ).join('');
}

function openSheet(task = null) {
  form.id = task ? task.id : null;
  form.category = task ? task.category : 'pessoal';
  form.priority = task ? task.priority : 'media';
  // ao editar, respeita o que o usuário já escolheu; ao criar, sugere automaticamente
  form.touched = { category: !!task, priority: !!task };

  $('sheet-title').textContent = task ? 'Editar tarefa' : 'Nova tarefa';
  $('t-title').value = task ? task.title : '';
  $('t-notes').value = task ? task.notes : '';
  $('t-due').value = task && task.due ? task.due : '';
  $('t-time').value = task && task.time ? task.time : '';
  $('t-delete').hidden = !task;
  $('t-error').hidden = true;
  $('hint-cat').hidden = true;
  $('hint-pri').hidden = true;
  renderFormChoices();
  $('sheet').hidden = false;
  if (!task) setTimeout(() => $('t-title').focus(), 50);
}

function closeSheet() {
  $('sheet').hidden = true;
}

function applySuggestion() {
  if (form.touched.category && form.touched.priority) return;
  const s = suggest($('t-title').value, $('t-due').value || null);
  if (!form.touched.category && s.category) {
    form.category = s.category;
    $('hint-cat').hidden = false;
  }
  if (!form.touched.priority) {
    form.priority = s.priority;
    $('hint-pri').hidden = !$('t-title').value.trim();
  }
  renderFormChoices();
}

$('t-title').addEventListener('input', applySuggestion);
$('t-due').addEventListener('change', applySuggestion);

$('t-cats').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  form.category = b.dataset.cat;
  form.touched.category = true;
  $('hint-cat').hidden = true;
  renderFormChoices();
});

$('t-pri').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pri]');
  if (!b) return;
  form.priority = b.dataset.pri;
  form.touched.priority = true;
  $('hint-pri').hidden = true;
  renderFormChoices();
});

$('t-clear-due').addEventListener('click', () => {
  $('t-due').value = '';
  $('t-time').value = '';
  applySuggestion();
});

$('btn-new').addEventListener('click', () => openSheet());
$('f-cancel').addEventListener('click', closeSheet);
$('sheet').addEventListener('click', (e) => {
  if (e.target === $('sheet')) closeSheet();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('sheet').hidden) closeSheet();
});

$('task-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    title: $('t-title').value,
    notes: $('t-notes').value,
    category: form.category,
    priority: form.priority,
    due: $('t-due').value || null,
    time: $('t-time').value || null
  };
  if (!data.title.trim()) {
    $('t-error').textContent = 'Informe um título para a tarefa.';
    $('t-error').hidden = false;
    $('t-title').focus();
    return;
  }
  try {
    if (form.id) await store.update(form.id, data);
    else await store.add(data);
    closeSheet();
  } catch (err) {
    $('t-error').textContent = err.message;
    $('t-error').hidden = false;
  }
});

$('t-delete').addEventListener('click', async () => {
  if (!form.id) return;
  if (!window.confirm('Excluir esta tarefa? Essa ação não pode ser desfeita.')) return;
  await store.remove(form.id);
  closeSheet();
});

/* =============================== início =============================== */

store.subscribe(render);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) render(); // atualiza "Hoje"/"Atrasada" ao voltar para o app
});

registerServiceWorker();
renderChips();
store.init().catch((err) => {
  console.error(err);
  $('summary').textContent = 'Não foi possível carregar os dados salvos.';
});

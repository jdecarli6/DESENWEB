import './styles.css';
import { setupIonic, showToast, confirmAlert } from './ionic.js';
import { CATEGORIES, filterTasks, sortTasks, summarize, dueLabel, parseQuickAdd, suggest, getCategory, getPriority, toISO } from './smart.js';
import { createStore } from './store.js';
import { createStorage } from './storage.js';
import { registerServiceWorker } from './pwa.js';

setupIonic();

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const store = createStore(createStorage());
const filters = { query: '', status: 'all', category: 'all', priority: 'all', sort: 'smart' };

const SAVE_ERROR = 'Não foi possível salvar';
const saveFailed = (err) => {
  console.error(err);
  showToast(SAVE_ERROR, { color: 'danger', duration: 4000 });
};

/* =============================== lista =============================== */

// ion-chip não é botão nativo: role/tabindex/aria-pressed dão o estado ao leitor de tela
function chipHTML(c, on, attrs) {
  return `<ion-chip class="${on ? 'on' : ''}" tabindex="0" ${attrs} data-cat="${c.id}">${c.color ? `<i style="--c:${c.color}" aria-hidden="true"></i>` : ''}<ion-label>${esc(c.label)}</ion-label></ion-chip>`;
}

function renderChips() {
  const all = [{ id: 'all', label: 'Todas', color: null }, ...CATEGORIES];
  $('chips').innerHTML = all.map((c) => chipHTML(c, filters.category === c.id, `role="button" aria-pressed="${filters.category === c.id}"`)).join('');
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
    <ion-item-sliding data-id="${esc(t.id)}">
      <ion-item class="task${t.done ? ' done' : ''}" style="--p:${pri.color}">
        <ion-checkbox slot="start" ${t.done ? 'checked' : ''} aria-label="${t.done ? 'Concluída' : 'Pendente'}: ${esc(t.title)}"></ion-checkbox>
        <ion-label class="body" data-act="edit" role="button" tabindex="0" aria-label="Editar tarefa: ${esc(t.title)}">
          <div class="title">${esc(t.title)}</div>
          ${t.notes ? `<div class="notes">${esc(t.notes)}</div>` : ''}
          <div class="meta">
            <span class="tag" style="--c:${cat.color}">${esc(cat.label)}</span>
            ${due ? `<span class="due ${due.tone}">${esc(due.text)}</span>` : ''}
            <span class="prio">${esc(pri.label)}</span>
          </div>
        </ion-label>
      </ion-item>
      <ion-item-options side="end">
        <ion-item-option data-act="edit"><ion-icon slot="top" name="create-outline" aria-hidden="true"></ion-icon>Editar</ion-item-option>
        <ion-item-option color="danger" data-act="delete"><ion-icon slot="top" name="trash-outline" aria-hidden="true"></ion-icon>Excluir</ion-item-option>
      </ion-item-options>
    </ion-item-sliding>`;
}

function render() {
  const all = store.getAll();
  const visible = sortTasks(filterTasks(all, filters), filters.sort, toISO(new Date()));
  renderSummary(all);
  renderChips();

  $('list').hidden = !visible.length;
  $('swipe-hint').hidden = !visible.length;
  $('empty').hidden = !!visible.length;
  if (!visible.length) {
    $('list').innerHTML = '';
    $('empty').innerHTML = all.length
      ? '<strong>Nada encontrado</strong>Ajuste a busca ou os filtros.'
      : '<strong>Tudo em dia ✨</strong>Digite abaixo, por exemplo:<br><em>“Pagar boleto sexta #financas”</em><br>e o app entende prazo, categoria e prioridade.';
    return;
  }
  $('list').innerHTML = visible.map(taskHTML).join('');
}

/* ============================ adição rápida ============================ */

function describe(task) {
  const bits = [getCategory(task.category).label, `prioridade ${getPriority(task.priority).label.toLowerCase()}`];
  const due = dueLabel(task);
  if (due) bits.push(due.text.replace(/^Atrasada · /, ''));
  return bits.join(' · ');
}

async function quickAdd() {
  const input = $('quick-input');
  const text = String(input.value ?? '').trim();
  if (!text) return;
  const parsed = parseQuickAdd(text);
  let task;
  try {
    task = await store.add({ ...parsed });
  } catch (err) {
    saveFailed(err); // mantém o texto no campo para tentar de novo
    return;
  }
  input.value = '';
  // se os filtros esconderem a nova tarefa, limpa-os para o usuário ver a nova tarefa
  if (!filterTasks([task], filters).length) resetFilters();
  showToast(`Adicionada: ${describe(task)}`);
  input.setFocus();
}

$('quick').addEventListener('submit', (e) => {
  e.preventDefault();
  quickAdd();
});
$('quick-input').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault(); // evita o submit implícito duplicado
  quickAdd();
});

function resetFilters() {
  Object.assign(filters, { query: '', status: 'all', category: 'all', priority: 'all' });
  $('search').value = '';
  $('status').value = 'all';
  $('f-priority').value = 'all';
  render();
}

/* ============================ busca e filtros ============================ */

$('search').addEventListener('ionInput', (e) => {
  filters.query = e.target.value ?? '';
  render();
});

$('status').addEventListener('ionChange', (e) => {
  filters.status = e.detail.value;
  render();
});

function pickChip(e, attr) {
  if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return null;
  const chip = e.target.closest(`ion-chip[${attr}]`);
  if (chip && e.type === 'keydown') e.preventDefault();
  return chip;
}

function onFilterChip(e) {
  const chip = pickChip(e, 'data-cat');
  if (!chip) return;
  filters.category = chip.dataset.cat;
  render();
  $('chips').querySelector(`[data-cat="${chip.dataset.cat}"]`)?.focus();
}
$('chips').addEventListener('click', onFilterChip);
$('chips').addEventListener('keydown', onFilterChip);

$('f-priority').addEventListener('ionChange', (e) => {
  filters.priority = e.detail.value;
  render();
});

$('f-sort').addEventListener('ionChange', (e) => {
  filters.sort = e.detail.value;
  render();
});

/* ============================ ações na lista ============================ */

$('list').addEventListener('ionChange', async (e) => {
  if (e.target.tagName !== 'ION-CHECKBOX') return;
  const row = e.target.closest('ion-item-sliding');
  try {
    await store.toggle(row.dataset.id);
  } catch (err) {
    saveFailed(err);
    render(); // devolve o checkbox ao estado salvo
  }
});

async function deleteTask(id) {
  const ok = await confirmAlert({ header: 'Excluir tarefa?', message: 'Essa ação não pode ser desfeita.', confirmText: 'Excluir' });
  if (!ok) return false;
  try {
    await store.remove(id);
    showToast('Tarefa excluída');
    return true;
  } catch (err) {
    saveFailed(err);
    return false;
  }
}

$('list').addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  const row = e.target.closest('ion-item-sliding');
  if (!el || !row) return;
  e.stopPropagation(); // o ion-item repassaria o toque ao checkbox
  const id = row.dataset.id;
  await row.close();
  if (el.dataset.act === 'delete') deleteTask(id);
  else openSheet(store.get(id));
}, true); // fase de captura: chega antes do clique do ion-item

$('list').addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.body[data-act="edit"]')) {
    e.preventDefault();
    openSheet(store.get(e.target.closest('ion-item-sliding').dataset.id));
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
  $('t-cats').innerHTML = CATEGORIES.map((c) => chipHTML(c, form.category === c.id, `role="radio" aria-checked="${form.category === c.id}"`)).join('');
  $('t-pri').value = form.priority;
}

function showError(msg) {
  $('t-error').textContent = msg;
  $('t-error').hidden = !msg;
}

async function openSheet(task = null) {
  if (!task && arguments.length) return; // tarefa sumiu (ex.: excluída em outra aba)
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
  showError('');
  $('hint-cat').hidden = true;
  $('hint-pri').hidden = true;
  renderFormChoices();
  await $('sheet').present();
  if (!task) $('t-title').setFocus();
}

const closeSheet = () => $('sheet').dismiss();

function applySuggestion() {
  if (form.touched.category && form.touched.priority) return;
  const title = String($('t-title').value ?? '');
  const s = suggest(title, $('t-due').value || null);
  if (!form.touched.category && s.category) {
    form.category = s.category;
    $('hint-cat').hidden = false;
  }
  if (!form.touched.priority) {
    form.priority = s.priority;
    $('hint-pri').hidden = !title.trim();
  }
  renderFormChoices();
}

$('t-title').addEventListener('ionInput', applySuggestion);
$('t-due').addEventListener('ionChange', applySuggestion);

function onFormChip(e) {
  const chip = pickChip(e, 'data-cat');
  if (!chip) return;
  form.category = chip.dataset.cat;
  form.touched.category = true;
  $('hint-cat').hidden = true;
  renderFormChoices();
  $('t-cats').querySelector(`[data-cat="${chip.dataset.cat}"]`)?.focus();
}
$('t-cats').addEventListener('click', onFormChip);
$('t-cats').addEventListener('keydown', onFormChip);

$('t-pri').addEventListener('ionChange', (e) => {
  form.priority = e.detail.value;
  form.touched.priority = true;
  $('hint-pri').hidden = true;
});

$('t-clear-due').addEventListener('click', () => {
  $('t-due').value = '';
  $('t-time').value = '';
  applySuggestion();
});

$('btn-new').addEventListener('click', () => openSheet());
$('f-cancel').addEventListener('click', closeSheet);

async function saveForm() {
  const data = {
    title: String($('t-title').value ?? ''),
    notes: String($('t-notes').value ?? ''),
    category: form.category,
    priority: form.priority,
    due: $('t-due').value || null,
    time: $('t-time').value || null
  };
  if (!data.title.trim()) {
    showError('Informe um título para a tarefa.');
    $('t-title').setFocus();
    return;
  }
  try {
    if (form.id) await store.update(form.id, data);
    else await store.add(data);
  } catch (err) {
    saveFailed(err); // formulário continua aberto, nada se perde
    return;
  }
  showToast(form.id ? 'Tarefa atualizada' : 'Tarefa criada');
  closeSheet();
}

$('f-save').addEventListener('click', saveForm);
$('task-form').addEventListener('submit', (e) => {
  e.preventDefault();
  saveForm();
});
$('t-title').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  saveForm();
});

$('t-delete').addEventListener('click', async () => {
  if (!form.id) return;
  if (await deleteTask(form.id)) closeSheet();
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

// Regras puras (sem DOM): categorias, datas, "inteligência" (parser de texto livre,
// sugestão de categoria/prioridade), filtros e ordenação.

export const CATEGORIES = [
  { id: 'trabalho', label: 'Trabalho', color: '#0a84ff' },
  { id: 'estudo', label: 'Estudo', color: '#af52de' },
  { id: 'pessoal', label: 'Pessoal', color: '#30b0c7' },
  { id: 'saude', label: 'Saúde', color: '#ff375f' },
  { id: 'financas', label: 'Finanças', color: '#ff9f0a' },
  { id: 'outros', label: 'Outros', color: '#8e8e93' }
];

export const PRIORITIES = [
  { id: 'alta', label: 'Alta', weight: 3, color: '#ff3b30' },
  { id: 'media', label: 'Média', weight: 2, color: '#ff9500' },
  { id: 'baixa', label: 'Baixa', weight: 1, color: '#34c759' }
];

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
export const getPriority = (id) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[1];

/* ------------------------------ datas ------------------------------ */

const pad = (n) => String(n).padStart(2, '0');

export function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, n) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** Dias entre a e b (b - a). */
export function diffDays(aIso, bIso) {
  const a = fromISO(aIso);
  const b = fromISO(bIso);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
}

function validDate(y, m, d) {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/* ------------------------------ texto ------------------------------ */

/** Minúsculas e sem acentos, preservando o comprimento da string (1 char -> 1 char). */
export function fold(s) {
  return String(s ?? '')
    .split('')
    .map((c) => c.normalize('NFD')[0].toLowerCase())
    .join('');
}

const CONNECTORS = new Set(['para', 'pra', 'as', 'a', 'em', 'no', 'na', 'dia', 'de', 'do', 'da', 'ate', 'e', 'com']);

function cleanTitle(raw) {
  let words = raw.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  while (words.length > 1 && CONNECTORS.has(fold(words[words.length - 1]))) words.pop();
  while (words.length > 1 && ['as', 'a', 'em', 'dia'].includes(fold(words[0]))) words.shift();
  const t = words.join(' ').replace(/[\s,;:\-–]+$/, '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

/* ------------------------ sugestões inteligentes ------------------------ */

const CATEGORY_KEYWORDS = {
  trabalho: ['reunia', 'relatorio', 'client', 'projeto', 'e-?mail', 'apresenta', 'proposta', 'deploy', 'servidor', 'chamado', 'equipe', 'orcamento', 'contrato', 'fornecedor', 'sprint', 'planilha', 'suporte', 'backup', 'banco de dado', 'entrega', 'escritorio', 'gestor', 'chefe'],
  estudo: ['estud', 'prova', 'curso', 'aula', 'faculdade', 'ler(?![a-z])', 'livro', 'tcc', 'exercicio', 'revisa', 'apostila', 'artigo', 'certifica', 'semin', 'pesquis', 'licao', 'trabalho da', 'trabalho de (?:historia|geografia|portugues|matematica)'],
  saude: ['medic', 'dentista', 'consulta', 'exame', 'remedio', 'academia', 'treino', 'corrida', 'caminhada', 'vacina', 'fisio', 'psic', 'terapia', 'saude', 'nutri'],
  financas: ['pagar', 'boleto', 'fatura', 'imposto', 'banco(?! de dado)', 'transfer', 'ipva', 'parcela', 'financi', 'cartao', 'salario', 'nota fiscal', 'declarac', 'irpf', 'conta de', 'cobranca', 'pix'],
  pessoal: ['aniversario', 'familia', 'mae(?![a-z])', 'pai(?![a-z])', 'casa(?![a-z])', 'mercado', 'supermercado', 'farmacia', 'comprar', 'limpar', 'lavar', 'viagem', 'amig', 'festa', 'cinema', 'presente', 'churrasco', 'cachorro', 'pet(?![a-z])']
};

const keywordRegex = (kw) => new RegExp(`(^|[^a-z0-9])(?:${kw})`);

const CATEGORY_MATCHERS = Object.entries(CATEGORY_KEYWORDS).map(([id, kws]) => [id, kws.map(keywordRegex)]);

/** Devolve o id da categoria mais provável ou null quando não há pistas. */
export function inferCategory(text) {
  const f = fold(text);
  let best = null;
  let bestScore = 0;
  for (const [id, regs] of CATEGORY_MATCHERS) {
    const score = regs.reduce((n, re) => n + (re.test(f) ? 1 : 0), 0);
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }
  return best;
}

const HIGH_RE = /(^|[^a-z0-9])(urgente|urgencia|importante|critic[oa]|asap|imediat|o quanto antes|prioridade|emergencia|inadiavel)/;
const LOW_RE = /(^|[^a-z0-9])(quando der|sem pressa|talvez|algum dia|opcional|se sobrar tempo|um dia)/;

/** Prioridade sugerida: palavras-chave > proximidade do prazo > média. */
export function inferPriority(text, due, today) {
  const f = fold(text);
  if (HIGH_RE.test(f)) return 'alta';
  if (LOW_RE.test(f)) return 'baixa';
  if (due && today) {
    const d = diffDays(today, due);
    if (d <= 1) return 'alta';
    if (d <= 7) return 'media';
  }
  return 'media';
}

export function suggest(title, due = null, now = new Date()) {
  return {
    category: inferCategory(title),
    priority: inferPriority(title, due, toISO(now))
  };
}

/* ------------------- adição rápida em linguagem natural ------------------- */

const B = '(^|[^a-z0-9])'; // fronteira à esquerda (grupo 1)
const E = '(?![a-z0-9])'; // fronteira à direita

/**
 * "Entregar relatório amanhã 14h #trabalho !alta"
 *  -> { title, category, priority, due, time, auto: { category, priority } }
 */
export function parseQuickAdd(text, now = new Date()) {
  const original = String(text ?? '').trim();
  let f = fold(original);
  const ranges = [];
  const today = toISO(now);

  const take = (re, fn) => {
    const m = re.exec(f);
    if (!m) return null;
    const start = m.index + (m[1] ? m[1].length : 0);
    const end = m.index + m[0].length;
    const res = fn(m);
    if (res === false || res === undefined || res === null) return null;
    ranges.push([start, end]);
    f = f.slice(0, start) + ' '.repeat(end - start) + f.slice(end);
    return res;
  };

  // #categoria e !prioridade explícitas
  const tagCategory = take(/(^|\s)#([a-z0-9_]+)/, (m) => {
    const c = CATEGORIES.find((x) => x.id.startsWith(m[2]) || fold(x.label).startsWith(m[2]));
    return c ? c.id : false;
  });
  const tagPriority = take(/(^|\s)!(alt|med|bai)[a-z]*/, (m) => ({ alt: 'alta', med: 'media', bai: 'baixa' })[m[2]]);

  // data
  let due =
    take(new RegExp(`${B}depois de amanha${E}`), () => addDays(today, 2)) ??
    take(new RegExp(`${B}amanha${E}`), () => addDays(today, 1)) ??
    take(new RegExp(`${B}hoje${E}`), () => today) ??
    take(new RegExp(`${B}em\\s+(\\d{1,3})\\s+(dias?|semanas?)${E}`), (m) => addDays(today, Number(m[2]) * (m[3].startsWith('semana') ? 7 : 1))) ??
    take(new RegExp(`${B}(?:proxim[oa]\\s+)?(domingo|segunda|terca|quarta|quinta|sexta|sabado)(?:[- ]feira)?${E}`), (m) => {
      const target = WEEKDAYS.indexOf(m[2]);
      return addDays(today, (target - now.getDay() + 7) % 7 || 7);
    }) ??
    take(/(^|[^a-z0-9])(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?![0-9/])/, (m) => {
      const day = Number(m[2]);
      const month = Number(m[3]);
      let year = m[4] ? Number(m[4]) : now.getFullYear();
      if (m[4] && m[4].length === 2) year += 2000;
      if (!validDate(year, month, day)) return false;
      let iso = toISO(new Date(year, month - 1, day));
      if (!m[4] && iso < today) iso = toISO(new Date(year + 1, month - 1, day));
      return iso;
    });

  // hora: 14h, 14h30, 14:30, às 14h
  const time = take(/(^|[^a-z0-9:])(?:(?:as|a)\s+)?(\d{1,2})(?:\s*h\s*(\d{2})?|:(\d{2}))(?![a-z0-9])/, (m) => {
    const h = Number(m[2]);
    const min = Number(m[3] ?? m[4] ?? 0);
    if (h > 23 || min > 59) return false;
    return `${pad(h)}:${pad(min)}`;
  });
  if (time && !due) due = today;

  // título = texto original sem os trechos reconhecidos
  let title = original;
  [...ranges].sort((a, b) => b[0] - a[0]).forEach(([s, e]) => {
    title = title.slice(0, s) + ' ' + title.slice(e);
  });
  title = cleanTitle(title) || original;

  const inferredCategory = inferCategory(title);
  const category = tagCategory ?? inferredCategory ?? 'outros';
  const priority = tagPriority ?? inferPriority(title, due, today);

  return {
    title,
    category,
    priority,
    due: due ?? null,
    time: time ?? null,
    auto: { category: !tagCategory, priority: !tagPriority }
  };
}

/* ----------------------- filtros, ordenação e resumo ----------------------- */

export function filterTasks(tasks, { query = '', status = 'all', category = 'all', priority = 'all' } = {}) {
  const q = fold(query).trim();
  return tasks.filter((t) => {
    if (status === 'pending' && t.done) return false;
    if (status === 'done' && !t.done) return false;
    if (category !== 'all' && t.category !== category) return false;
    if (priority !== 'all' && t.priority !== priority) return false;
    if (q) {
      const hay = fold(`${t.title} ${t.notes || ''} ${getCategory(t.category).label} ${getPriority(t.priority).label}`);
      return q.split(/\s+/).every((word) => hay.includes(word));
    }
    return true;
  });
}

/** Quanto maior, mais urgente. */
export function urgencyScore(task, today) {
  let score = getPriority(task.priority).weight * 15;
  if (task.due) {
    const d = diffDays(today, task.due);
    if (d < 0) score += 100;
    else if (d === 0) score += 60;
    else if (d === 1) score += 40;
    else if (d <= 7) score += 20;
  }
  return score;
}

const dueKey = (t) => (t.due ? `${t.due}T${t.time || '23:59'}` : '9999');

export function sortTasks(tasks, mode = 'smart', today = toISO(new Date())) {
  const byRecent = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);
  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));

  const cmp = {
    smart: (a, b) => urgencyScore(b, today) - urgencyScore(a, today) || dueKey(a).localeCompare(dueKey(b)) || byRecent(a, b),
    due: (a, b) => dueKey(a).localeCompare(dueKey(b)) || byRecent(a, b),
    priority: (a, b) => getPriority(b.priority).weight - getPriority(a.priority).weight || dueKey(a).localeCompare(dueKey(b)) || byRecent(a, b),
    recent: byRecent
  }[mode] || byRecent;

  return [...pending.sort(cmp), ...done];
}

export function summarize(tasks, today = toISO(new Date())) {
  const pending = tasks.filter((t) => !t.done);
  return {
    total: tasks.length,
    pending: pending.length,
    done: tasks.length - pending.length,
    overdue: pending.filter((t) => t.due && t.due < today).length,
    today: pending.filter((t) => t.due === today).length
  };
}

/** Texto e "tom" do prazo para exibição na lista. */
export function dueLabel(task, now = new Date()) {
  if (!task.due) return null;
  const today = toISO(now);
  const d = diffDays(today, task.due);
  const dt = fromISO(task.due);
  const short = `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}${dt.getFullYear() !== now.getFullYear() ? '/' + dt.getFullYear() : ''}`;
  let text;
  let tone = 'normal';
  if (d < 0) {
    text = `Atrasada · ${short}`;
    tone = task.done ? 'normal' : 'overdue';
  } else if (d === 0) {
    text = 'Hoje';
    tone = task.done ? 'normal' : 'today';
  } else if (d === 1) {
    text = 'Amanhã';
  } else if (d <= 6) {
    text = WEEKDAY_LABELS[dt.getDay()];
  } else {
    text = short;
  }
  if (task.time) text += ` · ${task.time}`;
  return { text, tone };
}

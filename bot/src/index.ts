import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { loadTasks, saveTasks, createTask } from './storage.js';
import type { Task } from './storage.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set. Create bot/.env from bot/.env.example');
  process.exit(1);
}

const allowedIds = process.env.ALLOWED_USER_IDS
  ? process.env.ALLOWED_USER_IDS.split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean)
  : [];

const bot = new Telegraf(token);

// Access control middleware
bot.use((ctx, next) => {
  if (allowedIds.length === 0) return next();
  const userId = ctx.from?.id;
  if (userId && allowedIds.includes(userId)) return next();
  return ctx.reply('⛔ Доступ заборонено.');
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const PRIORITY_EMOJI: Record<Task['priority'], string> = {
  low: '🟢',
  medium: '🟡',
  high: '🔴',
};

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий',
};

function formatTask(task: Task, index: number): string {
  const status = task.completed ? '✅' : '⬜';
  const priority = PRIORITY_EMOJI[task.priority];
  const deadline = task.deadline ? ` 📅 ${task.deadline}` : '';
  const initiator = task.initiator ? ` 👤 ${task.initiator}` : '';
  return `${index}. ${status} ${priority} <b>${escapeHtml(task.title)}</b>${deadline}${initiator}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Parse: /add <title> [--priority low|medium|high] [--initiator name] [--deadline YYYY-MM-DD]
function parseAddArgs(text: string): { title: string; priority: Task['priority']; initiator: string; deadline: string } {
  let priority: Task['priority'] = 'medium';
  let initiator = '';
  let deadline = '';

  text = text.replace(/--priority\s+(low|medium|high)/i, (_, p) => {
    priority = p.toLowerCase() as Task['priority'];
    return '';
  });
  text = text.replace(/--initiator\s+(\S+)/i, (_, i) => {
    initiator = i;
    return '';
  });
  text = text.replace(/--deadline\s+(\d{4}-\d{2}-\d{2})/i, (_, d) => {
    deadline = d;
    return '';
  });

  return { title: text.trim(), priority, initiator, deadline };
}

// ─── Commands ────────────────────────────────────────────────────────────────

bot.command('start', async ctx => {
  await ctx.replyWithHTML(
    '👋 <b>Task Manager Bot</b>\n\n' +
    'Доступні команди:\n' +
    '/tasks — активні задачі\n' +
    '/all — всі задачі\n' +
    '/add &lt;назва&gt; — нова задача\n' +
    '/done &lt;номер&gt; — позначити виконаною\n' +
    '/undone &lt;номер&gt; — зняти позначку\n' +
    '/delete &lt;номер&gt; — видалити задачу\n' +
    '/info &lt;номер&gt; — деталі задачі\n' +
    '/help — ця довідка\n\n' +
    '<i>Для /add можна додати прапорці:\n' +
    '--priority low|medium|high\n' +
    '--initiator &lt;ім\'я&gt;\n' +
    '--deadline YYYY-MM-DD</i>'
  );
});

bot.command('help', async ctx => {
  await ctx.replyWithHTML(
    '<b>Команди бота:</b>\n\n' +
    '/tasks — активні задачі\n' +
    '/all — всі задачі (активні + виконані)\n' +
    '/add &lt;назва&gt; — нова задача\n' +
    '  <i>--priority low|medium|high</i>\n' +
    '  <i>--initiator &lt;ім\'я&gt;</i>\n' +
    '  <i>--deadline YYYY-MM-DD</i>\n' +
    '/done &lt;номер&gt; — позначити виконаною\n' +
    '/undone &lt;номер&gt; — зняти позначку виконання\n' +
    '/delete &lt;номер&gt> — видалити задачу\n' +
    '/info &lt;номер&gt; — деталі задачі з коментарями'
  );
});

bot.command('tasks', async ctx => {
  const tasks = loadTasks().filter(t => !t.completed);
  if (tasks.length === 0) {
    return ctx.reply('📭 Активних задач немає.');
  }
  const lines = tasks.map((t, i) => formatTask(t, i + 1));
  await ctx.replyWithHTML(`<b>Активні задачі (${tasks.length}):</b>\n\n` + lines.join('\n'));
});

bot.command('all', async ctx => {
  const tasks = loadTasks();
  if (tasks.length === 0) {
    return ctx.reply('📭 Задач немає.');
  }
  const active = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);
  let msg = `<b>Всі задачі:</b>\n`;
  if (active.length > 0) {
    msg += `\n<b>Активні (${active.length}):</b>\n` + active.map((t, i) => formatTask(t, i + 1)).join('\n');
  }
  if (done.length > 0) {
    msg += `\n\n<b>Виконані (${done.length}):</b>\n` + done.map((t, i) => formatTask(t, active.length + i + 1)).join('\n');
  }
  await ctx.replyWithHTML(msg);
});

bot.command('add', async ctx => {
  const input = ctx.message.text.replace(/^\/add\s*/i, '').trim();
  if (!input) {
    return ctx.reply('Вкажіть назву задачі. Наприклад:\n/add Зробити звіт --priority high --deadline 2025-12-31');
  }
  const { title, priority, initiator, deadline } = parseAddArgs(input);
  if (!title) {
    return ctx.reply('Назва задачі не може бути порожньою.');
  }
  const tasks = loadTasks();
  const task = createTask(title, priority, '', initiator, deadline);
  tasks.unshift(task);
  saveTasks(tasks);
  await ctx.replyWithHTML(
    `✅ Задачу додано!\n\n` +
    `<b>${escapeHtml(task.title)}</b>\n` +
    `Пріоритет: ${PRIORITY_EMOJI[priority]} ${PRIORITY_LABEL[priority]}` +
    (initiator ? `\nВиконавець: ${escapeHtml(initiator)}` : '') +
    (deadline ? `\nДедлайн: ${deadline}` : '')
  );
});

bot.command('done', async ctx => {
  const input = ctx.message.text.replace(/^\/done\s*/i, '').trim();
  const index = parseInt(input, 10);
  if (!index || isNaN(index)) {
    return ctx.reply('Вкажіть номер задачі зі списку /tasks. Наприклад: /done 2');
  }

  // Work on active tasks numbered list (same as /tasks)
  const tasks = loadTasks();
  const active = tasks.filter(t => !t.completed);
  const task = active[index - 1];
  if (!task) {
    return ctx.reply(`Задачу #${index} не знайдено. Перевірте список /tasks`);
  }
  const taskIndex = tasks.findIndex(t => t.id === task.id);
  tasks[taskIndex] = { ...task, completed: true, completedAt: Date.now() };
  saveTasks(tasks);
  await ctx.replyWithHTML(`✅ Виконано: <b>${escapeHtml(task.title)}</b>`);
});

bot.command('undone', async ctx => {
  const input = ctx.message.text.replace(/^\/undone\s*/i, '').trim();
  const index = parseInt(input, 10);
  if (!index || isNaN(index)) {
    return ctx.reply('Вкажіть номер задачі. Наприклад: /undone 1');
  }

  const tasks = loadTasks();
  const done = tasks.filter(t => t.completed);
  const task = done[index - 1];
  if (!task) {
    return ctx.reply(`Виконану задачу #${index} не знайдено.`);
  }
  const taskIndex = tasks.findIndex(t => t.id === task.id);
  const { completedAt: _, ...rest } = tasks[taskIndex];
  tasks[taskIndex] = { ...rest, completed: false };
  saveTasks(tasks);
  await ctx.replyWithHTML(`↩️ Відновлено: <b>${escapeHtml(task.title)}</b>`);
});

bot.command('delete', async ctx => {
  const input = ctx.message.text.replace(/^\/delete\s*/i, '').trim();
  const index = parseInt(input, 10);
  if (!index || isNaN(index)) {
    return ctx.reply('Вкажіть номер задачі зі списку /all. Наприклад: /delete 3');
  }

  const tasks = loadTasks();
  const task = tasks[index - 1];
  if (!task) {
    return ctx.reply(`Задачу #${index} не знайдено. Перевірте список /all`);
  }

  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback('🗑 Так, видалити', `confirm_delete:${task.id}`),
    Markup.button.callback('❌ Скасувати', 'cancel_delete'),
  ]);
  await ctx.replyWithHTML(
    `Видалити задачу?\n\n<b>${escapeHtml(task.title)}</b>`,
    keyboard
  );
});

bot.action(/^confirm_delete:(.+)$/, async ctx => {
  const taskId = ctx.match[1];
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    await ctx.answerCbQuery('Задачу не знайдено.');
    return ctx.editMessageText('Задачу не знайдено або вже видалено.');
  }
  saveTasks(tasks.filter(t => t.id !== taskId));
  await ctx.answerCbQuery('Видалено');
  await ctx.editMessageText(`🗑 Видалено: ${task.title}`);
});

bot.action('cancel_delete', async ctx => {
  await ctx.answerCbQuery('Скасовано');
  await ctx.deleteMessage();
});

bot.command('info', async ctx => {
  const input = ctx.message.text.replace(/^\/info\s*/i, '').trim();
  const index = parseInt(input, 10);
  if (!index || isNaN(index)) {
    return ctx.reply('Вкажіть номер задачі зі списку /all. Наприклад: /info 1');
  }

  const tasks = loadTasks();
  const task = tasks[index - 1];
  if (!task) {
    return ctx.reply(`Задачу #${index} не знайдено.`);
  }

  const status = task.completed ? '✅ Виконано' : '⬜ Активна';
  const priority = `${PRIORITY_EMOJI[task.priority]} ${PRIORITY_LABEL[task.priority]}`;
  const created = new Date(task.createdAt).toLocaleDateString('uk-UA');

  let msg = `<b>${escapeHtml(task.title)}</b>\n\n`;
  msg += `Статус: ${status}\n`;
  msg += `Пріоритет: ${priority}\n`;
  msg += `Створено: ${created}\n`;
  if (task.initiator) msg += `Виконавець: ${escapeHtml(task.initiator)}\n`;
  if (task.deadline) msg += `Дедлайн: ${task.deadline}\n`;
  if (task.description) msg += `\nОпис: ${escapeHtml(task.description)}\n`;
  if (task.completedAt) {
    msg += `Виконано: ${new Date(task.completedAt).toLocaleDateString('uk-UA')}\n`;
  }

  if (task.comments.length > 0) {
    msg += `\n<b>Коментарі (${task.comments.length}):</b>\n`;
    for (const c of task.comments) {
      const date = new Date(c.createdAt).toLocaleDateString('uk-UA');
      msg += `• <i>${escapeHtml(c.author)}</i> [${date}]: ${escapeHtml(c.text)}\n`;
    }
  }

  await ctx.replyWithHTML(msg);
});

// ─── Unknown messages ────────────────────────────────────────────────────────

bot.on(message('text'), async ctx => {
  await ctx.reply('Не розумію. Введіть /help щоб побачити доступні команди.');
});

// ─── Launch ──────────────────────────────────────────────────────────────────

bot.launch(() => {
  console.log('🤖 Task Manager Bot запущено');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

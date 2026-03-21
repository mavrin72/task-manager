// ============================================================
// Task Manager — Telegram Bot (Google Apps Script)
// ============================================================
// Розгортання:
//   1. Відкрий https://script.google.com → New project
//   2. Встав цей код
//   3. У рядку 8 встав свій BOT_TOKEN
//   4. Deploy → New deployment → Web app
//      Execute as: Me | Who has access: Anyone
//   5. Скопіюй URL деплою і запусти setWebhook() один раз
// ============================================================

var BOT_TOKEN = 'ВСТАВ_СВІЙ_ТОКЕН_ТУТ';
var TASKS_KEY = 'tasks';

// ─── Webhook setup ──────────────────────────────────────────

function setWebhook() {
  var url = ScriptApp.getService().getUrl();
  var res = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + BOT_TOKEN + '/setWebhook',
    { method: 'post', payload: { url: url } }
  );
  Logger.log(res.getContentText());
}

function doPost(e) {
  try {
    var update = JSON.parse(e.postData.contents);
    handleUpdate(update);
  } catch (err) {
    Logger.log('Error: ' + err.toString());
  }
  return ContentService.createTextOutput('ok');
}

// ─── Storage ────────────────────────────────────────────────

function loadTasks() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(TASKS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function saveTasks(tasks) {
  PropertiesService.getScriptProperties().setProperty(TASKS_KEY, JSON.stringify(tasks));
}

function createTask(title, priority, initiator, deadline) {
  return {
    id: Utilities.getUuid(),
    title: title,
    description: '',
    initiator: initiator || '',
    deadline: deadline || '',
    completed: false,
    priority: priority || 'medium',
    createdAt: Date.now(),
    comments: []
  };
}

// ─── Telegram helpers ────────────────────────────────────────

function sendMessage(chatId, text, parseMode) {
  var payload = { chat_id: chatId, text: text };
  if (parseMode) payload.parse_mode = parseMode;
  UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}

function answerCallback(callbackId, text) {
  UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/answerCallbackQuery', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ callback_query_id: callbackId, text: text || '' })
  });
}

function editMessage(chatId, messageId, text) {
  UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/editMessageText', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, message_id: messageId, text: text })
  });
}

function sendWithInlineKeyboard(chatId, text, buttons) {
  UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons }
    })
  });
}

// ─── Update router ───────────────────────────────────────────

function handleUpdate(update) {
  if (update.callback_query) {
    handleCallback(update.callback_query);
    return;
  }
  if (!update.message || !update.message.text) return;

  var msg = update.message;
  var chatId = msg.chat.id;
  var text = msg.text.trim();

  // Extract command and args
  var parts = text.split(/\s+/);
  var cmd = parts[0].toLowerCase().replace(/^\//, '').replace(/@.*$/, '');
  var args = text.replace(/^\/\S+\s*/, '').trim();

  switch (cmd) {
    case 'start':  cmdHelp(chatId); break;
    case 'help':   cmdHelp(chatId); break;
    case 'tasks':  cmdTasks(chatId); break;
    case 'all':    cmdAll(chatId); break;
    case 'add':    cmdAdd(chatId, args); break;
    case 'done':   cmdDone(chatId, args, false); break;
    case 'undone': cmdDone(chatId, args, true); break;
    case 'delete': cmdDelete(chatId, args); break;
    case 'info':   cmdInfo(chatId, args); break;
    default:
      sendMessage(chatId, 'Не розумію. Введіть /help щоб побачити команди.');
  }
}

function handleCallback(cb) {
  var chatId = cb.message.chat.id;
  var messageId = cb.message.message_id;
  var data = cb.data;

  if (data.indexOf('confirm_delete:') === 0) {
    var taskId = data.replace('confirm_delete:', '');
    var tasks = loadTasks();
    var task = null;
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === taskId) { task = tasks[i]; break; }
    }
    if (!task) {
      answerCallback(cb.id, 'Не знайдено');
      editMessage(chatId, messageId, 'Задачу не знайдено або вже видалено.');
      return;
    }
    saveTasks(tasks.filter(function(t) { return t.id !== taskId; }));
    answerCallback(cb.id, 'Видалено ✓');
    editMessage(chatId, messageId, '🗑 Видалено: ' + task.title);
  } else if (data === 'cancel_delete') {
    answerCallback(cb.id, 'Скасовано');
    editMessage(chatId, messageId, '❌ Скасовано');
  }
}

// ─── Commands ────────────────────────────────────────────────

var PRIORITY_EMOJI = { low: '🟢', medium: '🟡', high: '🔴' };
var PRIORITY_LABEL = { low: 'Низький', medium: 'Середній', high: 'Високий' };

function formatTask(task, index) {
  var status = task.completed ? '✅' : '⬜';
  var priority = PRIORITY_EMOJI[task.priority] || '🟡';
  var deadline = task.deadline ? ' 📅 ' + task.deadline : '';
  var initiator = task.initiator ? ' 👤 ' + task.initiator : '';
  return index + '. ' + status + ' ' + priority + ' <b>' + escHtml(task.title) + '</b>' + deadline + initiator;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseAddArgs(input) {
  var priority = 'medium';
  var initiator = '';
  var deadline = '';

  input = input.replace(/--priority\s+(low|medium|high)/i, function(_, p) {
    priority = p.toLowerCase(); return '';
  });
  input = input.replace(/--initiator\s+(\S+)/i, function(_, v) {
    initiator = v; return '';
  });
  input = input.replace(/--deadline\s+(\d{4}-\d{2}-\d{2})/i, function(_, v) {
    deadline = v; return '';
  });

  return { title: input.trim(), priority: priority, initiator: initiator, deadline: deadline };
}

function cmdHelp(chatId) {
  var text =
    '<b>Task Manager Bot</b>\n\n' +
    '/tasks — активні задачі\n' +
    '/all — всі задачі\n' +
    '/add &lt;назва&gt; — нова задача\n' +
    '  <i>--priority low|medium|high</i>\n' +
    '  <i>--initiator &lt;ім\'я&gt;</i>\n' +
    '  <i>--deadline YYYY-MM-DD</i>\n' +
    '/done &lt;номер&gt; — позначити виконаною\n' +
    '/undone &lt;номер&gt; — зняти позначку\n' +
    '/delete &lt;номер&gt; — видалити\n' +
    '/info &lt;номер&gt; — деталі задачі';
  sendMessage(chatId, text, 'HTML');
}

function cmdTasks(chatId) {
  var tasks = loadTasks().filter(function(t) { return !t.completed; });
  if (tasks.length === 0) {
    sendMessage(chatId, '📭 Активних задач немає.');
    return;
  }
  var lines = tasks.map(function(t, i) { return formatTask(t, i + 1); });
  sendMessage(chatId, '<b>Активні задачі (' + tasks.length + '):</b>\n\n' + lines.join('\n'), 'HTML');
}

function cmdAll(chatId) {
  var tasks = loadTasks();
  if (tasks.length === 0) {
    sendMessage(chatId, '📭 Задач немає.');
    return;
  }
  var active = tasks.filter(function(t) { return !t.completed; });
  var done = tasks.filter(function(t) { return t.completed; });
  var msg = '<b>Всі задачі:</b>';
  if (active.length > 0) {
    msg += '\n\n<b>Активні (' + active.length + '):</b>\n' + active.map(function(t, i) { return formatTask(t, i + 1); }).join('\n');
  }
  if (done.length > 0) {
    msg += '\n\n<b>Виконані (' + done.length + '):</b>\n' + done.map(function(t, i) { return formatTask(t, active.length + i + 1); }).join('\n');
  }
  sendMessage(chatId, msg, 'HTML');
}

function cmdAdd(chatId, input) {
  if (!input) {
    sendMessage(chatId, 'Вкажіть назву. Наприклад:\n/add Зробити звіт --priority high');
    return;
  }
  var parsed = parseAddArgs(input);
  if (!parsed.title) {
    sendMessage(chatId, 'Назва не може бути порожньою.');
    return;
  }
  var tasks = loadTasks();
  var task = createTask(parsed.title, parsed.priority, parsed.initiator, parsed.deadline);
  tasks.unshift(task);
  saveTasks(tasks);

  var reply = '✅ Задачу додано!\n\n<b>' + escHtml(task.title) + '</b>\n' +
    'Пріоритет: ' + PRIORITY_EMOJI[task.priority] + ' ' + PRIORITY_LABEL[task.priority];
  if (task.initiator) reply += '\nВиконавець: ' + escHtml(task.initiator);
  if (task.deadline) reply += '\nДедлайн: ' + task.deadline;
  sendMessage(chatId, reply, 'HTML');
}

function cmdDone(chatId, input, revert) {
  var index = parseInt(input, 10);
  if (!index || isNaN(index)) {
    sendMessage(chatId, 'Вкажіть номер. Наприклад: /' + (revert ? 'undone' : 'done') + ' 2');
    return;
  }
  var tasks = loadTasks();
  var pool = revert
    ? tasks.filter(function(t) { return t.completed; })
    : tasks.filter(function(t) { return !t.completed; });
  var task = pool[index - 1];
  if (!task) {
    sendMessage(chatId, 'Задачу #' + index + ' не знайдено.');
    return;
  }
  var idx = -1;
  for (var i = 0; i < tasks.length; i++) { if (tasks[i].id === task.id) { idx = i; break; } }
  if (revert) {
    tasks[idx].completed = false;
    delete tasks[idx].completedAt;
    sendMessage(chatId, '↩️ Відновлено: <b>' + escHtml(task.title) + '</b>', 'HTML');
  } else {
    tasks[idx].completed = true;
    tasks[idx].completedAt = Date.now();
    sendMessage(chatId, '✅ Виконано: <b>' + escHtml(task.title) + '</b>', 'HTML');
  }
  saveTasks(tasks);
}

function cmdDelete(chatId, input) {
  var index = parseInt(input, 10);
  if (!index || isNaN(index)) {
    sendMessage(chatId, 'Вкажіть номер зі списку /all. Наприклад: /delete 3');
    return;
  }
  var tasks = loadTasks();
  var task = tasks[index - 1];
  if (!task) {
    sendMessage(chatId, 'Задачу #' + index + ' не знайдено.');
    return;
  }
  sendWithInlineKeyboard(chatId, 'Видалити задачу?\n\n<b>' + escHtml(task.title) + '</b>', [
    [
      { text: '🗑 Так, видалити', callback_data: 'confirm_delete:' + task.id },
      { text: '❌ Скасувати', callback_data: 'cancel_delete' }
    ]
  ]);
}

function cmdInfo(chatId, input) {
  var index = parseInt(input, 10);
  if (!index || isNaN(index)) {
    sendMessage(chatId, 'Вкажіть номер зі списку /all. Наприклад: /info 1');
    return;
  }
  var tasks = loadTasks();
  var task = tasks[index - 1];
  if (!task) {
    sendMessage(chatId, 'Задачу #' + index + ' не знайдено.');
    return;
  }
  var status = task.completed ? '✅ Виконано' : '⬜ Активна';
  var priority = (PRIORITY_EMOJI[task.priority] || '🟡') + ' ' + (PRIORITY_LABEL[task.priority] || task.priority);
  var created = new Date(task.createdAt).toLocaleDateString('uk-UA');

  var msg = '<b>' + escHtml(task.title) + '</b>\n\n' +
    'Статус: ' + status + '\n' +
    'Пріоритет: ' + priority + '\n' +
    'Створено: ' + created + '\n';
  if (task.initiator) msg += 'Виконавець: ' + escHtml(task.initiator) + '\n';
  if (task.deadline) msg += 'Дедлайн: ' + task.deadline + '\n';
  if (task.description) msg += '\nОпис: ' + escHtml(task.description) + '\n';
  if (task.completedAt) msg += 'Виконано: ' + new Date(task.completedAt).toLocaleDateString('uk-UA') + '\n';

  if (task.comments && task.comments.length > 0) {
    msg += '\n<b>Коментарі (' + task.comments.length + '):</b>\n';
    task.comments.forEach(function(c) {
      var d = new Date(c.createdAt).toLocaleDateString('uk-UA');
      msg += '• <i>' + escHtml(c.author) + '</i> [' + d + ']: ' + escHtml(c.text) + '\n';
    });
  }

  sendMessage(chatId, msg, 'HTML');
}

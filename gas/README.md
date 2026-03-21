# Telegram Bot — Google Apps Script

Безкоштовний хостинг бота через Google Apps Script + Telegram Webhook.

## Розгортання (5 хвилин)

### 1. Відкрий Google Apps Script

Перейди на [script.google.com](https://script.google.com) → **New project**

### 2. Вставте код

Видали весь вміст `Code.gs` і встав код з файлу [`Code.gs`](./Code.gs).

У рядку з `BOT_TOKEN` встав свій токен:
```js
var BOT_TOKEN = '8686948955:AAHe...';
```

### 3. Задеплой як Web App

- Натисни **Deploy → New deployment**
- Type: **Web app**
- Execute as: **Me**
- Who has access: **Anyone**
- Натисни **Deploy** → скопіюй URL (виглядає як `https://script.google.com/macros/s/.../exec`)

### 4. Встанови Webhook

У редакторі Apps Script:
- Вибери функцію `setWebhook` у випадаючому списку функцій
- Натисни ▶ **Run**
- Перевір логи — має бути `{"ok":true,...}`

### 5. Готово!

Напиши боту `/start` в Telegram.

## Команди

| Команда | Дія |
|---------|-----|
| `/tasks` | Активні задачі |
| `/all` | Всі задачі |
| `/add <назва>` | Нова задача |
| `/add Назва --priority high --initiator Іван --deadline 2025-12-31` | З параметрами |
| `/done <номер>` | Позначити виконаною |
| `/undone <номер>` | Зняти позначку |
| `/delete <номер>` | Видалити (з підтвердженням) |
| `/info <номер>` | Деталі задачі |

## Зберігання даних

Задачі зберігаються у **PropertiesService** (вбудоване сховище Google Apps Script).
Ліміт: ~500 KB — достатньо для сотень задач.

import { useState, useEffect, useRef } from 'react';

const SITE_URL = 'https://hoe.com.ua/shutdown/new';
const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

function loadLastChecked(): number | null {
  const v = localStorage.getItem('poc-last-checked');
  return v ? parseInt(v, 10) : null;
}

function saveLastChecked(ts: number) {
  localStorage.setItem('poc-last-checked', String(ts));
}

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

export function PowerOutageChecker() {
  const [open, setOpen] = useState(false);
  const [lastChecked, setLastChecked] = useState<number | null>(loadLastChecked);
  const [countdown, setCountdown] = useState(0);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Countdown tick
  useEffect(() => {
    const tick = () => {
      if (lastChecked === null) { setCountdown(INTERVAL_MS); return; }
      setCountdown(Math.max(0, INTERVAL_MS - (Date.now() - lastChecked)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastChecked]);

  // Schedule browser notification
  useEffect(() => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    if (!lastChecked || notifPerm !== 'granted') return;
    const delay = Math.max(0, INTERVAL_MS - (Date.now() - lastChecked));
    if (delay > 0) {
      notifTimer.current = setTimeout(() => {
        new Notification('Час перевірити графік відключень', {
          body: 'Минула 1 година — перевір графік на hoe.com.ua',
        });
      }, delay);
    }
    return () => { if (notifTimer.current) clearTimeout(notifTimer.current); };
  }, [lastChecked, notifPerm]);

  const requestNotif = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  };

  const handleOpen = () => {
    window.open(SITE_URL, '_blank', 'noopener,noreferrer');
    const now = Date.now();
    setLastChecked(now);
    saveLastChecked(now);
  };

  const isDue = lastChecked === null || countdown === 0;
  const progress = lastChecked ? Math.min(1, (Date.now() - lastChecked) / INTERVAL_MS) : 0;

  return (
    <div className={`poc-card${open ? ' poc-card--open' : ''}${isDue ? ' poc-card--due' : ''}`}>
      <button className="poc-header" onClick={() => setOpen(v => !v)}>
        <span className="poc-header__icon">⚡</span>
        <span className="poc-header__title">Графік відключень</span>
        {isDue && <span className="poc-badge poc-badge--due">Час перевірити</span>}
        {!isDue && <span className="poc-badge">{fmt(countdown)}</span>}
        <span className={`expand-arrow${open ? ' expanded' : ''}`}>›</span>
      </button>

      {open && (
        <div className="poc-body">
          {/* Progress bar */}
          <div className="poc-progress-track">
            <div className="poc-progress-bar" style={{ width: `${progress * 100}%` }} />
          </div>

          <div className="poc-info">
            {lastChecked ? (
              <>
                <span className="poc-info__label">Остання перевірка</span>
                <span className="poc-info__value">{fmtTime(lastChecked)}</span>
                <span className="poc-info__sep">·</span>
                <span className="poc-info__label">Наступна через</span>
                <span className={`poc-info__value${isDue ? ' poc-info__value--due' : ''}`}>
                  {isDue ? 'зараз!' : fmt(countdown)}
                </span>
              </>
            ) : (
              <span className="poc-info__label">Ще не перевіряли — натисни кнопку нижче</span>
            )}
          </div>

          <div className="poc-actions">
            <button className={`btn${isDue ? ' btn-add' : ' btn-cancel'} poc-btn-open`} onClick={handleOpen}>
              ⚡ Відкрити графік
            </button>

            {notifPerm !== 'granted' && notifPerm !== 'denied' && (
              <button className="btn btn-comment" onClick={requestNotif} title="Отримувати сповіщення кожну годину">
                🔔 Сповіщення
              </button>
            )}
            {notifPerm === 'granted' && (
              <span className="poc-notif-ok">🔔 Сповіщення увімкнено</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

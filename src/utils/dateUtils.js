import { MONTHS, MONTHS_S, DOW, DOW_S } from './constants.js';

export const pad = (n) => String(n).padStart(2, '0');

export const toISO = (d) => {
  if (!(d instanceof Date) || isNaN(d)) return '';
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
};

export const todayISO = () => toISO(new Date());

export const fromISO = (s) => {
  if (!s) return new Date();
  const p = String(s).split('-').map(Number);
  return new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
};

export const addDays = (iso, n) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

export const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export const mKey = (iso) => String(iso || '').slice(0, 7);

export const diffDays = (a, b) => Math.round((fromISO(a) - fromISO(b)) / 86400000);

export const uid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
};

export const num = (v) => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const fmtLong = (iso) => {
  if (!isDate(iso)) return '—';
  const d = fromISO(iso);
  return DOW[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
};

export const fmtMed = (iso) => {
  if (!isDate(iso)) return '—';
  const d = fromISO(iso);
  return d.getDate() + ' ' + MONTHS_S[d.getMonth()] + ' ' + d.getFullYear();
};

export const fmtShort = (iso) => {
  if (!isDate(iso)) return '—';
  const d = fromISO(iso);
  return d.getDate() + ' ' + MONTHS_S[d.getMonth()];
};

export const relDay = (iso) => {
  if (!isDate(iso)) return '';
  const d = diffDays(iso, todayISO());
  return d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d === -1 ? 'Yesterday' : d > 1 ? 'in ' + d + ' days' : Math.abs(d) + ' days ago';
};

export function fmtRange(fromISOStr, toISOStr) {
  if (!isDate(fromISOStr) && !isDate(toISOStr)) return '';
  const a = isDate(fromISOStr) ? fromISO(fromISOStr) : null;
  const b = isDate(toISOStr) ? fromISO(toISOStr) : a;
  const md = (d) => MONTHS[d.getMonth()] + ' ' + d.getDate();
  if (!a && b) return MONTHS[b.getMonth()] + ' ' + b.getDate() + ', ' + b.getFullYear();
  if (a && !b) return MONTHS[a.getMonth()] + ' ' + a.getDate() + ', ' + a.getFullYear();
  if (toISO(a) === toISO(b)) return md(a) + ', ' + a.getFullYear();
  if (a.getFullYear() === b.getFullYear()) {
    if (a.getMonth() === b.getMonth()) return md(a) + '–' + b.getDate() + ', ' + a.getFullYear();
    return md(a) + ' – ' + md(b) + ', ' + a.getFullYear();
  }
  return md(a) + ', ' + a.getFullYear() + ' – ' + md(b) + ', ' + b.getFullYear();
}

/**
 * Format travel date or date range string (from Google Script)
 */
export function formatTravelDate(value) {
  if (!value) return '';

  if (typeof value === 'string') {
    // 1. Handle Ranges with " to " separator
    if (value.toLowerCase().includes(' to ')) {
      const parts = value.split(/ to /i).map((v) => v.trim());
      if (parts.length === 2) {
        const start = new Date(parts[0]);
        const end = new Date(parts[1]);
        if (!isNaN(start) && !isNaN(end)) {
          return formatDateRange(start, end);
        }
      }
    }

    // 2. Already formatted string e.g. "February 10, 2026"
    if (/[a-z]/i.test(value) && (value.includes(',') || value.includes('–') || value.includes('-'))) {
      return value;
    }

    // 3. YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [yStr, mStr, dStr] = value.split('-');
      const m = parseInt(mStr, 10);
      const d = parseInt(dStr, 10);
      return `${MONTHS[m - 1]} ${d}, ${yStr}`;
    }
  }

  // Date object or fallback
  let d = value instanceof Date ? value : new Date(value);
  if (!isNaN(d.getTime())) {
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  return String(value).trim();
}

export function formatDateRange(start, end) {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    return `${MONTHS[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }
  if (!sameMonth && sameYear) {
    return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${MONTHS[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

export function parseSortDate(v) {
  if (v instanceof Date) {
    return isNaN(v.getTime()) ? Infinity : v.getTime();
  }
  let s = String(v || '').trim();
  if (s.startsWith("'")) s = s.substring(1).trim();
  if (!s) return Infinity;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  }

  if (/[a-z]+\s+\d+\s*[-–]/i.test(s)) {
    const matchYear = s.match(/(\d{4})/);
    if (matchYear) {
      const year = matchYear[1];
      const startMatch = s.match(/^([a-z]+\s+\d+)/i);
      if (startMatch) {
        const d = new Date(startMatch[1] + ', ' + year);
        if (!isNaN(d.getTime())) return d.getTime();
      }
    }
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.getTime();
  return 0;
}

export function makeRequestId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const min = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  const rnd = Math.floor(Math.random() * 900) + 100;
  return `REQ-${y}${m}${d}-${h}${min}${s}-${rnd}`;
}

export function makeBatchId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const min = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  return `BATCH-${y}${m}${d}-${h}${min}${s}`;
}

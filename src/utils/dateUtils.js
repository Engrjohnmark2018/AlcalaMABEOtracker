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

export function formatDatePrepared(value) {
  if (!value) {
    const now = new Date();
    return `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  }

  // 1. If it's a number or numeric string representing an Excel serial date
  const numVal = Number(value);
  if (!isNaN(numVal) && numVal > 20000 && numVal < 80000) {
    const utcDays = Math.floor(numVal - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  }

  const s = String(value).trim();

  // 2. Already formatted: "October 11, 2026"
  if (/^[A-Za-z]+\s+\d{1,2},\s*\d{4}$/.test(s)) {
    return s;
  }

  // 3. YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [yStr, mStr, dStr] = s.split('-');
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);
    return `${MONTHS[m - 1]} ${d}, ${yStr}`;
  }

  // 4. Fallback date parse
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return `${MONTHS[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()}`;
  }

  return s;
}

export function parseDateRangeToISO(str) {
  if (!str) return { from: '', to: '' };
  const s = String(str).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return { from: s, to: s };
  if (s.includes(' to ')) {
    const parts = s.split(' to ');
    return { from: parts[0].trim(), to: (parts[1] || parts[0]).trim() };
  }
  const single = s.match(/^([A-Za-z]+)\s+([\d\s,]+),?\s*(\d{4})$/);
  if (single) {
    const m = MONTHS.findIndex((x) => x.toLowerCase() === single[1].toLowerCase());
    if (m >= 0) {
      const dayNums = single[2].split(/[,\s]+/).map(Number).filter((n) => n > 0 && n <= 31);
      if (dayNums.length) {
        const minD = Math.min(...dayNums);
        const maxD = Math.max(...dayNums);
        const y = single[3];
        const ms = String(m + 1).padStart(2, '0');
        return {
          from: `${y}-${ms}-${String(minD).padStart(2, '0')}`,
          to: `${y}-${ms}-${String(maxD).padStart(2, '0')}`
        };
      }
    }
  }
  const intraMonth = s.match(/^([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2}),?\s*(\d{4})$/);
  if (intraMonth) {
    const m = MONTHS.findIndex((x) => x.toLowerCase() === intraMonth[1].toLowerCase());
    if (m >= 0) {
      const d1 = String(intraMonth[2]).padStart(2, '0');
      const d2 = String(intraMonth[3]).padStart(2, '0');
      const y = intraMonth[4];
      const ms = String(m + 1).padStart(2, '0');
      return { from: `${y}-${ms}-${d1}`, to: `${y}-${ms}-${d2}` };
    }
  }
  const interMonth = s.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,?\s*(\d{4}))?\s*[-–]\s*([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})$/);
  if (interMonth) {
    const m1 = MONTHS.findIndex((x) => x.toLowerCase() === interMonth[1].toLowerCase());
    const m2 = MONTHS.findIndex((x) => x.toLowerCase() === interMonth[4].toLowerCase());
    const y2 = interMonth[6];
    const y1 = interMonth[3] || y2;
    if (m1 >= 0 && m2 >= 0) {
      return {
        from: `${y1}-${String(m1 + 1).padStart(2, '0')}-${String(interMonth[2]).padStart(2, '0')}`,
        to: `${y2}-${String(m2 + 1).padStart(2, '0')}-${String(interMonth[5]).padStart(2, '0')}`
      };
    }
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const iso = toISO(parsed);
    return { from: iso, to: iso };
  }
  return { from: '', to: '' };
}

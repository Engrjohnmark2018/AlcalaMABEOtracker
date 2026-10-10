import { todayISO, isDate, diffDays, toISO, fromISO } from './dateUtils.js';

export const isOpen = (e) => e.status === 'open' || e.status === 'pend';
export const isOverdue = (e) => isOpen(e) && isDate(e.dueDate) && e.dueDate < todayISO();
export function plotDate(e, mode = 'auto') {
  if (mode === 'done') return e.completedDate || e.dueDate || e.startDate || '';
  if (mode === 'due') return e.dueDate || e.completedDate || e.startDate || '';
  return e.status === 'done' ? e.completedDate || e.dueDate || e.startDate || '' : e.dueDate || e.startDate || e.completedDate || '';
}
export function summarize(list) {
  const s = { total: list.length, done: 0, open: 0, pend: 0, cancel: 0, overdue: 0, ben: 0, dueSoon: 0 };
  for (const e of list) {
    if (e.status in s) s[e.status]++;
    if (isOverdue(e)) s.overdue++;
    else if (isOpen(e) && isDate(e.dueDate) && diffDays(e.dueDate, todayISO()) >= 0 && diffDays(e.dueDate, todayISO()) <= 7) s.dueSoon++;
    s.ben += Number(e.beneficiaries) || 0;
  }
  const active = s.done + s.open + s.pend;
  return { ...s, rate: active ? Math.round(s.done / active * 100) : 0 };
}
export function entriesForDate(entries, iso, mode = 'auto') {
  const done = [], unfinished = [], spanning = [];
  for (const e of entries) {
    if (plotDate(e, mode) === iso) (e.status === 'done' ? done : unfinished).push(e);
    else if (isOpen(e) && isDate(e.startDate) && isDate(e.dueDate) && e.startDate <= iso && iso <= e.dueDate) spanning.push(e);
  }
  return { done, unfinished, spanning };
}
export const travelsOn = (travels, iso) => travels.filter(t => isDate(t.from) && isDate(t.to) && t.from <= iso && iso <= t.to);
export const overlapsRange = (t, from, to) => isDate(t.from) && isDate(t.to) && (!to || t.from <= to) && (!from || t.to >= from);
export const travelDays = (t) => isDate(t.from) && isDate(t.to) && t.to >= t.from ? diffDays(t.to, t.from) + 1 : 0;
export function monthCells(y, m, weekStart = 0) {
  const lead = (new Date(y, m, 1).getDay() - Number(weekStart) + 7) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  return Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => i < lead || i >= lead + days ? '' : toISO(new Date(y, m, i - lead + 1)));
}
export function reportRange(preset, from = '', to = '', today = todayISO()) {
  const d = fromISO(today), y = d.getFullYear(), m = d.getMonth();
  if (preset === 'custom') return { from, to };
  if (preset === 'all') return { from: '', to: '' };
  if (preset === 'last-month') return { from: toISO(new Date(y, m - 1, 1)), to: toISO(new Date(y, m, 0)) };
  if (preset === 'last-30') return { from: toISO(new Date(y, m, d.getDate() - 29)), to: today };
  return { from: toISO(new Date(y, preset === 'year' ? 0 : preset === 'quarter' ? Math.floor(m / 3) * 3 : m, 1)), to: today };
}

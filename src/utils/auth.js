import { AUTH, AKEY, MAX_TRIES, COOL_MS, ROLES } from './constants.js';
import { lsObj, sGet, sSet, sDel } from './storage.js';

export { MAX_TRIES };

export function bytesOf(str) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
  const out = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 128) out.push(c);
    else if (c < 2048) out.push(192 | (c >> 6), 128 | (c & 63));
    else out.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
  }
  return out;
}

export function hexOf(buf) {
  let s = '';
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
  return s;
}

export function fallbackHash(str) {
  let h = 5381;
  const b = bytesOf(str);
  for (let i = 0; i < b.length; i++) h = ((h * 33) ^ b[i]) >>> 0;
  return h.toString(16);
}

export async function pwHashes(pw, salt) {
  const salted = (salt || '') + pw;
  let sha = '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
      sha = hexOf(await window.crypto.subtle.digest('SHA-256', bytesOf(salted)));
    }
  } catch (e) {
    sha = '';
  }
  return { sha256: sha, fb: fallbackHash(salted) };
}

export function makeSalt() {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const a = new Uint8Array(16);
      window.crypto.getRandomValues(a);
      return hexOf(a.buffer);
    }
  } catch (e) {}
  return 's' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const matchMaster = (h) => (!!h.sha256 && h.sha256 === AUTH.sha256) || h.fb === AUTH.fallback;
export const matchUser = (h, u) => (!!h.sha256 && !!u.sha && h.sha256 === u.sha) || (!!u.fb && h.fb === u.fb);

export function failsInfo() {
  try {
    return JSON.parse(sGet(lsObj('l'), AKEY.fails)) || { n: 0, t: 0 };
  } catch (e) {
    return { n: 0, t: 0 };
  }
}

export function failsSave(o) {
  sSet(lsObj('l'), AKEY.fails, JSON.stringify(o));
}

export function coolRemaining() {
  const f = failsInfo();
  if ((f.n || 0) < MAX_TRIES) return 0;
  const left = (f.t || 0) + COOL_MS - Date.now();
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

export function devRec() {
  try {
    return JSON.parse(sGet(lsObj('l'), AKEY.dev) || 'null') || null;
  } catch (e) {
    return null;
  }
}

export function devSave(o) {
  sSet(lsObj('l'), AKEY.dev, JSON.stringify(o));
}

export function sesRec() {
  try {
    return JSON.parse(sGet(lsObj('s'), AKEY.ses) || 'null') || null;
  } catch (e) {
    return null;
  }
}

export function sesSave(id) {
  sSet(lsObj('s'), AKEY.ses, JSON.stringify({ u: id, t: Date.now() }));
}

export function sesClear() {
  sDel(lsObj('s'), AKEY.ses);
}

export function canDo(role, perm) {
  return !!(ROLES[role] && ROLES[role].can && ROLES[role].can[perm]);
}

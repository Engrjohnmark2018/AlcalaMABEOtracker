// Storage utilities: localStorage shim + IndexedDB for files

const mem = {};
const LS_OK = (function () {
  try {
    const k = '__abe_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
})();

export const store = {
  get(k) {
    if (LS_OK) {
      try {
        return localStorage.getItem(k);
      } catch (e) {}
    }
    return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
  },
  set(k, v) {
    if (LS_OK) {
      try {
        localStorage.setItem(k, v);
        return;
      } catch (e) {}
    }
    mem[k] = v;
  },
  del(k) {
    if (LS_OK) {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    }
    delete mem[k];
  }
};

export function lsObj(kind) {
  try {
    return kind === 's' ? window.sessionStorage : window.localStorage;
  } catch (e) {
    return null;
  }
}
export function sGet(st, k) {
  try {
    return st && st.getItem(k);
  } catch (e) {
    return null;
  }
}
export function sSet(st, k, v) {
  try {
    if (st) st.setItem(k, v);
  } catch (e) {}
}
export function sDel(st, k) {
  try {
    if (st) st.removeItem(k);
  } catch (e) {}
}

export function abToB64(buf) {
  const b = new Uint8Array(buf);
  let s = '';
  const CH = 0x8000;
  for (let i = 0; i < b.length; i += CH) {
    s += String.fromCharCode.apply(null, b.subarray(i, i + CH));
  }
  return btoa(s);
}

export function b64ToAb(b64) {
  const bin = atob(b64);
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return b.buffer;
}

export function downloadBinary(filename, bytes, mime) {
  try {
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1500);
    return true;
  } catch (e) {
    return false;
  }
}

/* ---------------- IndexedDB for file templates ---------------- */
export const TO_DB = 'abe-alcala-b.files';
export const TO_STORE = 'templates';
export const TO_REC = 'totemplate';
export const TO_KEY = 'abe-alcala-b.to-template';
export const TO_META_KEY = 'abe-alcala-b.to-meta';
export const TO_DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const TO_MAX_BYTES = 20971520;
export const TO_MAX_BYTES_LS = 1500000;

let toIdbDb = null;
let toIdbOpening = null;
let toTplMeta = null;

function toIdb() {
  if (toIdbDb) return Promise.resolve(toIdbDb);
  if (toIdbOpening) return toIdbOpening;
  toIdbOpening = new Promise((resolve) => {
    let req;
    try {
      if (!window.indexedDB || typeof window.indexedDB.open !== 'function') return resolve(null);
      req = window.indexedDB.open(TO_DB, 2);
    } catch (e) {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TO_STORE)) db.createObjectStore(TO_STORE);
      if (!db.objectStoreNames.contains('tev_templates')) db.createObjectStore('tev_templates');
    };
    req.onsuccess = () => {
      toIdbDb = req.result;
      resolve(toIdbDb);
    };
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  }).then((db) => {
    if (!db) toIdbOpening = null;
    return db;
  });
  return toIdbOpening;
}

function toIdbRun(storeName, mode, fn) {
  return toIdb().then((db) => new Promise((resolve) => {
    if (!db) return resolve(null);
    try {
      const tx = db.transaction(storeName, mode);
      const rq = fn(tx.objectStore(storeName));
      rq.onsuccess = () => resolve(rq.result === undefined ? true : rq.result);
      rq.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  }));
}

export function toMetaSave() {
  try {
    if (toTplMeta) store.set(TO_META_KEY, JSON.stringify(toTplMeta));
    else store.del(TO_META_KEY);
  } catch (e) {}
}

export function toTemplateGet() {
  return toTplMeta;
}

export async function toTemplateBytes() {
  const rec = await toIdbRun(TO_STORE, 'readonly', (st) => st.get(TO_REC));
  if (rec && rec.bytes) return rec.bytes;
  try {
    const legacy = JSON.parse(store.get(TO_KEY) || 'null');
    if (legacy && legacy.data) return b64ToAb(legacy.data);
  } catch (e) {}
  return null;
}

export async function toTemplateSave(rec) {
  const saved = await toIdbRun(TO_STORE, 'readwrite', (st) => st.put(rec, TO_REC));
  if (saved) {
    const { bytes, ...meta } = rec;
    toTplMeta = { ...meta, where: 'idb' };
    toMetaSave();
    return 'idb';
  }
  if (rec.size > TO_MAX_BYTES_LS) {
    throw new Error('Fallback storage is limited to 1.5MB. Please use smaller template without large images.');
  }
  try {
    store.set(TO_KEY, JSON.stringify({
      name: rec.name, size: rec.size, at: rec.at, found: rec.found,
      missing: rec.missing, extra: rec.extra, paths: rec.paths, data: abToB64(rec.bytes)
    }));
  } catch (e) {
    throw new Error('Browser storage full.');
  }
  const { bytes, ...meta } = rec;
  toTplMeta = { ...meta, where: 'local' };
  toMetaSave();
  return 'local';
}

export async function toTemplateClear() {
  await toIdbRun(TO_STORE, 'readwrite', (st) => st.delete(TO_REC));
  try { store.del(TO_KEY); } catch (e) {}
  toTplMeta = null;
  toMetaSave();
}

export async function toTemplateBoot() {
  try {
    toTplMeta = JSON.parse(store.get(TO_META_KEY) || 'null') || null;
  } catch (e) {
    toTplMeta = null;
  }
  const rec = await toIdbRun(TO_STORE, 'readonly', (st) => st.get(TO_REC));
  if (rec && rec.bytes) {
    toTplMeta = {
      name: rec.name, size: rec.size, at: rec.at,
      found: rec.found, missing: rec.missing, extra: rec.extra,
      paths: rec.paths, where: 'idb'
    };
    toMetaSave();
    return toTplMeta;
  }
  try {
    const legacy = JSON.parse(store.get(TO_KEY) || 'null');
    if (legacy?.data) {
      const { data, ...meta } = legacy;
      toTplMeta = { ...meta, where: 'local' };
      toMetaSave();
    }
  } catch (e) {}
  return toTplMeta;
}

/* ---------------- TEV Custom Templates in IndexedDB ---------------- */
export async function tevTemplateGet(key) {
  return await toIdbRun('tev_templates', 'readonly', (st) => st.get(key));
}

export async function tevTemplateSave(key, rec) {
  return await toIdbRun('tev_templates', 'readwrite', (st) => st.put(rec, key));
}

export async function tevTemplateClear(key) {
  return await toIdbRun('tev_templates', 'readwrite', (st) => st.delete(key));
}

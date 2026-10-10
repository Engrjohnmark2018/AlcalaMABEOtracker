import { reactive, watch } from 'vue';
import {
  KEY, AKEY, AUTH, ROLES, STATUS, DEFAULT_SETTINGS,
  SEED_ENTRIES_RAW, DEFAULT_FARE_MATRIX, DEFAULT_TEV_REQUESTS
} from '../utils/constants';
import { store, sGet, sSet, sDel, lsObj } from '../utils/storage';
import {
  todayISO, toISO, fromISO, addDays, isDate, diffDays, uid, num,
  makeRequestId, formatTravelDate
} from '../utils/dateUtils';
import { pwHashes, matchMaster, matchUser, makeSalt } from '../utils/auth';

function seedEntries() {
  const T = todayISO();
  return SEED_ENTRIES_RAW.map((r) => {
    const [title, category, status, sOff, dOff, cOff, ben, remarks] = r;
    return cleanEntry({
      title,
      category,
      status,
      startDate: sOff === null ? '' : addDays(T, sOff),
      dueDate: dOff === null ? '' : addDays(T, dOff),
      completedDate: cOff === null ? '' : addDays(T, cOff),
      beneficiaries: ben,
      remarks,
      location: 'Municipal Hall / ABE Office',
      personnel: 'ABE Staff / Engineer',
      createdBy: 'seed',
      createdByName: 'ABE Staff'
    });
  });
}

export function cleanEntry(e) {
  const out = {
    id: e && e.id ? String(e.id) : uid(),
    title: String(e && e.title || '').trim(),
    category: String(e && e.category || 'Others').trim() || 'Others',
    status: STATUS[e && e.status] ? e.status : 'pend',
    startDate: isDate(e && e.startDate) ? e.startDate : '',
    dueDate: isDate(e && e.dueDate) ? e.dueDate : '',
    completedDate: isDate(e && e.completedDate) ? e.completedDate : '',
    location: String(e && e.location || '').trim(),
    personnel: String(e && e.personnel || '').trim(),
    beneficiaries: num(e && e.beneficiaries),
    remarks: String(e && e.remarks || '').trim(),
    createdAt: (e && e.createdAt) || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: String(e && e.createdBy || ''),
    createdByName: String(e && e.createdByName || ''),
    updatedBy: String(e && e.updatedBy || ''),
    updatedByName: String(e && e.updatedByName || ''),
    completedBy: String(e && e.completedBy || ''),
    completedByName: String(e && e.completedByName || ''),
    driveUrl: String(e && e.driveUrl || '').trim()
  };
  if (out.status === 'done' && !out.completedDate) {
    out.completedDate = out.dueDate || todayISO();
  }
  return out;
}

export function cleanUser(u) {
  return {
    id: u && u.id ? String(u.id) : uid(),
    username: String(u && u.username || '').trim().toLowerCase(),
    displayName: String(u && u.displayName || '').trim(),
    role: u && ROLES[u.role] ? u.role : 'editor',
    salt: String(u && u.salt || ''),
    sha: String(u && u.sha || ''),
    fb: String(u && u.fb || ''),
    active: !(u && u.active === false),
    createdAt: (u && u.createdAt) || new Date().toISOString(),
    updatedAt: (u && u.updatedAt) || '',
    lastLogin: (u && u.lastLogin) || ''
  };
}

export function cleanTravel(t) {
  return {
    id: t && t.id ? String(t.id) : uid(),
    travellerId: String(t && t.travellerId || ''),
    travellerName: String(t && t.travellerName || '').trim(),
    destination: String(t && t.destination || '').trim(),
    purpose: String(t && t.purpose || '').trim(),
    from: isDate(t && t.from) ? t.from : '',
    to: isDate(t && t.to) ? t.to : (isDate(t && t.from) ? t.from : ''),
    orderDate: isDate(t && t.orderDate) ? t.orderDate : todayISO(),
    docGenerated: !!(t && t.docGenerated),
    createdByName: String(t && t.createdByName || ''),
    createdAt: (t && t.createdAt) || new Date().toISOString(),
    updatedAt: (t && t.updatedAt) || ''
  };
}

export function cleanTevRequest(r) {
  return {
    GENERATE: r && (r.GENERATE === true || r.GENERATE === 1 || r.GENERATE === '1' || r.GENERATE === 'true'),
    REQUEST_ID: String(r && r.REQUEST_ID || makeRequestId()).trim(),
    CREATION_DATE: r && r.CREATION_DATE ? String(r.CREATION_DATE).trim() : todayISO(),
    DESTINATION: String(r && r.DESTINATION || '').trim(),
    ROUTE: String(r && r.ROUTE || '').trim(),
    TRANSPORTATION: String(r && r.TRANSPORTATION || '').trim(),
    FARE: num(r && r.FARE),
    DATE_OF_TRAVEL: formatTravelDate(r && r.DATE_OF_TRAVEL ? String(r.DATE_OF_TRAVEL).trim() : ''),
    PURPOSE: String(r && r.PURPOSE || '').trim(),
    DIEM: num(r && r.DIEM),
    BATCH_ID: String(r && r.BATCH_ID || '').trim(),
    OUTPUT_FOLDER_LINK: String(r && r.OUTPUT_FOLDER_LINK || '').trim(),
    TO_FILE_LINK: String(r && r.TO_FILE_LINK || '').trim(),
    IOT_FILE_LINK: String(r && r.IOT_FILE_LINK || '').trim(),
    COE_FILE_LINK: String(r && r.COE_FILE_LINK || '').trim(),
    CTC_FILE_LINK: String(r && r.CTC_FILE_LINK || '').trim()
  };
}

export const state = reactive({
  // App state
  settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
  meta: { seeded: true, updatedAt: '' },
  entries: [],
  users: [],
  travels: [],
  templates: [],
  trash: [],
  ppa: null,

  // TEV Automation State
  tevRequests: [],
  fareMatrix: JSON.parse(JSON.stringify(DEFAULT_FARE_MATRIX)),

  // Auth & UI session
  auth: { id: '', name: '', role: 'viewer', username: '' },
  isLocked: true,
  theme: 'light',
  activeTab: 'dashboard',

  // Calendar
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  calMode: 'auto',
  calView: 'month',
  selDate: todayISO(),

  // Filters & Sub-options
  filters: {
    q: '',
    status: '',
    category: '',
    location: '',
    user: '',
    from: '',
    to: '',
    sort: 'due-asc',
    quick: 'all'
  },
  savedFilters: [],
  ppaQ: '',
  ppaSort: { col: -1, dir: 1 },
  report: { preset: 'month', from: '', to: '', group: 'category' },
  wk: { mon: '', accomplished: true, paper: 'a4l' },

  // Toast
  toast: { show: false, message: '', isError: false, timer: null }
});

// Toast notification helper
export function notify(msg, isError = false) {
  if (state.toast.timer) clearTimeout(state.toast.timer);
  state.toast.message = msg;
  state.toast.isError = isError;
  state.toast.show = true;
  state.toast.timer = setTimeout(() => {
    state.toast.show = false;
  }, 3500);
}

// Persist state to local storage
export function saveState() {
  state.meta.updatedAt = new Date().toISOString();
  store.set(KEY.state, JSON.stringify({
    settings: state.settings,
    meta: state.meta,
    entries: state.entries,
    users: state.users,
    travels: state.travels,
    templates: state.templates,
    trash: state.trash,
    ppa: state.ppa
  }));
  // Save TEV state
  store.set(KEY.tev, JSON.stringify({
    tevRequests: state.tevRequests,
    fareMatrix: state.fareMatrix
  }));
}

export function saveUi() {
  store.set(KEY.ui, JSON.stringify({
    view: state.activeTab,
    theme: state.theme,
    calYear: state.calYear,
    calMonth: state.calMonth,
    calMode: state.calMode,
    calView: state.calView,
    selDate: state.selDate,
    f: state.filters,
    savedFilters: state.savedFilters,
    ppaQ: state.ppaQ,
    ppaSort: state.ppaSort,
    report: state.report,
    wk: state.wk
  }));
}

// Load state from storage on init
export function loadState() {
  try {
    const raw = store.get(KEY.state);
    if (raw) {
      const j = JSON.parse(raw);
      if (j && Array.isArray(j.entries)) {
        state.settings = Object.assign(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), j.settings || {});
        state.meta = Object.assign({ seeded: true }, j.meta || {});
        state.entries = j.entries.map(cleanEntry);
        state.users = Array.isArray(j.users) ? j.users.map(cleanUser) : [];
        state.travels = Array.isArray(j.travels) ? j.travels.map(cleanTravel) : [];
        state.templates = Array.isArray(j.templates) ? j.templates.map(cleanTemplate) : [];
        state.trash = Array.isArray(j.trash) ? j.trash.filter((r) => r && r.entry).map((r) => ({
          id: r.id || uid(), entry: cleanEntry(r.entry), deletedAt: r.deletedAt || '',
          deletedBy: r.deletedBy || '', deletedByName: r.deletedByName || '', reason: r.reason || ''
        })) : [];
        state.ppa = j.ppa || null;
      }
    } else {
      // First boot: initialize with seed entries
      state.entries = seedEntries();
      state.meta.seeded = true;
      saveState();
    }

    // Load TEV data
    const rawTev = store.get(KEY.tev);
    if (rawTev) {
      const t = JSON.parse(rawTev);
      if (Array.isArray(t.tevRequests)) {
        state.tevRequests = t.tevRequests.map(cleanTevRequest);
      }
      if (Array.isArray(t.fareMatrix) && t.fareMatrix.length > 0) {
        state.fareMatrix = t.fareMatrix;
      }
    } else {
      // Seed default TEV requests and fare matrix from template
      state.tevRequests = DEFAULT_TEV_REQUESTS.map(cleanTevRequest);
      state.fareMatrix = JSON.parse(JSON.stringify(DEFAULT_FARE_MATRIX));
      saveState();
    }

    // Load UI preferences
    const rawUi = store.get(KEY.ui);
    if (rawUi) {
      const u = JSON.parse(rawUi);
      if (u) {
        if (u.view) state.activeTab = u.view;
        if (u.theme) state.theme = u.theme;
        if (Number.isInteger(u.calYear)) state.calYear = u.calYear;
        if (Number.isInteger(u.calMonth) && u.calMonth >= 0 && u.calMonth < 12) state.calMonth = u.calMonth;
        if (['auto','due','done'].includes(u.calMode)) state.calMode = u.calMode;
        if (['month','year'].includes(u.calView)) state.calView = u.calView;
        if (isDate(u.selDate)) state.selDate = u.selDate;
        if (u.ppaSort) state.ppaSort = u.ppaSort;
        if (u.f) state.filters = Object.assign(state.filters, u.f);
        if (u.savedFilters) state.savedFilters = u.savedFilters;
        if (u.ppaQ) state.ppaQ = u.ppaQ;
        if (u.report) state.report = Object.assign(state.report, u.report);
        if (u.wk) state.wk = Object.assign(state.wk, u.wk);
      }
    }
  } catch (e) {
    console.error('Error loading state from storage:', e);
  }

  // Set theme on HTML root
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dataset.theme = state.theme === 'dark' ? 'dark' : 'light';
  }
}

export function cleanTemplate(t) {
  return {
    id: t && t.id ? String(t.id) : uid(),
    title: String(t && t.title || '').trim().slice(0, 160),
    category: String(t && t.category || 'Others').trim() || 'Others',
    location: String(t && t.location || '').trim(),
    personnel: String(t && t.personnel || '').trim(),
    remarks: String(t && t.remarks || '').trim(),
    days: Math.max(0, Math.min(365, num(t && t.days))),
    uses: Math.max(0, num(t && t.uses)),
    lastUsedAt: (t && t.lastUsedAt) || '',
    createdBy: String(t && t.createdBy || ''),
    createdByName: String(t && t.createdByName || ''),
    createdAt: (t && t.createdAt) || new Date().toISOString()
  };
}

// ----------------- Auth Actions -----------------
export async function tryUnlock(username, password, remember = false) {
  const uname = String(username || '').trim().toLowerCase();
  const pw = String(password || '');
  if (!pw) throw new Error('Please enter the password.');

  let ident = null;
  let disabled = false;

  // 1. Check user account
  const u = state.users.find((x) => x.username === uname);
  if (u) {
    if (!u.active) disabled = true;
    else {
      const h = await pwHashes(pw, u.salt);
      if (matchUser(h, u)) {
        ident = { id: u.id, name: u.displayName || u.username, username: u.username, role: u.role };
      }
    }
  }

  // 2. Check master password
  if (!ident && !disabled) {
    const h = await pwHashes(pw, AUTH.salt);
    if (matchMaster(h)) {
      ident = { id: 'master', name: 'Administrator (master password)', username: 'master', role: 'admin' };
    }
  }

  if (disabled) throw new Error('That account has been disabled. Ask an administrator.');
  if (!ident) throw new Error('Incorrect username or password.');

  state.auth = ident;
  state.isLocked = false;
  sSet(lsObj('s'), AKEY.ses, JSON.stringify({ u: ident.id, t: Date.now() }));
  sSet(lsObj('l'), AKEY.dev, JSON.stringify({ u: ident.id, rem: remember, lock: false }));

  if (ident.id !== 'master') {
    const uu = state.users.find((x) => x.id === ident.id);
    if (uu) {
      uu.lastLogin = new Date().toISOString();
      saveState();
    }
  }

  return ident;
}

export function lockNow(msg) {
  sDel(lsObj('s'), AKEY.ses);
  state.isLocked = true;
  state.auth = { id: '', name: '', role: 'viewer', username: '' };
  if (msg) notify(msg);
}

export function autoCheckSession() {
  try {
    const ses = JSON.parse(sGet(lsObj('s'), AKEY.ses) || 'null');
    if (ses && ses.u) {
      if (ses.u === 'master') {
        state.auth = { id: 'master', name: 'Administrator (master password)', username: 'master', role: 'admin' };
        state.isLocked = false;
        return;
      }
      const u = state.users.find((x) => x.id === ses.u);
      if (u && u.active) {
        state.auth = { id: u.id, name: u.displayName || u.username, username: u.username, role: u.role };
        state.isLocked = false;
        return;
      }
    }

    const dev = JSON.parse(sGet(lsObj('l'), AKEY.dev) || 'null');
    if (dev && dev.u && !dev.lock && dev.rem) {
      if (dev.u === 'master') {
        state.auth = { id: 'master', name: 'Administrator (master password)', username: 'master', role: 'admin' };
        state.isLocked = false;
        return;
      }
      const u = state.users.find((x) => x.id === dev.u);
      if (u && u.active) {
        state.auth = { id: u.id, name: u.displayName || u.username, username: u.username, role: u.role };
        state.isLocked = false;
        return;
      }
    }
  } catch (e) {}
  state.isLocked = true;
}

// ----------------- TEV Automation Actions -----------------
export function addTevRequest(payload) {
  const req = cleanTevRequest(payload);
  state.tevRequests.unshift(req);
  saveState();
  notify(`Added travel request: ${req.DESTINATION}`);
  return req;
}

export function updateTevRequest(requestId, payload) {
  const idx = state.tevRequests.findIndex((r) => r.REQUEST_ID === requestId);
  if (idx < 0) throw new Error('Request not found: ' + requestId);
  state.tevRequests[idx] = cleanTevRequest(Object.assign({}, state.tevRequests[idx], payload));
  saveState();
  notify('Request updated successfully.');
  return state.tevRequests[idx];
}

export function deleteTevRequest(requestId) {
  state.tevRequests = state.tevRequests.filter((r) => r.REQUEST_ID !== requestId);
  saveState();
  notify('Request deleted.');
}

export function deleteCheckedTevRequests() {
  const count = state.tevRequests.filter((r) => r.GENERATE).length;
  state.tevRequests = state.tevRequests.filter((r) => !r.GENERATE);
  saveState();
  notify(`Deleted ${count} request(s).`);
  return count;
}

export function toggleSelectAllTev(checked) {
  state.tevRequests.forEach((r) => {
    r.GENERATE = !!checked;
  });
  saveState();
}

export function toggleSelectTev(requestId, checked) {
  const r = state.tevRequests.find((x) => x.REQUEST_ID === requestId);
  if (r) {
    r.GENERATE = !!checked;
    saveState();
  }
}

export function updateTevBatch(requestIds, batchId, links = {}) {
  const idSet = new Set(requestIds);
  state.tevRequests.forEach((r) => {
    if (idSet.has(r.REQUEST_ID)) {
      r.BATCH_ID = batchId;
      r.GENERATE = false; // uncheck after generation
      if (links.to) r.TO_FILE_LINK = links.to;
      if (links.iot) r.IOT_FILE_LINK = links.iot;
      if (links.coe) r.COE_FILE_LINK = links.coe;
      if (links.ctc) r.CTC_FILE_LINK = links.ctc;
      if (links.folder) r.OUTPUT_FOLDER_LINK = links.folder;
    }
  });
  saveState();
}

// ----------------- Fare Matrix Actions -----------------
export function lookupFareByDestination(destName) {
  const d = String(destName || '').trim().toLowerCase();
  if (!d) return null;
  return state.fareMatrix.find((r) => r.destination.toLowerCase() === d) || null;
}

export function addFareDestination(item) {
  const dest = String(item.destination || '').trim();
  if (!dest) throw new Error('Destination name is required.');
  const existing = state.fareMatrix.find((r) => r.destination.toLowerCase() === dest.toLowerCase());
  if (existing) throw new Error('Destination already exists in fare matrix.');
  state.fareMatrix.push({
    destination: dest,
    route: String(item.route || '').trim(),
    transportation: String(item.transportation || 'Tricycle').trim(),
    fare: num(item.fare)
  });
  state.fareMatrix.sort((a, b) => a.destination.localeCompare(b.destination));
  saveState();
  notify(`Added ${dest} to fare matrix.`);
}

export function updateFareDestination(oldDest, item) {
  const idx = state.fareMatrix.findIndex((r) => r.destination.toLowerCase() === oldDest.toLowerCase());
  if (idx < 0) throw new Error('Destination not found: ' + oldDest);
  state.fareMatrix[idx] = {
    destination: String(item.destination || oldDest).trim(),
    route: String(item.route || '').trim(),
    transportation: String(item.transportation || '').trim(),
    fare: num(item.fare)
  };
  state.fareMatrix.sort((a, b) => a.destination.localeCompare(b.destination));
  saveState();
  notify(`Updated ${item.destination} in fare matrix.`);
}

export function deleteFareDestination(destName) {
  state.fareMatrix = state.fareMatrix.filter((r) => r.destination.toLowerCase() !== destName.toLowerCase());
  saveState();
  notify(`Removed ${destName} from fare matrix.`);
}

export function resetFareMatrix() {
  state.fareMatrix = JSON.parse(JSON.stringify(DEFAULT_FARE_MATRIX));
  saveState();
  notify('Fare matrix reset to Alcala defaults.');
}

// ----------------- Tasks CRUD Actions -----------------
export function addEntry(e) {
  const rec = cleanEntry(e);
  rec.createdBy = state.auth.id;
  rec.createdByName = state.auth.name;
  if (rec.status === 'done') {
    rec.completedBy = state.auth.id;
    rec.completedByName = state.auth.name;
  }
  state.entries.unshift(rec);
  saveState();
  notify(`Work logged: ${rec.title}`);
  return rec;
}

export function updateEntry(id, e) {
  const idx = state.entries.findIndex((x) => x.id === id);
  if (idx < 0) throw new Error('Entry not found');
  const prev = state.entries[idx];
  const rec = cleanEntry(Object.assign({}, prev, e));
  rec.updatedBy = state.auth.id;
  rec.updatedByName = state.auth.name;
  if (rec.status === 'done' && prev.status !== 'done') {
    rec.completedBy = state.auth.id;
    rec.completedByName = state.auth.name;
    if (!rec.completedDate) rec.completedDate = todayISO();
  }
  state.entries[idx] = rec;
  saveState();
  notify('Entry updated.');
  return rec;
}

export function deleteEntry(id, reason = '') {
  const idx = state.entries.findIndex((x) => x.id === id);
  if (idx < 0) return;
  const removed = state.entries.splice(idx, 1)[0];
  state.trash.unshift({
    id: uid(),
    entry: removed,
    deletedAt: new Date().toISOString(),
    deletedBy: state.auth.id,
    deletedByName: state.auth.name,
    reason: reason || ''
  });
  saveState();
  notify('Entry moved to trash bin.');
}

export function restoreTrash(trashId) {
  const idx = state.trash.findIndex((x) => x.id === trashId);
  if (idx < 0) return;
  const item = state.trash.splice(idx, 1)[0];
  state.entries.unshift(item.entry);
  saveState();
  notify(`Restored: ${item.entry.title}`);
}

export function purgeTrash() {
  const count = state.trash.length;
  state.trash = [];
  saveState();
  notify(`Emptied trash bin (${count} items).`);
}

// ----------------- Travel Order (Tab 6) CRUD -----------------
export function addTravel(t) {
  const rec = cleanTravel(t);
  rec.createdByName = state.auth.name;
  state.travels.unshift(rec);
  saveState();
  notify(`Travel order recorded: ${rec.destination}`);
  return rec;
}

export function updateTravel(id, t) {
  const idx = state.travels.findIndex((x) => x.id === id);
  if (idx < 0) throw new Error('Travel not found');
  state.travels[idx] = cleanTravel(Object.assign({}, state.travels[idx], t));
  saveState();
  notify('Travel record updated.');
  return state.travels[idx];
}

export function deleteTravel(id) {
  state.travels = state.travels.filter((x) => x.id !== id);
  saveState();
  notify('Travel record deleted.');
}

// ----------------- Theme Switcher -----------------
export function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dataset.theme = state.theme;
  }
  saveUi();
}

// ----------------- Demo Data & Reset -----------------
export function resetDemoData() {
  state.entries = seedEntries();
  state.tevRequests = DEFAULT_TEV_REQUESTS.map(cleanTevRequest);
  state.fareMatrix = JSON.parse(JSON.stringify(DEFAULT_FARE_MATRIX));
  saveState();
  notify('Demo data reset to fresh state.');
}

export function clearAllData() {
  state.entries = [];
  state.travels = [];
  state.trash = [];
  state.templates = [];
  state.tevRequests = [];
  saveState();
  notify('All records cleared.', true);
}

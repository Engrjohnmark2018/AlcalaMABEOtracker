import { isDate, num } from './dateUtils.js';
import { STATUS } from './constants.js';

function csvEscape(val) {
  const s = String(val == null ? '' : val);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function encCsvRows(text) {
  const rows = [];
  let cur = [];
  let field = '';
  let inQuote = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (i + 1 < n && text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuote = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ',') {
        cur.push(field);
        field = '';
      } else if (ch === '\r') {
        // skip \r
      } else if (ch === '\n') {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = '';
      } else {
        field += ch;
      }
    }
    i++;
  }
  if (field || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}

export function entriesToCsv(entries) {
  const headers = [
    'Title', 'Category', 'Status', 'Start Date', 'Target / Due Date', 'Accomplished Date',
    'Location', 'Personnel', 'Beneficiaries', 'Remarks', 'Google Drive Folder',
    'Created By', 'Completed By'
  ];
  const lines = [headers.map(csvEscape).join(',')];

  (entries || []).forEach((e) => {
    lines.push([
      e.title,
      e.category,
      STATUS[e.status] ? STATUS[e.status].label : e.status,
      e.startDate,
      e.dueDate,
      e.completedDate,
      e.location,
      e.personnel,
      e.beneficiaries || 0,
      e.remarks,
      e.driveUrl || '',
      e.createdByName || '',
      e.completedByName || ''
    ].map(csvEscape).join(','));
  });

  return lines.join('\r\n');
}

export function csvToEntries(text) {
  const rows = encCsvRows(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => String(h || '').trim().toLowerCase());
  const idx = (name) => headers.findIndex((h) => h.includes(name));

  const iTitle = idx('title');
  const iCat = idx('cat');
  const iStat = idx('stat');
  const iStart = idx('start');
  const iDue = idx('due') >= 0 ? idx('due') : idx('target');
  const iComp = idx('accomplish') >= 0 ? idx('accomplish') : idx('comp');
  const iLoc = idx('loc');
  const iPers = idx('person');
  const iBen = idx('ben');
  const iRem = idx('remark');
  const iDrive = idx('drive');

  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const title = iTitle >= 0 ? row[iTitle] : row[0];
    if (!title || !String(title).trim()) continue;

    let stat = 'pend';
    const sRaw = (iStat >= 0 ? row[iStat] : '').toLowerCase();
    if (sRaw.includes('accomp') || sRaw.includes('done')) stat = 'done';
    else if (sRaw.includes('ongo') || sRaw.includes('open')) stat = 'open';
    else if (sRaw.includes('cancel')) stat = 'cancel';

    out.push({
      title: String(title).trim(),
      category: iCat >= 0 && row[iCat] ? String(row[iCat]).trim() : 'Others',
      status: stat,
      startDate: iStart >= 0 && isDate(row[iStart]) ? row[iStart] : '',
      dueDate: iDue >= 0 && isDate(row[iDue]) ? row[iDue] : '',
      completedDate: iComp >= 0 && isDate(row[iComp]) ? row[iComp] : '',
      location: iLoc >= 0 ? String(row[iLoc] || '').trim() : '',
      personnel: iPers >= 0 ? String(row[iPers] || '').trim() : '',
      beneficiaries: iBen >= 0 ? num(row[iBen]) : 0,
      remarks: iRem >= 0 ? String(row[iRem] || '').trim() : '',
      driveUrl: iDrive >= 0 ? String(row[iDrive] || '').trim() : ''
    });
  }
  return out;
}
